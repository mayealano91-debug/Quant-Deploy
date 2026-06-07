import React from 'react';
import { useAgent, PHASES } from '@/lib/AgentContext';

export default function ExecutionCycle() {
  const { phase, cycleCount, fillLatency, isRunning } = useAgent();

  // phase = -1 means idle/not running
  const activeStep = phase;

  return (
    <div className="shrink-0 border-b border-border/60 bg-[hsl(220,15%,5%)] font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-[hsl(220,15%,7%)] border-b border-border/40">
        <span className="text-[8px] text-muted-foreground tracking-widest uppercase">
          ◉ EXECUTION CYCLE ·{' '}
          <span className="text-foreground font-bold">#{cycleCount}</span>
        </span>
        <span className="text-[8px] text-muted-foreground">
          {isRunning
            ? <>FILL <span className="text-green-400 font-bold">{fillLatency}S</span></>
            : <span className="text-muted-foreground/50">IDLE</span>
          }
        </span>
      </div>

      {/* Steps */}
      <div className="flex">
        {PHASES.map((step, i) => {
          const isActive = i === activeStep;
          const isDone   = activeStep >= 0 && i < activeStep;
          const isIdle   = activeStep < 0;

          return (
            <div
              key={step}
              className={`flex-1 flex flex-col items-center py-1.5 border-r border-border/30 last:border-r-0 transition-all duration-300 ${
                isActive
                  ? 'bg-primary text-black'
                  : isDone
                  ? 'bg-green-500/15 text-green-400'
                  : isIdle
                  ? 'bg-transparent text-muted-foreground/30'
                  : 'bg-transparent text-muted-foreground'
              }`}
            >
              <div className={`text-[7px] font-mono mb-0.5 ${isActive ? 'text-black/60' : 'text-muted-foreground/60'}`}>
                0{i + 1}
              </div>
              <div className={`text-[10px] font-bold ${isActive ? 'text-black' : ''}`}>
                {step}
              </div>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-black/60 mt-0.5 animate-ping" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
