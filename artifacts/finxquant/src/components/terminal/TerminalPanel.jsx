import React, { useState } from 'react';
import { Maximize2, Minimize2, X, GripHorizontal } from 'lucide-react';

export default function TerminalPanel({ title, icon: Icon, children, className = '', headerExtra, onClose }) {
  const [minimized, setMinimized] = useState(false);

  return (
    <div className={`flex flex-col bg-card border border-border rounded-sm overflow-hidden ${className}`}>
      {/* Panel Header */}
      <div className="flex items-center h-6 bg-[hsl(220,15%,7%)] border-b border-border px-1.5 shrink-0">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {Icon && <Icon className="w-3 h-3 text-primary shrink-0" />}
          <span className="text-[10px] font-mono font-medium text-primary uppercase tracking-wider truncate">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          {headerExtra}
          <button 
            className="p-0.5 hover:bg-secondary rounded transition-colors"
            onClick={() => setMinimized(!minimized)}
          >
            {minimized ? <Maximize2 className="w-2.5 h-2.5 text-muted-foreground" /> : <Minimize2 className="w-2.5 h-2.5 text-muted-foreground" />}
          </button>
          {onClose && (
            <button className="p-0.5 hover:bg-destructive/20 rounded transition-colors" onClick={onClose}>
              <X className="w-2.5 h-2.5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      {/* Panel Content */}
      {!minimized && (
        <div className="flex-1 overflow-auto min-h-0">
          {children}
        </div>
      )}
    </div>
  );
}