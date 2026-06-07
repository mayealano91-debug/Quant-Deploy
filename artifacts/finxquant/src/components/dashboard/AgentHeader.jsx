import React, { useState, useEffect, useCallback } from 'react';

export default function AgentHeader() {
  const [time,      setTime]      = useState(new Date());
  const [positions, setPositions] = useState([]);
  const [clock,     setClock]     = useState(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const [posRes, clockRes] = await Promise.all([
        fetch('/api/alpaca/positions'),
        fetch('/api/alpaca/clock'),
      ]);
      if (posRes.ok)   setPositions(await posRes.json());
      if (clockRes.ok) setClock(await clockRes.json());
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, 10000);
    return () => clearInterval(id);
  }, [fetchLive]);

  const pad = n => String(n).padStart(2, '0');
  const timeStr = `${pad(time.getUTCHours())}:${pad(time.getUTCMinutes())}:${pad(time.getUTCSeconds())}`;
  const isOpen  = clock?.is_open ?? false;

  const positionChips = positions.map(p => {
    const pl   = parseFloat(p.unrealized_pl);
    const isUp = pl >= 0;
    const sym  = p.symbol.replace('/USD', '').replace('USD', '');
    const val  = `${isUp ? '+' : '-'}$${Math.abs(pl).toFixed(0)}`;
    return { asset: sym, dir: isUp ? 'UP' : 'DN', tf: 'NOW', val, color: isUp ? 'text-green-400' : 'text-red-400' };
  });

  return (
    <div className="shrink-0 border-b border-border bg-[hsl(220,15%,5%)]">
      {/* Row 1: Agent identity + clock */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-primary flex items-center justify-center text-[9px] font-black text-black shrink-0">Q</div>
          <span className="text-[13px] font-black text-white tracking-wider uppercase">CLAUDE <span className="text-primary">×</span> QUANT</span>
          <span className="text-[8px] text-muted-foreground hidden sm:block">BTC/ETH/SOL · 5M POLYMARKET AGENT</span>
          <span className="text-[8px] text-muted-foreground hidden md:block mx-2">MARKOV · KELLY · SELF-LEARN</span>
        </div>
        <div className="text-right">
          <div className="text-base font-black text-primary tracking-widest leading-none">{timeStr}</div>
          <div className="text-[8px] text-muted-foreground text-right">
            UTC · MARKET <span className={isOpen ? 'text-green-400' : 'text-red-400'}>{isOpen ? 'OPEN' : 'CLOSED'}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Clock info */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-0 px-3 py-0.5 border-b border-border/30 text-[8px] font-mono">
        <span className={`font-bold ${isOpen ? 'text-green-400' : 'text-yellow-400'}`}>
          {isOpen ? '● MARKET OPEN' : '○ MARKET CLOSED'}
        </span>
        {clock?.next_open && !isOpen && (
          <>
            <span className="text-muted-foreground">·</span>
            <span>OPENS <span className="text-primary font-bold">{new Date(clock.next_open).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET</span></span>
          </>
        )}
        {clock?.next_close && isOpen && (
          <>
            <span className="text-muted-foreground">·</span>
            <span>CLOSES <span className="text-primary font-bold">{new Date(clock.next_close).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'America/New_York' })} ET</span></span>
          </>
        )}
        <span className="text-muted-foreground">·</span>
        <span>OPEN POSITIONS <span className="text-foreground font-bold">{positions.length}</span></span>
        {positions.length > 0 && (
          <>
            <span className="text-muted-foreground">·</span>
            <span>
              TOTAL P&amp;L{' '}
              <span className={parseFloat(positions.reduce((s, p) => s + parseFloat(p.unrealized_pl), 0)) >= 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                {(() => {
                  const total = positions.reduce((s, p) => s + parseFloat(p.unrealized_pl), 0);
                  return `${total >= 0 ? '+' : '-'}$${Math.abs(total).toFixed(2)}`;
                })()}
              </span>
            </span>
          </>
        )}
      </div>

      {/* Row 3: LIVE badge + real positions */}
      <div className="flex items-center gap-2 px-3 py-0.5 text-[8px] font-mono overflow-x-auto">
        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-600 text-white text-[7px] font-black rounded-sm pulse-live shrink-0">● LIVE</span>

        {positionChips.length === 0 && (
          <span className="text-muted-foreground text-[7px]">No open positions · Start agent to trade</span>
        )}

        {positionChips.map((p, i) => (
          <div key={i} className="flex items-center gap-1 pl-2 border-l border-border/40 shrink-0">
            <span className={p.color}>{p.dir === 'UP' ? '▲' : '▼'}</span>
            <span className="text-muted-foreground font-medium">{p.asset}</span>
            <span className="text-muted-foreground">{p.dir}</span>
            <span className={`font-bold ${p.color}`}>{p.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
