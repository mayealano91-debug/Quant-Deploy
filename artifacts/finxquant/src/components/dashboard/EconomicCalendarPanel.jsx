import React from 'react';
import { CalendarDays } from 'lucide-react';

const EVENTS = [
  { time: '08:30', event: 'Non-Farm Payrolls', country: 'US', impact: 'high', actual: '272K', forecast: '185K', previous: '165K' },
  { time: '10:00', event: 'ISM Services PMI', country: 'US', impact: 'high', actual: '53.8', forecast: '51.0', previous: '49.4' },
  { time: '10:00', event: 'Consumer Sentiment', country: 'US', impact: 'medium', actual: '-', forecast: '72.1', previous: '69.1' },
  { time: '14:00', event: 'FOMC Minutes', country: 'US', impact: 'high', actual: '-', forecast: '-', previous: '-' },
  { time: '02:00', event: 'GDP (QoQ)', country: 'EU', impact: 'medium', actual: '0.3%', forecast: '0.2%', previous: '0.1%' },
  { time: '04:30', event: 'CPI (YoY)', country: 'UK', impact: 'high', actual: '2.3%', forecast: '2.1%', previous: '2.3%' },
  { time: '19:30', event: 'Trade Balance', country: 'JP', impact: 'low', actual: '-', forecast: '-¥462B', previous: '-¥474B' },
];

const impactColor = { high: 'bg-red-500', medium: 'bg-yellow-500', low: 'bg-green-500' };

export default function EconomicCalendarPanel() {
  return (
    <div className="text-[10px] font-mono">
      <table className="w-full terminal-table">
        <thead>
          <tr className="text-[9px] text-muted-foreground border-b border-border/50">
            <th className="text-left">TIME</th>
            <th className="text-left">EVENT</th>
            <th className="text-center">CC</th>
            <th className="text-center">!</th>
            <th className="text-right">ACT</th>
            <th className="text-right">FCST</th>
            <th className="text-right">PREV</th>
          </tr>
        </thead>
        <tbody>
          {EVENTS.map((e, i) => (
            <tr key={i} className="hover:bg-secondary/30 cursor-pointer border-b border-border/20">
              <td className="text-muted-foreground">{e.time}</td>
              <td className="text-foreground truncate max-w-[120px]">{e.event}</td>
              <td className="text-center text-muted-foreground">{e.country}</td>
              <td className="text-center"><div className={`w-1.5 h-1.5 rounded-full ${impactColor[e.impact]} mx-auto`} /></td>
              <td className="text-right text-primary">{e.actual}</td>
              <td className="text-right text-muted-foreground">{e.forecast}</td>
              <td className="text-right text-muted-foreground">{e.previous}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}