"""
broker/position_tracker.py
Real-time position tracking via Alpaca WebSocket fill stream.
Reconciles tracked state with actual Alpaca positions on startup.
"""

import logging
import threading
from datetime import datetime
from alpaca.trading.stream import TradingStream

logger = logging.getLogger(__name__)


class PositionState:
    def __init__(self, symbol: str, entry_price: float, qty: float, side: str, regime: str = "unknown"):
        self.symbol       = symbol
        self.entry_price  = entry_price
        self.entry_time   = datetime.utcnow()
        self.qty          = qty
        self.side         = side  # 'long' | 'short'
        self.current_price = entry_price
        self.stop_level   = None
        self.regime_entry = regime
        self.regime_now   = regime
        self.trade_id     = None

    @property
    def unrealized_pnl(self) -> float:
        mult = 1 if self.side == "long" else -1
        return round((self.current_price - self.entry_price) * self.qty * mult, 2)

    @property
    def holding_period_seconds(self) -> float:
        return (datetime.utcnow() - self.entry_time).total_seconds()

    def to_dict(self) -> dict:
        return {
            "symbol":        self.symbol,
            "side":          self.side,
            "qty":           self.qty,
            "entry_price":   self.entry_price,
            "current_price": self.current_price,
            "unrealized_pnl": self.unrealized_pnl,
            "stop_level":    self.stop_level,
            "holding_sec":   self.holding_period_seconds,
            "regime_entry":  self.regime_entry,
            "regime_now":    self.regime_now,
            "trade_id":      self.trade_id,
        }


class PositionTracker:
    def __init__(self, alpaca_client, circuit_breaker=None):
        self.alpaca         = alpaca_client
        self.circuit        = circuit_breaker
        self.positions: dict[str, PositionState] = {}
        self._stream        = None
        self._thread        = None
        self._running       = False

        self._reconcile_on_startup()

    # ─── Startup reconciliation ──────────────────────────────────────────────────

    def _reconcile_on_startup(self):
        """Sync tracked positions with actual Alpaca positions."""
        actual = self.alpaca.get_positions()
        for pos in actual:
            sym = pos.symbol
            side = "long" if float(pos.qty) > 0 else "short"
            state = PositionState(
                symbol      = sym,
                entry_price = float(pos.avg_entry_price),
                qty         = abs(float(pos.qty)),
                side        = side,
            )
            state.current_price = float(pos.current_price)
            self.positions[sym] = state
            logger.info(f"[Reconcile] {sym} {side} {pos.qty} @ ${pos.avg_entry_price} · uPnL ${pos.unrealized_pl}")

        logger.info(f"[PositionTracker] Reconciled {len(self.positions)} positions from Alpaca.")

    # ─── WebSocket stream ────────────────────────────────────────────────────────

    def start(self):
        self._running = True
        self._thread  = threading.Thread(target=self._run_stream, daemon=True)
        self._thread.start()
        logger.info("[PositionTracker] WebSocket stream started.")

    def stop(self):
        self._running = False
        if self._stream:
            self._stream.stop()
        logger.info("[PositionTracker] WebSocket stream stopped.")

    def _run_stream(self):
        import os
        from dotenv import load_dotenv
        load_dotenv()
        stream = TradingStream(
            api_key    = os.getenv("ALPACA_API_KEY"),
            secret_key = os.getenv("ALPACA_SECRET_KEY"),
            paper      = self.alpaca.paper,
        )
        stream.subscribe_trade_updates(self._on_trade_update)
        self._stream = stream
        stream.run()

    async def _on_trade_update(self, data):
        event  = data.event           # 'fill', 'partial_fill', 'canceled', etc.
        order  = data.order
        symbol = order.symbol

        if event in ("fill", "partial_fill"):
            filled_price = float(order.filled_avg_price or 0)
            filled_qty   = float(order.filled_qty or 0)
            side_str     = "long" if order.side.value == "buy" else "short"

            if symbol not in self.positions:
                self.positions[symbol] = PositionState(
                    symbol      = symbol,
                    entry_price = filled_price,
                    qty         = filled_qty,
                    side        = side_str,
                )
            else:
                pos = self.positions[symbol]
                pos.current_price = filled_price

            trade_id = order.client_order_id
            self.positions[symbol].trade_id = trade_id
            logger.info(f"[Fill] {symbol} {event} {filled_qty} @ ${filled_price} · trade_id={trade_id}")

            if self.circuit:
                self.circuit.on_fill(symbol, filled_price, filled_qty, side_str)

        elif event == "canceled":
            logger.info(f"[Order] {symbol} order cancelled.")

    # ─── Price update ────────────────────────────────────────────────────────────

    def update_price(self, symbol: str, price: float):
        if symbol in self.positions:
            self.positions[symbol].current_price = price

    def get_position(self, symbol: str):
        return self.positions.get(symbol)

    def all_positions(self):
        return {sym: pos.to_dict() for sym, pos in self.positions.items()}