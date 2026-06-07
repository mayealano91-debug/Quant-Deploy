"""
main.py
-------
FastAPI entry-point for the FINxQUANT Python broker backend.

Exposes the REST endpoints that the Express API server proxies at /api/alpaca/*.
Starts cleanly even when Alpaca credentials are missing (stub mode — every
broker endpoint returns HTTP 503 with a descriptive message).

Run:
    cd artifacts/finxquant/src/python_backend
    uvicorn main:app --host 0.0.0.0 --port ${PYTHON_BACKEND_PORT:-8001} --reload
"""

import os
import logging
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()  # no-op on Replit (env vars are injected directly)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("finxquant.backend")

# ── Singletons (initialised in lifespan) ─────────────────────────────────────

_alpaca      = None
_executor    = None
_tracker     = None
_market_data = None


def _require_alpaca(label: str = "broker"):
    if _alpaca is None:
        raise HTTPException(
            status_code=503,
            detail=(
                f"{label} unavailable — set ALPACA_API_KEY and ALPACA_SECRET_KEY "
                "in Replit Secrets (or a local .env file) and restart the backend."
            ),
        )
    return _alpaca


def _require_executor():
    if _executor is None:
        _require_alpaca("order executor")
    return _executor


def _require_market_data():
    if _market_data is None:
        _require_alpaca("market data")
    return _market_data


# ── Lifespan: startup / shutdown ──────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _alpaca, _executor, _tracker, _market_data

    api_key    = os.getenv("ALPACA_API_KEY")
    secret_key = os.getenv("ALPACA_SECRET_KEY")

    if api_key and secret_key:
        try:
            from broker.alpaca_client   import AlpacaClient
            from broker.order_executor  import OrderExecutor
            from broker.position_tracker import PositionTracker
            from data.market_data       import MarketData

            _alpaca      = AlpacaClient()
            _executor    = OrderExecutor(_alpaca)
            _tracker     = PositionTracker(_alpaca)
            _tracker.start()
            _market_data = MarketData(api_key, secret_key)
            logger.info("All broker services initialised ✓  (paper=%s)", _alpaca.paper)
        except Exception as exc:
            logger.error("Broker initialisation failed: %s", exc)
    else:
        logger.warning(
            "ALPACA_API_KEY / ALPACA_SECRET_KEY not set — running in stub mode. "
            "Add them to Replit Secrets."
        )

    yield  # server is live

    if _tracker:
        _tracker.stop()
    if _market_data:
        _market_data.stop_stream()
    logger.info("Backend shutdown complete.")


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="FINxQUANT Broker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {
        "status":          "ok",
        "broker_ready":    _alpaca is not None,
        "paper_trading":   _alpaca.paper if _alpaca else None,
        "positions_count": len(_tracker.positions) if _tracker else 0,
    }


# ── Account ───────────────────────────────────────────────────────────────────

@app.get("/account")
async def get_account():
    acct = _require_alpaca("account").get_account()
    return {
        "id":                 str(acct.id),
        "account_number":     str(acct.account_number),
        "status":             acct.status.value if hasattr(acct.status, "value") else str(acct.status),
        "equity":             str(acct.equity),
        "cash":               str(acct.cash),
        "buying_power":       str(acct.buying_power),
        "portfolio_value":    str(acct.portfolio_value),
        "daytrade_count":     acct.daytrade_count,
        "pattern_day_trader": acct.pattern_day_trader,
        "paper":              _alpaca.paper,
    }


@app.get("/margin")
async def get_margin():
    return {"buying_power": _require_alpaca("margin").get_available_margin()}


# ── Positions ─────────────────────────────────────────────────────────────────

@app.get("/positions")
async def get_positions():
    positions = _require_alpaca("positions").get_positions()
    return [
        {
            "symbol":          p.symbol,
            "qty":             str(p.qty),
            "side":            p.side.value if hasattr(p.side, "value") else str(p.side),
            "avg_entry_price": str(p.avg_entry_price),
            "current_price":   str(p.current_price or 0),
            "unrealized_pl":   str(p.unrealized_pl or 0),
            "unrealized_plpc": str(p.unrealized_plpc or 0),
            "market_value":    str(p.market_value or 0),
        }
        for p in positions
    ]


@app.get("/tracked-positions")
async def get_tracked_positions():
    if _tracker is None:
        return {}
    return _tracker.all_positions()


# ── Market clock ──────────────────────────────────────────────────────────────

@app.get("/clock")
async def get_clock():
    clock = _require_alpaca("clock").get_clock()
    return {
        "is_open":    clock.is_open,
        "next_open":  str(clock.next_open),
        "next_close": str(clock.next_close),
        "timestamp":  str(clock.timestamp),
    }


# ── Orders ────────────────────────────────────────────────────────────────────

@app.get("/orders")
async def get_orders(limit: int = Query(50, ge=1, le=500)):
    orders = _require_alpaca("orders").get_order_history(limit=limit)
    return [
        {
            "id":               str(o.id),
            "client_order_id":  str(o.client_order_id or ""),
            "symbol":           o.symbol,
            "qty":              str(o.qty or 0),
            "filled_qty":       str(o.filled_qty or 0),
            "side":             o.side.value if hasattr(o.side, "value") else str(o.side),
            "type":             o.type.value if hasattr(o.type, "value") else str(o.type),
            "status":           o.status.value if hasattr(o.status, "value") else str(o.status),
            "limit_price":      str(o.limit_price or ""),
            "filled_avg_price": str(o.filled_avg_price or ""),
            "created_at":       str(o.created_at),
            "filled_at":        str(o.filled_at or ""),
        }
        for o in orders
    ]


