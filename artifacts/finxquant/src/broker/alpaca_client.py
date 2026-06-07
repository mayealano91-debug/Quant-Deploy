"""
broker/alpaca_client.py
Alpaca-py SDK wrapper with paper/live switching, health checks, and auto-reconnect.
Credentials loaded exclusively from .env – never hardcoded.
"""

import os
import time
import logging
from dotenv import load_dotenv
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import GetAssetsRequest
from alpaca.trading.enums import AssetClass

load_dotenv()  # reads .env in project root

logger = logging.getLogger(__name__)

PAPER_BASE_URL = "https://paper-api.alpaca.markets"
LIVE_BASE_URL  = "https://api.alpaca.markets"

_MAX_RETRIES   = 5
_BACKOFF_BASE  = 2   # seconds — doubles each retry (exponential backoff)


def _require_confirmation():
    """Guard for live trading mode."""
    resp = input(
        "\n⚠️  WARNING: ALPACA_PAPER=FALSE — you are about to connect to LIVE trading.\n"
        "Type 'CONFIRM LIVE' to proceed: "
    ).strip()
    if resp != "CONFIRM LIVE":
        raise RuntimeError("Live trading not confirmed. Aborting.")


class AlpacaClient:
    def __init__(self):
        api_key    = os.getenv("ALPACA_API_KEY")
        secret_key = os.getenv("ALPACA_SECRET_KEY")
        paper      = os.getenv("ALPACA_PAPER", "TRUE").upper() == "TRUE"

        if not api_key or not secret_key:
            raise EnvironmentError(
                "ALPACA_API_KEY and ALPACA_SECRET_KEY must be set in .env"
            )

        if not paper:
            _require_confirmation()

        self.paper    = paper
        self.base_url = PAPER_BASE_URL if paper else LIVE_BASE_URL
        self._api_key    = api_key
        self._secret_key = secret_key
        self.client: TradingClient = None

        self._connect_with_backoff()

    # ─── Connection ────────────────────────────────────────────────────────────

    def _build_client(self) -> TradingClient:
        return TradingClient(
            api_key    = self._api_key,
            secret_key = self._secret_key,
            paper      = self.paper,
        )

    def _connect_with_backoff(self):
        """Attempt connection with exponential backoff on failure."""
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                self.client = self._build_client()
                self._health_check()
                mode = "PAPER" if self.paper else "LIVE"
                logger.info(f"[AlpacaClient] Connected ({mode}) — {self.base_url}")
                return
            except Exception as exc:
                wait = _BACKOFF_BASE ** attempt
                logger.warning(
                    f"[AlpacaClient] Connection attempt {attempt}/{_MAX_RETRIES} failed: {exc}. "
                    f"Retrying in {wait}s..."
                )
                time.sleep(wait)
        raise ConnectionError("[AlpacaClient] All connection attempts exhausted.")

    def _health_check(self):
        """Verify credentials by fetching account info."""
        account = self.client.get_account()
        logger.info(
            f"[AlpacaClient] Health OK · Account #{account.account_number} · "
            f"Buying power: ${float(account.buying_power):,.2f}"
        )

    # ─── Account & Portfolio ────────────────────────────────────────────────────

    def get_account(self):
        """Return the full account object."""
        return self.client.get_account()

    def get_positions(self):
        """Return list of current open positions."""
        return self.client.get_all_positions()

    def get_order_history(self, limit: int = 50):
        """Return recent orders (filled + cancelled)."""
        from alpaca.trading.requests import GetOrdersRequest
        from alpaca.trading.enums import QueryOrderStatus
        req = GetOrdersRequest(status=QueryOrderStatus.ALL, limit=limit)
        return self.client.get_orders(filter=req)

    def get_available_margin(self) -> float:
        """Return available buying power as float."""
        account = self.get_account()
        return float(account.buying_power)

    # ─── Market Hours ───────────────────────────────────────────────────────────

    def get_clock(self):
        """Return the Alpaca market clock object."""
        return self.client.get_clock()

    def is_market_open(self) -> bool:
        """True if the US equity market is currently open."""
        return self.get_clock().is_open