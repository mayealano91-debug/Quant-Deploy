import React, { useRef, useEffect, useState } from 'react';

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
      x: randBetween(10, W - 10),
      y: randBetween(10, H - 10),
      vx: randBetween(-0.6, 0.6),
      vy: randBetween(-0.6, 0.6),
      r: randBetween(2, 7),
      color: type.color,
      label: Math.random() > 0.82 ? type.label.split(' ')[0] : null,
    };
  });
}

export default function ForceGraphPanel() {
  const canvasRef  = useRef(null);
  const nodesRef   = useRef(null);
  const [stats]    = useState({ value: '$77,392', paths: 3126, trade: 37 });
  const [pace]     = useState('$277/HR');
  const [next, setNext] = useState(4);

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

    function draw() {
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
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < n.r || n.x > W - n.r) n.vx *= -1;
        if (n.y < n.r || n.y > H - n.r) n.vy *= -1;

        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = n.color + 'bb';
        ctx.fill();

        if (n.label) {
          ctx.font = '6px JetBrains Mono, monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillText(n.label, n.x + n.r + 2, n.y + 3);
        }
      });

      // NEAR-R SNIPE box
      const bx = W / 2 - 110, by = H / 2 - 11;
      ctx.strokeStyle = 'rgba(250,204,21,0.7)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, by, 220, 22);
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.fillText('NEAR-R SNIPE  73¢ → 79¢  EDGE +6¢', W / 2, by + 14);
      ctx.textAlign = 'left';

      raf = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNext(n => n <= 1 ? 5 : n - 1), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="font-mono text-[9px] h-full flex flex-col bg-[hsl(220,15%,6%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-border/40 bg-[hsl(220,15%,7%)] shrink-0">
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">◎ MIROFISH · BTC GRAPH · FORCE GRAPH · V4.2</span>
        <div className="flex items-center gap-3 text-[8px]">
          <span>T+5M <span className="text-primary font-bold">{stats.value}</span></span>
          <span className="text-muted-foreground">PATHS <span className="text-foreground">{stats.paths.toLocaleString()}</span></span>
          <span className="text-muted-foreground">TRADE <span className="text-primary">#{stats.trade}</span></span>
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
            { label: 'CONV',  val: '98.1%', color: 'text-green-400' },
            { label: 'BEAR',  val: '1,491', color: 'text-red-400' },
            { label: 'BULL',  val: '1,458', color: 'text-green-400' },
            { label: 'HUB',   val: '0',     color: 'text-muted-foreground' },
            { label: 'SIG+',  val: '0',     color: 'text-primary' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-[7px] text-muted-foreground">{s.label}</div>
              <div className={`font-bold text-[9px] ${s.color}`}>{s.val}</div>
            </div>
          ))}
          <div className="border-t border-border/40 pt-1.5 space-y-1.5 mt-auto">
            <div>
              <div className="text-[7px] text-muted-foreground">STREAK</div>
              <div className="text-primary font-black text-base leading-none">62</div>
            </div>
            <div>
              <div className="text-[7px] text-muted-foreground">PACE</div>
              <div className="text-green-400 font-bold text-[9px]">{pace}</div>
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
        <span className="ml-auto text-[7px] text-muted-foreground">BULL 50% N:120 ⬛188</span>
      </div>
    </div>
  );
}