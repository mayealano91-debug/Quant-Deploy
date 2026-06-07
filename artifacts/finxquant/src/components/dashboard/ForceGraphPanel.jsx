import React, { useRef, useEffect, useState } from 'react';
import { useAgent } from '@/lib/AgentContext';

const NODE_TYPES = [
  { label: 'BEAR SIG',  color: '#ef4444' },
  { label: 'BULL SIG',  color: '#22c55e' },
  { label: 'MOMENTUM',  color: '#f97316' },
  { label: 'CATALYST',  color: '#a855f7' },
  { label: 'CLUSTER',   color: '#3b82f6' },
  { label: 'COLLISION', color: '#ec4899' },
];

function randBetween(a, b) { return a + Math.random() * (b - a); }

function createNodes(count, W, H) {
  return Array.from({ length: count }, (_, i) => {
    const type = NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)];
    return {
      id: i,
      x:  randBetween(10, W - 10),
      y:  randBetween(10, H - 10),
      vx: randBetween(-0.5, 0.5),
      vy: randBetween(-0.5, 0.5),
      r:  randBetween(2, 7),
      color: type.color,
      label: Math.random() > 0.82 ? type.label.split(' ')[0] : null,
      pulse: 0,
    };
  });
}

export default function ForceGraphPanel() {
  const { agentStats, signals, isRunning, tradeCount, sessionPnl, streak } = useAgent();

  const canvasRef = useRef(null);
  const nodesRef  = useRef(null);
  const [next, setNext] = useState(5);

  // Burst animation when a new signal arrives
  const lastSigLen = useRef(0);
  useEffect(() => {
    if (signals.length > lastSigLen.current && nodesRef.current) {
      // Pulse a random node
      const idx = Math.floor(Math.random() * nodesRef.current.length);
      nodesRef.current[idx].pulse = 15;
    }
    lastSigLen.current = signals.length;
  }, [signals]);

  // Countdown to next cycle
  useEffect(() => {
    const t = setInterval(() => setNext(n => n <= 1 ? 5 : n - 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const W = canvas.clientWidth  || 500;
    const H = canvas.clientHeight || 220;
    canvas.width  = W;
    canvas.height = H;
    nodesRef.current = createNodes(90, W, H);

    const ctx = canvas.getContext('2d');
    let raf;
    let frame = 0;

    function draw() {
      frame++;
      ctx.fillStyle = 'hsl(220,15%,6%)';
      ctx.fillRect(0, 0, W, H);

      const nodes = nodesRef.current;

      // Edges
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i += 3) {
        for (let j = i + 1; j < Math.min(i + 6, nodes.length); j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < 4900) {
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      nodes.forEach(n => {
        // Gravity toward centre
        const cx = W / 2, cy = H / 2;
        n.vx += (cx - n.x) * 0.0002;
        n.vy += (cy - n.y) * 0.0002;

        n.x += n.vx;
        n.y += n.vy;
        if (n.x < n.r || n.x > W - n.r) { n.vx *= -1; n.x = Math.max(n.r, Math.min(W - n.r, n.x)); }
        if (n.y < n.r || n.y > H - n.r) { n.vy *= -1; n.y = Math.max(n.r, Math.min(H - n.r, n.y)); }

        const pulsing = n.pulse > 0;
        if (pulsing) {
          // Glowing ring
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.r + n.pulse, 0, Math.PI * 2);
          ctx.strokeStyle = n.color + '50';
          ctx.lineWidth   = 2;
          ctx.stroke();
          n.pulse = Math.max(0, n.pulse - 0.5);
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = pulsing ? n.color : n.color + 'bb';
        ctx.fill();

        if (n.label) {
          ctx.font = '6px JetBrains Mono, monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillText(n.label, n.x + n.r + 2, n.y + 3);
        }
      });

      // NEAR-R SNIPE box (flashes when running)
      if (!isRunning || frame % 60 < 45) {
        const bx = W / 2 - 110, by = H / 2 - 11;
        ctx.strokeStyle = 'rgba(250,204,21,0.7)';
        ctx.lineWidth = 1;
        ctx.strokeRect(bx, by, 220, 22);
        ctx.font = 'bold 9px JetBrains Mono, monospace';
        ctx.fillStyle = '#facc15';
        ctx.textAlign = 'center';
        const snipeMsg = signals.length > 0
          ? `NEAR-R SNIPE  ${signals[signals.length - 1].symbol}  ${signals[signals.length - 1].pct.toFixed(2)}%`
          : 'NEAR-R SNIPE  73¢ → 79¢  EDGE +6¢';
        ctx.fillText(snipeMsg, W / 2, by + 14);
        ctx.textAlign = 'left';
      }

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, [isRunning, signals]);

  const pace = tradeCount > 0
    ? `$${Math.max(0, Math.round(sessionPnl)).toLocaleString()}`
    : '$0';

  return (
    <div className="font-mono text-[9px] h-full flex flex-col bg-[hsl(220,15%,6%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-border/40 bg-[hsl(220,15%,7%)] shrink-0">
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">◎ MIROFISH · SIGNAL GRAPH · FORCE V4.2</span>
        <div className="flex items-center gap-3 text-[8px]">
          <span>SIG+ <span className="text-primary font-bold">{agentStats.sig}</span></span>
          <span className="text-muted-foreground">TRADES <span className="text-foreground">{tradeCount}</span></span>
          <span className="text-muted-foreground">P&amp;L <span className={sessionPnl >= 0 ? 'text-green-400' : 'text-red-400'}>{sessionPnl >= 0 ? '+' : ''}${sessionPnl.toFixed(2)}</span></span>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Canvas */}
        <div className="flex-1 min-w-0 min-h-0">
          <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
        </div>

        {/* Right sidebar */}
        <div className="w-[72px] border-l border-border/40 flex flex-col py-1.5 px-1.5 gap-1.5 shrink-0">
          {[
            { label: 'CONV', val: `${agentStats.conv.toFixed(1)}%`, color: 'text-green-400' },
            { label: 'BEAR', val: agentStats.bear.toLocaleString(), color: 'text-red-400' },
            { label: 'BULL', val: agentStats.bull.toLocaleString(), color: 'text-green-400' },
            { label: 'HUB',  val: agentStats.hub.toString(),        color: 'text-muted-foreground' },
            { label: 'SIG+', val: agentStats.sig.toString(),        color: 'text-primary' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[7px] text-muted-foreground">{s.label}</div>
              <div className={`font-bold text-[9px] ${s.color}`}>{s.val}</div>
            </div>
          ))}

          <div className="border-t border-border/40 pt-1.5 space-y-1.5 mt-auto">
            <div>
              <div className="text-[7px] text-muted-foreground">STREAK</div>
              <div className="text-primary font-black text-base leading-none">{streak}</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground">P&amp;L</div>
              <div className={`font-bold text-[9px] ${sessionPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>{pace}</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground">NEXT</div>
              <div className="text-yellow-400 font-black text-base leading-none">{next}S</div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 px-2 py-0.5 border-t border-border/40 bg-[hsl(220,15%,7%)] shrink-0 flex-wrap">
        {NODE_TYPES.map(t => (
          <div key={t.label} className="flex items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: t.color }} />
            <span className="text-[7px] text-muted-foreground">{t.label}</span>
          </div>
        ))}
        <span className="ml-auto text-[7px] text-muted-foreground">
          BULL {agentStats.bull > 0 ? Math.round(agentStats.bull / (agentStats.bull + agentStats.bear + 1) * 100) : 50}%
          {' '}N:{agentStats.sig} ⬛{agentStats.bear}
        </span>
      </div>
    </div>
  );
}
