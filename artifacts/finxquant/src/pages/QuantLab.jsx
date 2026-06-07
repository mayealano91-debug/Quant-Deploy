import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { FlaskConical, BarChart3, TrendingUp, Settings, Play, Zap, Target } from 'lucide-react';

const FACTORS = [
  { name: 'Momentum', return: 12.3, sharpe: 1.45, weight: 25 },
  { name: 'Value', return: 8.7, sharpe: 1.12, weight: 20 },
  { name: 'Quality', return: 10.2, sharpe: 1.34, weight: 20 },
  { name: 'Low Vol', return: 7.8, sharpe: 1.56, weight: 15 },
  { name: 'Size', return: 5.4, sharpe: 0.89, weight: 10 },
  { name: 'Growth', return: 15.6, sharpe: 1.23, weight: 10 },
];

const BACKTEST_RESULTS = {
  totalReturn: 34.56, cagr: 18.23, sharpe: 1.67, maxDrawdown: -8.45,
  winRate: 64.3, profitFactor: 2.34, avgWin: 2.12, avgLoss: -1.23,
  totalTrades: 234, benchmark: 22.45, alpha: 12.11,
};

const MONTE_CARLO = [
  { percentile: '95th', return: 42.3, maxDD: -5.2 },
  { percentile: '75th', return: 28.7, maxDD: -8.9 },
  { percentile: '50th', return: 18.4, maxDD: -12.3 },
  { percentile: '25th', return: 8.9, maxDD: -18.7 },
  { percentile: '5th', return: -4.5, maxDD: -28.4 },
];

