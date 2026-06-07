"""
broker/order_executor.py
------------------------
Order submission, bracket orders, stop management, and position close.
Every order carries a unique trade_id that links:
    risk decision → order submission → fill notification

Rules enforced here:
  • Default: LIMIT order at ±0.1% of current price
  • Cancel after 30s if unfilled; optionally retry as market
  • Bracket orders: entry + stop + take-profit via Alpaca OCO
  • modify_stop: only TIGHTEN (raise for long, lower for short) — never widen
"""

import uuid
import time
import logging
from alpaca.trading.requests import (
    MarketOrderRequest,
    LimitOrderRequest,
    StopLossRequest,
    TakeProfitRequest,
    ReplaceOrderRequest,
    GetOrdersRequest,
    OrderRequest,
)
from alpaca.trading.enums import OrderSide, TimeInForce, OrderStatus, QueryOrderStatus

logger = logging.getLogger(__name__)

LIMIT_OFFSET_PCT  = 0.001   # 0.1% away from current price
ORDER_TIMEOUT_SEC = 30      # cancel unfilled limit after this many seconds
POLL_INTERVAL_SEC = 2       # how often to check fill status


def _new_trade_id() -> str:
    """Unique 12-char ID linking risk_decision → order → fill."""
    return "TRD-" + uuid.uuid4().hex[:9].upper()


