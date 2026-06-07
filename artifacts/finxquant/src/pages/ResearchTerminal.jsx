import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import { getResearchData, generatePrediction } from '@/lib/localMarketData';
import { Search, Building2, BarChart3, Target, TrendingUp, Users, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

export default function ResearchTerminal() {
  const [symbol, setSymbol] = useState('');
  const [input, setInput] = useState('AAPL');
  const [data, setData] = useState(null);
  const [prediction, setPrediction] = useState(null);

  const loadResearch = (sym) => {
    const s = (sym || input).toUpperCase();
    setSymbol(s);
    const d = getResearchData(s);
    setData(d);
    setPrediction(generatePrediction(s));
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sym = params.get('symbol');
    if (sym) { setInput(sym); loadResearch(sym); }
    else { loadResearch('AAPL'); }
  }, []);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Search bar */}
      <div className="flex items-center gap-2 px-2 py-1 bg-[hsl(220,15%,6%)] border-b border-border shrink-0">
        <Search className="w-3 h-3 text-primary" />
        <input
          className="bg-transparent text-xs font-mono text-foreground placeholder-muted-foreground flex-1 outline-none"
          placeholder="Enter symbol (AAPL, MSFT, NVDA, TSLA, BTC)..."
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === 'Enter' && loadResearch()}
        />
        <button
          className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-mono rounded hover:bg-primary/80"
          onClick={() => loadResearch()}
        >
          ANALYZE
        </button>
      </div>

      <div className="flex-1 min-h-0">
        {!data ? (
          <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm flex-col gap-2">
            <span>Enter a symbol and press ANALYZE</span>
            <div className="flex gap-2">
              {['AAPL','MSFT','NVDA','TSLA','BTC'].map(s => (
                <button key={s} onClick={() => { setInput(s); loadResearch(s); }} className="px-2 py-1 bg-secondary/50 text-primary text-xs rounded hover:bg-secondary">{s}</button>
              ))}
            </div>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal">
            {/* Left column */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={40}>
                  <TerminalPanel title={`${symbol} — Overview`} icon={Building2}>
                    <div className="text-[10px] font-mono p-1.5 space-y-1">
                      <div className="text-foreground text-xs font-medium">{data.name}</div>
                      <div className="text-muted-foreground">{data.sector} • {data.industry}</div>
                      <div className="text-[9px] text-muted-foreground leading-relaxed mt-1">{data.description?.substring(0, 220)}...</div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 mt-2">
                        <div className="flex justify-between"><span className="text-muted-foreground">CEO</span><span className="text-foreground truncate">{data.ceo}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Employees</span><span className="text-foreground">{data.employees?.toLocaleString()}</span></div>
                      </div>
                    </div>
                  </TerminalPanel>
                </ResizablePanel>
                <ResizableHandle className="h-px bg-border" />
                <ResizablePanel defaultSize={60}>
                  <TerminalPanel title="Financials" icon={BarChart3}>
                    <div className="text-[10px] font-mono p-1.5">
                      <div className="space-y-0.5">
                        {data.financials && Object.entries(data.financials).map(([key, val]) => (
                          <div key={key} className="flex justify-between py-0.5 border-b border-border/20">
                            <span className="text-muted-foreground">{key.replace(/_/g, ' ').toUpperCase()}</span>
                            <span className="text-foreground">{typeof val === 'number' ? (val > 1 ? val.toFixed(2) : (val * 100).toFixed(1) + '%') : val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TerminalPanel>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle className="w-px bg-border" />

            {/* Center column */}
            <ResizablePanel defaultSize={40} minSize={25}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={50}>
                  <TerminalPanel title={`${symbol} — Chart`} icon={TrendingUp}>
                    <PerformanceChart symbol={symbol} />
                  </TerminalPanel>
                </ResizablePanel>
                <ResizableHandle className="h-px bg-border" />
                <ResizablePanel defaultSize={50}>
                  <TerminalPanel title="Valuation + Quote" icon={Target}>
                    <div className="text-[10px] font-mono p-1.5">
                      {data.valuation && (
                        <div className="grid grid-cols-3 gap-1 mb-2">
                          {Object.entries(data.valuation).filter(([,v]) => v > 0).map(([key, val]) => (
                            <div key={key} className="bg-secondary/30 rounded p-1 text-center">
                              <div className="text-[9px] text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</div>
                              <div className="text-primary font-medium">{val.toFixed(1)}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      {data.quote && (
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 border-t border-border/50 pt-1">
                          <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="text-foreground">${data.quote.price.toLocaleString()}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Mkt Cap</span><span className="text-foreground">{data.quote.market_cap}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">52W High</span><span className="text-foreground">${data.quote.high_52w}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">52W Low</span><span className="text-foreground">${data.quote.low_52w}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Beta</span><span className="text-foreground">{data.quote.beta}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Div Yield</span><span className="text-foreground">{data.quote.dividend_yield}%</span></div>
                        </div>
                      )}
                    </div>
                  </TerminalPanel>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
            <ResizableHandle className="w-px bg-border" />

            {/* Right column */}
            <ResizablePanel defaultSize={30} minSize={20}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={25}>
                  <TerminalPanel title="Signal Prediction" icon={prediction?.timeLabel.direction === 'UP' ? ArrowUp : ArrowDown}>
                    <div className="text-[10px] font-mono p-1.5">
                      {prediction && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className={`text-sm font-bold ${prediction.timeLabel.direction === 'UP' ? 'text-green-400' : prediction.timeLabel.direction === 'DOWN' ? 'text-red-400' : 'text-yellow-400'}`}>
                              {prediction.timeLabel.direction === 'UP' ? '▲ BULLISH' : prediction.timeLabel.direction === 'DOWN' ? '▼ BEARISH' : '◆ NEUTRAL'}
                            </span>
                            <span className="text-primary">{prediction.confidence}% conf</span>
                          </div>
                          <div className="text-muted-foreground">Expected move {prediction.timeLabel.label}</div>
                          <div className="grid grid-cols-2 gap-1 text-[9px]">
                            <div className="bg-secondary/30 rounded p-1"><div className="text-muted-foreground">1H</div><div className={prediction.timeLabel.direction === 'UP' ? 'text-green-400' : 'text-red-400'}>{prediction.move1h}</div></div>
                            <div className="bg-secondary/30 rounded p-1"><div className="text-muted-foreground">4H</div><div className={prediction.timeLabel.direction === 'UP' ? 'text-green-400' : 'text-red-400'}>{prediction.move4h}</div></div>
                            <div className="bg-secondary/30 rounded p-1"><div className="text-muted-foreground">1D</div><div className={prediction.timeLabel.direction === 'UP' ? 'text-green-400' : 'text-red-400'}>{prediction.move1d}</div></div>
                            <div className="bg-secondary/30 rounded p-1"><div className="text-muted-foreground">3D</div><div className={prediction.timeLabel.direction === 'UP' ? 'text-green-400' : 'text-red-400'}>{prediction.move3d}</div></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TerminalPanel>
                </ResizablePanel>
                <ResizableHandle className="h-px bg-border" />
                <ResizablePanel defaultSize={30}>
                  <TerminalPanel title="Analyst Targets" icon={Target}>
                    <div className="text-[10px] font-mono p-1.5">
                      {data.analyst_targets && (
                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-green-400">BUY: {data.analyst_targets.buy}</span>
                            <span className="text-yellow-400">HOLD: {data.analyst_targets.hold}</span>
                            <span className="text-red-400">SELL: {data.analyst_targets.sell}</span>
                          </div>
                          <div className="space-y-0.5 border-t border-border/50 pt-1">
                            <div className="flex justify-between"><span className="text-muted-foreground">Avg Target</span><span className="text-primary">${data.analyst_targets.avg_target?.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">High</span><span className="text-foreground">${data.analyst_targets.high_target?.toLocaleString()}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Low</span><span className="text-foreground">${data.analyst_targets.low_target?.toLocaleString()}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TerminalPanel>
                </ResizablePanel>
                <ResizableHandle className="h-px bg-border" />
                <ResizablePanel defaultSize={20}>
                  <TerminalPanel title="Insider Activity" icon={Users}>
                    <div className="text-[10px] font-mono p-1.5 space-y-0.5">
                      {data.insider_activity?.length > 0 ? data.insider_activity.map((ia, i) => (
                        <div key={i} className="py-0.5 border-b border-border/20">
                          <div className="flex justify-between">
                            <span className="text-foreground">{ia.name}</span>
                            <span className={ia.action?.includes('Buy') ? 'text-green-400' : 'text-red-400'}>{ia.action}</span>
                          </div>
                          <div className="flex justify-between text-[9px]">
                            <span className="text-muted-foreground">{ia.title}</span>
                            <span className="text-muted-foreground">{ia.shares?.toLocaleString()} shs</span>
                          </div>
                        </div>
                      )) : <span className="text-muted-foreground">No recent activity</span>}
                    </div>
                  </TerminalPanel>
                </ResizablePanel>
                <ResizableHandle className="h-px bg-border" />
                <ResizablePanel defaultSize={25}>
                  <TerminalPanel title="Key Risks" icon={AlertTriangle}>
                    <div className="text-[10px] font-mono p-1.5 space-y-0.5">
                      {data.risks?.map((r, i) => (
                        <div key={i} className="flex items-start gap-1 py-0.5">
                          <span className="text-destructive shrink-0">▸</span>
                          <span className="text-muted-foreground">{r}</span>
                        </div>
                      ))}
                    </div>
                  </TerminalPanel>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}