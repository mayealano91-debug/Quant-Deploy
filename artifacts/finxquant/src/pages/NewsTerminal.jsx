import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import NewsFeedPanel from '@/components/dashboard/NewsFeedPanel';
import { Newspaper, AlertTriangle, BarChart3, Filter, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const CATEGORIES = ['All', 'Breaking', 'Macro', 'Earnings', 'Tech', 'Crypto', 'Commodities', 'Forex', 'Regulation'];

function SentimentPanel() {
  const sentiments = [
    { asset: 'S&P 500', score: 72, label: 'Bullish' },
    { asset: 'NASDAQ', score: 78, label: 'Very Bullish' },
    { asset: 'Bitcoin', score: 81, label: 'Very Bullish' },
    { asset: 'Gold', score: 55, label: 'Neutral' },
    { asset: 'Oil', score: 35, label: 'Bearish' },
    { asset: 'USD', score: 48, label: 'Neutral' },
    { asset: 'Bonds', score: 42, label: 'Slightly Bearish' },
  ];
  return (
    <div className="text-[10px] font-mono p-1.5 space-y-1">
      <div className="text-[9px] text-muted-foreground uppercase mb-1">News Sentiment Analysis</div>
      {sentiments.map(s => (
        <div key={s.asset} className="flex items-center gap-2">
          <span className="text-muted-foreground w-16">{s.asset}</span>
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${s.score > 65 ? 'bg-green-500' : s.score > 45 ? 'bg-yellow-500' : 'bg-red-500'}`}
              style={{ width: `${s.score}%` }}
            />
          </div>
          <span className={`w-8 text-right ${s.score > 65 ? 'text-green-400' : s.score > 45 ? 'text-yellow-400' : 'text-red-400'}`}>{s.score}</span>
          <span className="text-muted-foreground text-[9px] w-20 text-right">{s.label}</span>
        </div>
      ))}
      <div className="mt-2 pt-1 border-t border-border/50">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Fear & Greed Index:</span>
          <span className="text-green-400 font-medium">68 — Greed</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Market Mood:</span>
          <span className="text-primary">Risk-On</span>
        </div>
      </div>
    </div>
  );
}

function MarketImpactPanel() {
  const impacts = [
    { event: 'NVDA Earnings Beat', impact: '+6.2%', assets: 'NVDA, SOX, SMH', type: 'positive' },
    { event: 'Fed Rate Hold', impact: '+0.4%', assets: 'SPX, QQQ, IWM', type: 'positive' },
    { event: 'China PMI Miss', impact: '-1.2%', assets: 'FXI, EEM, KWEB', type: 'negative' },
    { event: 'Oil Inventory Build', impact: '-0.9%', assets: 'USO, XLE, OXY', type: 'negative' },
    { event: 'Bitcoin ETF Flows', impact: '+2.3%', assets: 'BTC, ETH, COIN', type: 'positive' },
  ];
  return (
    <div className="text-[10px] font-mono p-1.5">
      <div className="text-[9px] text-muted-foreground uppercase mb-1">Market Impact Scoring</div>
      <div className="space-y-1">
        {impacts.map((item, i) => (
          <div key={i} className="bg-secondary/20 rounded p-1.5 border border-border/30">
            <div className="flex items-center justify-between">
              <span className="text-foreground">{item.event}</span>
              <span className={item.type === 'positive' ? 'text-green-400' : 'text-red-400'}>{item.impact}</span>
            </div>
            <span className="text-muted-foreground text-[9px]">Affected: {item.assets}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NewsTerminal() {
  const [activeCategory, setActiveCategory] = useState('All');
  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={55} minSize={35}>
          <TerminalPanel 
            title="Live News Terminal" 
            icon={Newspaper}
            headerExtra={
              <div className="flex items-center gap-0.5 mr-1">
                {CATEGORIES.slice(0, 5).map(cat => (
                  <button
                    key={cat}
                    className={`px-1 py-0 text-[8px] rounded ${activeCategory === cat ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                    onClick={() => setActiveCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            }
          >
            <NewsFeedPanel />
          </TerminalPanel>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={22} minSize={15}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Sentiment Analysis" icon={BarChart3}>
                <SentimentPanel />
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Market Impact" icon={AlertTriangle}>
                <MarketImpactPanel />
              </TerminalPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={23} minSize={15}>
          <TerminalPanel title="Earnings Calendar" icon={BarChart3}>
            <div className="text-[10px] font-mono p-1.5">
              <div className="text-[9px] text-muted-foreground uppercase mb-1">Upcoming Earnings</div>
              {[
                { sym: 'ORCL', date: 'Jun 12', est: '$1.65', time: 'AMC' },
                { sym: 'ADBE', date: 'Jun 13', est: '$4.39', time: 'AMC' },
                { sym: 'KR', date: 'Jun 13', est: '$0.91', time: 'BMO' },
                { sym: 'LULU', date: 'Jun 14', est: '$2.54', time: 'AMC' },
                { sym: 'COST', date: 'Jun 14', est: '$3.78', time: 'AMC' },
                { sym: 'NKE', date: 'Jun 20', est: '$0.83', time: 'AMC' },
                { sym: 'FDX', date: 'Jun 25', est: '$5.34', time: 'AMC' },
              ].map(e => (
                <div key={e.sym} className="flex items-center justify-between py-0.5 border-b border-border/20">
                  <span className="text-primary">{e.sym}</span>
                  <span className="text-muted-foreground">{e.date}</span>
                  <span className="text-foreground">{e.est}</span>
                  <span className="text-muted-foreground text-[9px]">{e.time}</span>
                </div>
              ))}
            </div>
          </TerminalPanel>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}