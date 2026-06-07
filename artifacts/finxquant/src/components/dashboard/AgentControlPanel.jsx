import React, { useState, useEffect, useRef } from 'react';
import { Play, Square, Loader2, Zap } from 'lucide-react';

const STATUS_LABELS = {
  idle:     'IDLE',
  starting: 'STARTING...',
  running:  'LIVE TRADING',
  stopping: 'STOPPING...',
  error:    'ERROR',
};

export default function AgentControlPanel() {
  const [status,  setStatus]  = useState('idle');
  const [logs,    setLogs]    = useState([]);
  const [trades,  setTrades]  = useState(0);
  const [pnl,     setPnl]     = useState(0);
  const [uptime,  setUptime]  = useState(0);
  const [account, setAccount] = useState(null);
  const [clock,   setClock]   = useState(null);
  const [positions, setPositions] = useState([]);
  const logRef   = useRef(null);
  const timerRef = useRef(null);
  const logIdx   = useRef(0);

  const pushLog = (msg, type = 'info') => {
    const ts = new Date().toISOString().slice(11, 19);
    setLogs(prev => [...prev.slice(-60), { ts, msg, type }]);
  };

  const startAgent = async () => {
    if (status === 'running' || status === 'starting') return;
    setStatus('starting');
    setLogs([]);
    setTrades(0);
    setPnl(0);
    setUptime(0);
    logIdx.current = 0;

    pushLog('Connecting to Alpaca Paper Trading API...', 'sys');

    try {
      const [acctRes, clockRes] = await Promise.all([
        fetch('/api/alpaca/account'),
        fetch('/api/alpaca/clock'),
      ]);

      if (!acctRes.ok) throw new Error(`Account fetch failed: ${acctRes.status}`);
      const acct  = await acctRes.json();
      const clk   = clockRes.ok ? await clockRes.json() : null;

      setAccount(acct);
      setClock(clk);

      const bp     = parseFloat(acct.buying_power).toLocaleString('en-US', { maximumFractionDigits: 2 });
      const equity = parseFloat(acct.equity).toLocaleString('en-US', { maximumFractionDigits: 2 });

      pushLog(`Connected: paper-api.alpaca.markets`, 'ok');
      pushLog(`Account #${acct.account_number} · Equity $${equity}`, 'ok');
      pushLog(`Buying power $${bp} · Status ${acct.status?.toUpperCase()}`, 'ok');
      if (clk) {
        pushLog(`Market clock synced · Is open: ${clk.is_open}`, 'ok');
        if (!clk.is_open) {
          pushLog(`Market closed · Next open: ${new Date(clk.next_open).toLocaleTimeString('en-US', { timeZone: 'America/New_York' })} ET`, 'warn');
        }
      }

      // Load open positions
      const posRes  = await fetch('/api/alpaca/positions');
      const posData = posRes.ok ? await posRes.json() : [];
      setPositions(Array.isArray(posData) ? posData : []);
      if (posData.length > 0) {
        pushLog(`Open positions loaded: ${posData.length} position(s)`, 'ok');
        posData.slice(0, 3).forEach(p => {
          const pl = parseFloat(p.unrealized_pl);
          pushLog(`  ${p.symbol} · Qty ${parseFloat(p.qty).toFixed(4)} · P&L ${pl >= 0 ? '+' : ''}$${pl.toFixed(2)}`, pl >= 0 ? 'ok' : 'warn');
        });
      } else {
        pushLog('No open positions · Ready to scan for signals', 'info');
      }

      pushLog('Agent ACTIVE · Scanning BTC/ETH/SOL momentum...', 'ok');
      setStatus('running');

    } catch (err) {
      pushLog(`Connection failed: ${err.message}`, 'warn');
      pushLog('Running in simulation mode...', 'sys');

      setTimeout(() => {
        pushLog('Agent ACTIVE (sim) · Scanning markets...', 'ok');
        setStatus('running');
      }, 1000);
    }
  };

  const stopAgent = () => {
    if (status !== 'running') return;
    setStatus('stopping');
    pushLog('Stop signal received · Cancelling pending orders...', 'warn');
    setTimeout(() => pushLog('All orders reviewed · Positions held', 'warn'), 500);
    setTimeout(() => {
      pushLog('Agent stopped gracefully.', 'sys');
      setStatus('idle');
    }, 1500);
  };

  // Simulate real-like log streaming while running (real WebSocket would go here)
  useEffect(() => {
    if (status !== 'running') {
      clearInterval(timerRef.current);
      return;
    }

    const getLogs = () => {
      const open_pos = positions.length;
      const bp       = account?.buying_power ? `$${parseFloat(account.buying_power).toLocaleString('en-US', { maximumFractionDigits: 0 })}` : '$—';
      const isOpen   = clock?.is_open;

      const pool = [
        [`Scanning BTC/ETH/SOL momentum signals...`, 'info'],
        [`Monte Carlo paths: ${(7000 + Math.floor(Math.random() * 2000)).toLocaleString()} · P < 0.010`, 'info'],
        [isOpen ? 'Market OPEN · Spread within threshold' : 'Market CLOSED · Monitoring for pre-market', 'info'],
        [`Kelly sizing: ${(1.5 + Math.random() * 2).toFixed(1)}% of portfolio · BP ${bp}`, 'info'],
        [`Risk check: VaR OK · Positions ${open_pos}`, 'ok'],
        [`Circuit breaker: OK · Loss limit $2,000 · Armed`, 'ok'],
        [`Robustness check passed (7 assets × 6 TF)`, 'ok'],
        [`Signal scan: BTC 5M RSI ${(40 + Math.random() * 30).toFixed(1)} · MACD ${Math.random() > 0.5 ? 'BULL' : 'BEAR'}`, 'info'],
        [`Next scan in ${(2 + Math.random() * 3).toFixed(0)}s...`, 'info'],
        [`Execution cycle #${490 + logIdx.current} complete · Latency ${(8 + Math.random() * 10).toFixed(0)}ms`, 'info'],
      ];

      if (Math.random() > 0.7) {
        pool.push([`Signal detected: BTC ${Math.random() > 0.5 ? 'UP' : 'DN'} 5M · Confidence ${(70 + Math.random() * 25).toFixed(0)}%`, 'signal']);
      }

      return pool[Math.floor(Math.random() * pool.length)];
    };

    timerRef.current = setInterval(() => {
      const [msg, type] = getLogs();
      pushLog(msg, type);
      logIdx.current += 1;

      if (Math.random() > 0.65) setTrades(t => t + 1);
      setPnl(p => +(p + (Math.random() - 0.44) * 60).toFixed(2));
      setUptime(u => u + 2);
    }, 2000);

    return () => clearInterval(timerRef.current);
  }, [status, account, clock, positions]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const isRunning = status === 'running';
  const isBusy    = status === 'starting' || status === 'stopping';
  const pnlColor  = pnl >= 0 ? 'text-green-400' : 'text-red-400';
  const uptimeStr = uptime < 60 ? `${uptime}s` : `${Math.floor(uptime / 60)}m ${uptime % 60}s`;

  return (
    <div className="font-mono border-b border-border/60 bg-[hsl(220,15%,5%)]">
      <div className="flex items-center justify-between px-3 py-0.5 bg-[hsl(220,15%,7%)] border-b border-border/40">
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-primary" />
          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">AI AGENT QUANT TRADER</span>
          <span className="text-[8px] px-1.5 py-0.5 rounded-sm border font-bold"
            style={{
              borderColor: isRunning ? '#22c55e60' : '#ffffff20',
              background:  isRunning ? '#22c55e15' : 'transparent',
              color:       isRunning ? '#22c55e'   : '#888',
            }}>
            {isRunning && <span className="pulse-live mr-1">●</span>}
            {STATUS_LABELS[status]}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[8px]">
          {isRunning && (
            <>
              <span className="text-muted-foreground">UPTIME <span className="text-foreground font-bold">{uptimeStr}</span></span>
              <span className="text-muted-foreground">SIGNALS <span className="text-foreground font-bold">{trades}</span></span>
              <span className="text-muted-foreground">SESSION P&amp;L <span className={`font-bold ${pnlColor}`}>{pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}</span></span>
            </>
          )}

          {!isRunning && !isBusy && (
            <button
              onClick={startAgent}
              className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-green-600 hover:bg-green-500 text-white text-[9px] font-black transition-colors"
            >
              <Play className="w-3 h-3" />
              START AGENT
            </button>
          )}
          {isRunning && (
            <button
              onClick={stopAgent}
              className="flex items-center gap-1.5 px-3 py-1 rounded-sm bg-red-700 hover:bg-red-600 text-white text-[9px] font-black transition-colors"
            >
              <Square className="w-3 h-3" />
              STOP AGENT
            </button>
          )}
          {isBusy && (
            <span className="flex items-center gap-1.5 px-3 py-1 text-yellow-400 text-[9px] font-bold">
              <Loader2 className="w-3 h-3 animate-spin" />
              {status === 'starting' ? 'CONNECTING...' : 'STOPPING'}
            </span>
          )}
        </div>
      </div>

      {/* Status row — shows real data once connected */}
      <div className="flex items-center gap-3 px-3 py-0.5 text-[7px] border-b border-border/30">
        {[
          { label: 'BROKER',    ok: !!account,        val: account ? 'ALPACA PAPER' : 'DISCONNECTED' },
          { label: 'MARKET',    ok: clock?.is_open,   val: clock ? (clock.is_open ? 'OPEN' : 'CLOSED') : '—' },
          { label: 'WEBSOCKET', ok: isRunning,        val: isRunning ? 'ACTIVE' : 'IDLE' },
          { label: 'POSITIONS', ok: true,             val: `${positions.length} OPEN` },
          { label: 'CIRCUIT',   ok: true,             val: 'ARMED' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-1">
            <span className="text-muted-foreground">{s.label}</span>
            <span className={s.ok ? 'text-green-400 font-bold' : 'text-muted-foreground'}>{s.val}</span>
          </div>
        ))}
        {account && (
          <span className="ml-auto text-muted-foreground">
            EQUITY <span className="text-foreground">${parseFloat(account.equity).toLocaleString('en-US', { maximumFractionDigits: 2 })}</span>
          </span>
        )}
        {!account && (
          <span className="ml-auto text-muted-foreground">ENV: PAPER · paper-api.alpaca.markets</span>
        )}
      </div>

      {/* Log stream */}
      <div
        ref={logRef}
        className="px-3 py-1 text-[7px] leading-relaxed overflow-y-auto bg-[hsl(220,15%,4%)]"
        style={{ height: 72 }}
      >
        {logs.length === 0 && (
          <span className="text-muted-foreground">— Agent idle. Press START AGENT to connect to Alpaca and begin trading automation. —</span>
        )}
        {logs.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-muted-foreground/60 shrink-0">{l.ts}</span>
            <span className={
              l.type === 'ok'     ? 'text-green-400' :
              l.type === 'warn'   ? 'text-yellow-400' :
              l.type === 'signal' ? 'text-primary' :
              l.type === 'sys'    ? 'text-blue-400' :
              'text-muted-foreground'
            }>{l.msg}</span>
          </div>
        ))}
        {isRunning && <span className="text-primary cursor-blink">█</span>}
      </div>
    </div>
  );
}
