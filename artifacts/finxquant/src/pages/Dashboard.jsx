import React from 'react';
import AgentHeader from '@/components/dashboard/AgentHeader';
import PnLBlock from '@/components/dashboard/PnLBlock';
import AgentControlPanel from '@/components/dashboard/AgentControlPanel';
import ExecutionCycle from '@/components/dashboard/ExecutionCycle';
import ForceGraphPanel from '@/components/dashboard/ForceGraphPanel';
import RobustnessMatrix from '@/components/dashboard/RobustnessMatrix';
import MonteCarloPanel from '@/components/dashboard/MonteCarloPanel';

export default function Dashboard() {
  return (
    <div className="h-full w-full flex flex-col bg-[hsl(220,15%,5%)] font-mono overflow-y-auto overflow-x-hidden">
      {/* SECTION 1: Agent Header (identity + rank + live positions) */}
      <AgentHeader />

      {/* SECTION 2: PnL + Biggest Win + BTC Chart + OrderBook */}
      <PnLBlock />

      {/* SECTION 2b: Agent Control Panel */}
      <AgentControlPanel />

      {/* SECTION 3: Execution Cycle */}
      <ExecutionCycle />

      {/* SECTION 4: Force Graph */}
      <div className="shrink-0" style={{ height: 290 }}>
        <ForceGraphPanel />
      </div>

      {/* SECTION 5: Robustness Matrix */}
      <div className="shrink-0 border-t border-border/60" style={{ height: 225 }}>
        <RobustnessMatrix />
      </div>

      {/* SECTION 6: Monte Carlo */}
      <div className="shrink-0 border-t border-border/60" style={{ height: 160 }}>
        <MonteCarloPanel />
      </div>
    </div>
  );
}