class OrderExecutor:
    def __init__(self, alpaca_client) -> None:
        """
        Parameters
        ----------
        alpaca_client : AlpacaClient
            Shared instance — do not create a second connection.
        """
        self.client = alpaca_client.client
        self._active: dict[str, str] = {}  # trade_id → order_id

    # ── Helpers ──────────────────────────────────────────────────────────────

    def _limit_price(self, side: OrderSide, current_price: float) -> float:
        offset = current_price * LIMIT_OFFSET_PCT
        px = current_price + offset if side == OrderSide.BUY else current_price - offset
        return round(px, 2)

    def _poll_for_fill(self, order_id, trade_id: str) -> str:
        """Poll until filled, timeout, or cancellation. Returns final status string."""
        deadline = time.monotonic() + ORDER_TIMEOUT_SEC
        while time.monotonic() < deadline:
            time.sleep(POLL_INTERVAL_SEC)
            o = self.client.get_order_by_id(order_id)
            if o.status == OrderStatus.FILLED:
                logger.info("[%s] FILLED @ $%s", trade_id, o.filled_avg_price)
                return "filled"
            if o.status in (OrderStatus.CANCELED, OrderStatus.EXPIRED):
                return str(o.status.value)
        return "timeout"

    # ── Submit LIMIT order ───────────────────────────────────────────────────

    def submit_order(self, signal: dict, retry_market: bool = False) -> dict:
        """
        Submit a LIMIT order ±0.1% from current price.
        Cancel after 30s if unfilled; optionally retry as market.

        Parameters
        ----------
        signal : dict
            { symbol, side ('buy'|'sell'), qty, current_price }
        retry_market : bool
            If True, submit a market order when the limit times out.

        Returns
        -------
        dict
            { trade_id, order_id, status }
        """
        trade_id = _new_trade_id()
        side     = OrderSide.BUY if signal["side"] == "buy" else OrderSide.SELL
        limit_px = self._limit_price(side, signal["current_price"])

        req = LimitOrderRequest(
            symbol=signal["symbol"],
            qty=signal["qty"],
            side=side,
            time_in_force=TimeInForce.DAY,
            limit_price=limit_px,
            client_order_id=trade_id,
        )
        order = self.client.submit_order(req)
        self._active[trade_id] = str(order.id)
        logger.info("[%s] LIMIT %s %s qty=%s @ $%.2f",
                    trade_id, side.value.upper(), signal["symbol"], signal["qty"], limit_px)

        fill_status = self._poll_for_fill(order.id, trade_id)

        if fill_status not in ("filled", "partially_filled"):
            logger.warning("[%s] Unfilled after %ds — cancelling", trade_id, ORDER_TIMEOUT_SEC)
            try:
                self.client.cancel_order_by_id(order.id)
            except Exception:
                pass

            if retry_market:
                return self._submit_market_retry(signal, trade_id)

        return {"trade_id": trade_id, "order_id": str(order.id), "status": fill_status}

    def _submit_market_retry(self, signal: dict, trade_id: str) -> dict:
        side = OrderSide.BUY if signal["side"] == "buy" else OrderSide.SELL
        req  = MarketOrderRequest(
            symbol=signal["symbol"],
            qty=signal["qty"],
            side=side,
            time_in_force=TimeInForce.DAY,
            client_order_id=f"{trade_id}-MKT",
        )
        order = self.client.submit_order(req)
        logger.info("[%s] MARKET retry submitted for %s", trade_id, signal["symbol"])
        return {"trade_id": trade_id, "order_id": str(order.id), "status": "market_retry"}

    # ── Bracket order ────────────────────────────────────────────────────────

    def submit_bracket_order(self, signal: dict) -> dict:
        """
        Submit entry + stop-loss + take-profit via Alpaca OCO bracket.

        Parameters
        ----------
        signal : dict
            { symbol, side, qty, current_price, stop_price, take_profit_price }
        """
        trade_id = _new_trade_id()
        side     = OrderSide.BUY if signal["side"] == "buy" else OrderSide.SELL
        limit_px = self._limit_price(side, signal["current_price"])

        req = OrderRequest(
            symbol=signal["symbol"],
            qty=signal["qty"],
            side=side,
            type="limit",
            time_in_force=TimeInForce.DAY,
            limit_price=limit_px,
            order_class="bracket",
            stop_loss=StopLossRequest(stop_price=signal["stop_price"]),
            take_profit=TakeProfitRequest(limit_price=signal["take_profit_price"]),
            client_order_id=trade_id,
        )
        order = self.client.submit_order(req)
        self._active[trade_id] = str(order.id)
        logger.info(
            "[%s] BRACKET %s %s — entry=$%.2f  stop=$%.2f  tp=$%.2f",
            trade_id, side.value.upper(), signal["symbol"],
            limit_px, signal["stop_price"], signal["take_profit_price"],
        )
        return {"trade_id": trade_id, "order_id": str(order.id), "status": "bracket_submitted"}

    # ── Stop management ──────────────────────────────────────────────────────

    def modify_stop(
        self,
        symbol: str,
        new_stop: float,
        current_stop: float,
        position_side: str = "long",
    ) -> bool:
        """
        Modify the open stop order for *symbol*.
        Only TIGHTEN — never widen:
          • long  → new_stop must be ABOVE current_stop (raise the floor)
          • short → new_stop must be BELOW current_stop (lower the ceiling)

        Returns True if the stop was successfully replaced, False otherwise.
        """
        if position_side == "long" and new_stop <= current_stop:
            logger.warning(
                "modify_stop refused: %.2f ≤ %.2f (would widen LONG stop on %s)",
                new_stop, current_stop, symbol,
            )
            return False
        if position_side == "short" and new_stop >= current_stop:
            logger.warning(
                "modify_stop refused: %.2f ≥ %.2f (would widen SHORT stop on %s)",
                new_stop, current_stop, symbol,
            )
            return False

        req    = GetOrdersRequest(status=QueryOrderStatus.OPEN)
        orders = self.client.get_orders(filter=req)

        for o in orders:
            if o.symbol == symbol and str(o.type) in ("stop", "stop_limit"):
                try:
                    self.client.replace_order_by_id(
                        o.id,
                        ReplaceOrderRequest(stop_price=new_stop),
                    )
                    logger.info("modify_stop %s: $%.2f → $%.2f ✓", symbol, current_stop, new_stop)
                    return True
                except Exception as exc:
                    logger.error("modify_stop failed for %s: %s", symbol, exc)
                    return False

        logger.warning("modify_stop: no open stop order found for %s", symbol)
        return False

    # ── Cancellation / close ─────────────────────────────────────────────────

    def cancel_order(self, order_id: str) -> None:
        self.client.cancel_order_by_id(order_id)
        logger.info("Order %s cancelled", order_id)

    def close_position(self, symbol: str) -> None:
        self.client.close_position(symbol)
        logger.info("Position closed: %s", symbol)

    def close_all_positions(self) -> None:
        self.client.close_all_positions(cancel_orders=True)
        logger.warning("ALL positions and open orders closed.")
