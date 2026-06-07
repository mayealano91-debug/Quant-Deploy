import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { Briefcase, PieChart, TrendingUp, History, BarChart3, Activity } from 'lucide-react';

const HOLDINGS = [
  { sym: 'AAPL', shares: 150, avgCost: 178.45, current: 234.56, sector: 'Technology' },
  { sym: 'MSFT', shares: 80, avgCost: 345.23, current: 467.89, sector: 'Technology' },
  { sym: 'NVDA', shares: 200, avgCost: 98.34, current: 145.23, sector: 'Technology' },
  { sym: 'GOOGL', shares: 100, avgCost: 142.56, current: 178.45, sector: 'Communication' },
  { sym: 'AMZN', shares: 60, avgCost: 167.89, current: 223.45, sector: 'Consumer Disc.' },
  { sym: 'BTC', shares: 2.5, avgCost: 42000, current: 104523, sector: 'Crypto' },
  { sym: 'ETH', shares: 20, avgCost: 2345, current: 3876, sector: 'Crypto' },
  { sym: 'GOLD', shares: 50, avgCost: 2234, current: 2687, sector: 'Commodities' },
];

const TRANSACTIONS = [
  { date: '2024-06-03', sym: 'NVDA', action: 'BUY', shares: 50, price: 138.45, total: 6922 },
  { date: '2024-06-02', sym: 'BTC', action: 'BUY', shares: 0.5, price: 101234, total: 50617 },
  { date: '2024-06-01', sym: 'TSLA', action: 'SELL', shares: 30, price: 352.34, total: 10570 },
  { date: '2024-05-30', sym: 'AAPL', action: 'BUY', shares: 25, price: 230.12, total: 5753 },
  { date: '2024-05-29', sym: 'ETH', action: 'BUY', shares: 5, price: 3712, total: 18560 },
];

export default function PortfolioTerminal() {
  const totalValue = HOLDINGS.reduce((s, h) => s + h.shares * h.current, 0);
  const totalCost = HOLDINGS.reduce((s, h) => s + h.shares * h.avgCost, 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = (totalPnl / totalCost) * 100;

  const sectorAlloc = HOLDINGS.reduce((acc, h) => {
    const val = h.shares * h.current;
    acc[h.sector] = (acc[h.sector] || 0) + val;
    return acc;
  }, {});

  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={45} minSize={30}>
          <ResizablePanelGroup direction="vertical">
            {/* Summary */}
            <ResizablePanel defaultSize={15} minSize={10}>
              <TerminalPanel title="Portfolio Summary" icon={Briefcase}>
                <div className="flex items-center justify-between px-2 py-1 text-[10px] font-mono">
                  <div><span className="text-muted-foreground">VALUE: </span><span className="text-foreground">${totalValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
                  <div><span className="text-muted-foreground">COST: </span><span className="text-foreground">${totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</span></div>
                  <div><span className="text-muted-foreground">P&L: </span><span className={totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                    {totalPnl >= 0 ? '+' : ''}${totalPnl.toLocaleString(undefined, {maximumFractionDigits: 0})} ({totalPnlPct.toFixed(2)}%)
                  </span></div>
                  <div><span className="text-muted-foreground">POSITIONS: </span><span className="text-primary">{HOLDINGS.length}</span></div>
                </div>
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            {/* Holdings Matrix */}
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Holdings Matrix" icon={BarChart3}>
                <div className="text-[10px] font-mono overflow-auto">
                  <table className="w-full terminal-table">
                    <thead className="sticky top-0 bg-card">
                      <tr className="text-[9px] text-muted-foreground border-b border-border">
                        <th className="text-left">SYM</th>
                        <th className="text-right">QTY</th>
                        <th className="text-right">AVG</th>
                        <th className="text-right">LAST</th>
                        <th className="text-right">MKT VAL</th>
                        <th className="text-right">P&L</th>
                        <th className="text-right">%P&L</th>
                        <th className="text-right">%PORT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {HOLDINGS.map(h => {
                        const mktVal = h.shares * h.current;
                        const pnl = (h.current - h.avgCost) * h.shares;
                        const pnlPct = ((h.current - h.avgCost) / h.avgCost) * 100;
                        const portPct = (mktVal / totalValue) * 100;
                        return (
                          <tr key={h.sym} className="hover:bg-secondary/30 border-b border-border/20">
                            <td className="text-primary">{h.sym}</td>
                            <td className="text-right">{h.shares}</td>
                            <td className="text-right text-muted-foreground">${h.avgCost.toLocaleString()}</td>
                            <td className="text-right">${h.current.toLocaleString()}</td>
                            <td className="text-right">${mktVal.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                            <td className={`text-right ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pnl >= 0 ? '+' : ''}${pnl.toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </td>
                            <td className={`text-right ${pnlPct >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                            </td>
                            <td className="text-right text-muted-foreground">{portPct.toFixed(1)}%</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={35}>
              <TerminalPanel title="Transaction History" icon={History}>
                <div className="text-[10px] font-mono overflow-auto">
                  <table className="w-full terminal-table">
                    <thead className="sticky top-0 bg-card">
                      <tr className="text-[9px] text-muted-foreground border-b border-border">
                        <th className="text-left">DATE</th>
                        <th className="text-left">SYM</th>
                        <th className="text-center">SIDE</th>
                        <th className="text-right">QTY</th>
                        <th className="text-right">PRICE</th>
                        <th className="text-right">TOTAL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {TRANSACTIONS.map((t, i) => (
                        <tr key={i} className="hover:bg-secondary/30 border-b border-border/20">
                          <td className="text-muted-foreground">{t.date}</td>
                          <td className="text-primary">{t.sym}</td>
                          <td className={`text-center ${t.action === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{t.action}</td>
                          <td className="text-right">{t.shares}</td>
                          <td className="text-right">${t.price.toLocaleString()}</td>
                          <td className="text-right">${t.total.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TerminalPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={30} minSize={20}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Portfolio Performance" icon={TrendingUp}>
                <PerformanceChart symbol="PORTFOLIO" />
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Sector Allocation" icon={PieChart}>
                <div className="text-[10px] font-mono p-1.5 space-y-1">
                  {Object.entries(sectorAlloc).sort(([,a],[,b]) => b - a).map(([sector, val]) => {
                    const pct = (val / totalValue) * 100;
                    return (
                      <div key={sector} className="space-y-0.5">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{sector}</span>
                          <span className="text-foreground">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TerminalPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={25} minSize={15}>
          <TerminalPanel title="Performance Attribution" icon={Activity}>
            <div className="text-[10px] font-mono p-1.5 space-y-1">
              <div className="text-[9px] text-muted-foreground uppercase mb-1">Top Contributors</div>
              {HOLDINGS.map(h => {
                const pnl = (h.current - h.avgCost) * h.shares;
                const contrib = (pnl / totalCost) * 100;
                return (
                  <div key={h.sym} className="flex items-center justify-between py-0.5 border-b border-border/20">
                    <span className="text-primary">{h.sym}</span>
                    <div className="flex-1 mx-2 h-1 bg-secondary rounded-full">
                      <div className={`h-full rounded-full ${pnl >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(contrib) * 5, 100)}%` }} />
                    </div>
                    <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {contrib >= 0 ? '+' : ''}{contrib.toFixed(2)}%
                    </span>
                  </div>
                );
              })}
            </div>
          </TerminalPanel>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}