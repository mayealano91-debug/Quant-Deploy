import React, { useState, useEffect } from 'react';
import { 
  Search, Terminal, Wifi, WifiOff, Bell, User, Activity, 
  ChevronDown, Command, Zap, BarChart3, Clock
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { base44 } from "@/api/base44Client";

const menuItems = {
  File: ['New Workspace', 'Save Workspace', 'Load Workspace', 'Export Data', 'Print', 'Exit'],
  Navigate: ['Dashboard', 'Markets', 'News', 'Research', 'Portfolio', 'Risk', 'AI Lab', 'Quant Lab', 'Trading'],
  View: ['Full Screen', 'Split Horizontal', 'Split Vertical', 'Reset Layout', 'Toggle Ticker', 'Toggle Status Bar'],
  Tools: ['Command Palette', 'Symbol Lookup', 'Calculator', 'Unit Converter', 'Correlation Tool', 'Screener'],
  Workspace: ['Research', 'Trading', 'Portfolio', 'Quant', 'News', 'AI', 'Risk'],
  Help: ['Documentation', 'Keyboard Shortcuts', 'API Reference', 'About']
};

export default function TerminalBar({ 
  onNavigate, onCommandOpen, alertCount = 0, activeWorkspace = 'Research',
  onWorkspaceChange 
}) {
  const [time, setTime] = useState(new Date());
  const [connected, setConnected] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    base44.auth.me().then(u => setUser(u)).catch(() => {});
    return () => clearInterval(timer);
  }, []);

  const handleMenuClick = (menu, item) => {
    if (menu === 'Navigate') onNavigate?.(item.toLowerCase().replace(' ', '-'));
    if (menu === 'Workspace') onWorkspaceChange?.(item.toLowerCase());
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) onNavigate?.(`research?symbol=${searchQuery.toUpperCase()}`);
    setSearchQuery('');
  };

  return (
    <div className="h-7 bg-[hsl(220,15%,6%)] border-b border-border flex items-center px-1 select-none shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-1 px-2 text-primary font-mono font-bold text-xs tracking-wider">
        <Zap className="w-3 h-3" />
        <span>FINCEPT</span>
      </div>

      <div className="h-4 w-px bg-border mx-1" />

      {/* Menu Items */}
      {Object.entries(menuItems).map(([menu, items]) => (
        <DropdownMenu key={menu}>
          <DropdownMenuTrigger asChild>
            <button className="px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors">
              {menu}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="min-w-[160px] bg-popover border-border">
            <DropdownMenuLabel className="text-[10px] text-muted-foreground">{menu}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {items.map(item => (
              <DropdownMenuItem 
                key={item} 
                className="text-xs cursor-pointer"
                onClick={() => handleMenuClick(menu, item)}
              >
                {item}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ))}

      <div className="h-4 w-px bg-border mx-1" />

      {/* Command Input */}
      <form onSubmit={handleSearchSubmit} className="flex items-center">
        <div className="flex items-center bg-secondary/50 rounded px-1.5 py-0.5 gap-1">
          <Command className="w-3 h-3 text-muted-foreground" />
          <input
            className="bg-transparent text-xs text-foreground placeholder-muted-foreground w-32 focus:w-48 transition-all outline-none font-mono"
            placeholder="Symbol / Command..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClick={() => !searchQuery && onCommandOpen?.()}
          />
        </div>
      </form>

      <div className="flex-1" />

      {/* Right side status */}
      <div className="flex items-center gap-2 text-[10px] font-mono">
        {/* Market Status */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary/30 rounded">
          <BarChart3 className="w-3 h-3 text-primary" />
          <span className="text-muted-foreground">MKT</span>
          <span className="text-green-400 green-glow">OPEN</span>
        </div>

        {/* Connection */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary/30 rounded">
          {connected ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-destructive" />}
          <span className={connected ? "text-green-400" : "text-destructive"}>
            {connected ? 'LIVE' : 'DISC'}
          </span>
        </div>

        {/* Alerts */}
        <button 
          className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary/30 rounded hover:bg-secondary transition-colors"
          onClick={() => onNavigate?.('alerts')}
        >
          <Bell className="w-3 h-3 text-primary" />
          <span className="text-primary">{alertCount}</span>
        </button>

        {/* Active Workspace */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded border border-primary/20">
          <Activity className="w-3 h-3 text-primary" />
          <span className="text-primary uppercase">{activeWorkspace}</span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{time.toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>

        {/* User */}
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-secondary/30 rounded">
          <User className="w-3 h-3 text-muted-foreground" />
          <span className="text-muted-foreground">{user?.full_name?.split(' ')[0] || 'ANALYST'}</span>
        </div>
      </div>
    </div>
  );
}