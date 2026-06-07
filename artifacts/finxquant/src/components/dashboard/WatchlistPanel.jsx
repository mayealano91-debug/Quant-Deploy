import React, { useState } from 'react';
import { Plus, Star, TrendingUp, TrendingDown } from 'lucide-react';

const DEFAULT_WATCHLIST = [
  { sym: 'AAPL', price: 234.56, chg: 3.21, pct: 1.39, vol: '45.2M' },
  { sym: 'MSFT', price: 467.89, chg: 5.67, pct: 1.23, vol: '23.1M' },
  { sym: 'NVDA', price: 145.23, chg: 8.45, pct: 6.17, vol: '312.4M' },
  { sym: 'GOOGL', price: 178.45, chg: -1.23, pct: -0.68, vol: '18.7M' },
  { sym: 'AMZN', price: 223.45, chg: 2.34, pct: 1.06, vol: '34.5M' },
  { sym: 'META', price: 567.89, chg: 12.34, pct: 2.22, vol: '15.8M' },
  { sym: 'TSLA', price: 345.67, chg: -12.34, pct: -3.45, vol: '89.3M' },
  { sym: 'BTC', price: 104523, chg: 2341, pct: 2.29, vol: '32.1B' },
  { sym: 'ETH', price: 3876, chg: 98, pct: 2.60, vol: '14.5B' },
  { sym: 'SOL', price: 187.34, chg: 5.67, pct: 3.12, vol: '3.2B' },
  { sym: 'GOLD', price: 2687, chg: 12.30, pct: 0.46, vol: '234K' },
  { sym: 'EUR/USD', price: 1.0876, chg: 0.0023, pct: 0.21, vol: '-' },
];

export default function WatchlistPanel({ onSymbolClick }) {
  const [watchlist] = useState(DEFAULT_WATCHLIST);
  const [activeTab, setActiveTab] = useState('main');

  return (
    <div className="text-[10px] font-mono">
      <div className="flex items-center gap-1 px-1.5 py-0.5 border-b border-border bg-secondary/20">
        {['Main', 'Tech', 'Crypto', 'Forex'].map(tab => (
          <button
            key={tab}
            className={`px-1.5 py-0.5 rounded text-[9px] transition-colors ${
              activeTab === tab.toLowerCase() ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            onClick={() => setActiveTab(tab.toLowerCase())}
          >
            {tab}
          </button>
        ))}
        <button className="ml-auto p-0.5 hover:bg-secondary rounded">
          <Plus className="w-2.5 h-2.5 text-muted-foreground" />
        </button>
      </div>

      <table className="w-full terminal-table">
        <thead>
          <tr className="text-[9px] text-muted-foreground border-b border-border/50">
            <th className="text-left">SYM</th>
            <th className="text-right">LAST</th>
            <th className="text-right">CHG</th>
            <th className="text-right">%CHG</th>
            <th className="text-right">VOL</th>
          </tr>
        </thead>
        <tbody>
          {watchlist.map(item => (
            <tr
              key={item.sym}
              className="hover:bg-secondary/30 cursor-pointer transition-colors border-b border-border/20"
              onClick={() => onSymbolClick?.(item.sym)}
            >
              <td className="text-primary font-medium">{item.sym}</td>
              <td className="text-right text-foreground">{item.price.toLocaleString()}</td>
              <td className={`text-right ${item.chg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.chg >= 0 ? '+' : ''}{item.chg}
              </td>
              <td className={`text-right ${item.pct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {item.pct >= 0 ? '+' : ''}{item.pct}%
              </td>
              <td className="text-right text-muted-foreground">{item.vol}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}