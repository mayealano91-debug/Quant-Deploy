import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import TerminalBar from './TerminalBar';
import StatusBar from './StatusBar';
import MarketTicker from './MarketTicker';
import { 
  LayoutDashboard, BarChart3, Newspaper, Search, Briefcase, Shield, 
  Brain, FlaskConical, DollarSign 
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'DASH', icon: LayoutDashboard, path: '/' },
  { id: 'markets', label: 'MKT', icon: BarChart3, path: '/markets' },
  { id: 'news', label: 'NEWS', icon: Newspaper, path: '/news' },
  { id: 'research', label: 'RES', icon: Search, path: '/research' },
  { id: 'portfolio', label: 'PORT', icon: Briefcase, path: '/portfolio' },
  { id: 'risk', label: 'RISK', icon: Shield, path: '/risk' },
  { id: 'ai-lab', label: 'AI', icon: Brain, path: '/ai-lab' },
  { id: 'quant', label: 'QNT', icon: FlaskConical, path: '/quant' },
  { id: 'trading', label: 'TRADE', icon: DollarSign, path: '/trading' },
];

export default function TerminalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeWorkspace, setActiveWorkspace] = useState('research');

  const handleNavigate = (target) => {
    const navItem = NAV_ITEMS.find(n => n.id === target || n.label.toLowerCase() === target);
    if (navItem) {
      navigate(navItem.path);
    } else if (target.startsWith('research')) {
      navigate(`/research?${target.split('?')[1] || ''}`);
    } else {
      navigate(`/${target}`);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Top Terminal Bar */}
      <TerminalBar
        onNavigate={handleNavigate}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={setActiveWorkspace}
        alertCount={3}
      />

      {/* Market Ticker */}
      <MarketTicker />

      {/* Main Content Area */}
      <div className="flex flex-1 min-h-0">
        {/* Side Navigation */}
        <div className="w-12 bg-[hsl(220,15%,6%)] border-r border-border flex flex-col items-center py-1 gap-0.5 shrink-0">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path || (item.path === '/' && location.pathname === '/');
            return (
              <button
                key={item.id}
                className={`w-10 h-9 flex flex-col items-center justify-center rounded transition-colors ${
                  isActive 
                    ? 'bg-primary/15 text-primary border border-primary/30' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/30'
                }`}
                onClick={() => navigate(item.path)}
                title={item.label}
              >
                <item.icon className="w-3.5 h-3.5" />
                <span className="text-[7px] font-mono mt-0.5 leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Page Content */}
        <div className="flex-1 min-w-0 min-h-0">
          <Outlet />
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar activeWorkspace={activeWorkspace} alertCount={3} />
    </div>
  );
}