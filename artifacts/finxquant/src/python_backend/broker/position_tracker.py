"""
broker/position_tracker.py
--------------------------
WebSocket fill notifications + per-position state tracking.
Reconciles with Alpaca on startup.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from typing import Optional, Dict, Callable

from alpaca.trading.client import TradingClient
from alpaca.trading.stream import TradingStream

logger = logging.getLogger(__name__)


@dataclass
class PositionState:
    symbol:        str
    side:          str                    # "long" | "short"
    qty:           float
    entry_price:   float
    entry_time:    datetime
    current_price: float = 0.0
    stop_level:    Optional[float] = None
    take_profit:   Optional[float] = None
    regime_entry:  str = "unknown"        # market regime at entry
    regime_now:    str = "unknown"        # current regime
    trade_id:      str = ""

    @property
    def unrealized_pnl(self) -> float:
        mult = 1 if self.side == "long" else -1
        return mult * (self.current_price - self.entry_price) * self.qty

    @property
    def holding_period_seconds(self) -> float:
        return (datetime.utcnow() - self.entry_time).total_seconds()


class PositionTracker:
    def __init__(
        self,
        trading_client: TradingClient,
        api_key: str,
        secret_key: str,
        paper: bool = True,
        on_fill_cb: Optional[Callable] = None,
    ):
        self.client      = trading_client
        self.api_key     = api_key
        self.secret_key  = secret_key
        self.paper       = paper
        self.on_fill_cb  = on_fill_cb   # called with PositionState after each fill

        self.positions: Dict[str, PositionState] = {}
        self._stream: Optional[TradingStream] = None

        self._sync_with_alpaca()

    # ------------------------------------------------------------------
    # Startup reconciliation
    # ------------------------------------------------------------------

    def _sync_with_alpaca(self):
        """Load existing open positions from Alpaca into local state."""
        logger.info("Syncing positions with Alpaca…")
        alpaca_positions = self.client.get_all_positions()

        for pos in alpaca_positions:
            symbol = pos.symbol
            side   = "long" if pos.side.value == "long" else "short"
            self.positions[symbol] = PositionState(
                symbol=symbol,
                side=side,
                qty=float(pos.qty),
                entry_price=float(pos.avg_entry_price),
                current_price=float(pos.current_price or pos.avg_entry_price),
                entry_time=datetime.utcnow(),   # actual time not available from positions endpoint
            )
            logger.info("Synced: %s %s qty=%.4f entry=%.2f pnl=%.2f",
                        side.upper(), symbol, float(pos.qty),
                        float(pos.avg_entry_price), float(pos.unrealized_pl or 0))

        logger.info("Sync complete — %d position(s) loaded", len(self.positions))

    # ------------------------------------------------------------------
    # WebSocket stream
    # ------------------------------------------------------------------

    def start_stream(self):
        """Subscribe to order-update events via WebSocket."""
        self._stream = TradingStream(
            api_key=self.api_key,
            secret_key=self.secret_key,
            paper=self.paper,
        )
        self._stream.subscribe_trade_updates(self._on_trade_update)
        logger.info("PositionTracker WebSocket stream started")
        self._stream.run()   # blocking — run in a separate thread

    def stop_stream(self):
        if self._stream:
            self._stream.stop()
            logger.info("PositionTracker stream stopped")

    # ------------------------------------------------------------------
    # Fill handler
    # ------------------------------------------------------------------

    async def _on_trade_update(self, data):
        event  = data.event
        order  = data.order
        symbol = order.symbol

        logger.info("Trade update: event=%s symbol=%s status=%s", event, symbol, order.status)

        if event == "fill":
            side       = "long" if order.side.value == "buy" else "short"
            fill_price = float(order.filled_avg_price or 0)
            fill_qty   = float(order.filled_qty or 0)

            if side == "long":
                self.positions[symbol] = PositionState(
                    symbol=symbol,
                    side=side,
                    qty=fill_qty,
                    entry_price=fill_price,
                    current_price=fill_price,
                    entry_time=datetime.utcnow(),
                    trade_id=str(order.client_order_id or ""),
                )
                logger.info("[FILL] LONG %s qty=%.4f @ %.2f  trade_id=%s",
                            symbol, fill_qty, fill_price, order.client_order_id)
            elif symbol in self.positions:
                pnl = self.positions[symbol].unrealized_pnl
                logger.info("[FILL] CLOSED %s  PnL=%.2f  trade_id=%s",
                            symbol, pnl, order.client_order_id)
                del self.positions[symbol]

            if self.on_fill_cb:
                pos = self.positions.get(symbol)
                self.on_fill_cb(pos)

        elif event in ("canceled", "expired"):
            logger.info("Order %s for %s — %s", order.id, symbol, event)

    # ------------------------------------------------------------------
    # Accessors
    # ------------------------------------------------------------------

    def update_price(self, symbol: str, price: float):
        if symbol in self.positions:
            self.positions[symbol].current_price = price

    def get_position(self, symbol: str) -> Optional[PositionState]:
        return self.positions.get(symbol)

    def get_all(self) -> Dict[str, PositionState]:
        return self.positions.copy()

    def total_unrealized_pnl(self) -> float:
        return sum(p.unrealized_pnl for p in self.positions.values())