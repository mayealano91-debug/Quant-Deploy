# Alpaca Quant Trader — Python Backend

## Setup

```bash
cd python_backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env and paste your Alpaca API keys
```

## .env
```
ALPACA_API_KEY=YOUR_KEY_HERE
ALPACA_SECRET_KEY=YOUR_SECRET_HERE
ALPACA_PAPER=TRUE   # Change to FALSE only for live real-money trading
```

⚠️ **Never commit .env to git** — it is in .gitignore.

## Structure
```
python_backend/
├── .env.example          ← copy to .env, fill in keys
├── .gitignore
├── requirements.txt
├── broker/
│   ├── alpaca_client.py      ← SDK wrapper + health check + backoff
│   ├── order_executor.py     ← limit/bracket/stop orders + trade_id
│   └── position_tracker.py  ← WebSocket fills + P&L tracking
└── data/
    └── market_data.py        ← historical + live bars/quotes
```

## Paper vs Live
- `ALPACA_PAPER=TRUE`  → safe paper trading (default)  
- `ALPACA_PAPER=FALSE` → live money, requires typed confirmation at startup