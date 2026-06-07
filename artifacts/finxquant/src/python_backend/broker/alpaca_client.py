"""
broker/alpaca_client.py
-----------------------
Alpaca-py SDK wrapper.
Credentials loaded from .env — NEVER hardcoded.
Paper trading is the default (ALPACA_PAPER=TRUE).
"""

import os
import time
import logging
from dotenv import load_dotenv
from alpaca.trading.client import TradingClient
from alpaca.trading.requests import GetOrdersRequest
from alpaca.trading.enums import QueryOrderStatus

load_dotenv()  # reads .env in project root

logger = logging.getLogger(__name__)

PAPER_URL = "https://paper-api.alpaca.markets"
LIVE_URL  = "https://api.alpaca.markets"

MAX_RETRIES    = 5
BACKOFF_BASE   = 2   # seconds — exponential: 2, 4, 8, 16, 32


class AlpacaClient:
    def __init__(self):
        self.api_key    = os.environ["ALPACA_API_KEY"]
        self.secret_key = os.environ["ALPACA_SECRET_KEY"]
        self.paper      = os.getenv("ALPACA_PAPER", "TRUE").upper() == "TRUE"

        if not self.paper:
            self._confirm_live_trading()

        self.client = self._connect_with_retry()
        self._health_check()

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _confirm_live_trading(self):
        """Force explicit confirmation before any live-money connection."""
        answer = input(
            "\n⚠️  WARNING: ALPACA_PAPER=FALSE — you are about to connect to LIVE trading.\n"
            "   Real funds are at risk. Type 'CONFIRM LIVE' to proceed: "
        )
        if answer.strip() != "CONFIRM LIVE":
            raise SystemExit("Live trading cancelled by user.")

    def _make_client(self) -> TradingClient:
        return TradingClient(
            api_key=self.api_key,
            secret_key=self.secret_key,
            paper=self.paper,
        )

    def _connect_with_retry(self) -> TradingClient:
        """Exponential back-off reconnect on startup."""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                client = self._make_client()
                logger.info("AlpacaClient connected (paper=%s)", self.paper)
                return client
            except Exception as exc:
                wait = BACKOFF_BASE ** attempt
                logger.warning(
                    "Connection attempt %d/%d failed: %s — retrying in %ds",
                    attempt, MAX_RETRIES, exc, wait,
                )
                if attempt == MAX_RETRIES:
                    raise
                time.sleep(wait)

    def _health_check(self):
        """Verify connectivity and log account summary on startup."""
        acct = self.get_account()
        logger.info(
            "Health check OK — equity=$%.2f  cash=$%.2f  buying_power=$%.2f",
            float(acct.equity), float(acct.cash), float(acct.buying_power),
        )

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def get_account(self):
        """Return full account object."""
        return self.client.get_account()

    def get_positions(self) -> list:
        """Return list of open positions."""
        return self.client.get_all_positions()

    def get_order_history(self, status: str = "all", limit: int = 100) -> list:
        req = GetOrdersRequest(status=QueryOrderStatus(status), limit=limit)
        return self.client.get_orders(filter=req)

    def is_market_open(self) -> bool:
        return self.client.get_clock().is_open

    def get_clock(self):
        return self.client.get_clock()

    def get_available_margin(self) -> float:
        acct = self.get_account()
        return float(acct.buying_power)