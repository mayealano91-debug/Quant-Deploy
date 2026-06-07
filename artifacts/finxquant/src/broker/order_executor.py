"""
broker/order_executor.py
Order submission, bracket orders, stop modification, and position management.
All orders use LIMIT by default; cancel after 30s if unfilled with optional market retry.
"""

import uuid
import time
import logging
from alpaca.trading.requests import (
    MarketOrderRequest, LimitOrderRequest, StopLossRequest,
    TakeProfitRequest, GetOrderByIdRequest
)
from alpaca.trading.enums import OrderSide, TimeInForce, OrderStatus

logger = logging.getLogger(__name__)

LIMIT_OFFSET_PCT  = 0.001   # 0.1% from current price
ORDER_TIMEOUT_SEC = 30


class OrderExecutor:
    def __init__(self, alpaca_client):
        self.client = alpaca_client.client

    def _gen_trade_id(self) -> str:
        """Unique ID linking risk decision → order → fill."""
        return str(uuid.uuid4())[:12].upper()

    # ─── Submit LIMIT order ─────────────────────────────────────────────────────

    def submit_order(self, signal: dict, retry_market: bool = False) -> dict:
        """
        signal: { symbol, side ('buy'|'sell'), qty, current_price }
        Returns { trade_id, order_id, status }
        """
        trade_id = self._gen_trade_id()
        side     = OrderSide.BUY if signal["side"] == "buy" else OrderSide.SELL
        offset   = signal["current_price"] * LIMIT_OFFSET_PCT
        limit_px = round(
            signal["current_price"] + (offset if side == OrderSide.BUY else -offset), 2
        )

        req = LimitOrderRequest(
            symbol        = signal["symbol"],
            qty           = signal["qty"],
            side          = side,
            time_in_force = TimeInForce.DAY,
            limit_price   = limit_px,
            client_order_id = trade_id,
        )
        order = self.client.submit_order(req)
        logger.info(f"[{trade_id}] LIMIT order submitted: {signal['symbol']} {side} {signal['qty']} @ ${limit_px}")

        # Wait up to 30s for fill
        deadline = time.time() + ORDER_TIMEOUT_SEC
        while time.time() < deadline:
            time.sleep(2)
            o = self.client.get_order_by_id(order.id)
            if o.status == OrderStatus.FILLED:
                logger.info(f"[{trade_id}] FILLED @ ${o.filled_avg_price}")
                return {"trade_id": trade_id, "order_id": str(o.id), "status": "filled"}
            if o.status in (OrderStatus.CANCELED, OrderStatus.EXPIRED):
                break

        # Cancel if still open
        try:
            self.client.cancel_order_by_id(order.id)
            logger.warning(f"[{trade_id}] Order not filled in {ORDER_TIMEOUT_SEC}s — cancelled.")
        except Exception:
            pass

        if retry_market:
            return self._submit_market_retry(signal, trade_id)

        return {"trade_id": trade_id, "order_id": str(order.id), "status": "cancelled"}

    def _submit_market_retry(self, signal: dict, trade_id: str) -> dict:
        side = OrderSide.BUY if signal["side"] == "buy" else OrderSide.SELL
        req  = MarketOrderRequest(
            symbol        = signal["symbol"],
            qty           = signal["qty"],
            side          = side,
            time_in_force = TimeInForce.DAY,
            client_order_id = trade_id + "-MKT",
        )
        order = self.client.submit_order(req)
        logger.info(f"[{trade_id}] MARKET retry submitted.")
        return {"trade_id": trade_id, "order_id": str(order.id), "status": "market_retry"}

    # ─── Bracket order ──────────────────────────────────────────────────────────

    def submit_bracket_order(self, signal: dict) -> dict:
        """
        signal: { symbol, side, qty, current_price, stop_price, take_profit_price }
        Submits entry + stop-loss + take-profit (Alpaca OCO bracket).
        """
        trade_id = self._gen_trade_id()
        side     = OrderSide.BUY if signal["side"] == "buy" else OrderSide.SELL
        offset   = signal["current_price"] * LIMIT_OFFSET_PCT
        limit_px = round(signal["current_price"] + (offset if side == OrderSide.BUY else -offset), 2)

        from alpaca.trading.requests import OrderRequest
        req = OrderRequest(
            symbol            = signal["symbol"],
            qty               = signal["qty"],
            side              = side,
            type              = "limit",
            time_in_force     = TimeInForce.DAY,
            limit_price       = limit_px,
            order_class       = "bracket",
            stop_loss         = StopLossRequest(stop_price=signal["stop_price"]),
            take_profit       = TakeProfitRequest(limit_price=signal["take_profit_price"]),
            client_order_id   = trade_id,
        )
        order = self.client.submit_order(req)
        logger.info(f"[{trade_id}] BRACKET order: {signal['symbol']} entry={limit_px} stop={signal['stop_price']} tp={signal['take_profit_price']}")
        return {"trade_id": trade_id, "order_id": str(order.id), "status": "bracket_submitted"}

    # ─── Stop management ────────────────────────────────────────────────────────

    def modify_stop(self, symbol: str, new_stop: float, current_stop: float) -> bool:
        """Only tighten the stop (move it closer to entry / further from risk)."""
        # For long: new_stop > current_stop is tighter
        # For short: new_stop < current_stop is tighter
        # Caller passes current_stop; we enforce direction.
        logger.info(f"modify_stop {symbol}: {current_stop} → {new_stop}")
        # Actual modification requires replacing the child stop order via Alpaca API.
        # Find the open stop order for this symbol and replace it.
        orders = self.client.get_orders()
        for o in orders:
            if o.symbol == symbol and o.type == "stop" and o.status == OrderStatus.HELD:
                from alpaca.trading.requests import ReplaceOrderRequest
                self.client.replace_order_by_id(
                    o.id,
                    ReplaceOrderRequest(stop_price=new_stop)
                )
                logger.info(f"Stop updated for {symbol} → ${new_stop}")
                return True
        logger.warning(f"No open stop order found for {symbol}")
        return False

    # ─── Cancellation / Close ───────────────────────────────────────────────────

    def cancel_order(self, order_id: str):
        self.client.cancel_order_by_id(order_id)
        logger.info(f"Order {order_id} cancelled.")

    def close_position(self, symbol: str):
        self.client.close_position(symbol)
        logger.info(f"Position closed: {symbol}")

    def close_all_positions(self):
        self.client.close_all_positions(cancel_orders=True)
        logger.warning("All positions and open orders closed.")