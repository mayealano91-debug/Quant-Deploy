import React, { createContext, useContext, useState, useCallback } from 'react';

export const PHASES = ['Scan', 'Detect', 'Validate', 'Size', 'Fill', 'Settle'];

const AgentContext = createContext(null);

export function AgentProvider({ children }) {
  const [phase,        setPhase]        = useState(-1);   // -1 = idle
  const [isRunning,    setIsRunning]    = useState(false);
  const [cycleCount,   setCycleCount]   = useState(495);
  const [fillLatency,  setFillLatency]  = useState(0.94);
  const [tradeCount,   setTradeCount]   = useState(0);
  const [sessionPnl,   setSessionPnl]   = useState(0);
  const [streak,       setStreak]       = useState(0);
  const [signals,      setSignals]      = useState([]);   // live signal nodes for force graph
  const [agentStats,   setAgentStats]   = useState({
    conv: 98.1, bear: 0, bull: 0, hub: 0, sig: 0,
  });
  const [account,      setAccount]      = useState(null);
  const [positions,    setPositions]    = useState([]);

  const pushSignal = useCallback((sig) => {
    setSignals(prev => [...prev.slice(-20), sig]);
    setAgentStats(prev => ({
      ...prev,
      bull: sig.side === 'buy'  ? prev.bull + 1 : prev.bull,
      bear: sig.side === 'sell' ? prev.bear + 1 : prev.bear,
      sig:  prev.sig + 1,
      conv: Math.min(100, prev.conv + 0.1),
    }));
  }, []);

  return (
    <AgentContext.Provider value={{
      phase, setPhase,
      isRunning, setIsRunning,
      cycleCount, setCycleCount,
      fillLatency, setFillLatency,
      tradeCount, setTradeCount,
      sessionPnl, setSessionPnl,
      streak, setStreak,
      signals, pushSignal,
      agentStats,
      account, setAccount,
      positions, setPositions,
    }}>
      {children}
    </AgentContext.Provider>
  );
}

export const useAgent = () => {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error('useAgent must be used inside <AgentProvider>');
  return ctx;
};
