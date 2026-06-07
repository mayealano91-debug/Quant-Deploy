import React, { useRef, useEffect, useState, useCallback } from 'react';

function MiniCandleChart({ candles, livePrice }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !candles || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    const highs = candles.map(c => c.high);
    const lows  = candles.map(c => c.low);
    const maxP  = Math.max(...highs), minP = Math.min(...lows);
    const range = maxP - minP || 1;
    const toY   = p => h - ((p - minP) / range) * (h * 0.85) - h * 0.05;

    ctx.clearRect(0, 0, w, h);
    const cw = w / candles.length;

    candles.forEach((c, i) => {
      const x     = i * cw + cw / 2;
      const isUp  = c.close >= c.open;
      const color = isUp ? '#22c55e' : '#ef4444';
      const bodyTop = toY(Math.max(c.open, c.close));
      const bodyBot = toY(Math.min(c.open, c.close));
      const bodyH   = Math.max(1, bodyBot - bodyTop);

      ctx.strokeStyle = color;
      ctx.lineWidth   = 0.5;
      ctx.beginPath();
      ctx.moveTo(x, toY(c.high));
      ctx.lineTo(x, toY(c.low));
      ctx.stroke();

      ctx.fillStyle = color;
      ctx.fillRect(x - cw * 0.35, bodyTop, cw * 0.7, bodyH);
    });

    const lastClose = livePrice ?? candles[candles.length - 1].close;
    const py = toY(lastClose);
    ctx.strokeStyle = 'rgba(250,204,21,0.8)';
    ctx.lineWidth   = 0.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 8px JetBrains Mono, monospace';
    ctx.fillText(`$${Math.round(lastClose).toLocaleString()}`, w - 54, py - 2);
  }, [candles, livePrice]);

  return <canvas ref={canvasRef} width={200} height={130} className="w-full h-full" style={{ display: 'block' }} />;
}

function OrderBookMini({ snapshot }) {
  const mid  = snapshot?.latestTrade?.p ?? snapshot?.latestQuote?.ap ?? 77680;
  const step = mid * 0.00003;

  const asks = Array.from({ length: 8 }, (_, i) => ({
    price: mid + (i + 1) * step,
    size:  snapshot?.latestQuote?.as
      ? Math.floor(snapshot.latestQuote.as * (1 + i * 0.15) * 1000) / 10
      : Math.floor(200 + Math.random() * 800),
  })).reverse();

  const bids = Array.from({ length: 8 }, (_, i) => ({
    price: mid - (i + 1) * step,
    size:  snapshot?.latestQuote?.bs
      ? Math.floor(snapshot.latestQuote.bs * (1 + i * 0.15) * 1000) / 10
      : Math.floor(200 + Math.random() * 800),
  }));

  return (
    <div className="text-[7px] font-mono h-full overflow-hidden flex flex-col justify-center px-1">
      {asks.map((r, i) => (
        <div key={`a${i}`} className="flex justify-between py-px text-red-400">
          <span>{r.price.toFixed(1)}</span>
          <span className="text-muted-foreground">{r.size}</span>
        </div>
      ))}
      <div className="text-[8px] text-yellow-400 font-bold text-center py-0.5 border-y border-border/30 my-0.5">
        {Math.round(mid).toLocaleString()}
      </div>
      {bids.map((r, i) => (
        <div key={`b${i}`} className="flex justify-between py-px text-green-400">
          <span>{r.price.toFixed(1)}</span>
          <span className="text-muted-foreground">{r.size}</span>
        </div>
      ))}
    </div>
  );
}

