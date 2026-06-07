import React, { useState, useEffect } from 'react';

function generateOrderBook(midPrice = 5998) {
  const bids = Array.from({ length: 10 }, (_, i) => ({
    price: +(midPrice - (i + 1) * 0.25).toFixed(2),
    size: Math.floor(50 + Math.random() * 500),
    orders: Math.floor(1 + Math.random() * 15),
  }));
  const asks = Array.from({ length: 10 }, (_, i) => ({
    price: +(midPrice + (i + 1) * 0.25).toFixed(2),
    size: Math.floor(50 + Math.random() * 500),
    orders: Math.floor(1 + Math.random() * 15),
  }));
  // Accumulate totals
  let bidTotal = 0, askTotal = 0;
  bids.forEach(b => { bidTotal += b.size; b.total = bidTotal; });
  asks.forEach(a => { askTotal += a.size; a.total = askTotal; });
  const maxTotal = Math.max(bidTotal, askTotal);
  bids.forEach(b => b.pct = (b.total / maxTotal) * 100);
  asks.forEach(a => a.pct = (a.total / maxTotal) * 100);
  return { bids, asks, spread: (asks[0].price - bids[0].price).toFixed(2) };
}

export default function OrderBookPanel({ symbol = 'SPX', compact = false }) {
  const [book, setBook] = useState(generateOrderBook());

  useEffect(() => {
    const timer = setInterval(() => setBook(generateOrderBook()), 2000);
    return () => clearInterval(timer);
  }, []);

  if (compact) {
    return (
      <div className="text-[8px] font-mono p-0.5 h-full overflow-hidden">
        <div className="text-[7px] text-muted-foreground px-1 mb-0.5">SPREAD <span className="text-primary">{book.spread}</span></div>
        {book.asks.slice(0,7).reverse().map((a, i) => (
          <div key={i} className="relative flex items-center px-1 py-px">
            <div className="absolute inset-0 bg-red-500/10" style={{ width: `${a.pct}%` }} />
            <span className="relative text-red-400 flex-1">{a.price}</span>
            <span className="relative text-muted-foreground">{a.size}</span>
          </div>
        ))}
        <div className="text-[7px] text-center text-muted-foreground py-0.5 border-y border-border/30">MID</div>
        {book.bids.slice(0,7).map((b, i) => (
          <div key={i} className="relative flex items-center px-1 py-px">
            <div className="absolute inset-0 bg-green-500/10" style={{ width: `${b.pct}%` }} />
            <span className="relative text-green-400 flex-1">{b.price}</span>
            <span className="relative text-muted-foreground">{b.size}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-[10px] font-mono p-1">
      <div className="flex items-center justify-between px-1 mb-1">
        <span className="text-[9px] text-muted-foreground">SPREAD: <span className="text-primary">{book.spread}</span></span>
      </div>
      <div className="grid grid-cols-2 gap-0.5">
        {/* Bids */}
        <div>
          <div className="flex text-[9px] text-muted-foreground px-1 mb-0.5">
            <span className="flex-1">BID</span>
            <span className="w-10 text-right">SIZE</span>
            <span className="w-10 text-right">TOT</span>
          </div>
          {book.bids.map((b, i) => (
            <div key={i} className="relative flex items-center px-1 py-px">
              <div className="absolute inset-0 bg-green-500/10" style={{ width: `${b.pct}%` }} />
              <span className="relative text-green-400 flex-1">{b.price}</span>
              <span className="relative text-foreground w-10 text-right">{b.size}</span>
              <span className="relative text-muted-foreground w-10 text-right">{b.total}</span>
            </div>
          ))}
        </div>
        {/* Asks */}
        <div>
          <div className="flex text-[9px] text-muted-foreground px-1 mb-0.5">
            <span className="flex-1">ASK</span>
            <span className="w-10 text-right">SIZE</span>
            <span className="w-10 text-right">TOT</span>
          </div>
          {book.asks.map((a, i) => (
            <div key={i} className="relative flex items-center px-1 py-px">
              <div className="absolute inset-0 right-0 bg-red-500/10" style={{ width: `${a.pct}%` }} />
              <span className="relative text-red-400 flex-1">{a.price}</span>
              <span className="relative text-foreground w-10 text-right">{a.size}</span>
              <span className="relative text-muted-foreground w-10 text-right">{a.total}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}