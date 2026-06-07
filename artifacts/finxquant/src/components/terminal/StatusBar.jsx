import React, { useState, useEffect } from 'react';
import { Circle, Zap, Database, Activity, AlertTriangle, Terminal } from 'lucide-react';

export default function StatusBar({ activeWorkspace = 'Research', alertCount = 0 }) {
  const [latency, setLatency] = useState(12);
  const [dataRate, setDataRate] = useState('2.4k');
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setLatency(Math.floor(8 + Math.random() * 15));
      setDataRate(`${(1.5 + Math.random() * 3).toFixed(1)}k`);
      setUptime(prev => prev + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="h-5 bg-[hsl(220,15%,6%)] border-t border-border flex items-center px-2 select-none shrink-0 text-[10px] font-mono">
      {/* Left side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Circle className="w-2 h-2 fill-green-400 text-green-400 pulse-live" />
          <span className="text-green-400 green-glow">LIVE</span>
        </div>

        <div className="flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-green-400" />
          <span className="text-green-400">READY</span>
        </div>

        <div className="flex items-center gap-1">
          <Database className="w-2.5 h-2.5 text-green-400" />
          <span className="text-green-400">CONNECTED</span>
        </div>

        <div className="h-3 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Activity className="w-2.5 h-2.5 text-primary" />
          <span className="text-muted-foreground">STREAM:</span>
          <span className="text-primary">{dataRate}/s</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">LAT:</span>
          <span className={latency < 15 ? "text-green-400" : "text-yellow-400"}>{latency}ms</span>
        </div>
      </div>

      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">WS:</span>
          <span className="text-primary uppercase">{activeWorkspace}</span>
        </div>

        <div className="flex items-center gap-1">
          <Terminal className="w-2.5 h-2.5 text-muted-foreground" />
          <span className="text-muted-foreground">UPTIME:</span>
          <span className="text-foreground">{formatUptime(uptime)}</span>
        </div>

        <div className="flex items-center gap-1">
          <AlertTriangle className="w-2.5 h-2.5 text-primary" />
          <span className="text-muted-foreground">ALERTS:</span>
          <span className="text-primary">{alertCount}</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="text-muted-foreground">v2.0</span>
        </div>
      </div>
    </div>
  );
}