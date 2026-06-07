import React from 'react';

const SECTORS = [
  { name: 'Technology', pct: 1.23, size: 28 },
  { name: 'Healthcare', pct: -0.45, size: 14 },
  { name: 'Financials', pct: 0.67, size: 13 },
  { name: 'Consumer Disc.', pct: 0.89, size: 11 },
  { name: 'Communication', pct: 1.56, size: 9 },
  { name: 'Industrials', pct: 0.34, size: 8 },
  { name: 'Consumer Stap.', pct: -0.23, size: 6 },
  { name: 'Energy', pct: -1.12, size: 4 },
  { name: 'Utilities', pct: 0.12, size: 3 },
  { name: 'Real Estate', pct: -0.56, size: 2 },
  { name: 'Materials', pct: 0.45, size: 2 },
];

function getColor(pct) {
  if (pct > 1.5) return 'bg-green-600';
  if (pct > 0.5) return 'bg-green-700';
  if (pct > 0) return 'bg-green-900';
  if (pct > -0.5) return 'bg-red-900';
  if (pct > -1.5) return 'bg-red-700';
  return 'bg-red-600';
}

export default function HeatmapPanel() {
  return (
    <div className="p-1.5 h-full">
      <div className="grid grid-cols-4 gap-0.5 h-full">
        {SECTORS.map(sector => (
          <div
            key={sector.name}
            className={`${getColor(sector.pct)} rounded-sm flex flex-col items-center justify-center p-1 cursor-pointer hover:opacity-80 transition-opacity`}
            style={{ gridColumn: sector.size > 15 ? 'span 2' : 'span 1', gridRow: sector.size > 20 ? 'span 2' : 'span 1' }}
          >
            <span className="text-[9px] font-mono text-white/80 truncate w-full text-center">{sector.name}</span>
            <span className={`text-[10px] font-mono font-bold ${sector.pct >= 0 ? 'text-green-200' : 'text-red-200'}`}>
              {sector.pct >= 0 ? '+' : ''}{sector.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}