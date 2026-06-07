import React, { useState } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import TerminalPanel from '@/components/terminal/TerminalPanel';
import PerformanceChart from '@/components/dashboard/PerformanceChart';
import OrderBookPanel from '@/components/dashboard/OrderBookPanel';
import { DollarSign, FileText, Activity, ShieldAlert, ListOrdered, Clock } from 'lucide-react';

const POSITIONS = [
  { sym: 'AAPL', side: 'LONG', qty: 150, entry: 230.12, current: 234.56, pnl: 666, pnlPct: 1.93 },
  { sym: 'NVDA', side: 'LONG', qty: 200, entry: 138.45, current: 145.23, pnl: 1356, pnlPct: 4.90 },
  { sym: 'TSLA', side: 'SHORT', qty: 30, entry: 352.34, current: 345.67, pnl: 200, pnlPct: 1.89 },
  { sym: 'BTC', side: 'LONG', qty: 0.5, entry: 101234, current: 104523, pnl: 1645, pnlPct: 3.25 },
];

const OPEN_ORDERS = [
  { id: 'ORD-001', sym: 'AAPL', side: 'BUY', type: 'LIMIT', qty: 50, price: 228.00, status: 'OPEN' },
  { id: 'ORD-002', sym: 'NVDA', side: 'SELL', type: 'STOP', qty: 100, price: 135.00, status: 'OPEN' },
  { id: 'ORD-003', sym: 'ETH', side: 'BUY', type: 'LIMIT', qty: 10, price: 3600.00, status: 'OPEN' },
];

const BLOTTER = [
  { time: '14:23:45', sym: 'NVDA', side: 'BUY', qty: 50, price: 138.45, status: 'FILLED' },
  { time: '13:45:12', sym: 'BTC', side: 'BUY', qty: 0.5, price: 101234, status: 'FILLED' },
  { time: '12:30:00', sym: 'TSLA', side: 'SELL', qty: 30, price: 352.34, status: 'FILLED' },
  { time: '11:15:34', sym: 'AAPL', side: 'BUY', qty: 25, price: 230.12, status: 'FILLED' },
  { time: '10:00:00', sym: 'AMZN', side: 'BUY', qty: 20, price: 220.56, status: 'FILLED' },
];

function OrderEntry() {
  const [side, setSide] = useState('BUY');
  return (
    <div className="text-[10px] font-mono p-1.5 space-y-1.5">
      <div className="flex gap-0.5">
        <button className={`flex-1 py-1 rounded text-[10px] font-medium ${side === 'BUY' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-secondary text-muted-foreground'}`} onClick={() => setSide('BUY')}>BUY</button>
        <button className={`flex-1 py-1 rounded text-[10px] font-medium ${side === 'SELL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-secondary text-muted-foreground'}`} onClick={() => setSide('SELL')}>SELL</button>
      </div>
      <input className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" placeholder="Symbol" />
      <div className="grid grid-cols-2 gap-1">
        <input className="bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" placeholder="Qty" type="number" />
        <select className="bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none">
          <option>MARKET</option><option>LIMIT</option><option>STOP</option><option>STOP LIMIT</option>
        </select>
      </div>
      <input className="w-full bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" placeholder="Price (for limit/stop)" type="number" />
      <div className="grid grid-cols-2 gap-1">
        <input className="bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" placeholder="Stop Loss" type="number" />
        <input className="bg-secondary/50 text-foreground px-2 py-1 rounded text-[10px] outline-none" placeholder="Take Profit" type="number" />
      </div>
      <button className={`w-full py-1.5 rounded font-medium ${side === 'BUY' ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}>
        SUBMIT {side} ORDER
      </button>
    </div>
  );
}

export default function TradingDesk() {
  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={15} minSize={12}>
          <TerminalPanel title="Order Entry" icon={DollarSign}>
            <OrderEntry />
          </TerminalPanel>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={40} minSize={25}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={55}>
              <TerminalPanel title="Chart" icon={Activity}>
                <PerformanceChart symbol="NVDA" />
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={45}>
              <TerminalPanel title="Positions" icon={ListOrdered}>
                <div className="text-[10px] font-mono overflow-auto">
                  <table className="w-full terminal-table">
                    <thead className="sticky top-0 bg-card">
                      <tr className="text-[9px] text-muted-foreground border-b border-border">
                        <th className="text-left">SYM</th><th className="text-center">SIDE</th><th className="text-right">QTY</th>
                        <th className="text-right">ENTRY</th><th className="text-right">LAST</th><th className="text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {POSITIONS.map(p => (
                        <tr key={p.sym} className="hover:bg-secondary/30 border-b border-border/20">
                          <td className="text-primary">{p.sym}</td>
                          <td className={`text-center ${p.side === 'LONG' ? 'text-green-400' : 'text-red-400'}`}>{p.side}</td>
                          <td className="text-right">{p.qty}</td>
                          <td className="text-right text-muted-foreground">${p.entry.toLocaleString()}</td>
                          <td className="text-right">${p.current.toLocaleString()}</td>
                          <td className={`text-right ${p.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>+${p.pnl} ({p.pnlPct}%)</td>
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
        <ResizablePanel defaultSize={20} minSize={15}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Order Book" icon={FileText}>
                <OrderBookPanel symbol="NVDA" />
              </TerminalPanel>
            </ResizablePanel>
            <ResizableHandle className="h-px bg-border" />
            <ResizablePanel defaultSize={50}>
              <TerminalPanel title="Open Orders" icon={Clock}>
                <div className="text-[10px] font-mono p-1 space-y-0.5">
                  {OPEN_ORDERS.map(o => (
                    <div key={o.id} className="flex items-center justify-between py-0.5 border-b border-border/20">
                      <span className="text-muted-foreground text-[9px]">{o.id}</span>
                      <span className="text-primary">{o.sym}</span>
                      <span className={o.side === 'BUY' ? 'text-green-400' : 'text-red-400'}>{o.side}</span>
                      <span className="text-muted-foreground">{o.qty}@{o.price}</span>
                      <span className="text-yellow-400 text-[9px]">{o.status}</span>
                    </div>
                  ))}
                </div>
              </TerminalPanel>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
        <ResizableHandle className="w-px bg-border" />
        <ResizablePanel defaultSize={25} minSize={15}>
          <TerminalPanel title="Trade Blotter" icon={FileText}>
            <div className="text-[10px] font-mono overflow-auto">
              <table className="w-full terminal-table">
                <thead className="sticky top-0 bg-card">
                  <tr className="text-[9px] text-muted-foreground border-b border-border">
                    <th className="text-left">TIME</th><th className="text-left">SYM</th><th className="text-center">SIDE</th>
                    <th className="text-right">QTY</th><th className="text-right">PRICE</th><th className="text-center">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {BLOTTER.map((b, i) => (
                    <tr key={i} className="hover:bg-secondary/30 border-b border-border/20">
                      <td className="text-muted-foreground">{b.time}</td>
                      <td className="text-primary">{b.sym}</td>
                      <td className={`text-center ${b.side === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>{b.side}</td>
                      <td className="text-right">{b.qty}</td>
                      <td className="text-right">${b.price.toLocaleString()}</td>
                      <td className="text-center text-green-400 text-[9px]">{b.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TerminalPanel>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}