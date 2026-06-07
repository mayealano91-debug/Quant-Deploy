import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import { generatePrediction, getResearchData } from '@/lib/localMarketData';
import { Brain, User, Target, AlertTriangle, Zap, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

const AGENTS = [
  { id: 'buffett',       name: 'Buffett',        style: 'Value Investing',    color: 'text-green-400',  bias: 0.8  },
  { id: 'graham',        name: 'Graham',          style: 'Deep Value',         color: 'text-blue-400',   bias: 0.9  },
  { id: 'lynch',         name: 'Lynch',           style: 'Growth at Value',    color: 'text-purple-400', bias: 0.7  },
  { id: 'munger',        name: 'Munger',          style: 'Quality + Moat',     color: 'text-yellow-400', bias: 0.85 },
  { id: 'dalio',         name: 'Dalio',           style: 'Macro / All Weather',color: 'text-cyan-400',   bias: 0.5  },
  { id: 'marks',         name: 'Marks',           style: 'Risk / Cycles',      color: 'text-orange-400', bias: 0.6  },
  { id: 'klarman',       name: 'Klarman',         style: 'Margin of Safety',   color: 'text-red-400',    bias: 0.95 },
  { id: 'druckenmiller', name: 'Druckenmiller',   style: 'Macro Momentum',     color: 'text-emerald-400',bias: 0.4  },
  { id: 'simons',        name: 'Simons',          style: 'Quantitative',       color: 'text-indigo-400', bias: 0.3  },
];

function buildAgentAnalysis(agentId, sym, bias) {
  const pred = generatePrediction(sym);
  const research = getResearchData(sym);
  const agentScore = pred.score * bias;
  const isUp = agentScore >= 0;

  const ratingMap = [
    { min: 4,  label: 'Strong Buy' },
    { min: 2,  label: 'Buy' },
    { min: 0,  label: 'Hold' },
    { min: -2, label: 'Underperform' },
    { min: -99,label: 'Sell' },
  ];
  const rating = ratingMap.find(r => agentScore >= r.min)?.label || 'Hold';

  const basePrice = research?.quote?.price || 100;
  const uplift = isUp ? 1 + (Math.abs(agentScore) * 0.04) : 1 - (Math.abs(agentScore) * 0.03);
  const target = Math.round(basePrice * uplift);
  const upside = Math.round((target / basePrice - 1) * 100);

  const theses = {
    buffett: isUp ? `${sym} demonstrates durable competitive advantages with strong free cash flow generation. Management allocates capital effectively and returns value to shareholders. Current valuation offers a reasonable margin of safety for a long-term holding.` :
      `${sym} faces challenges to its economic moat. Current valuation does not provide adequate margin of safety given the uncertainty in future cash flows. Would consider buying at a 30-40% discount.`,
    graham: isUp ? `${sym} passes the majority of Benjamin Graham's defensive investor criteria. The balance sheet shows adequate financial strength and the earnings record demonstrates stability over the past decade.` :
      `${sym} fails several Graham criteria — P/E exceeds 15x, P/B exceeds 1.5x, or earnings stability is lacking. A net-net analysis reveals limited downside protection at current prices.`,
    lynch: isUp ? `${sym} is a classic ${research?.sector === 'Technology' ? 'fast grower' : 'stalwart'} — the kind of company you can find by observing everyday trends. Growth is sustainable with strong unit economics.` :
      `The PEG ratio has expanded beyond reasonable levels. ${sym} has grown faster than its fundamentals can support. Looking for a better entry point.`,
    munger: isUp ? `${sym} possesses genuine competitive advantages that compound over time. The business model is simple to understand, highly predictable, and run by rational management. This is the kind of quality business Charlie would hold forever.` :
      `The capital allocation is concerning. ${sym} appears to be competing in a commoditizing industry without durable pricing power. Avoiding.`,
    dalio: isUp ? `${sym} aligns with current macro environment — rising productivity, accommodative monetary policy, and healthy credit cycle support risk assets. Fits the growth sleeve of an All Weather allocation.` :
      `Macro headwinds including tightening credit and slowing global growth create an unfavorable backdrop for ${sym}. De-risking exposure and increasing hedge positions.`,
    marks: isUp ? `We are not at a market top. ${sym} is attractively priced given the risk-reward skew. Second-level thinking here: most investors are avoiding this because of obvious risks, which is exactly why the opportunity exists.` :
      `The market is pricing in too much optimism for ${sym}. Risk is underpriced. In a down cycle, there is significant downside not reflected in current consensus targets.`,
    klarman: isUp ? `${sym} offers a compelling margin of safety when accounting for tangible book value and normalized earnings. The catalyst is clear and the downside scenario is well-protected by asset values.` :
      `At current prices, ${sym} offers insufficient margin of safety. The intrinsic value range is $${Math.round(basePrice * 0.65)}–$${Math.round(basePrice * 0.85)} based on conservative DCF assumptions.`,
    druckenmiller: isUp ? `Macro flows are moving in ${sym}'s favor. Capital is rotating into this asset class and momentum is building. This is an asymmetric bet: the trend is your friend and I'm positioned large.` :
      `Capital flows are rotating out of ${sym}. The macro trend has turned. I cut positions quickly when wrong — this is a situation to be out of, not average down.`,
    simons: isUp ? `Quantitative signals are strongly positive: momentum factor +${(Math.abs(agentScore) * 12).toFixed(0)}bp, mean-reversion signal favorable, options flow showing institutional accumulation. Statistical edge confirmed.` :
      `Quantitative signals are negative: mean-reversion signal bearish, momentum deteriorating. Statistical models show elevated probability of continued underperformance over the next 3-5 days.`,
  };

  return {
    agent: agentId, symbol: sym, rating,
    conviction: Math.min(90, 40 + Math.abs(agentScore) * 12),
    price_target: target,
    upside,
    thesis: theses[agentId] || 'Analysis complete.',
    key_metrics: [
      { metric: 'Signal Score', value: agentScore.toFixed(1), assessment: agentScore > 2 ? 'Strong' : agentScore > 0 ? 'Moderate' : 'Weak' },
      { metric: 'RSI', value: pred.rsi, assessment: pred.rsi > 70 ? 'Overbought' : pred.rsi < 30 ? 'Oversold' : 'Neutral' },
      { metric: 'MACD', value: pred.macd.toFixed(2), assessment: pred.macd > 0 ? 'Bullish' : 'Bearish' },
      { metric: 'Rel Volume', value: `${pred.relVol}x`, assessment: pred.relVol > 1.5 ? 'High' : 'Normal' },
    ],
    risks: research?.risks?.slice(0, 3) || ['Market volatility', 'Macro uncertainty', 'Execution risk'],
    catalysts: isUp
      ? ['Earnings beat potential', 'Sector rotation inflows', 'Technical breakout above resistance']
      : ['Margin compression risk', 'Valuation multiple contraction', 'Macro headwinds'],
    recommendation: isUp
      ? `${rating} with price target $${target} (${upside}% upside). Initiate/add position on pullbacks toward $${Math.round(basePrice * 0.95)}.`
      : `${rating}. Reduce exposure. Consider re-entry at $${Math.round(basePrice * 0.80)}.`,
    time_horizon: bias > 0.7 ? '12–24 months' : '3–6 months',
    prediction: pred,
  };
}

function AgentResult({ result }) {
  if (!result) return null;
  const isUp = result.upside >= 0;
  return (
    <div className="text-[10px] font-mono p-1.5 space-y-2 overflow-auto h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-primary font-medium">{result.symbol}</span>
          <span className={`px-1 rounded text-[9px] ${result.rating.includes('Buy') ? 'bg-green-500/20 text-green-400' : result.rating.includes('Sell') ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
            {result.rating}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">Conviction:</span>
          <div className="w-12 h-1.5 bg-secondary rounded-full">
            <div className="h-full bg-primary rounded-full" style={{ width: `${result.conviction}%` }} />
          </div>
          <span className="text-primary">{result.conviction}%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <div className="bg-secondary/30 rounded p-1 text-center">
          <div className="text-[9px] text-muted-foreground">TARGET</div>
          <div className="text-primary">${result.price_target?.toLocaleString()}</div>
        </div>
        <div className="bg-secondary/30 rounded p-1 text-center">
          <div className="text-[9px] text-muted-foreground">UPSIDE</div>
          <div className={result.upside >= 0 ? 'text-green-400' : 'text-red-400'}>{result.upside}%</div>
        </div>
        <div className="bg-secondary/30 rounded p-1 text-center">
          <div className="text-[9px] text-muted-foreground">HORIZON</div>
          <div className="text-foreground">{result.time_horizon}</div>
        </div>
      </div>

      {/* Time prediction */}
      {result.prediction && (
        <div className="bg-primary/10 border border-primary/20 rounded p-1.5">
          <div className="text-[9px] text-muted-foreground uppercase mb-1">Signal Timing</div>
          <div className="flex items-center justify-between">
            <span className={`font-bold ${result.prediction.timeLabel.direction === 'UP' ? 'text-green-400' : result.prediction.timeLabel.direction === 'DOWN' ? 'text-red-400' : 'text-yellow-400'}`}>
              {result.prediction.timeLabel.direction === 'UP' ? '▲' : result.prediction.timeLabel.direction === 'DOWN' ? '▼' : '◆'} {result.prediction.timeLabel.direction} {result.prediction.timeLabel.label}
            </span>
            <div className="flex gap-2 text-[9px]">
              <span className="text-muted-foreground">1H: <span className={isUp ? 'text-green-400' : 'text-red-400'}>{result.prediction.move1h}</span></span>
              <span className="text-muted-foreground">1D: <span className={isUp ? 'text-green-400' : 'text-red-400'}>{result.prediction.move1d}</span></span>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="text-[9px] text-muted-foreground uppercase mb-0.5">Thesis</div>
        <p className="text-foreground leading-relaxed">{result.thesis}</p>
      </div>

      {result.key_metrics?.length > 0 && (
        <div>
          <div className="text-[9px] text-muted-foreground uppercase mb-0.5">Key Metrics</div>
          <div className="space-y-0.5">
            {result.key_metrics.map((m, i) => (
              <div key={i} className="flex items-center justify-between py-0.5 border-b border-border/20">
                <span className="text-muted-foreground">{m.metric}</span>
                <span className="text-foreground">{m.value}</span>
                <span className={m.assessment === 'Strong' || m.assessment === 'Bullish' || m.assessment === 'Oversold' ? 'text-green-400' : m.assessment === 'Weak' || m.assessment === 'Bearish' || m.assessment === 'Overbought' ? 'text-red-400' : 'text-yellow-400'}>{m.assessment}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-[9px] text-muted-foreground uppercase mb-0.5 flex items-center gap-1"><Zap className="w-2.5 h-2.5" /> Catalysts</div>
          {result.catalysts?.map((c, i) => (
            <div key={i} className="flex items-start gap-1 py-0.5">
              <span className="text-green-400 shrink-0">▸</span>
              <span className="text-foreground">{c}</span>
            </div>
          ))}
        </div>
        <div>
          <div className="text-[9px] text-muted-foreground uppercase mb-0.5 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" /> Risks</div>
          {result.risks?.map((r, i) => (
            <div key={i} className="flex items-start gap-1 py-0.5">
              <span className="text-red-400 shrink-0">▸</span>
              <span className="text-muted-foreground">{r}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded p-1.5">
        <div className="text-[9px] text-muted-foreground uppercase">Recommendation</div>
        <div className="text-foreground mt-0.5">{result.recommendation}</div>
      </div>
    </div>
  );
}

export default function AIResearchTerminal() {
  const [selectedAgent, setSelectedAgent] = useState('buffett');
  const [symbol, setSymbol] = useState('NVDA');
  const [results, setResults] = useState({});

  const runAgent = (agentId) => {
    const agent = AGENTS.find(a => a.id === agentId);
    const result = buildAgentAnalysis(agentId, symbol, agent.bias);
    setResults(prev => ({ ...prev, [agentId]: result }));
    setSelectedAgent(agentId);
  };

  const runAllAgents = () => {
    const newResults = {};
    AGENTS.forEach(agent => {
      newResults[agent.id] = buildAgentAnalysis(agent.id, symbol, agent.bias);
    });
    setResults(newResults);
  };

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex items-center gap-2 px-2 py-1 bg-[hsl(220,15%,6%)] border-b border-border shrink-0">
        <Brain className="w-3 h-3 text-primary" />
        <input
          className="bg-secondary/50 text-xs font-mono text-foreground px-2 py-0.5 rounded w-20 outline-none"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <button className="px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-mono rounded hover:bg-primary/80" onClick={() => runAgent(selectedAgent)}>
          RUN AGENT
        </button>
        <button className="px-2 py-0.5 bg-secondary text-foreground text-[10px] font-mono rounded hover:bg-secondary/80" onClick={runAllAgents}>
          RUN ALL 9 AGENTS
        </button>
        <span className="text-[9px] text-muted-foreground ml-auto">Local analysis engine — no API required</span>
      </div>

      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={15} minSize={12}>
            <TerminalPanel title="AI Agents" icon={User}>
              <div className="p-1 space-y-0.5">
                {AGENTS.map(agent => (
                  <button
                    key={agent.id}
                    className={`w-full text-left px-1.5 py-1 rounded text-[10px] font-mono transition-colors ${selectedAgent === agent.id ? 'bg-primary/20 border border-primary/30' : 'hover:bg-secondary/30'}`}
                    onClick={() => runAgent(agent.id)}
                  >
                    <div className={`font-medium ${agent.color}`}>{agent.name}</div>
                    <div className="text-[9px] text-muted-foreground">{agent.style}</div>
                    {results[agent.id] && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={`text-[9px] ${results[agent.id]?.rating?.includes('Buy') ? 'text-green-400' : results[agent.id]?.rating?.includes('Sell') ? 'text-red-400' : 'text-yellow-400'}`}>
                          {results[agent.id]?.rating}
                        </span>
                        <span className="text-[9px] text-primary">{results[agent.id]?.conviction}%</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </TerminalPanel>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border" />
          <ResizablePanel defaultSize={55} minSize={30}>
            <TerminalPanel title={`${AGENTS.find(a => a.id === selectedAgent)?.name} — ${symbol} Analysis`} icon={Brain}>
              {results[selectedAgent] ? (
                <AgentResult result={results[selectedAgent]} />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground font-mono text-sm flex-col gap-2">
                  <span>Click an agent or press RUN AGENT</span>
                  <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs rounded hover:bg-primary/80" onClick={() => runAgent(selectedAgent)}>
                    RUN {AGENTS.find(a => a.id === selectedAgent)?.name} NOW
                  </button>
                </div>
              )}
            </TerminalPanel>
          </ResizablePanel>
          <ResizableHandle className="w-px bg-border" />
          <ResizablePanel defaultSize={30} minSize={20}>
            <TerminalPanel title="Multi-Agent Consensus" icon={Target}>
              <div className="text-[10px] font-mono p-1.5">
                {Object.keys(results).length > 0 ? (
                  <div className="space-y-1">
                    <div className="text-[9px] text-muted-foreground uppercase">Agent Ratings for {symbol}</div>
                    {AGENTS.filter(a => results[a.id]).map(agent => (
                      <div key={agent.id} className="flex items-center justify-between py-0.5 border-b border-border/20">
                        <span className={`w-20 ${agent.color}`}>{agent.name}</span>
                        <span className={results[agent.id]?.rating?.includes('Buy') ? 'text-green-400' : results[agent.id]?.rating?.includes('Sell') ? 'text-red-400' : 'text-yellow-400'}>
                          {results[agent.id]?.rating}
                        </span>
                        <span className="text-primary">${results[agent.id]?.price_target?.toLocaleString()}</span>
                        <span className="text-muted-foreground">{results[agent.id]?.conviction}%</span>
                      </div>
                    ))}
                    {Object.keys(results).length >= 2 && (
                      <div className="mt-2 bg-primary/10 border border-primary/20 rounded p-1.5">
                        <div className="text-[9px] text-muted-foreground uppercase">Consensus</div>
                        <div className="flex justify-between mt-1">
                          <span className="text-muted-foreground">Avg Target</span>
                          <span className="text-primary font-medium">
                            ${Math.round(Object.values(results).reduce((s, r) => s + (r?.price_target || 0), 0) / Object.keys(results).length).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Conviction</span>
                          <span className="text-primary">
                            {Math.round(Object.values(results).reduce((s, r) => s + (r?.conviction || 0), 0) / Object.keys(results).length)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Bullish Agents</span>
                          <span className="text-green-400">
                            {Object.values(results).filter(r => r?.rating?.includes('Buy')).length}/{Object.keys(results).length}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-4">Run agents to see consensus</div>
                )}
              </div>
            </TerminalPanel>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}