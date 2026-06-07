import React, { useState, useEffect } from 'react';

const STEPS = ['Scan', 'Detect', 'Validate', 'Size', 'Fill', 'Settle'];

export default function ExecutionCycle() {
  const [activeStep, setActiveStep] = useState(4);
  const [cycle, setCycle] = useState(495);
  const [fill, setFill] = useState(0.94);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveStep(s => (s + 1) % STEPS.length);
      setCycle(c => c + 1);
      setFill(f => +Math.min(0.99, Math.max(0.80, f + (Math.random() * 0.02 - 0.01))).toFixed(2));
    }, 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="shrink-0 border-b border-border/60 bg-[hsl(220,15%,5%)] font-mono">
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-0.5 bg-[hsl(220,15%,7%)] border-b border-border/40">
        <span className="text-[8px] text-muted-foreground tracking-widest uppercase">◉ EXECUTION CYCLE · <span className="text-foreground font-bold">#{cycle}</span></span>
        <span className="text-[8px] text-muted-foreground">FILL <span className="text-green-400 font-bold">{fill.toFixed(2)}S</span></span>
      </div>
      {/* Steps */}
      <div className="flex">
        {STEPS.map((step, i) => (
          <div key={step} className={`flex-1 flex flex-col items-center py-1.5 border-r border-border/30 last:border-r-0 transition-all ${
            i === activeStep
              ? 'bg-primary text-black'
              : i < activeStep
              ? 'bg-green-500/15 text-green-400'
              : 'bg-transparent text-muted-foreground'
          }`}>
            <div className={`text-[7px] font-mono mb-0.5 ${i === activeStep ? 'text-black/60' : 'text-muted-foreground/60'}`}>0{i + 1}</div>
            <div className={`text-[10px] font-bold ${i === activeStep ? 'text-black' : ''}`}>{step}</div>
          </div>
        ))}
      </div>
    </div>
  );
}