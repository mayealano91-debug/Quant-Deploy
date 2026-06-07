"""
broker/position_tracker.py
--------------------------
Real-time position tracking via Alpaca WebSocket trade-update stream.

On startup:
  • Reconciles local state with actual Alpaca positions.

While running:
  • WebSocket fills update PositionState instantly.
  • Calls optional on_fill_cb(symbol, state) after every fill.
  • Calls optional circuit_breaker.on_fill() if provided.

Per-position tracking:
  entry_time / entry_price / current_price / unrealized P&L /
  stop_level / holding_period / regime_entry vs regime_now / trade_id
"""

import os
import logging
import threading
from datetime import datetime
from typing import Callable, Optional
from dotenv import load_dotenv
from alpaca.trading.stream import TradingStream

load_dotenv()

logger = logging.getLogger(__name__)


class PositionState:
    """Mutable snapshot of a single open position."""

    def __init__(
        self,
        symbol: str,
        entry_price: float,
        qty: float,
        side: str,                 # "long" | "short"
        regime: str = "unknown",
        trade_id: str = "",
    ) -> None:
        self.symbol        = symbol
        self.entry_price   = entry_price
        self.entry_time    = datetime.utcnow()
        self.qty           = qty
        self.side          = side
        self.current_price = entry_price
        self.stop_level: Optional[float] = None
        self.take_profit: Optional[float] = None
        self.regime_entry  = regime
        self.regime_now    = regime
        self.trade_id      = trade_id

    # ── Derived metrics ───────────────────────────────────────────────────────

    @property
    def unrealized_pnl(self) -> float:
        mult = 1.0 if self.side == "long" else -1.0
        return round((self.current_price - self.entry_price) * self.qty * mult, 2)

    @property
    def holding_period_seconds(self) -> float:
        return (datetime.utcnow() - self.entry_time).total_seconds()

    def to_dict(self) -> dict:
        return {
            "symbol":           self.symbol,
            "side":             self.side,
            "qty":              self.qty,
            "entry_price":      self.entry_price,
            "entry_time":       self.entry_time.isoformat(),
            "current_price":    self.current_price,
            "unrealized_pnl":   self.unrealized_pnl,
            "stop_level":       self.stop_level,
            "take_profit":      self.take_profit,
            "holding_seconds":  self.holding_period_seconds,
            "regime_entry":     self.regime_entry,
            "regime_now":       self.regime_now,
            "trade_id":         self.trade_id,
        }


