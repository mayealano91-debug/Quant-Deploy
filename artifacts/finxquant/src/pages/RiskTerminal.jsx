import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import { STATIC_RISK } from '@/lib/staticMarketData';
import { Shield, AlertTriangle, BarChart3, Activity } from 'lucide-react';

export default function RiskTerminal() {
  const [risk] = useState(STATIC_RISK);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 bg-[hsl(220,15%,6%)] border-b border-border shrink-0">
        <Shield className="w-3 h-3 text-primary" />
        <span className="text-xs font-mono text-muted-foreground">RISK ANALYTICS — Portfolio Risk Dashboard</span>
      </div>
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={20}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel defaultSize={50}>
                <TerminalPanel title="Risk Metrics" icon={Shield}>
                  <div className="text-[10px] font-mono p-1.5 space-y-1">
                    <div className="grid grid-cols-2 gap-1">
                      {[
                        { label: 'VaR (95%)', value: `${risk.var_95}%`, color: 'text-red-400' },
                        { label: 'VaR (99%)', value: `${risk.var_99}%`, color: 'text-red-400' },
                        { label: 'CVaR', value: `${risk.cvar}%`, color: 'text-red-400' },
                        { label: 'Sharpe', value: risk.sharpe_ratio, color: 'text-green-400' },
                        { label: 'Sortino', value: risk.sortino_ratio, color: 'text-green-400' },
                        { label: 'Max DD', value: `${risk.max_drawdown}%`, color: 'text-red-400' },
                        { label: 'Volatility', value: `${risk.volatility}%`, color: 'text-yellow-400' },
                        { label: 'Beta', value: risk.beta, color: 'text-foreground' },
                        { label: 'Alpha', value: `${risk.alpha}%`, color: 'text-green-400' },
                        { label: 'Risk Score', value: `${risk.risk_score}/100`, color: 'text-primary' },
                      ].map(m => (
                        <div key={m.label} className="bg-secondary/30 rounded p-1.5">
                          <div className="text-[9px] text-muted-foreground">{m.label}</div>
                          <div className={`font-medium ${m.color}`}>{m.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TerminalPanel>
              </ResizablePanel>
              <ResizableHandle className="h-px bg-border" />
              <ResizablePanel defaultSize={50}>
                <TerminalPanel title="Sector Exposure" icon={BarChart3}>
                  <div className="text-[10px] font-mono p-1.5 space-y-1">
                    {risk.sector_exposure?.map(s => (
                      <div key={s.sector}>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{s.sector}</span>
                          <span className={s.weight > 30 ? 'text-red-400' : 'text-foreground'}>{s.weight}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-secondary rounded-full">
                          <div className={`h-full rounded-full ${s.weight > 30 ? 'bg-red-500' : s.weight > 15 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${s.weight}%` }} />
                        </div>
                      </div>
                    ))}
                    <div className="mt-1 pt-1 border-t border-border/50">
                      <div className="text-[9px] text-muted-foreground">{risk.risk_assessment}</div>
                    </div>
                  </div>
                </TerminalPanel>
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border" />
          <ResizablePanel defaultSize={35} minSize={25}>
            <TerminalPanel title="Stress Testing" icon={AlertTriangle}>
              <div className="text-[10px] font-mono p-1.5 space-y-1">
                <div className="text-[9px] text-muted-foreground uppercase mb-1">Scenario Analysis</div>
                {risk.stress_tests?.map((st, i) => (
                  <div key={i} className="bg-secondary/20 rounded p-1.5 border border-border/30">
                    <div className="flex items-center justify-between">
                      <span className="text-foreground">{st.scenario}</span>
                      <span className="text-red-400 font-medium">{st.portfolio_impact}%</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <div className="flex-1 h-1.5 bg-secondary rounded-full mr-2">
                        <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.abs(st.portfolio_impact)}%` }} />
                      </div>
                      <span className="text-red-400 text-[9px]">${Math.abs(st.dollar_loss).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </TerminalPanel>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border" />
          <ResizablePanel defaultSize={35} minSize={20}>
            <TerminalPanel title="Correlation Matrix" icon={Activity}>
              <div className="text-[10px] font-mono p-1.5">
                <div className="text-[9px] text-muted-foreground uppercase mb-1">Pairwise Correlations</div>
                <div className="space-y-0.5">
                  {risk.correlation_matrix?.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-0.5 border-b border-border/20">
                      <span className="text-muted-foreground">{c.pair}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-secondary rounded-full">
                          <div
                            className={`h-full rounded-full ${c.correlation > 0.6 ? 'bg-red-500' : c.correlation > 0.3 ? 'bg-yellow-500' : c.correlation > 0 ? 'bg-green-500' : 'bg-blue-500'}`}
                            style={{ width: `${Math.abs(c.correlation) * 100}%` }}
                          />
                        </div>
                        <span className={c.correlation > 0.6 ? 'text-red-400' : 'text-foreground'}>{c.correlation.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TerminalPanel>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
