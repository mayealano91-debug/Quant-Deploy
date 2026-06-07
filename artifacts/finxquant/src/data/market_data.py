"""
data/market_data.py
Historical + real-time market data via alpaca-py.
Handles gaps (weekends, holidays, halts) gracefully.
"""

import os
import logging
import threading
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from alpaca.data.historical import StockHistoricalDataClient, CryptoHistoricalDataClient
from alpaca.data.live import StockDataStream, CryptoDataStream
from alpaca.data.requests import (
    StockBarsRequest, StockLatestBarRequest,
    StockLatestQuoteRequest, StockSnapshotRequest,
)
from alpaca.data.timeframe import TimeFrame

load_dotenv()
logger = logging.getLogger(__name__)

NY_TZ = ZoneInfo("America/New_York")


class MarketData:
    def __init__(self):
        api_key    = os.getenv("ALPACA_API_KEY")
        secret_key = os.getenv("ALPACA_SECRET_KEY")

        self._hist   = StockHistoricalDataClient(api_key, secret_key)
        self._stream = StockDataStream(api_key, secret_key)
        self._thread = None

    # ─── Historical bars ─────────────────────────────────────────────────────────

    def get_historical_bars(self, symbol: str, timeframe: TimeFrame,
                             start: datetime, end: datetime = None):
        """
        Fetch OHLCV bars. Gaps (weekends/holidays/halts) are omitted by Alpaca
        and handled by returning only the available bars — caller must account for gaps.
        """
        end = end or datetime.now(NY_TZ)
        req = StockBarsRequest(
            symbol_or_symbols = symbol,
            timeframe         = timeframe,
            start             = start,
            end               = end,
            adjustment        = "all",
        )
        try:
            bars = self._hist.get_stock_bars(req)
            return bars.df
        except Exception as e:
            logger.warning(f"[MarketData] get_historical_bars {symbol}: {e} — returning empty.")
            return None

    # ─── Latest snapshot helpers ─────────────────────────────────────────────────

    def get_latest_bar(self, symbol: str):
        req = StockLatestBarRequest(symbol_or_symbols=symbol)
        try:
            return self._hist.get_stock_latest_bar(req)[symbol]
        except Exception as e:
            logger.warning(f"[MarketData] get_latest_bar {symbol}: {e}")
            return None

    def get_latest_quote(self, symbol: str):
        req = StockLatestQuoteRequest(symbol_or_symbols=symbol)
        try:
            return self._hist.get_stock_latest_quote(req)[symbol]
        except Exception as e:
            logger.warning(f"[MarketData] get_latest_quote {symbol}: {e}")
            return None

    def get_snapshot(self, symbol: str):
        req = StockSnapshotRequest(symbol_or_symbols=symbol)
        try:
            return self._hist.get_stock_snapshot(req)[symbol]
        except Exception as e:
            logger.warning(f"[MarketData] get_snapshot {symbol}: {e}")
            return None

    # ─── Real-time WebSocket subscriptions ───────────────────────────────────────

    def subscribe_bars(self, symbols: list[str], timeframe: TimeFrame, callback):
        """
        Subscribe to real-time bar updates for a list of symbols.
        `callback(bar)` is called on each new bar.
        """
        async def _handler(bar):
            try:
                callback(bar)
            except Exception as e:
                logger.error(f"[MarketData] subscribe_bars callback error: {e}")

        self._stream.subscribe_bars(_handler, *symbols)
        self._start_stream()

    def subscribe_quotes(self, symbols: list[str], callback):
        """
        Subscribe to real-time quote updates (bid/ask) for spread checks.
        `callback(quote)` is called on each update.
        """
        async def _handler(quote):
            try:
                callback(quote)
            except Exception as e:
                logger.error(f"[MarketData] subscribe_quotes callback error: {e}")

        self._stream.subscribe_quotes(_handler, *symbols)
        self._start_stream()

    def _start_stream(self):
        if self._thread and self._thread.is_alive():
            return
        self._thread = threading.Thread(target=self._stream.run, daemon=True)
        self._thread.start()
        logger.info("[MarketData] Real-time data stream started.")

    def stop_stream(self):
        self._stream.stop()
        logger.info("[MarketData] Real-time data stream stopped.")