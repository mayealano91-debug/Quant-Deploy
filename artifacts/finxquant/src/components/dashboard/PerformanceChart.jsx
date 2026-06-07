import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';

const generateChartData = (days = 30) => {
  let price = 5800;
  return Array.from({ length: days }, (_, i) => {
    price += (Math.random() - 0.45) * 30;
    return {
      date: `${Math.floor(i / 30) + 1}/${(i % 30) + 1}`,
      value: Math.round(price * 100) / 100,
      volume: Math.floor(Math.random() * 5000000000)
    };
  });
};

const TIMEFRAMES = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'MAX'];

export default function PerformanceChart({ symbol = 'SPX' }) {
  const [data] = useState(generateChartData(60));
  const [tf, setTf] = useState('1M');
  const lastVal = data[data.length - 1]?.value;
  const firstVal = data[0]?.value;
  const change = lastVal - firstVal;
  const isPositive = change >= 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-2 py-1 border-b border-border/50">
        <div className="flex items-center gap-2 text-[10px] font-mono">
          <span className="text-primary font-medium">{symbol}</span>
          <span className="text-foreground">{lastVal?.toLocaleString()}</span>
          <span className={isPositive ? "text-green-400" : "text-red-400"}>
            {isPositive ? '+' : ''}{change.toFixed(2)} ({((change / firstVal) * 100).toFixed(2)}%)
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {TIMEFRAMES.map(t => (
            <button
              key={t}
              className={`px-1 py-0.5 text-[9px] font-mono rounded transition-colors ${
                tf === t ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setTf(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'hsl(220,10%,50%)' }} axisLine={false} tickLine={false} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 9, fill: 'hsl(220,10%,50%)' }} axisLine={false} tickLine={false} width={45} />
            <Tooltip
              contentStyle={{ background: 'hsl(220,15%,8%)', border: '1px solid hsl(220,15%,15%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              labelStyle={{ color: 'hsl(220,10%,50%)' }}
            />
            <ReferenceLine y={firstVal} stroke="hsl(220,15%,20%)" strokeDasharray="3 3" />
            <Area type="monotone" dataKey="value" stroke={isPositive ? "#22c55e" : "#ef4444"} fill="url(#colorValue)" strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}