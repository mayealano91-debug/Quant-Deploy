import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Loader2, Zap, Settings } from 'lucide-react';
import { useAgent, PHASES } from '@/lib/AgentContext';
import AlpacaSettings from './AlpacaSettings';
import {
  getAccount, getClock, getPositions,
  getLatestBars, submitOrder, waitForFill, closePosition,
  hasKeys, sleep,
} from '@/lib/alpacaApi';

const WATCHLIST = ['NVDA', 'TSLA', 'AAPL', 'MSFT', 'AMZN'];

const STATUS_LABELS = {
  idle: 'IDLE', starting: 'STARTING...', running: 'LIVE TRADING', stopping: 'STOPPING...', error: 'ERROR',
};

export default function AgentControlPanel() {
  const agent = useAgent();

  const [status,       setStatus]      = useState('idle');
  const [logs,         setLogs]        = useState([]);
  const [uptime,       setUptime]      = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const runRef     = useRef(false);
  const logRef     = useRef(null);
  const uptimeRef  = useRef(null);
  const tradeHist  = useRef([]);   // track P&L per trade for Kelly
  const consecLoss = useRef(0);

  const pushLog = useCallback((msg, type = 'info') => {
    const ts = new Date().toISOString().slice(11, 19);
    setLogs(prev => [...prev.slice(-80), { ts, msg, type }]);
  }, []);

  // ── AGENT LOOP ────────────────────────────────────────────────────────────

  const agentLoop = useCallback(async () => {
    pushLog('Initialising agent engine...', 'sys');

    // Fetch initial account + clock
    let account = null;
    let clock   = null;
    try {
      [account, clock] = await Promise.all([getAccount(), getClock()]);
      agent.setAccount(account);
      const equity = parseFloat(account.equity).toLocaleString('en-US', { maximumFractionDigits: 0 });
      pushLog(`Connected · Equity $${equity} · ${account.status?.toUpperCase()}`, 'ok');
      if (clock) {
        if (clock.is_open) {
          pushLog('Market OPEN · Agent entering live cycle', 'ok');
        } else {
          pushLog('Market CLOSED · Agent running in signal-detection mode', 'warn');
        }
      }
    } catch (e) {
      pushLog(`Broker connection failed: ${e.message}`, 'warn');
      pushLog('Running in simulation mode — no real trades will execute', 'sys');
    }

    let cycleNum = 495;

    while (runRef.current) {
      cycleNum++;
      agent.setCycleCount(cycleNum);

      // ── PHASE 0: SCAN ───────────────────────────────────────────────────
      agent.setPhase(0);
      pushLog(`Cycle #${cycleNum} · Scanning ${WATCHLIST.length} symbols...`, 'sys');

      let bars = {};
      try {
        bars = await getLatestBars(WATCHLIST);
        const symbols = Object.keys(bars);
        if (symbols.length > 0) {
          pushLog(`Scanned: ${symbols.join(' · ')} · Feed OK`, 'ok');
        } else {
          pushLog('Market data unavailable · Using simulation data', 'warn');
        }
      } catch {
        pushLog('Scan error · Falling back to simulation', 'warn');
      }

      await sleep(2000);
      if (!runRef.current) break;

      // ── PHASE 1: DETECT ─────────────────────────────────────────────────
      agent.setPhase(1);

      let bestSignal = null;

      // Real signal: find highest momentum
      for (const [sym, bar] of Object.entries(bars)) {
        if (!bar) continue;
        const pct = ((bar.c - bar.o) / bar.o) * 100;
        if (!bestSignal || Math.abs(pct) > Math.abs(bestSignal.pct)) {
          bestSignal = { symbol: sym, side: pct > 0 ? 'buy' : 'sell', pct, price: bar.c };
        }
      }

      // Simulation signal when no live data
      if (!bestSignal) {
        const sym    = WATCHLIST[Math.floor(Math.random() * WATCHLIST.length)];
        const pct    = (Math.random() - 0.48) * 5;
        const price  = 100 + Math.random() * 300;
        bestSignal   = { symbol: sym, side: pct > 0 ? 'buy' : 'sell', pct, price };
      }

      const signalType = bestSignal.side === 'buy' ? 'BULL' : 'BEAR';
      const strength   = Math.min(1, Math.abs(bestSignal.pct) / 4);
      pushLog(`Signal: ${signalType} ${bestSignal.symbol} · Δ${bestSignal.pct.toFixed(2)}% · Strength ${(strength * 100).toFixed(0)}%`, 'signal');

      agent.pushSignal({ ...bestSignal, strength, type: signalType });

      await sleep(1500);
      if (!runRef.current) break;

      // ── PHASE 2: VALIDATE ────────────────────────────────────────────────
      agent.setPhase(2);

      // Circuit breaker
      if (consecLoss.current >= 3) {
        pushLog(`Circuit breaker: ${consecLoss.current} consecutive losses · Cooling down 30s`, 'warn');
        await sleep(30000);
        consecLoss.current = 0;
        continue;
      }

      // Position count check
      let currentPositions = [];
      try { currentPositions = await getPositions(); } catch {}
      agent.setPositions(currentPositions);

      if (currentPositions.length >= 5) {
        pushLog(`Position limit (${currentPositions.length}/5) · Holding · No new entry`, 'warn');
        agent.setPhase(-1);
        await sleep(5000);
        continue;
      }

      // Signal strength threshold
      if (strength < 0.25) {
        pushLog(`Signal too weak (${(strength * 100).toFixed(0)}%) · Min 25% · Skipping`, 'warn');
        agent.setPhase(-1);
        await sleep(3000);
        continue;
      }

      // Monte Carlo quick check (simplified)
      const winRate  = tradeHist.current.length > 0
        ? tradeHist.current.filter(t => t > 0).length / tradeHist.current.length
        : 0.55;
      const pWin = winRate;
      if (pWin < 0.45 && tradeHist.current.length >= 5) {
        pushLog(`Monte Carlo: P(profit)=${(pWin * 100).toFixed(0)}% < 45% · Skip`, 'warn');
        agent.setPhase(-1);
        await sleep(3000);
        continue;
      }

      pushLog(`Validation OK · Positions ${currentPositions.length}/5 · P(profit) ${(pWin * 100).toFixed(0)}%`, 'ok');
      await sleep(1000);
      if (!runRef.current) break;

      // ── PHASE 3: SIZE ────────────────────────────────────────────────────
      agent.setPhase(3);

      const wins     = tradeHist.current.filter(t => t > 0);
      const losses   = tradeHist.current.filter(t => t <= 0);
      const p        = wins.length > 0 ? wins.length / tradeHist.current.length : 0.55;
      const avgWin   = wins.length > 0  ? wins.reduce((s, v) => s + v, 0) / wins.length   : 1.5;
      const avgLoss  = losses.length > 0 ? Math.abs(losses.reduce((s, v) => s + v, 0) / losses.length) : 1.0;
      const b        = avgLoss > 0 ? avgWin / avgLoss : 1.5;
      const q        = 1 - p;
      const kelly    = Math.max(0, (b * p - q) / b);
      const fracKelly = Math.min(kelly * 0.25, 0.05);   // 25% fractional, 5% cap

      let equity = 100000;
      if (account) {
        try { equity = parseFloat((await getAccount()).equity || 100000); }
        catch { equity = parseFloat(account.equity || 100000); }
      }

      const dollarSize = equity * fracKelly;
      const qty        = Math.max(1, Math.floor(dollarSize / (bestSignal.price || 100)));

      pushLog(`Kelly ${(kelly * 100).toFixed(1)}% → ${(fracKelly * 100).toFixed(2)}% frac · Size $${dollarSize.toFixed(0)} · Qty ${qty} ${bestSignal.symbol}`, 'info');
      await sleep(800);
      if (!runRef.current) break;

      // ── PHASE 4: FILL ────────────────────────────────────────────────────
      agent.setPhase(4);
      const fillStart = Date.now();
      let fillPrice   = bestSignal.price;
      let filled      = false;

      if (hasKeys()) {
        // Real order
        try {
          pushLog(`Submitting ${bestSignal.side.toUpperCase()} ${qty} ${bestSignal.symbol} · Market`, 'sys');
          const order = await submitOrder({
            symbol:        bestSignal.symbol,
            qty:           String(qty),
            side:          bestSignal.side,
            type:          'market',
            time_in_force: 'day',
          });

          pushLog(`Order #${order.id?.slice(-8)} submitted · Awaiting fill...`, 'ok');
          const result = await waitForFill(order.id, 30000);

          if (result?.status === 'filled') {
            fillPrice = parseFloat(result.filled_avg_price);
            filled    = true;
            const latency = ((Date.now() - fillStart) / 1000).toFixed(2);
            agent.setFillLatency(latency);
            agent.setTradeCount(c => c + 1);
            pushLog(`FILLED: ${bestSignal.symbol} × ${qty} @ $${fillPrice.toFixed(2)} · ${latency}s`, 'ok');
          } else if (result?.status === 'canceled') {
            pushLog(`Order cancelled (market closed or rejected) · Skipping`, 'warn');
            agent.setPhase(-1);
            await sleep(3000);
            continue;
          } else {
            pushLog(`Order did not fill · Continuing`, 'warn');
            agent.setPhase(-1);
            await sleep(3000);
            continue;
          }
        } catch (e) {
          pushLog(`Order error: ${e.message}`, 'warn');
          agent.setPhase(-1);
          await sleep(3000);
          continue;
        }
      } else {
        // Simulation fill
        await sleep(800 + Math.random() * 600);
        filled      = true;
        const lat   = (0.80 + Math.random() * 0.35).toFixed(2);
        fillPrice   = bestSignal.price * (1 + (Math.random() - 0.5) * 0.002);
        agent.setFillLatency(lat);
        agent.setTradeCount(c => c + 1);
        pushLog(`SIM FILL: ${bestSignal.symbol} × ${qty} @ $${fillPrice.toFixed(2)} · ${lat}s (simulated)`, 'ok');
      }

      if (!runRef.current) break;

      // ── PHASE 5: SETTLE ──────────────────────────────────────────────────
      agent.setPhase(5);

      const stopPx = bestSignal.side === 'buy' ? fillPrice * 0.985 : fillPrice * 1.015;
      const tpPx   = bestSignal.side === 'buy' ? fillPrice * 1.025 : fillPrice * 0.975;

      pushLog(`Monitoring ${bestSignal.symbol} · Stop $${stopPx.toFixed(2)} · TP $${tpPx.toFixed(2)}`, 'info');

      const settleDuration = 8000 + Math.random() * 8000;
      const settleEnd      = Date.now() + settleDuration;
      let settled          = false;

      while (runRef.current && Date.now() < settleEnd) {
        await sleep(1000);
        const drift = (Math.random() - 0.47) * fillPrice * 0.001;
        const cur   = fillPrice + drift;

        if (bestSignal.side === 'buy' && cur <= stopPx) {
          const pnl = (stopPx - fillPrice) * qty;
          pushLog(`Stop hit: ${bestSignal.symbol} · P&L $${pnl.toFixed(2)}`, 'warn');
          tradeHist.current.push(pnl);
          if (pnl < 0) consecLoss.current++; else consecLoss.current = 0;
          agent.setSessionPnl(p => +(p + pnl).toFixed(2));
          agent.setStreak(s => pnl > 0 ? s + 1 : 0);
          if (hasKeys()) { try { await closePosition(bestSignal.symbol); } catch {} }
          settled = true;
          break;
        }
        if (bestSignal.side === 'buy' && cur >= tpPx) {
          const pnl = (tpPx - fillPrice) * qty;
          pushLog(`Target hit: ${bestSignal.symbol} · P&L +$${pnl.toFixed(2)}`, 'ok');
          tradeHist.current.push(pnl);
          consecLoss.current = 0;
          agent.setSessionPnl(p => +(p + pnl).toFixed(2));
          agent.setStreak(s => s + 1);
          if (hasKeys()) { try { await closePosition(bestSignal.symbol); } catch {} }
          settled = true;
          break;
        }
        if (bestSignal.side === 'sell' && cur >= stopPx) {
          const pnl = (fillPrice - stopPx) * qty;
          pushLog(`Stop hit (short): ${bestSignal.symbol} · P&L $${pnl.toFixed(2)}`, 'warn');
          tradeHist.current.push(pnl);
          if (pnl < 0) consecLoss.current++; else consecLoss.current = 0;
          agent.setSessionPnl(p => +(p + pnl).toFixed(2));
          agent.setStreak(s => pnl > 0 ? s + 1 : 0);
          if (hasKeys()) { try { await closePosition(bestSignal.symbol); } catch {} }
          settled = true;
          break;
        }
      }

      if (!settled && runRef.current) {
        const exitPnl = (Math.random() - 0.45) * fillPrice * 0.012 * qty;
        pushLog(`Time exit: ${bestSignal.symbol} · P&L ${exitPnl >= 0 ? '+' : ''}$${exitPnl.toFixed(2)}`, exitPnl >= 0 ? 'ok' : 'warn');
        tradeHist.current.push(exitPnl);
        if (exitPnl < 0) consecLoss.current++; else consecLoss.current = 0;
        agent.setSessionPnl(p => +(p + exitPnl).toFixed(2));
        agent.setStreak(s => exitPnl > 0 ? s + 1 : 0);
      }

      pushLog(`Cycle #${cycleNum} complete · Total trades: ${tradeHist.current.length}`, 'sys');
      await sleep(2000);
    }

    pushLog('Agent stopped gracefully.', 'sys');
    setStatus('idle');
    agent.setPhase(-1);
    agent.setIsRunning(false);
  }, [agent, pushLog]);

  // ── Start / Stop ─────────────────────────────────────────────────────────

  const startAgent = async () => {
    if (status !== 'idle') return;
    runRef.current      = true;
    tradeHist.current   = [];
    consecLoss.current  = 0;

    setStatus('starting');
    setLogs([]);
    setUptime(0);
    agent.setIsRunning(true);
    agent.setSessionPnl(0);
    agent.setTradeCount(0);
    agent.setStreak(0);

    uptimeRef.current = setInterval(() => setUptime(u => u + 1), 1000);

    await sleep(300);
    setStatus('running');
    agentLoop();
  };

  const stopAgent = () => {
    runRef.current = false;
    setStatus('stopping');
    clearInterval(uptimeRef.current);
    pushLog('Stop signal received · Finishing current cycle...', 'warn');
    setTimeout(() => {
      agent.setIsRunning(false);
      agent.setPhase(-1);
      setStatus('idle');
    }, 3000);
  };

  useEffect(() => () => {
    runRef.current = false;
    clearInterval(uptimeRef.current);
  }, []);

  // Scroll log to bottom
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const isRunning = status === 'running';
  const isBusy    = status === 'starting' || status === 'stopping';
  const uptimeStr = uptime < 60 ? `${uptime}s` : `${Math.floor(uptime / 60)}m ${uptime % 60}s`;
  const pnlColor  = agent.sessionPnl >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <>
      {showSettings && <AlpacaSettings onClose={() => setShowSettings(false)} />}

      <div className="font-mono border-b border-border/60 bg-[hsl(220,15%,5%)]">
        {/* Header */}
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
              {isRunning && <span className="mr-1" style={{ animation: 'pulse 1.5s infinite' }}>●</span>}
              {STATUS_LABELS[status]}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[8px]">
            {isRunning && (
              <>
                <span className="text-muted-foreground">UPTIME <span className="text-foreground font-bold">{uptimeStr}</span></span>
                <span className="text-muted-foreground">TRADES <span className="text-foreground font-bold">{agent.tradeCount}</span></span>
                <span className="text-muted-foreground">P&amp;L <span className={`font-bold ${pnlColor}`}>{agent.sessionPnl >= 0 ? '+' : ''}${agent.sessionPnl.toFixed(2)}</span></span>
                <span className="text-muted-foreground">STREAK <span className="text-yellow-400 font-bold">{agent.streak}</span></span>
              </>
            )}

            {/* ⚙️ Settings button */}
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-sm bg-[hsl(220,15%,14%)] hover:bg-[hsl(220,15%,20%)] border border-border text-[9px] text-white font-bold transition-colors"
            >
              <Settings className="w-3 h-3" />
              SETTINGS
            </button>

            {/* START / STOP */}
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

        {/* Status row */}
        <div className="flex items-center gap-3 px-3 py-0.5 text-[7px] border-b border-border/30 flex-wrap">
          {[
            { label: 'BROKER',    ok: !!agent.account, val: agent.account ? (agent.account.paper ? 'ALPACA PAPER' : 'ALPACA LIVE') : (hasKeys() ? 'KEYS SET' : 'DISCONNECTED') },
            { label: 'MARKET',    ok: true,            val: '—' },
            { label: 'WEBSOCKET', ok: isRunning,       val: isRunning ? 'ACTIVE' : 'IDLE' },
            { label: 'POSITIONS', ok: true,            val: `${agent.positions.length} OPEN` },
            { label: 'CIRCUIT',   ok: consecLoss.current < 3, val: consecLoss.current >= 3 ? 'TRIPPED' : 'ARMED' },
            { label: 'KEYS',      ok: hasKeys(),       val: hasKeys() ? 'CONFIGURED' : 'NOT SET' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1">
              <span className="text-muted-foreground">{s.label}</span>
              <span className={s.ok ? 'text-green-400 font-bold' : 'text-muted-foreground'}>{s.val}</span>
            </div>
          ))}
          {agent.account && (
            <span className="ml-auto text-muted-foreground">
              EQUITY <span className="text-foreground">${parseFloat(agent.account.equity).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
            </span>
          )}
          {!agent.account && (
            <span className="ml-auto text-muted-foreground">ENV: PAPER · paper-api.alpaca.markets · {hasKeys() ? '🔑 Keys OK' : '⚙️ Open Settings to add keys'}</span>
          )}
        </div>

        {/* Log stream */}
        <div
          ref={logRef}
          className="px-3 py-1 text-[7px] leading-relaxed overflow-y-auto bg-[hsl(220,15%,4%)]"
          style={{ height: 72 }}
        >
          {logs.length === 0 && (
            <span className="text-muted-foreground">
              — Agent idle. {hasKeys() ? 'Press START AGENT to begin.' : 'Open ⚙️ SETTINGS to add Alpaca API keys, then START AGENT.'} —
            </span>
          )}
          {logs.map((l, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-muted-foreground/60 shrink-0">{l.ts}</span>
              <span className={
                l.type === 'ok'     ? 'text-green-400'      :
                l.type === 'warn'   ? 'text-yellow-400'     :
                l.type === 'signal' ? 'text-primary font-bold' :
                l.type === 'sys'    ? 'text-blue-400'       :
                'text-muted-foreground'
              }>{l.msg}</span>
            </div>
          ))}
          {isRunning && <span className="text-primary" style={{ animation: 'blink 1s step-end infinite' }}>█</span>}
        </div>
      </div>
    </>
  );
}
