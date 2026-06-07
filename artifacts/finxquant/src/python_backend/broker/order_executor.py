"""
broker/order_executor.py
------------------------
Order submission, bracket orders, stop management,
position close, and unique trade_id tracking.
"""

import uuid
import time
import logging
from dataclasses import dataclass, field
from typing import Optional

from alpaca.trading.client import TradingClient
from alpaca.trading.requests import (
    LimitOrderRequest, MarketOrderRequest,
    TakeProfitRequest, StopLossRequest,
)
from alpaca.trading.enums import OrderSide, TimeInForce, OrderClass

logger = logging.getLogger(__name__)

LIMIT_OFFSET_PCT  = 0.001   # 0.1% off current price for limit orders
FILL_TIMEOUT_SECS = 30      # cancel if unfilled after this many seconds


@dataclass
class Signal:
    symbol:       str
    side:         str           # "buy" | "sell"
    qty:          float
    current_price: float
    stop_price:   Optional[float] = None
    take_profit:  Optional[float] = None
    metadata:     dict = field(default_factory=dict)


class OrderExecutor:
    def __init__(self, trading_client: TradingClient):
        self.client = trading_client
        self._active_orders: dict[str, str] = {}   # trade_id -> order_id

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    def _new_trade_id(self) -> str:
        return f"TRD-{uuid.uuid4().hex[:8].upper()}"

    def _limit_price(self, side: str, current_price: float) -> float:
        if side == "buy":
            return round(current_price * (1 + LIMIT_OFFSET_PCT), 2)
        return round(current_price * (1 - LIMIT_OFFSET_PCT), 2)

    # ------------------------------------------------------------------
    # Public methods
    # ------------------------------------------------------------------

    def submit_order(self, signal: Signal, retry_at_market: bool = False) -> dict:
        """
        Submit a LIMIT order. Cancel after FILL_TIMEOUT_SECS if unfilled.
        Optionally retry as market order.
        Returns dict with trade_id + order_id.
        """
        trade_id   = self._new_trade_id()
        limit_px   = self._limit_price(signal.side, signal.current_price)
        side_enum  = OrderSide.BUY if signal.side == "buy" else OrderSide.SELL

        req = LimitOrderRequest(
            symbol=signal.symbol,
            qty=signal.qty,
            side=side_enum,
            limit_price=limit_px,
            time_in_force=TimeInForce.DAY,
            client_order_id=trade_id,
        )

        order = self.client.submit_order(req)
        logger.info("[%s] LIMIT %s %s @ %.2f (order_id=%s)",
                    trade_id, signal.side.upper(), signal.symbol, limit_px, order.id)

        self._active_orders[trade_id] = str(order.id)

        # Wait for fill, cancel if timeout
        time.sleep(FILL_TIMEOUT_SECS)
        refreshed = self.client.get_order_by_id(order.id)

        if refreshed.status not in ("filled", "partially_filled"):
            logger.warning("[%s] Unfilled after %ds — cancelling", trade_id, FILL_TIMEOUT_SECS)
            self.client.cancel_order_by_id(order.id)

            if retry_at_market:
                return self._submit_market_order(signal, trade_id)

        return {"trade_id": trade_id, "order_id": str(order.id), "status": str(refreshed.status)}

    def _submit_market_order(self, signal: Signal, trade_id: str) -> dict:
        side_enum = OrderSide.BUY if signal.side == "buy" else OrderSide.SELL
        req = MarketOrderRequest(
            symbol=signal.symbol,
            qty=signal.qty,
            side=side_enum,
            time_in_force=TimeInForce.DAY,
            client_order_id=f"{trade_id}-MKT",
        )
        order = self.client.submit_order(req)
        logger.info("[%s] MARKET %s %s (retry)", trade_id, signal.side.upper(), signal.symbol)
        return {"trade_id": trade_id, "order_id": str(order.id), "status": "market_retry"}

    def submit_bracket_order(self, signal: Signal) -> dict:
        """Entry + stop-loss + take-profit via Alpaca OCO bracket."""
        if signal.stop_price is None or signal.take_profit is None:
            raise ValueError("Bracket order requires stop_price and take_profit")

        trade_id  = self._new_trade_id()
        limit_px  = self._limit_price(signal.side, signal.current_price)
        side_enum = OrderSide.BUY if signal.side == "buy" else OrderSide.SELL

        req = LimitOrderRequest(
            symbol=signal.symbol,
            qty=signal.qty,
            side=side_enum,
            limit_price=limit_px,
            time_in_force=TimeInForce.GTC,
            order_class=OrderClass.BRACKET,
            take_profit=TakeProfitRequest(limit_price=signal.take_profit),
            stop_loss=StopLossRequest(stop_price=signal.stop_price),
            client_order_id=trade_id,
        )

        order = self.client.submit_order(req)
        logger.info("[%s] BRACKET %s %s — entry=%.2f stop=%.2f tp=%.2f",
                    trade_id, signal.side.upper(), signal.symbol,
                    limit_px, signal.stop_price, signal.take_profit)

        self._active_orders[trade_id] = str(order.id)
        return {"trade_id": trade_id, "order_id": str(order.id)}

    def modify_stop(self, symbol: str, new_stop: float, current_stop: float) -> bool:
        """Only TIGHTEN the stop — never widen it."""
        if new_stop <= current_stop:
            logger.warning("modify_stop: new_stop=%.2f is not tighter than current=%.2f — skipped",
                           new_stop, current_stop)
            return False
        logger.info("modify_stop: %s  %.2f → %.2f", symbol, current_stop, new_stop)
        # Actual modification requires cancelling old stop leg and resubmitting
        # Implementation depends on your position-tracking integration
        return True

    def cancel_order(self, order_id: str):
        self.client.cancel_order_by_id(order_id)
        logger.info("Cancelled order %s", order_id)

    def close_position(self, symbol: str):
        self.client.close_position(symbol)
        logger.info("Closed position: %s", symbol)

    def close_all_positions(self):
        self.client.close_all_positions(cancel_orders=True)
        logger.warning("CLOSED ALL POSITIONS")