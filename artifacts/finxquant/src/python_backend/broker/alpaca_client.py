"""
broker/alpaca_client.py
-----------------------
Alpaca-py SDK wrapper.
Credentials loaded exclusively from environment variables / .env — NEVER hardcoded.
Paper trading is the default (ALPACA_PAPER=TRUE).
Auto-reconnects with exponential back-off on startup failure.
"""

import os
import time
import logging
from dotenv import load_dotenv
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import GetOrdersRequest
from alpaca.trading.enums import QueryOrderStatus

load_dotenv()  # no-op if .env absent (Replit injects env vars directly)

logger = logging.getLogger(__name__)

PAPER_URL = "https://paper-api.alpaca.markets"
LIVE_URL  = "https://api.alpaca.markets"

_MAX_RETRIES  = 5
_BACKOFF_BASE = 2  # seconds — doubles each attempt: 2, 4, 8, 16, 32


def _require_live_confirmation() -> None:
    """Interactively guard against accidental live-money connections."""
    answer = input(
        "\n⚠️  WARNING: ALPACA_PAPER=FALSE — you are about to connect to LIVE trading.\n"
        "   Real funds are at risk.\n"
        "   Type 'CONFIRM LIVE' to proceed: "
    ).strip()
    if answer != "CONFIRM LIVE":
        raise SystemExit("Live trading not confirmed — aborting.")


class AlpacaClient:
    """
    Thread-safe wrapper around alpaca-py TradingClient.
    Instantiate once; share the instance across OrderExecutor and PositionTracker.
    """

    def __init__(self) -> None:
        self._api_key    = os.getenv("ALPACA_API_KEY")
        self._secret_key = os.getenv("ALPACA_SECRET_KEY")
        self.paper       = os.getenv("ALPACA_PAPER", "TRUE").upper() == "TRUE"

        if not self._api_key or not self._secret_key:
            raise EnvironmentError(
                "ALPACA_API_KEY and ALPACA_SECRET_KEY must be set in the environment "
                "(or in a .env file). Never hardcode credentials."
            )

        if not self.paper:
            _require_live_confirmation()

        self.base_url = PAPER_URL if self.paper else LIVE_URL
        self.client: TradingClient = self._connect_with_backoff()

    # ── Connection helpers ────────────────────────────────────────────────────

    def _build_client(self) -> TradingClient:
        return TradingClient(
            api_key=self._api_key,
            secret_key=self._secret_key,
            paper=self.paper,
        )

    def _connect_with_backoff(self) -> TradingClient:
        """Attempt connection with exponential back-off; raise after all retries."""
        for attempt in range(1, _MAX_RETRIES + 1):
            try:
                client = self._build_client()
                self._health_check(client)
                mode = "PAPER" if self.paper else "LIVE ⚡"
                logger.info("[AlpacaClient] Connected (%s) — %s", mode, self.base_url)
                return client
            except Exception as exc:
                wait = _BACKOFF_BASE ** attempt
                logger.warning(
                    "[AlpacaClient] Attempt %d/%d failed: %s — retrying in %ds",
                    attempt, _MAX_RETRIES, exc, wait,
                )
                if attempt == _MAX_RETRIES:
                    raise ConnectionError(
                        f"[AlpacaClient] All {_MAX_RETRIES} connection attempts exhausted."
                    ) from exc
                time.sleep(wait)

    def reconnect(self) -> None:
        """Explicit reconnect — call after a detected network drop."""
        logger.info("[AlpacaClient] Reconnecting…")
        self.client = self._connect_with_backoff()

    def _health_check(self, client: TradingClient) -> None:
        """Verify credentials + log account summary on startup."""
        acct = client.get_account()
        logger.info(
            "[AlpacaClient] Health OK · Account #%s · "
            "Equity=$%.2f  Cash=$%.2f  BuyingPower=$%.2f",
            acct.account_number,
            float(acct.equity),
            float(acct.cash),
            float(acct.buying_power),
        )

    # ── Account & portfolio ───────────────────────────────────────────────────

    def get_account(self):
        """Return full account object from Alpaca."""
        return self.client.get_account()

    def get_positions(self) -> list:
        """Return list of currently open positions."""
        return self.client.get_all_positions()

    def get_order_history(self, status: str = "all", limit: int = 100) -> list:
        req = GetOrdersRequest(status=QueryOrderStatus(status), limit=limit)
        return self.client.get_orders(filter=req)

    def get_available_margin(self) -> float:
        """Return current buying power as a float."""
        return float(self.get_account().buying_power)

    # ── Market hours ─────────────────────────────────────────────────────────

    def get_clock(self):
        """Return Alpaca's market clock object."""
        return self.client.get_clock()

    def is_market_open(self) -> bool:
        """True if the US equity market is currently open."""
        return self.get_clock().is_open
