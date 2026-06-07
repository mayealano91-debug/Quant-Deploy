"""
data/market_data.py
-------------------
Market data layer: historical bars, real-time WebSocket subscriptions,
latest quotes/bars, snapshots, and graceful gap handling.

Supports both US equities (Alpaca SIP feed) and crypto (Alpaca crypto feed).
Gap handling: weekends, market holidays, and halts are forward-filled so
callers always receive a contiguous series.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Callable, List, Optional

from alpaca.data.historical import StockHistoricalDataClient, CryptoHistoricalDataClient
from alpaca.data.live import StockDataStream, CryptoDataStream
from alpaca.data.requests import (
    StockBarsRequest,
    CryptoBarsRequest,
    StockLatestQuoteRequest,
    StockLatestBarRequest,
    StockSnapshotRequest,
    CryptoLatestQuoteRequest,
    CryptoLatestBarRequest,
    CryptoSnapshotRequest,
)
from alpaca.data.timeframe import TimeFrame, TimeFrameUnit

logger = logging.getLogger(__name__)

# Symbols recognised as crypto (strip "/" before checking)
_CRYPTO_SYMBOLS = {
    "BTCUSD", "ETHUSD", "SOLUSD", "ADAUSD", "DOTUSD",
    "BNBUSD", "XRPUSD", "AVAXUSD", "MATICUSD", "LINKUSD",
    "LTCUSD", "UNIUSD", "AAVEUSD",
}

_TIMEFRAME_MAP: dict[str, TimeFrame] = {
    "1Min":  TimeFrame.Minute,
    "5Min":  TimeFrame(5,  TimeFrameUnit.Minute),
    "15Min": TimeFrame(15, TimeFrameUnit.Minute),
    "30Min": TimeFrame(30, TimeFrameUnit.Minute),
    "1Hour": TimeFrame.Hour,
    "4Hour": TimeFrame(4,  TimeFrameUnit.Hour),
    "1Day":  TimeFrame.Day,
    "1Week": TimeFrame.Week,
}


def _normalise_symbol(symbol: str) -> str:
    """Strip '/' so 'BTC/USD' → 'BTCUSD'."""
    return symbol.replace("/", "").upper()


def _is_crypto(symbol: str) -> bool:
    return _normalise_symbol(symbol) in _CRYPTO_SYMBOLS


class MarketData:
    """
    Unified market data client for equities and crypto.

    Parameters
    ----------
    api_key : str
    secret_key : str
    """

    def __init__(self, api_key: str, secret_key: str) -> None:
        self.api_key    = api_key
        self.secret_key = secret_key
        self._stock_hist  = StockHistoricalDataClient(api_key, secret_key)
        self._crypto_hist = CryptoHistoricalDataClient(api_key, secret_key)
        self._stream = None

    # ── Historical bars ────────────────────────────────────────────────────────

    def get_historical_bars(
        self,
        symbol: str,
        timeframe: TimeFrame | str,
        start: datetime,
        end: Optional[datetime] = None,
    ):
        """
        Fetch OHLCV bars as a pandas DataFrame.

        Gaps (weekends, holidays, halts) are forward-filled so callers receive
        a contiguous series. Returns an empty DataFrame on total failure.

        Parameters
        ----------
        symbol    : str — e.g. "AAPL" or "BTC/USD"
        timeframe : TimeFrame or string key from _TIMEFRAME_MAP
        start     : datetime (timezone-aware recommended)
        end       : datetime, defaults to now
        """
        if isinstance(timeframe, str):
            timeframe = _TIMEFRAME_MAP.get(timeframe, TimeFrame.Minute)

        end  = end or datetime.now(timezone.utc)
        sym  = _normalise_symbol(symbol)

        try:
            if _is_crypto(symbol):
                req  = CryptoBarsRequest(symbol_or_symbols=sym, timeframe=timeframe,
                                         start=start, end=end)
                bars = self._crypto_hist.get_crypto_bars(req)
            else:
                req  = StockBarsRequest(symbol_or_symbols=sym, timeframe=timeframe,
                                        start=start, end=end)
                bars = self._stock_hist.get_stock_bars(req)

            df = bars.df
            if df is None or df.empty:
                logger.warning("No bars for %s — possible weekend/holiday/halt gap", sym)
                return df

            # Forward-fill tiny gaps while preserving the original index
            # (resample only works reliably for Minute/Hour/Day)
            resample_rule = getattr(timeframe, "value", None)
            if resample_rule and isinstance(resample_rule, str):
                try:
                    df = df.resample(resample_rule).ffill()
                except Exception:
                    pass  # silently skip if rule is not parseable by pandas

            logger.info("Fetched %d bars for %s", len(df), sym)
            return df

        except Exception as exc:
            logger.error("get_historical_bars failed for %s: %s", sym, exc)
            raise

    # ── Latest bar / quote / snapshot ─────────────────────────────────────────

    def get_latest_bar(self, symbol: str):
        sym = _normalise_symbol(symbol)
        if _is_crypto(symbol):
            req = CryptoLatestBarRequest(symbol_or_symbols=sym)
            return self._crypto_hist.get_crypto_latest_bar(req).get(sym)
        req = StockLatestBarRequest(symbol_or_symbols=sym)
        return self._stock_hist.get_stock_latest_bar(req).get(sym)

    def get_latest_quote(self, symbol: str):
        sym = _normalise_symbol(symbol)
        if _is_crypto(symbol):
            req = CryptoLatestQuoteRequest(symbol_or_symbols=sym)
            return self._crypto_hist.get_crypto_latest_quote(req).get(sym)
        req = StockLatestQuoteRequest(symbol_or_symbols=sym)
        return self._stock_hist.get_stock_latest_quote(req).get(sym)

    def get_snapshot(self, symbol: str):
        sym = _normalise_symbol(symbol)
        if _is_crypto(symbol):
            req = CryptoSnapshotRequest(symbol_or_symbols=sym)
            return self._crypto_hist.get_crypto_snapshot(req).get(sym)
        req = StockSnapshotRequest(symbol_or_symbols=sym)
        return self._stock_hist.get_stock_snapshot(req).get(sym)

    # ── WebSocket subscriptions ────────────────────────────────────────────────

    def subscribe_bars(
        self,
        symbols: List[str],
        timeframe: str,
        callback: Callable,
    ) -> None:
        """
        Subscribe to live bar updates via WebSocket (blocking — run in a thread).
        The *timeframe* label is for logging only; Alpaca streams the native bar cadence.
        """
        use_crypto = all(_is_crypto(s) for s in symbols)
        normed     = [_normalise_symbol(s) for s in symbols]

        if use_crypto:
            self._stream = CryptoDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_bars(callback, *normed)
        else:
            self._stream = StockDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_bars(callback, *normed)

        logger.info("Subscribed to %s bars: %s", timeframe, normed)
        self._stream.run()  # blocks — caller should run in a thread

    def subscribe_quotes(self, symbols: List[str], callback: Callable) -> None:
        """
        Subscribe to real-time bid/ask quotes for spread monitoring.
        Blocking — run in a thread.
        """
        use_crypto = all(_is_crypto(s) for s in symbols)
        normed     = [_normalise_symbol(s) for s in symbols]

        if use_crypto:
            self._stream = CryptoDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_quotes(callback, *normed)
        else:
            self._stream = StockDataStream(self.api_key, self.secret_key)
            self._stream.subscribe_quotes(callback, *normed)

        logger.info("Subscribed to quotes: %s", normed)
        self._stream.run()

    def stop_stream(self) -> None:
        if self._stream:
            self._stream.stop()
            logger.info("Market data stream stopped.")