class PositionTracker:
    """
    Tracks open positions in memory and keeps them current via WebSocket.

    Usage
    -----
    tracker = PositionTracker(alpaca_client)
    tracker.start()          # spawns daemon thread
    ...
    tracker.stop()
    """

    def __init__(
        self,
        alpaca_client,
        circuit_breaker=None,
        on_fill_cb: Optional[Callable] = None,
    ) -> None:
        self.alpaca          = alpaca_client
        self.circuit         = circuit_breaker
        self.on_fill_cb      = on_fill_cb
        self.positions: dict[str, PositionState] = {}
        self._stream         = None
        self._thread         = None
        self._running        = False
        self._lock           = threading.Lock()

        self._reconcile_on_startup()

    # ── Startup reconciliation ────────────────────────────────────────────────

    def _reconcile_on_startup(self) -> None:
        """Load existing Alpaca positions into local state."""
        logger.info("[PositionTracker] Reconciling with Alpaca…")
        try:
            actual = self.alpaca.get_positions()
        except Exception as exc:
            logger.error("[PositionTracker] Reconciliation failed: %s", exc)
            return

        with self._lock:
            for pos in actual:
                sym  = pos.symbol
                side = "long" if float(pos.qty) > 0 else "short"
                state = PositionState(
                    symbol=sym,
                    entry_price=float(pos.avg_entry_price),
                    qty=abs(float(pos.qty)),
                    side=side,
                )
                state.current_price = float(pos.current_price or pos.avg_entry_price)
                self.positions[sym] = state
                logger.info(
                    "[Reconcile] %s %s qty=%s  entry=$%s  uPnL=$%s",
                    side.upper(), sym, pos.qty,
                    pos.avg_entry_price, pos.unrealized_pl or 0,
                )

        logger.info(
            "[PositionTracker] Reconciled %d position(s) from Alpaca.",
            len(self.positions),
        )

    # ── WebSocket stream ──────────────────────────────────────────────────────

    def start(self) -> None:
        """Spawn background daemon thread for the trade-update WebSocket."""
        if self._running:
            return
        self._running = True
        self._thread  = threading.Thread(target=self._run_stream, daemon=True, name="pos-tracker")
        self._thread.start()
        logger.info("[PositionTracker] WebSocket stream thread started.")

    def stop(self) -> None:
        self._running = False
        if self._stream:
            try:
                self._stream.stop()
            except Exception:
                pass
        logger.info("[PositionTracker] WebSocket stream stopped.")

    def _run_stream(self) -> None:
        api_key    = os.getenv("ALPACA_API_KEY", "")
        secret_key = os.getenv("ALPACA_SECRET_KEY", "")
        stream = TradingStream(
            api_key=api_key,
            secret_key=secret_key,
            paper=self.alpaca.paper,
        )
        stream.subscribe_trade_updates(self._on_trade_update)
        self._stream = stream
        stream.run()  # blocking — exits when stopped

    # ── Fill handler (async callback from alpaca-py) ──────────────────────────

    async def _on_trade_update(self, data) -> None:
        event  = data.event
        order  = data.order
        symbol = order.symbol

        logger.debug("[TradeUpdate] event=%s symbol=%s status=%s", event, symbol, order.status)

        if event in ("fill", "partial_fill"):
            filled_price = float(order.filled_avg_price or 0)
            filled_qty   = float(order.filled_qty or 0)
            side_str     = "long" if order.side.value == "buy" else "short"
            trade_id     = str(order.client_order_id or "")

            with self._lock:
                if symbol not in self.positions:
                    self.positions[symbol] = PositionState(
                        symbol=symbol,
                        entry_price=filled_price,
                        qty=filled_qty,
                        side=side_str,
                        trade_id=trade_id,
                    )
                else:
                    pos = self.positions[symbol]
                    if side_str == pos.side:
                        # Averaging in — update average entry
                        total_qty   = pos.qty + filled_qty
                        pos.entry_price = (
                            (pos.entry_price * pos.qty + filled_price * filled_qty) / total_qty
                        )
                        pos.qty       = total_qty
                        pos.trade_id  = trade_id
                    else:
                        # Closing / reducing
                        remaining = pos.qty - filled_qty
                        if remaining <= 0:
                            pnl = pos.unrealized_pnl
                            logger.info("[CLOSE] %s  realised≈$%.2f  trade_id=%s", symbol, pnl, trade_id)
                            del self.positions[symbol]
                            if self.on_fill_cb:
                                self.on_fill_cb(symbol, None)
                            return
                        pos.qty = remaining

                state = self.positions.get(symbol)

            logger.info(
                "[FILL] %s %s qty=%.4f @ $%.2f  trade_id=%s",
                side_str.upper(), symbol, filled_qty, filled_price, trade_id,
            )

            if self.circuit and state:
                self.circuit.on_fill(symbol, filled_price, filled_qty, side_str)
            if self.on_fill_cb and state:
                self.on_fill_cb(symbol, state)

        elif event in ("canceled", "expired", "rejected"):
            logger.info("[Order] %s %s — %s", symbol, order.id, event)

    # ── Price updates (called by market-data layer) ───────────────────────────

    def update_price(self, symbol: str, price: float) -> None:
        with self._lock:
            if symbol in self.positions:
                self.positions[symbol].current_price = price

    def update_regime(self, symbol: str, regime: str) -> None:
        with self._lock:
            if symbol in self.positions:
                self.positions[symbol].regime_now = regime

    # ── Accessors ─────────────────────────────────────────────────────────────

    def get_position(self, symbol: str) -> Optional[PositionState]:
        with self._lock:
            return self.positions.get(symbol)

    def all_positions(self) -> dict:
        with self._lock:
            return {sym: pos.to_dict() for sym, pos in self.positions.items()}

    def total_unrealized_pnl(self) -> float:
        with self._lock:
            return sum(p.unrealized_pnl for p in self.positions.values())
