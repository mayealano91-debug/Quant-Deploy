import React, { useState, useEffect } from 'react';
import { Play, Square, AlertTriangle, Wifi, WifiOff, RefreshCw } from 'lucide-react';

const STATUSES = {
  stopped:    { label: 'STOPPED',    color: 'text-muted-foreground', bg: 'bg-secondary/40',        dot: 'bg-gray-500'  },
  starting:   { label: 'STARTING…',  color: 'text-yellow-400',       bg: 'bg-yellow-500/10',       dot: 'bg-yellow-400 animate-pulse' },
  running:    { label: 'LIVE',       color: 'text-green-400',        bg: 'bg-green-500/10',        dot: 'bg-green-400 pulse-live'     },
  stopping:   { label: 'STOPPING…',  color: 'text-orange-400',       bg: 'bg-orange-500/10',       dot: 'bg-orange-400 animate-pulse' },
  error:      { label: 'ERROR',      color: 'text-red-400',          bg: 'bg-red-500/10',          dot: 'bg-red-500'  },
};

const MOCK_LOG = [
  '[AGENT] Initializing AlpacaClient — PAPER mode',
  '[AGENT] Health check OK — account equity $125,430.00',
  '[AGENT] Market OPEN — session active',
  '[SIGNAL] BTC momentum +2.3σ → LONG signal queued',
  '[ORDER] LIMIT BUY BTCUSD @ $77,642.10 (qty 0.05)',
  '[FILL]  Filled @ $77,639.80 — trade_id #TRD-0042',
  '[RISK]  Stop set @ $77,100.00 · TP @ $78,800.00',
  '[CYCLE] Scan → Detect → Validate → Size → Fill ✓',
];

export default function AgentControlBar() {
  const [status, setStatus]     = useState('stopped');
  const [logs, setLogs]         = useState([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cycleCount, setCycleCount]   = useState(0);
  const [paperMode]             = useState(true); // always paper in UI demo

  const st = STATUSES[status];

  // Simulate log stream when running
  useEffect(() => {
    if (status !== 'running') return;
    let idx = 0;
    const t = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, `${new Date().toISOString().slice(11,19)} ${MOCK_LOG[idx % MOCK_LOG.length]}`];
        return next.slice(-6); // keep last 6 lines
      });
      setCycleCount(c => c + 1);
      idx++;
    }, 2200);
    return () => clearInterval(t);
  }, [status]);

  function handleStart() {
    if (!paperMode) { setShowConfirm(true); return; }
    doStart();
  }

  function doStart() {
    setShowConfirm(false);
    setStatus('starting');
    setLogs([`${new Date().toISOString().slice(11,19)} [AGENT] Connecting to Alpaca PAPER API…`]);
    setTimeout(() => setStatus('running'), 2000);
  }

  function handleStop() {
    setStatus('stopping');
    setTimeout(() => {
      setStatus('stopped');
      setLogs(prev => [...prev, `${new Date().toISOString().slice(11,19)} [AGENT] Graceful shutdown complete.`]);
    }, 1500);
  }

  return (
    <div className={`shrink-0 border-b border-border/60 font-mono ${st.bg} transition-colors`}>
      {/* Main control row */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        {/* Status dot + label */}
        <div className="flex items-center gap-1.5 min-w-[90px]">
          <div className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />
          <span className={`text-[9px] font-black tracking-widest ${st.color}`}>{st.label}</span>
        </div>

        {/* Agent identity */}
        <div className="flex items-center gap-1 flex-1">
          <span className="text-[8px] text-muted-foreground">AI AGENT</span>
          <span className="text-[8px] text-primary font-bold">QUANT TRADER</span>
          <span className="text-[7px] px-1 py-px bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 font-bold ml-1">
            {paperMode ? 'PAPER' : 'LIVE'}
          </span>
          {status === 'running' && (
            <span className="text-[7px] text-muted-foreground ml-2">CYCLES: <span className="text-foreground font-bold">{cycleCount}</span></span>
          )}
        </div>

        {/* Broker status */}
        <div className="flex items-center gap-1 text-[7px]">
          {status === 'running'
            ? <><Wifi className="w-3 h-3 text-green-400" /><span className="text-green-400">ALPACA CONNECTED</span></>
            : <><WifiOff className="w-3 h-3 text-muted-foreground" /><span className="text-muted-foreground">DISCONNECTED</span></>
          }
        </div>

        {/* Start / Stop button */}
        {(status === 'stopped' || status === 'error') && (
          <button
            onClick={handleStart}
            className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-400 text-[9px] font-black rounded-sm transition-all active:scale-95"
          >
            <Play className="w-3 h-3 fill-current" />
            START AGENT
          </button>
        )}
        {status === 'running' && (
          <button
            onClick={handleStop}
            className="flex items-center gap-1.5 px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 text-[9px] font-black rounded-sm transition-all active:scale-95"
          >
            <Square className="w-3 h-3 fill-current" />
            STOP AGENT
          </button>
        )}
        {(status === 'starting' || status === 'stopping') && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/40 border border-border/40 text-muted-foreground text-[9px] font-black rounded-sm">
            <RefreshCw className="w-3 h-3 animate-spin" />
            PLEASE WAIT
          </div>
        )}
      </div>

      {/* Live log stream (only when running/starting) */}
      {(status === 'running' || status === 'starting' || status === 'stopping') && logs.length > 0 && (
        <div className="px-3 pb-1.5 space-y-px">
          {logs.map((line, i) => (
            <div key={i} className={`text-[7px] font-mono ${
              line.includes('[FILL]')   ? 'text-green-400' :
              line.includes('[ORDER]')  ? 'text-primary' :
              line.includes('[SIGNAL]') ? 'text-yellow-400' :
              line.includes('[RISK]')   ? 'text-orange-400' :
              line.includes('ERROR')    ? 'text-red-400' :
              'text-muted-foreground'
            }`}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* Live confirmation modal for going LIVE (non-paper) */}
      {showConfirm && (
        <div className="mx-3 mb-2 p-2 border border-red-500/50 bg-red-500/10 rounded-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span className="text-[9px] text-red-400 font-black">LIVE TRADING — REAL MONEY AT RISK</span>
          </div>
          <div className="text-[7px] text-muted-foreground mb-2">You are about to activate LIVE trading mode. Real funds will be used. Are you sure?</div>
          <div className="flex gap-2">
            <button onClick={doStart} className="px-2 py-0.5 bg-red-500/20 border border-red-500/40 text-red-400 text-[8px] font-bold rounded-sm hover:bg-red-500/30">CONFIRM — GO LIVE</button>
            <button onClick={() => setShowConfirm(false)} className="px-2 py-0.5 bg-secondary/40 border border-border/40 text-muted-foreground text-[8px] font-bold rounded-sm hover:bg-secondary">CANCEL</button>
          </div>
        </div>
      )}
    </div>
  );
}