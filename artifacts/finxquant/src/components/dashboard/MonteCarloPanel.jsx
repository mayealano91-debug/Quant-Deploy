import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

function generateData() {
  return Array.from({ length: 50 }, (_, i) => {
    const x = (i - 25) * 0.8;
    const y = Math.round(Math.exp(-0.5 * Math.pow((x - 0.5) / 6, 2)) * 500 + Math.random() * 25);
    return { x: x.toFixed(1), y };
  });
}

function barColor(x) {
  const v = parseFloat(x);
  if (v < -10) return '#7f1d1d';
  if (v < -6)  return '#dc2626';
  if (v < -3)  return '#f97316';
  if (v < 0)   return '#eab308';
  if (v < 3)   return '#4ade80';
  if (v < 6)   return '#22c55e';
  return '#15803d';
}

// Ticker bar at bottom
const TICKERS = [
  { sym: 'ETH',  price: '$3,325', chg: '+0.34%', up: true },
  { sym: 'SOL',  price: '$188',   chg: '+2.28%', up: true },
  { sym: 'XRP',  price: '$2.35',  chg: '+1.40%', up: true },
  { sym: 'DOGE', price: '$0.36',  chg: '+3.86%', up: true },
];

export default function MonteCarloPanel() {
  const [data] = useState(generateData);

  return (
    <div className="font-mono text-[9px] h-full flex flex-col bg-[hsl(220,15%,5%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-border/40 bg-[hsl(220,15%,7%)] shrink-0">
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">◈ MONTE CARLO SIGNIFICANCE · 7,854 SIMULATED PATHS · 5V</span>
        <span className="text-[8px] text-primary font-bold">P &lt; 0.010</span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: stats + chart */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-2 pt-0.5 text-[7px] text-muted-foreground shrink-0">
            <span>σ -0.42% + 3.1%</span>
            <span>VaR<sub>0.1</sub> -6.7%  CVaR -31.4%</span>
            <span>Sharpe 2.41 · Sortino 3.12</span>
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: 70 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: -10 }} barCategoryGap={0}>
                <XAxis dataKey="x" tick={false} axisLine={false} tickLine={false} />
                <YAxis hide />
                <ReferenceLine x="0.0" stroke="hsl(35,100%,50%)" strokeWidth={1} strokeDasharray="3 3" />
                <Bar dataKey="y" radius={[1, 1, 0, 0]} isAnimationActive={false}>
                  {data.map((entry, idx) => (
                    <Cell key={idx} fill={barColor(entry.x)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Ticker row */}
          <div className="flex items-center gap-4 px-2 py-0.5 border-t border-border/30 bg-[hsl(220,15%,7%)] shrink-0">
            {TICKERS.map(t => (
              <span key={t.sym} className="text-[8px] flex items-center gap-1">
                <span className="text-muted-foreground font-bold">{t.sym}</span>
                <span className="text-foreground">{t.price}</span>
                <span className={t.up ? 'text-green-400' : 'text-red-400'}>{t.chg}</span>
              </span>
            ))}
            <span className="ml-auto text-[8px] text-primary font-bold">STACK</span>
          </div>
        </div>

        {/* Right: key stats */}
        <div className="w-20 border-l border-border/40 flex flex-col justify-center px-2 gap-2 shrink-0">
          <div>
            <div className="text-[7px] text-muted-foreground">5TH %ILE</div>
            <div className="text-green-400 font-black text-base leading-none">+5.0%</div>
          </div>
          <div>
            <div className="text-[7px] text-muted-foreground">EXPECTED</div>
            <div className="text-red-400 font-black text-base leading-none">-0.1%</div>
          </div>
          <div>
            <div className="text-[7px] text-muted-foreground">P(0.05–10%)</div>
            <div className="text-primary font-black text-base leading-none">2.9%</div>
          </div>
        </div>
      </div>
    </div>
  );
}