export default function PnLBlock() {
  const [candles,   setCandles]   = useState([]);
  const [snapshot,  setSnapshot]  = useState(null);
  const [account,   setAccount]   = useState(null);
  const [positions, setPositions] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [barsRes, snapRes, acctRes, posRes] = await Promise.all([
        fetch('/api/alpaca/crypto/bars?symbol=BTC%2FUSD&timeframe=5Min&limit=60'),
        fetch('/api/alpaca/crypto/snapshots?symbols=BTC%2FUSD'),
        fetch('/api/alpaca/account'),
        fetch('/api/alpaca/positions'),
      ]);

      if (barsRes.ok) {
        const barsData = await barsRes.json();
        const raw = barsData?.bars?.['BTC/USD'] ?? [];
        setCandles(raw.map(b => ({ open: b.o, high: b.h, low: b.l, close: b.c, vol: b.v })));
      }

      if (snapRes.ok) {
        const snapData = await snapRes.json();
        setSnapshot(snapData?.snapshots?.['BTC/USD'] ?? null);
      }

      if (acctRes.ok) {
        const acctData = await acctRes.json();
        setAccount(acctData);
      }

      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(Array.isArray(posData) ? posData : []);
      }
    } catch (_) {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [fetchData]);

  const livePrice = snapshot?.latestTrade?.p ?? snapshot?.latestQuote?.ap ?? null;
  const dailyBar  = snapshot?.dailyBar;
  const prevDaily = snapshot?.prevDailyBar;
  const dayChange    = dailyBar && prevDaily ? dailyBar.c - prevDaily.c : null;
  const dayChangePct = prevDaily?.c ? ((dayChange / prevDaily.c) * 100) : null;

  const equity      = account ? parseFloat(account.equity)       : null;
  const lastEquity  = account ? parseFloat(account.last_equity)  : null;
  const sessionPnL  = equity && lastEquity ? equity - lastEquity : null;
  const buyingPower = account ? parseFloat(account.buying_power) : null;

  const fmt = (n, d = 0) => n != null ? `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}` : '—';
  const sign = n => n >= 0 ? '+' : '-';

  const totalOrders = positions.length;
  const winPos = positions.filter(p => parseFloat(p.unrealized_pl) > 0).length;
  const winRate = totalOrders > 0 ? ((winPos / totalOrders) * 100).toFixed(1) : null;

  return (
    <div className="shrink-0 border-b border-border/60 bg-[hsl(220,15%,5%)] flex font-mono" style={{ minHeight: 175 }}>

      {/* LEFT: Account + PnL stats */}
      <div className="flex flex-col justify-between p-2 border-r border-border/50" style={{ minWidth: 185 }}>
        <div>
          <div className="text-[8px] text-green-400 font-bold">
            ◉ ALPACA PAPER <span className="ml-1 px-1 py-px bg-green-500/20 border border-green-500/40 text-green-300 text-[7px]">LIVE</span>
          </div>
          <div className="text-[7px] text-muted-foreground mb-1">paper-api.alpaca.markets · PAPER TRADING</div>
          {loading ? (
            <div className="text-3xl font-black text-green-400/40 leading-none tracking-tight animate-pulse">$——,———</div>
          ) : (
            <div className="text-3xl font-black text-green-400 leading-none tracking-tight">
              {fmt(equity)}
            </div>
          )}
          <div className="text-[8px] text-muted-foreground mt-0.5">
            PORTFOLIO EQUITY ·{' '}
            {sessionPnL != null && (
              <span className={sessionPnL >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {sign(sessionPnL)}{fmt(sessionPnL, 2)} TODAY
              </span>
            )}
          </div>
        </div>
        <div>
          <div className="grid grid-cols-3 gap-1 mt-1.5 mb-1.5">
            <div>
              <div className="text-[7px] text-muted-foreground">POSITIONS</div>
              <div className="text-sm font-black text-foreground">{positions.length}</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground">WIN POS</div>
              <div className="text-sm font-black text-green-400">
                {winRate != null ? `${winRate}%` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground">BUYING PWR</div>
              <div className="text-[9px] font-black text-primary">{fmt(buyingPower)}</div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] text-muted-foreground">ACCOUNT</span>
            <span className="text-[8px] font-bold text-foreground">PAPER</span>
            <span className="px-1 py-px bg-green-500/20 border border-green-500/40 text-green-400 text-[7px] font-black">SAFE</span>
          </div>
          <div className="w-full h-0.5 bg-secondary mt-1 rounded">
            <div className="h-full bg-green-500 rounded" style={{ width: `${Math.min(100, (positions.length / 10) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* CENTER: Open Positions */}
      <div className="flex flex-col p-2 border-r border-border/50" style={{ minWidth: 170 }}>
        <div className="flex items-center justify-between mb-0.5">
          <span className="text-[8px] text-yellow-400 font-bold">★ OPEN POSITIONS</span>
          <span className="text-[7px] px-1 py-px bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 font-bold">
            {positions.length > 0 ? 'LIVE' : 'NONE'}
          </span>
        </div>

        {positions.length === 0 && !loading && (
          <div className="text-[7px] text-muted-foreground mt-2 text-center">
            No open positions.<br />Start the agent to begin trading.
          </div>
        )}

        {positions.slice(0, 4).map((pos, i) => {
          const pl    = parseFloat(pos.unrealized_pl);
          const plPct = parseFloat(pos.unrealized_plpc) * 100;
          const isUp  = pl >= 0;
          return (
            <div key={i} className="border border-border/30 rounded-sm p-1 mb-1">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black text-foreground">{pos.symbol}</span>
                <span className={`text-[8px] font-bold ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                  {isUp ? '+' : ''}{pl.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-[7px] text-muted-foreground">
                <span>QTY {parseFloat(pos.qty).toFixed(4)} · {pos.side.toUpperCase()}</span>
                <span className={isUp ? 'text-green-400' : 'text-red-400'}>
                  {isUp ? '+' : ''}{plPct.toFixed(2)}%
                </span>
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="text-[7px] text-muted-foreground animate-pulse mt-2">Loading positions...</div>
        )}
      </div>

      {/* RIGHT: BTC Chart */}
      <div className="flex flex-1 min-w-0">
        <div className="flex flex-col flex-1 min-w-0 border-r border-border/50">
          <div className="flex items-center gap-2 px-2 py-0.5 border-b border-border/30 shrink-0">
            <span className="text-[8px] text-primary font-bold">⊕ BTC/USD · 5M</span>
            {livePrice != null && (
              <>
                <span className="text-[9px] text-green-400 font-bold">
                  ${Math.round(livePrice).toLocaleString()} {dayChange != null && (dayChange >= 0 ? '▲' : '▼')}
                </span>
                {dayChangePct != null && (
                  <span className={`text-[8px] ${dayChangePct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {dayChangePct >= 0 ? '+' : ''}{dayChangePct.toFixed(2)}%
                  </span>
                )}
              </>
            )}
            {livePrice == null && !loading && (
              <span className="text-[9px] text-muted-foreground">Fetching price...</span>
            )}
            <span className="ml-auto text-[7px] text-muted-foreground">
              {loading ? 'LOADING' : 'LIVE'}
            </span>
          </div>
          <div className="flex-1 min-h-0">
            {candles.length > 0
              ? <MiniCandleChart candles={candles} livePrice={livePrice} />
              : <div className="w-full h-full flex items-center justify-center text-[8px] text-muted-foreground">
                  {loading ? 'Loading chart data...' : 'No candle data'}
                </div>
            }
          </div>
        </div>
        {/* Order book */}
        <div className="w-16 shrink-0">
          <div className="text-[7px] text-muted-foreground text-center py-0.5 border-b border-border/30">BID/ASK</div>
          <OrderBookMini snapshot={snapshot} />
        </div>
      </div>

    </div>
  );
}