# ── Order submission ──────────────────────────────────────────────────────────

class OrderSignal(BaseModel):
    symbol:        str
    side:          str    # "buy" | "sell"
    qty:           float
    current_price: float
    retry_market:  bool = False


class BracketSignal(BaseModel):
    symbol:            str
    side:              str
    qty:               float
    current_price:     float
    stop_price:        float
    take_profit_price: float


class ModifyStopRequest(BaseModel):
    symbol:        str
    new_stop:      float
    current_stop:  float
    position_side: str = "long"   # "long" | "short"


@app.post("/orders")
async def submit_order(signal: OrderSignal):
    result = _require_executor().submit_order(
        signal.model_dump(exclude={"retry_market"}),
        retry_market=signal.retry_market,
    )
    return result


@app.post("/orders/bracket")
async def submit_bracket(signal: BracketSignal):
    return _require_executor().submit_bracket_order(signal.model_dump())


@app.put("/orders/stop")
async def modify_stop(req: ModifyStopRequest):
    success = _require_executor().modify_stop(
        req.symbol, req.new_stop, req.current_stop, req.position_side
    )
    return {"success": success}


@app.delete("/orders/{order_id}")
async def cancel_order(order_id: str):
    _require_executor().cancel_order(order_id)
    return {"cancelled": order_id}


@app.delete("/positions/{symbol}")
async def close_position(symbol: str):
    _require_executor().close_position(symbol)
    return {"closed": symbol}


@app.delete("/positions")
async def close_all():
    _require_executor().close_all_positions()
    return {"closed": "all"}


# ── Market data ───────────────────────────────────────────────────────────────

@app.get("/data/bars")
async def get_bars(
    symbol:    str,
    timeframe: str = "1Min",
    days:      int = Query(7, ge=1, le=365),
):
    md    = _require_market_data()
    start = datetime.now(timezone.utc) - timedelta(days=days)
    df    = md.get_historical_bars(symbol, timeframe, start)

    if df is None or df.empty:
        return []

    df = df.reset_index()
    # Timestamps aren't JSON-serialisable — convert to ISO strings
    for col in df.select_dtypes(include=["datetime64[ns, UTC]", "datetimetz"]).columns:
        df[col] = df[col].astype(str)
    return df.to_dict(orient="records")


@app.get("/data/quote/{symbol}")
async def get_quote(symbol: str):
    md    = _require_market_data()
    quote = md.get_latest_quote(symbol)
    if not quote:
        raise HTTPException(status_code=404, detail=f"No quote available for {symbol}")
    return {
        "symbol":   symbol,
        "bid":      float(quote.bid_price or 0),
        "ask":      float(quote.ask_price or 0),
        "bid_size": float(quote.bid_size or 0),
        "ask_size": float(quote.ask_size or 0),
        "spread":   round(float(quote.ask_price or 0) - float(quote.bid_price or 0), 4),
    }


@app.get("/data/snapshot/{symbol}")
async def get_snapshot(symbol: str):
    md   = _require_market_data()
    snap = md.get_snapshot(symbol)
    if not snap:
        raise HTTPException(status_code=404, detail=f"No snapshot for {symbol}")
    prev_close = float(snap.prev_daily_bar.close) if snap.prev_daily_bar else 0.0
    last_price = float(snap.latest_trade.price)   if snap.latest_trade  else 0.0
    return {
        "symbol":     symbol,
        "price":      last_price,
        "prev_close": prev_close,
        "change":     round(last_price - prev_close, 4),
        "change_pct": round((last_price - prev_close) / prev_close * 100, 4) if prev_close else 0.0,
    }


# ── Crypto convenience endpoints ──────────────────────────────────────────────

@app.get("/crypto/bars")
async def get_crypto_bars(
    symbol:    str = "BTC/USD",
    timeframe: str = "1Min",
    days:      int = Query(1, ge=1, le=30),
):
    md    = _require_market_data()
    start = datetime.now(timezone.utc) - timedelta(days=days)
    df    = md.get_historical_bars(symbol, timeframe, start)

    if df is None or df.empty:
        return []

    df = df.reset_index()
    for col in df.select_dtypes(include=["datetime64[ns, UTC]", "datetimetz"]).columns:
        df[col] = df[col].astype(str)
    return df.to_dict(orient="records")


@app.get("/crypto/snapshots")
async def get_crypto_snapshots(symbols: str = "BTCUSD,ETHUSD,SOLUSD"):
    md      = _require_market_data()
    sym_list = [s.strip() for s in symbols.split(",") if s.strip()]
    results  = {}
    for sym in sym_list:
        try:
            snap = md.get_snapshot(sym)
            if snap:
                last  = float(snap.latest_trade.price) if snap.latest_trade else 0.0
                prev  = float(snap.prev_daily_bar.close) if snap.prev_daily_bar else 0.0
                results[sym] = {
                    "price":      last,
                    "prev_close": prev,
                    "change_pct": round((last - prev) / prev * 100, 4) if prev else 0.0,
                }
        except Exception as exc:
            logger.debug("Snapshot failed for %s: %s", sym, exc)
    return results
