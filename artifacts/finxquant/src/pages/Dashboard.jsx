import React from 'react';
import { AgentProvider } from '@/lib/AgentContext';
import AgentHeader from '@/components/dashboard/AgentHeader';
import PnLBlock from '@/components/dashboard/PnLBlock';
import AgentControlPanel from '@/components/dashboard/AgentControlPanel';
import ExecutionCycle from '@/components/dashboard/ExecutionCycle';
import ForceGraphPanel from '@/components/dashboard/ForceGraphPanel';
import RobustnessMatrix from '@/components/dashboard/RobustnessMatrix';
import MonteCarloPanel from '@/components/dashboard/MonteCarloPanel';

export default function Dashboard() {
  return (
    <AgentProvider>
      <div className="h-full w-full flex flex-col bg-[hsl(220,15%,5%)] font-mono overflow-y-auto overflow-x-hidden">
        {/* SECTION 1: Agent identity + clock + live positions */}
        <AgentHeader />

        {/* SECTION 2: Portfolio equity + BTC chart + order book */}
        <PnLBlock />

        {/* SECTION 2b: Agent control panel — START/STOP + real trading loop */}
        <AgentControlPanel />

        {/* SECTION 3: Execution cycle — synced to agent phase */}
        <ExecutionCycle />

        {/* SECTION 4: MIROFISH force graph — live signal nodes */}
        <div className="shrink-0" style={{ height: 290 }}>
          <ForceGraphPanel />
        </div>

        {/* SECTION 5: Robustness matrix */}
        <div className="shrink-0 border-t border-border/60" style={{ height: 225 }}>
          <RobustnessMatrix />
        </div>

        {/* SECTION 6: Monte Carlo histogram */}
        <div className="shrink-0 border-t border-border/60" style={{ height: 160 }}>
          <MonteCarloPanel />
        </div>
      </div>
    </AgentProvider>
  );
}
