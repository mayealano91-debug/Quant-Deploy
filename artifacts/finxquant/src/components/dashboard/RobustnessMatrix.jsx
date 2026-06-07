import React, { useState, useEffect } from 'react';

const ASSETS = ['BTCUSD', 'ETHUSD', 'SOLUSD', 'BNBUSD', 'XRPUSD', 'ADAUSD', 'DOTUSD'];
const TFS    = ['5M', '15M', '30M', '1H', '4H', '1D', 'AVG'];

function rnd(base, spread) {
  return parseFloat((base + (Math.random() - 0.5) * spread).toFixed(1));
}

function generateRow() {
  const vals = [rnd(4, 12), rnd(3, 10), rnd(2, 14), rnd(-2, 16), rnd(4, 12), rnd(3, 14)];
  const avg = parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1));
  return [...vals, avg];
}

function cellBg(v) {
  if (v >= 8)   return '#16a34a';
  if (v >= 4)   return '#22c55e80';
  if (v >= 1)   return '#22c55e40';
  if (v >= -1)  return '#eab30860';
  if (v >= -4)  return '#ef444450';
  if (v >= -8)  return '#ef444480';
  return '#dc2626';
}
function cellText(v) {
  if (v >= 4)  return '#fff';
  if (v >= 1)  return '#86efac';
  if (v >= -1) return '#fde68a';
  return '#fca5a5';
}

export default function RobustnessMatrix() {
  const [data, setData] = useState(() => ASSETS.map(a => ({ asset: a, vals: generateRow() })));
  const [horizon, setHorizon] = useState(70);

  useEffect(() => {
    const t = setInterval(() => {
      setData(ASSETS.map(a => ({ asset: a, vals: generateRow() })));
      setHorizon(h => h >= 100 ? 60 : h + 1);
    }, 2500);
    return () => clearInterval(t);
  }, []);

  const circumference = 2 * Math.PI * 22;
  const dash = (horizon / 100) * circumference;

  return (
    <div className="font-mono text-[9px] h-full flex flex-col bg-[hsl(220,15%,5%)]">
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-0.5 border-b border-border/40 bg-[hsl(220,15%,7%)] shrink-0">
        <span className="text-[8px] text-muted-foreground uppercase tracking-wider">◉ ROBUSTNESS MATRIX · {ASSETS.length} ASSETS · {TFS.length - 1} TF</span>
        <span className="text-[8px]">HORIZON <span className="text-primary font-bold">{horizon}/100</span></span>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse text-[8px]">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-2 py-0.5 text-muted-foreground font-normal w-16">ASSET</th>
                {TFS.map(tf => (
                  <th key={tf} className={`text-center px-0.5 py-0.5 font-normal ${tf === 'AVG' ? 'text-primary' : 'text-muted-foreground'}`}>{tf}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map(({ asset, vals }) => (
                <tr key={asset} className="border-t border-border/20">
                  <td className="px-2 py-0.5 text-[8px] text-foreground font-medium">{asset}</td>
                  {vals.map((v, i) => (
                    <td key={i} className="px-0.5 py-0.5 text-center">
                      <span
                        className={`inline-block w-full text-center px-0.5 rounded-sm text-[8px] font-bold ${i === 6 ? 'font-black' : ''}`}
                        style={{ background: cellBg(v), color: cellText(v) }}
                      >
                        {v > 0 ? '+' : ''}{v}%
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right sidebar: ring + stats */}
        <div className="w-16 border-l border-border/40 flex flex-col items-center justify-around py-2 px-1 shrink-0">
          <svg width={52} height={52} viewBox="0 0 52 52">
            <circle cx={26} cy={26} r={22} fill="none" stroke="hsl(220,15%,15%)" strokeWidth={5} />
            <circle
              cx={26} cy={26} r={22} fill="none"
              stroke="hsl(35,100%,50%)" strokeWidth={5}
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
            <text x={26} y={30} textAnchor="middle" fontSize={10} fontWeight="bold" fill="hsl(35,100%,50%)" fontFamily="JetBrains Mono, monospace">
              {horizon}
            </text>
          </svg>
          {[
            { label: 'PERP', val: 71, color: '#22c55e' },
            { label: 'RISK', val: 56, color: '#eab308' },
            { label: 'STAT', val: 99, color: 'hsl(35,100%,50%)' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="text-[7px] text-muted-foreground">{s.label}</div>
              <div className="font-black text-sm" style={{ color: s.color }}>{s.val}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}