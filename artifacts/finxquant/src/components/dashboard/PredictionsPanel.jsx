import React, { useState } from 'react';
import { Brain, Flame, ArrowUp, ArrowDown, Minus, Clock } from 'lucide-react';

import { generatePrediction } from '@/lib/localMarketData';

const ASSETS = [
  { sym: 'NVDA', price: 145.23, catalyst: 'AI GPU demand surge' },
  { sym: 'BTC',  price: 104523, catalyst: 'ETF inflows + halving' },
  { sym: 'AAPL', price: 234.56, catalyst: 'WWDC + services growth' },
  { sym: 'TSLA', price: 345.67, catalyst: 'Margin pressure + delivery' },
  { sym: 'ETH',  price: 3876,   catalyst: 'DeFi TVL + L2 expansion' },
  { sym: 'MSFT', price: 467.89, catalyst: 'Azure AI + Copilot revenue' },
  { sym: 'SOL',  price: 187.34, catalyst: 'Ecosystem + DeFi activity' },
  { sym: 'SPX',  price: 5998,   catalyst: 'Fed rate cut expectations' },
  { sym: 'GOLD', price: 2687,   catalyst: 'Safe haven + USD weakness' },
  { sym: 'OIL',  price: 78.34,  catalyst: 'Inventory build bearish' },
];

const HOTTEST = [
  { symbol: 'NVDA', reason: 'AI capex cycle acceleration', direction: 'LONG' },
  { symbol: 'SOL',  reason: 'DeFi TVL surge',              direction: 'LONG' },
  { symbol: 'TSLA', reason: 'Delivery + margin headwinds', direction: 'SHORT' },
];

const TRENDS = [
  { trend: 'AI Infrastructure Boom', sectors: ['Tech', 'Semis'] },
  { trend: 'Crypto Bull Run',         sectors: ['Crypto'] },
  { trend: 'Rate Cut Expectations',   sectors: ['Financials', 'RE'] },
];

function DirectionBadge({ direction }) {
  if (direction === 'UP')      return <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold border border-green-500/30 bg-green-500/10 text-green-400"><ArrowUp className="w-2 h-2"/>UP</span>;
  if (direction === 'DOWN')    return <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold border border-red-500/30 bg-red-500/10 text-red-400"><ArrowDown className="w-2 h-2"/>DOWN</span>;
  return <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-bold border border-yellow-500/30 bg-yellow-500/10 text-yellow-400"><Minus className="w-2 h-2"/>FLAT</span>;
}

export default function PredictionsPanel() {
  const [filter, setFilter] = useState('all');

  const predictions = ASSETS.map(a => ({ ...a, ...generatePrediction(a.sym) }));

  const filtered = predictions.filter(p => {
    if (filter === 'up')   return p.timeLabel.direction === 'UP';
    if (filter === 'down') return p.timeLabel.direction === 'DOWN';
    return true;
  });

  return (
    <div className="text-[10px] font-mono p-1.5 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Brain className="w-3 h-3 text-primary" />
          <span className="text-[9px] text-muted-foreground uppercase">AI Signal Engine</span>
        </div>
        <div className="flex items-center gap-0.5">
          {['all', 'up', 'down'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-1.5 py-0.5 rounded text-[8px] uppercase transition-colors ${filter === f ? 'bg-primary/20 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}
            >{f}</button>
          ))}
        </div>
      </div>

      {/* Regime */}
      <div className="bg-primary/10 border border-primary/20 rounded px-2 py-0.5 flex justify-between">
        <span className="text-[9px] text-muted-foreground">REGIME:</span>
        <span className="text-primary text-[9px]">Risk-On / Late Cycle</span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-5 text-[9px] text-muted-foreground px-1 border-b border-border/40 pb-0.5">
        <span>ASSET</span>
        <span className="text-center">SIGNAL</span>
        <span className="text-center flex items-center justify-center gap-0.5"><Clock className="w-2 h-2"/>1H</span>
        <span className="text-center flex items-center justify-center gap-0.5"><Clock className="w-2 h-2"/>1D</span>
        <span className="text-center">CONF</span>
      </div>

      {/* Rows */}
      <div className="space-y-0.5">
        {filtered.map(p => (
          <div key={p.sym} className="bg-secondary/20 rounded border border-border/30 px-1.5 py-1">
            {/* Top row */}
            <div className="grid grid-cols-5 items-center mb-0.5">
              <div>
                <div className="text-primary font-medium">{p.sym}</div>
                <div className="text-[8px] text-muted-foreground">${p.price.toLocaleString()}</div>
              </div>
              <div className="flex justify-center">
                <DirectionBadge direction={p.timeLabel.direction} />
              </div>
              <div className={`text-center text-[9px] font-medium ${p.timeLabel.direction === 'UP' ? 'text-green-400' : p.timeLabel.direction === 'DOWN' ? 'text-red-400' : 'text-yellow-400'}`}>
                {p.move1h}
              </div>
              <div className={`text-center text-[9px] font-medium ${p.timeLabel.direction === 'UP' ? 'text-green-400' : p.timeLabel.direction === 'DOWN' ? 'text-red-400' : 'text-yellow-400'}`}>
                {p.move1d}
              </div>
              <div className="text-center">
                <div className="w-full bg-secondary rounded-full h-1 mb-0.5">
                  <div className="bg-primary rounded-full h-1" style={{ width: `${p.confidence}%` }} />
                </div>
                <span className="text-primary text-[8px]">{p.confidence}%</span>
              </div>
            </div>
            {/* Bottom row - timing + indicators */}
            <div className="flex items-center justify-between text-[8px]">
              <span className={`font-medium ${p.timeLabel.direction === 'UP' ? 'text-green-400' : p.timeLabel.direction === 'DOWN' ? 'text-red-400' : 'text-yellow-400'}`}>
                {p.timeLabel.direction === 'NEUTRAL' ? '~' : p.timeLabel.direction === 'UP' ? '▲' : '▼'} {p.timeLabel.label}
              </span>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>RSI:{p.rsi}</span>
                <span>MACD:{p.macd > 0 ? '+' : ''}{p.macd.toFixed(2)}</span>
                <span>Vol:{p.relVol}x</span>
                <span className="text-primary/60 truncate max-w-[70px]">{p.catalyst}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hottest Trades */}
      <div>
        <div className="flex items-center gap-1 mb-0.5">
          <Flame className="w-3 h-3 text-orange-400" />
          <span className="text-[9px] text-muted-foreground uppercase">Hot Trades</span>
        </div>
        {HOTTEST.map((t, i) => (
          <div key={i} className="flex items-center justify-between px-1 py-0.5 border-b border-border/20">
            <span className="text-primary">{t.symbol}</span>
            <span className={t.direction === 'LONG' ? 'text-green-400' : 'text-red-400'}>{t.direction}</span>
            <span className="text-muted-foreground truncate ml-2 flex-1 text-right">{t.reason}</span>
          </div>
        ))}
      </div>

      {/* Trends */}
      <div>
        <span className="text-[9px] text-muted-foreground uppercase">Prevailing Trends</span>
        {TRENDS.map((t, i) => (
          <div key={i} className="flex items-center gap-2 px-1 py-0.5">
            <span className="text-primary">▸</span>
            <span className="text-foreground">{t.trend}</span>
            <span className="text-muted-foreground text-[9px]">{t.sectors.join(', ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}