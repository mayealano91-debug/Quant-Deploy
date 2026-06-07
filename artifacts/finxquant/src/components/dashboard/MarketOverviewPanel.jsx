import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const INDICES = [
  { name: 'S&P 500', sym: 'SPX', price: 5998.74, chg: 23.41, pct: 0.39 },
  { name: 'NASDAQ', sym: 'NDX', price: 21456.32, chg: 145.67, pct: 0.68 },
  { name: 'DOW', sym: 'DJI', price: 42876.55, chg: -45.23, pct: -0.11 },
  { name: 'RUSSELL', sym: 'RUT', price: 2234.56, chg: 12.34, pct: 0.55 },
  { name: 'VIX', sym: 'VIX', price: 14.23, chg: -0.45, pct: -3.07 },
  { name: 'US 10Y', sym: 'TNX', price: 4.342, chg: 0.023, pct: 0.53 },
];

const CRYPTO = [
  { name: 'Bitcoin', sym: 'BTC', price: 104523.45, chg: 2341.56, pct: 2.29 },
  { name: 'Ethereum', sym: 'ETH', price: 3876.23, chg: 98.45, pct: 2.60 },
  { name: 'Solana', sym: 'SOL', price: 187.34, chg: 5.67, pct: 3.12 },
  { name: 'XRP', sym: 'XRP', price: 2.34, chg: 0.12, pct: 5.41 },
];

const FOREX = [
  { pair: 'EUR/USD', rate: 1.0876, chg: 0.21 },
  { pair: 'GBP/USD', rate: 1.2734, chg: -0.09 },
  { pair: 'USD/JPY', rate: 154.67, chg: 0.22 },
  { pair: 'USD/CHF', rate: 0.8834, chg: -0.15 },
];

const COMMODITIES = [
  { name: 'Gold', price: 2687.45, chg: 0.46 },
  { name: 'Silver', price: 31.23, chg: 0.89 },
  { name: 'Crude Oil', price: 78.34, chg: -0.85 },
  { name: 'Nat Gas', price: 2.87, chg: 1.23 },
];

export default function MarketOverviewPanel({ data }) {
  const indices = data?.indices || INDICES;
  const crypto = data?.crypto || CRYPTO;

  return (
    <div className="p-1.5 space-y-2 text-[10px] font-mono">
      {/* Indices */}
      <div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 px-1">Indices</div>
        <div className="space-y-0.5">
          {INDICES.map(item => (
            <div key={item.sym} className="flex items-center justify-between px-1 py-0.5 hover:bg-secondary/30 rounded">
              <div className="flex items-center gap-1.5">
                {item.pct >= 0 ? <TrendingUp className="w-2.5 h-2.5 text-green-400" /> : <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
                <span className="text-muted-foreground w-10">{item.sym}</span>
              </div>
              <span className="text-foreground">{item.price.toLocaleString()}</span>
              <span className={item.pct >= 0 ? "text-green-400 w-14 text-right" : "text-red-400 w-14 text-right"}>
                {item.pct >= 0 ? '+' : ''}{item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Crypto */}
      <div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 px-1">Crypto</div>
        <div className="space-y-0.5">
          {CRYPTO.map(item => (
            <div key={item.sym} className="flex items-center justify-between px-1 py-0.5 hover:bg-secondary/30 rounded">
              <div className="flex items-center gap-1.5">
                {item.pct >= 0 ? <TrendingUp className="w-2.5 h-2.5 text-green-400" /> : <TrendingDown className="w-2.5 h-2.5 text-red-400" />}
                <span className="text-muted-foreground w-10">{item.sym}</span>
              </div>
              <span className="text-foreground">{item.price.toLocaleString()}</span>
              <span className={item.pct >= 0 ? "text-green-400 w-14 text-right" : "text-red-400 w-14 text-right"}>
                +{item.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Forex */}
      <div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 px-1">Forex</div>
        <div className="space-y-0.5">
          {FOREX.map(item => (
            <div key={item.pair} className="flex items-center justify-between px-1 py-0.5 hover:bg-secondary/30 rounded">
              <span className="text-muted-foreground">{item.pair}</span>
              <span className="text-foreground">{item.rate}</span>
              <span className={item.chg >= 0 ? "text-green-400 w-14 text-right" : "text-red-400 w-14 text-right"}>
                {item.chg >= 0 ? '+' : ''}{item.chg}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Commodities */}
      <div>
        <div className="text-[9px] text-muted-foreground uppercase tracking-wider mb-1 px-1">Commodities</div>
        <div className="space-y-0.5">
          {COMMODITIES.map(item => (
            <div key={item.name} className="flex items-center justify-between px-1 py-0.5 hover:bg-secondary/30 rounded">
              <span className="text-muted-foreground">{item.name}</span>
              <span className="text-foreground">{item.price.toLocaleString()}</span>
              <span className={item.chg >= 0 ? "text-green-400 w-14 text-right" : "text-red-400 w-14 text-right"}>
                {item.chg >= 0 ? '+' : ''}{item.chg}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}