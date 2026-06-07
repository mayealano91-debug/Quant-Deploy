import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import OrderBookPanel from '@/components/dashboard/OrderBookPanel';
import WatchlistPanel from '@/components/dashboard/WatchlistPanel';
import HeatmapPanel from '@/components/dashboard/HeatmapPanel';
import { BarChart3, BookOpen, Eye, Activity, Search, TrendingUp, TrendingDown, Zap } from 'lucide-react';

const QUOTES = [
  { sym: 'AAPL', bid: 234.23, ask: 234.56, last: 234.40, chg: 1.39, vol: '45.2M', hi: 235.12, lo: 232.45 },
  { sym: 'MSFT', bid: 467.56, ask: 467.89, last: 467.72, chg: 1.23, vol: '23.1M', hi: 469.34, lo: 464.23 },
  { sym: 'NVDA', bid: 144.90, ask: 145.23, last: 145.10, chg: 6.17, vol: '312.4M', hi: 148.56, lo: 138.23 },
  { sym: 'GOOGL', bid: 178.12, ask: 178.45, last: 178.30, chg: -0.68, vol: '18.7M', hi: 180.23, lo: 177.45 },
  { sym: 'AMZN', bid: 223.12, ask: 223.45, last: 223.28, chg: 1.06, vol: '34.5M', hi: 225.56, lo: 221.23 },
  { sym: 'META', bid: 567.56, ask: 567.89, last: 567.72, chg: 2.22, vol: '15.8M', hi: 572.34, lo: 560.12 },
  { sym: 'TSLA', bid: 345.34, ask: 345.67, last: 345.50, chg: -3.45, vol: '89.3M', hi: 358.12, lo: 340.23 },
  { sym: 'BTC', bid: 104490, ask: 104523, last: 104510, chg: 2.29, vol: '32.1B', hi: 106234, lo: 101234 },
  { sym: 'ETH', bid: 3874, ask: 3876, last: 3875, chg: 2.60, vol: '14.5B', hi: 3923, lo: 3812 },
  { sym: 'SOL', bid: 187.10, ask: 187.34, last: 187.22, chg: 3.12, vol: '3.2B', hi: 192.34, lo: 182.56 },
  { sym: 'GOLD', bid: 2686, ask: 2688, last: 2687, chg: 0.46, vol: '234K', hi: 2695, lo: 2678 },
  { sym: 'EUR/USD', bid: 1.0874, ask: 1.0876, last: 1.0875, chg: 0.21, vol: '-', hi: 1.0912, lo: 1.0845 },
];

function QuotesGrid({ onSymbolClick }) {
  return (
    <div className="text-[10px] font-mono overflow-auto">
      <table className="w-full terminal-table">
        <thead className="sticky top-0 bg-card z-10">
          <tr className="text-[9px] text-muted-foreground border-b border-border">
            <th className="text-left">SYM</th>
            <th className="text-right">BID</th>
            <th className="text-right">ASK</th>
            <th className="text-right">LAST</th>
            <th className="text-right">%CHG</th>
            <th className="text-right">VOL</th>
            <th className="text-right">HIGH</th>
            <th className="text-right">LOW</th>
          </tr>
        </thead>
        <tbody>
          {QUOTES.map(q => (
            <tr key={q.sym} className="hover:bg-secondary/30 cursor-pointer border-b border-border/20" onClick={() => onSymbolClick?.(q.sym)}>
              <td className="text-primary font-medium">{q.sym}</td>
              <td className="text-right text-green-400">{q.bid.toLocaleString()}</td>
              <td className="text-right text-red-400">{q.ask.toLocaleString()}</td>
              <td className="text-right text-foreground">{q.last.toLocaleString()}</td>
              <td className={`text-right ${q.chg >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {q.chg >= 0 ? '+' : ''}{q.chg}%
              </td>
              <td className="text-right text-muted-foreground">{q.vol}</td>
              <td className="text-right text-muted-foreground">{q.hi.toLocaleString()}</td>
              <td className="text-right text-muted-foreground">{q.lo.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VolumeAnalytics() {
  const data = [
    { sym: 'NVDA', vol: '312.4M', relVol: 2.34, vwap: 143.56 },
    { sym: 'TSLA', vol: '89.3M', relVol: 1.87, vwap: 348.23 },
    { sym: 'AAPL', vol: '45.2M', relVol: 1.12, vwap: 233.89 },
    { sym: 'BTC', vol: '32.1B', relVol: 1.45, vwap: 103234 },
    { sym: 'AMZN', vol: '34.5M', relVol: 1.23, vwap: 222.56 },
  ];
  return (
    <div className="text-[10px] font-mono p-1">
      <table className="w-full terminal-table">
        <thead>
          <tr className="text-[9px] text-muted-foreground border-b border-border/50">
            <th className="text-left">SYM</th>
            <th className="text-right">VOL</th>
            <th className="text-right">REL.VOL</th>
            <th className="text-right">VWAP</th>
          </tr>
        </thead>
        <tbody>
          {data.map(d => (
            <tr key={d.sym} className="border-b border-border/20">
              <td className="text-primary">{d.sym}</td>
              <td className="text-right text-foreground">{d.vol}</td>
              <td className={`text-right ${d.relVol > 1.5 ? 'text-primary' : 'text-muted-foreground'}`}>{d.relVol}x</td>
              <td className="text-right text-muted-foreground">{d.vwap.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MarketsTerminal({ onNavigate }) {
  const [selectedSymbol, setSelectedSymbol] = useState('SPX');
  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={55} minSize={35}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title={`Chart — ${selectedSymbol}`} icon={BarChart3}>
                <PerformanceChart symbol={selectedSymbol} />
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Quotes Grid" icon={Search}>
                <QuotesGrid onSymbolClick={setSelectedSymbol} />
              </TerminalPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={20} minSize={15}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Order Book" icon={BookOpen}>
                <OrderBookPanel symbol={selectedSymbol} />
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Volume Analytics" icon={Activity}>
                <VolumeAnalytics />
              </TerminalPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={25} minSize={15}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Watchlist" icon={Eye}>
                <WatchlistPanel onSymbolClick={setSelectedSymbol} />
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Sector Heatmap" icon={Activity}>
                <HeatmapPanel />
              </TerminalPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}