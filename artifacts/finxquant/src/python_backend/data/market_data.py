"""
data/market_data.py
-------------------
Market data layer: historical bars, live bar/quote WebSocket subscriptions,
snapshots, and graceful gap handling.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional

from alpaca.data.historical import StockHistoricalDataClient, CryptoHistoricalDataClient
from alpaca.data.live import StockDataStream, CryptoDataStream
from alpaca.data.requests import (
    StockBarsRequest, CryptoBarsRequest,
    StockLatestQuoteRequest, StockLatestBarRequest,
    StockSnapshotRequest,
)
from alpaca.data.timeframe import TimeFrame

logger = logging.getLogger(__name__)


def _is_crypto(symbol: str) -> bool:
    CRYPTO_SYMBOLS = {"BTCUSD", "ETHUSD", "SOLUSD", "ADAUSD", "DOTUSD", "BNBUSD", "XRPUSD"}
    return symbol.upper() in CRYPTO_SYMBOLS


class MarketData:
    def __init__(self, api_key: str, secret_key: str):
        self.api_key    = api_key
        self.secret_key = secret_key

        self.stock_client  = StockHistoricalDataClient(api_key, secret_key)
        self.crypto_client = CryptoHistoricalDataClient(api_key, secret_key)
        self._stream: Optional[StockDataStream | CryptoDataStream] = None

    # ------------------------------------------------------------------
    # Historical
    # ------------------------------------------------------------------

    def get_historical_bars(
        self,
        symbol: str,
        timeframe: TimeFrame,
        start: datetime,
        end: Optional[datetime] = None,
    ):
        """
        Fetch OHLCV bars. Handles missing data gracefully (weekends, holidays, halts).
        Returns a pandas DataFrame or raises on total failure.
        """
        end = end or datetime.now(timezone.utc)

        try:
            if _is_crypto(symbol):
                req  = CryptoBarsRequest(symbol_or_symbols=symbol, timeframe=timeframe, start=start, end=end)
                bars = self.crypto_client.get_crypto_bars(req)
            else:
                req  = StockBarsRequest(symbol_or_symbols=symbol, timeframe=timeframe, start=start, end=end)
                bars = self.stock_client.get_stock_bars(req)

            df = bars.df
            if df is None or df.empty:
                logger.warning("No bars returned for %s — possible holiday/halt gap", symbol)
                return df

            # Fill tiny gaps (missing bars) with forward-fill
            df = df.resample(timeframe.value if hasattr(timeframe, 'value') else '5T').ffill()
            logger.info("Fetched %d bars for %s", len(df), symbol)
            return df

        except Exception as exc:
            logger.error("get_historical_bars failed for %s: %s", symbol, exc)
            raise

    # ------------------------------------------------------------------
    # Latest / snapshot
    # ------------------------------------------------------------------

    def get_latest_bar(self, symbol: str):
        req = StockLatestBarRequest(symbol_or_symbols=symbol)
        return self.stock_client.get_stock_latest_bar(req).get(symbol)

    def get_latest_quote(self, symbol: str):
        req = StockLatestQuoteRequest(symbol_or_symbols=symbol)
        return self.stock_client.get_stock_latest_quote(req).get(symbol)

    def get_snapshot(self, symbol: str):
        req = StockSnapshotRequest(symbol_or_symbols=symbol)
        return self.stock_client.get_stock_snapshot(req).get(symbol)

    # ------------------------------------------------------------------
    # Live WebSocket subscriptions
    # ------------------------------------------------------------------

    def subscribe_bars(self, symbols: List[str], timeframe: str, callback: Callable):
        """Subscribe to live bar updates via WebSocket."""
        use_crypto = all(_is_crypto(s) for s in symbols)
        if use_crypto:
            self._stream = CryptoDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_bars(callback, *symbols)
        else:
            self._stream = StockDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_bars(callback, *symbols)

        logger.info("Subscribed to %s bars for: %s", timeframe, symbols)
        self._stream.run()   # blocking — run in a thread

    def subscribe_quotes(self, symbols: List[str], callback: Callable):
        """Subscribe to live quote updates (bid/ask spread checks)."""
        use_crypto = all(_is_crypto(s) for s in symbols)
        if use_crypto:
            self._stream = CryptoDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_quotes(callback, *symbols)
        else:
            self._stream = StockDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_quotes(callback, *symbols)

        logger.info("Subscribed to quotes for: %s", symbols)
        self._stream.run()

    def stop_stream(self):
        if self._stream:
            self._stream.stop()
            logger.info("Market data stream stopped")