export default function QuantLab() {
  const [running, setRunning] = useState(false);
  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 bg-[hsl(220,15%,6%)] border-b border-border shrink-0">
        <FlaskConical className="w-3 h-3 text-primary" />
        <span className="text-xs font-mono text-muted-foreground">QUANT LAB — Strategy Builder & Backtesting</span>
        <div className="ml-auto flex items-center gap-1">
          <button className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-mono rounded hover:bg-primary/80 flex items-center gap-1">
            <Play className="w-3 h-3" /> RUN BACKTEST
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={25} minSize={18}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={55}>
                <TerminalPanel title="Strategy Builder" icon={Settings}>
                  <div className="text-[10px] font-mono p-1.5 space-y-2">
                    <div>
                      <label className="text-[9px] text-muted-foreground uppercase">Strategy Type</label>
                      <select className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none mt-0.5">
                        <option>Multi-Factor</option><option>Momentum</option><option>Mean Reversion</option>
                        <option>Statistical Arbitrage</option><option>Pairs Trading</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-muted-foreground uppercase">Universe</label>
                      <select className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none mt-0.5">
                        <option>S&P 500</option><option>NASDAQ 100</option><option>Russell 2000</option>
                        <option>Crypto Top 50</option><option>Forex Majors</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-[9px] text-muted-foreground">Lookback</label>
                        <input className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" defaultValue="252" />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground">Rebalance</label>
                        <select className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none">
                          <option>Monthly</option><option>Weekly</option><option>Daily</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-[9px] text-muted-foreground">Max Position</label>
                        <input className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" defaultValue="5%" />
                      </div>
                      <div>
                        <label className="text-[9px] text-muted-foreground">Stop Loss</label>
                        <input className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" defaultValue="8%" />
                      </div>
                    </div>
                  </div>
                </TerminalPanel>
              </ResizablePanel>
              <ResizableHandle className="h-px bg-border" />
              <ResizablePanel defaultSize={45}>
                <TerminalPanel title="Factor Research" icon={FlaskConical}>
                  <div className="text-[10px] font-mono p-1.5">
                    <table className="w-full terminal-table">
                      <thead>
                        <tr className="text-[9px] text-muted-foreground border-b border-border">
                          <th className="text-left">FACTOR</th><th className="text-right">RET%</th>
                          <th className="text-right">SHARPE</th><th className="text-right">WT%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {FACTORS.map(f => (
                          <tr key={f.name} className="border-b border-border/20">
                            <td className="text-primary">{f.name}</td>
                            <td className={`text-right ${f.return > 10 ? 'text-green-400' : 'text-foreground'}`}>{f.return}%</td>
                            <td className="text-right text-foreground">{f.sharpe}</td>
                            <td className="text-right text-muted-foreground">{f.weight}%</td>
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
          <ResizablePanel defaultSize={45} minSize={30}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={55}>
                <TerminalPanel title="Backtest Equity Curve" icon={TrendingUp}>
                  <PerformanceChart symbol="STRATEGY" />
                </TerminalPanel>
              </ResizablePanel>
              <ResizableHandle className="h-px bg-border" />
              <ResizablePanel defaultSize={45}>
                <TerminalPanel title="Backtest Results" icon={BarChart3}>
                  <div className="text-[10px] font-mono p-1.5">
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        { l: 'Total Return', v: `+${BACKTEST_RESULTS.totalReturn}%`, c: 'text-green-400' },
                        { l: 'CAGR', v: `${BACKTEST_RESULTS.cagr}%`, c: 'text-green-400' },
                        { l: 'Sharpe', v: BACKTEST_RESULTS.sharpe, c: 'text-foreground' },
                        { l: 'Max DD', v: `${BACKTEST_RESULTS.maxDrawdown}%`, c: 'text-red-400' },
                        { l: 'Win Rate', v: `${BACKTEST_RESULTS.winRate}%`, c: 'text-foreground' },
                        { l: 'Profit Factor', v: BACKTEST_RESULTS.profitFactor, c: 'text-foreground' },
                        { l: 'Trades', v: BACKTEST_RESULTS.totalTrades, c: 'text-foreground' },
                        { l: 'Alpha', v: `+${BACKTEST_RESULTS.alpha}%`, c: 'text-primary' },
                      ].map(m => (
                        <div key={m.l} className="bg-secondary/30 rounded p-1 text-center">
                          <div className="text-[9px] text-muted-foreground">{m.l}</div>
                          <div className={`font-medium ${m.c}`}>{m.v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TerminalPanel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border" />
          <ResizablePanel defaultSize={30} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50}>
                <TerminalPanel title="Monte Carlo Simulation" icon={Zap}>
                  <div className="text-[10px] font-mono p-1.5">
                    <div className="text-[9px] text-muted-foreground uppercase mb-1">10,000 Simulations</div>
                    <table className="w-full terminal-table">
                      <thead>
                        <tr className="text-[9px] text-muted-foreground border-b border-border">
                          <th className="text-left">PCTL</th><th className="text-right">RET%</th><th className="text-right">MAX DD</th>
                        </tr>
                      </thead>
                      <tbody>
                        {MONTE_CARLO.map(m => (
                          <tr key={m.percentile} className="border-b border-border/20">
                            <td className="text-muted-foreground">{m.percentile}</td>
                            <td className={`text-right ${m.return > 0 ? 'text-green-400' : 'text-red-400'}`}>{m.return}%</td>
                            <td className="text-right text-red-400">{m.maxDD}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </TerminalPanel>
              </ResizablePanel>
              <ResizableHandle className="h-px bg-border" />
              <ResizablePanel defaultSize={50}>
                <TerminalPanel title="Portfolio Optimization" icon={Target}>
                  <div className="text-[10px] font-mono p-1.5 space-y-1">
                    <div className="text-[9px] text-muted-foreground uppercase">Efficient Frontier</div>
                    {[
                      { name: 'Min Variance', ret: 8.2, vol: 10.3, sharpe: 0.80 },
                      { name: 'Max Sharpe', ret: 14.5, vol: 15.2, sharpe: 0.95 },
                      { name: 'Risk Parity', ret: 11.3, vol: 12.8, sharpe: 0.88 },
                      { name: 'Current', ret: 18.2, vol: 22.4, sharpe: 0.81 },
                    ].map(p => (
                      <div key={p.name} className="bg-secondary/20 rounded p-1 border border-border/30">
                        <div className="flex justify-between">
                          <span className="text-primary">{p.name}</span>
                          <span className="text-foreground">SR: {p.sharpe}</span>
                        </div>
                        <div className="flex justify-between text-[9px]">
                          <span className="text-green-400">Ret: {p.ret}%</span>
                          <span className="text-red-400">Vol: {p.vol}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TerminalPanel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}