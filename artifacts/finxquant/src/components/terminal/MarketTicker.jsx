import React, { useState, useEffect } from 'react';

const TICKER_DATA = [
  { s: 'SPX', p: 5998.74, c: 23.41, cp: 0.39 },
  { s: 'NDX', p: 21456.32, c: 145.67, cp: 0.68 },
  { s: 'DJI', p: 42876.55, c: -45.23, cp: -0.11 },
  { s: 'BTC', p: 104523.45, c: 2341.56, cp: 2.29 },
  { s: 'ETH', p: 3876.23, c: 98.45, cp: 2.60 },
  { s: 'EUR/USD', p: 1.0876, c: 0.0023, cp: 0.21 },
  { s: 'GBP/USD', p: 1.2734, c: -0.0012, cp: -0.09 },
  { s: 'USD/JPY', p: 154.67, c: 0.34, cp: 0.22 },
  { s: 'GOLD', p: 2687.45, c: 12.30, cp: 0.46 },
  { s: 'OIL', p: 78.34, c: -0.67, cp: -0.85 },
  { s: 'AAPL', p: 234.56, c: 3.21, cp: 1.39 },
  { s: 'MSFT', p: 467.89, c: 5.67, cp: 1.23 },
  { s: 'NVDA', p: 145.23, c: 8.45, cp: 6.17 },
  { s: 'TSLA', p: 345.67, c: -12.34, cp: -3.45 },
  { s: 'AMZN', p: 223.45, c: 2.34, cp: 1.06 },
  { s: 'SOL', p: 187.34, c: 5.67, cp: 3.12 },
  { s: 'VIX', p: 14.23, c: -0.45, cp: -3.07 },
  { s: 'TNX', p: 4.342, c: 0.023, cp: 0.53 },
];

export default function MarketTicker() {
  const [data, setData] = useState(TICKER_DATA);

  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => prev.map(item => {
        const delta = (Math.random() - 0.48) * item.p * 0.001;
        const newPrice = +(item.p + delta).toFixed(item.p > 1000 ? 2 : item.p > 10 ? 2 : 4);
        const newChange = +(item.c + delta).toFixed(item.p > 100 ? 2 : 4);
        const newPct = +((newChange / (newPrice - newChange)) * 100).toFixed(2);
        return { ...item, p: newPrice, c: newChange, cp: newPct };
      }));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-5 bg-[hsl(220,15%,4%)] border-b border-border overflow-hidden select-none shrink-0">
      <div className="ticker-scroll flex items-center h-full whitespace-nowrap" style={{ width: 'max-content' }}>
        {[...data, ...data].map((item, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-3 text-[10px] font-mono">
            <span className="text-muted-foreground font-medium">{item.s}</span>
            <span className="text-foreground">{item.p.toLocaleString()}</span>
            <span className={item.c >= 0 ? "text-green-400" : "text-red-400"}>
              {item.c >= 0 ? '+' : ''}{item.c.toFixed(2)}
            </span>
            <span className={`text-[9px] ${item.cp >= 0 ? "text-green-400" : "text-red-400"}`}>
              ({item.cp >= 0 ? '+' : ''}{item.cp}%)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}