import React, { useState } from 'react';
import { Circle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const MOCK_NEWS = [
  { headline: 'Fed Holds Rates Steady, Signals Potential Cut in September', source: 'Reuters', time: '2m ago', sentiment: 'neutral', impact_score: 8, is_breaking: true, category: 'Macro' },
  { headline: 'NVIDIA Surpasses Apple as Most Valuable Company', source: 'Bloomberg', time: '5m ago', sentiment: 'bullish', impact_score: 9, is_breaking: true, category: 'Tech' },
  { headline: 'Bitcoin Breaks $105K Resistance on Institutional Inflows', source: 'CoinDesk', time: '8m ago', sentiment: 'bullish', impact_score: 7, is_breaking: false, category: 'Crypto' },
  { headline: 'China PMI Contracts for Third Consecutive Month', source: 'SCMP', time: '12m ago', sentiment: 'bearish', impact_score: 6, is_breaking: false, category: 'Macro' },
  { headline: 'Tesla Deliveries Beat Estimates, Stock Surges Premarket', source: 'CNBC', time: '15m ago', sentiment: 'bullish', impact_score: 7, is_breaking: false, category: 'Earnings' },
  { headline: 'Oil Drops on Rising US Inventories', source: 'Reuters', time: '18m ago', sentiment: 'bearish', impact_score: 5, is_breaking: false, category: 'Commodities' },
  { headline: 'EU Approves New AI Regulation Framework', source: 'FT', time: '23m ago', sentiment: 'neutral', impact_score: 4, is_breaking: false, category: 'Regulation' },
  { headline: 'Goldman Sachs Upgrades Semiconductor Sector to Overweight', source: 'MarketWatch', time: '28m ago', sentiment: 'bullish', impact_score: 6, is_breaking: false, category: 'Research' },
  { headline: 'Japan Yen Weakens Past 155 as BOJ Holds Policy', source: 'Nikkei', time: '32m ago', sentiment: 'bearish', impact_score: 5, is_breaking: false, category: 'Forex' },
  { headline: 'Retail Sales Data Shows Consumer Spending Resilience', source: 'WSJ', time: '35m ago', sentiment: 'bullish', impact_score: 6, is_breaking: false, category: 'Macro' },
];

const sentimentIcon = {
  bullish: <TrendingUp className="w-2.5 h-2.5 text-green-400" />,
  bearish: <TrendingDown className="w-2.5 h-2.5 text-red-400" />,
  neutral: <Minus className="w-2.5 h-2.5 text-yellow-400" />,
};

export default function NewsFeedPanel({ compact = false }) {
  const [news] = useState(MOCK_NEWS);

  return (
    <div className="text-[10px] font-mono">
      <div className="flex items-center justify-between px-1.5 py-1 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground uppercase">Live Feed</span>
          <Circle className="w-1.5 h-1.5 fill-green-400 text-green-400 pulse-live" />
        </div>
        <span className="text-[9px] text-muted-foreground">{news.length} items</span>
      </div>
      <div className="divide-y divide-border/50">
        {news.map((item, i) => (
          <div key={i} className="px-1.5 py-1 hover:bg-secondary/30 cursor-pointer transition-colors">
            <div className="flex items-start gap-1.5">
              {item.is_breaking && (
                <span className="text-[8px] bg-destructive/20 text-destructive px-1 rounded shrink-0 mt-0.5">BREAK</span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-foreground leading-tight truncate">{item.headline}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-muted-foreground">{item.source}</span>
                  <span className="text-muted-foreground">{item.time}</span>
                  {sentimentIcon[item.sentiment]}
                  <span className="text-primary/60">{item.category}</span>
                  {!compact && (
                    <div className="flex items-center gap-0.5">
                      <span className="text-muted-foreground">IMP:</span>
                      <div className="flex gap-px">
                        {Array.from({ length: 10 }).map((_, j) => (
                          <div key={j} className={`w-1 h-2 rounded-sm ${j < item.impact_score ? 'bg-primary' : 'bg-secondary'}`} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}