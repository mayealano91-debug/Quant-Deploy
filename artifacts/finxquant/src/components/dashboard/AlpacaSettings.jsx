import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { loadSettings, saveSettings, hasKeys, getAccount, getClock, submitOrder, waitForFill } from '@/lib/alpacaApi';

export default function AlpacaSettings({ onClose }) {
  const saved = loadSettings();

  const [paper,     setPaper]     = useState(saved.paper !== false);
  const [apiKey,    setApiKey]    = useState(saved.apiKey    || '');
  const [secretKey, setSecretKey] = useState(saved.secretKey || '');
  const [showSec,   setShowSec]   = useState(false);
  const [status,    setStatus]    = useState(null);   // null | 'testing' | 'ok' | 'err'
  const [msg,       setMsg]       = useState('');

  const baseUrl = paper ? 'https://paper-api.alpaca.markets' : 'https://api.alpaca.markets';

  const mask = str => str.length > 4 ? '•'.repeat(str.length - 4) + str.slice(-4) : str;

  async function handleTest() {
    if (!apiKey || !secretKey) {
      setStatus('err');
      setMsg('Enter API Key and Secret Key first.');
      return;
    }

    // Save first so helper functions pick up new keys
    saveSettings({ apiKey, secretKey, paper });
    setStatus('testing');
    setMsg('Connecting to Alpaca...');

    try {
      const acct = await getAccount();
      const bp   = parseFloat(acct.buying_power).toLocaleString('en-US', { maximumFractionDigits: 0 });
      setMsg(`✅ Connected · Account #${acct.account_number} · Buying power $${bp}`);

      setMsg(prev => prev + '\n🔄 Placing test trade: NVDA × 1 (market order)...');

      const order = await submitOrder({
        symbol: 'NVDA',
        qty: '1',
        side: 'buy',
        type: 'market',
        time_in_force: 'day',
      });

      setMsg(prev => prev + `\n⏳ Order #${order.id?.slice(-8)} submitted · Waiting for fill...`);

      const filled = await waitForFill(order.id, 15000);
      if (filled?.status === 'filled') {
        const price = parseFloat(filled.filled_avg_price).toFixed(2);
        setMsg(prev => prev + `\n✅ TEST TRADE FILLED — NVDA × 1 @ $${price}\n✅ Alpaca API connected. Agent ready to launch.`);
        setStatus('ok');
      } else {
        setMsg(prev => prev + '\n⚠️ Market may be closed — order queued for next open.');
        setStatus('ok');
      }
    } catch (e) {
      setStatus('err');
      const detail = e.message?.toLowerCase();
      if (detail?.includes('403') || detail?.includes('forbidden') || detail?.includes('unauthorized')) {
        setMsg('❌ Authentication failed. Check your API key and secret.');
      } else if (detail?.includes('insufficient')) {
        setMsg('❌ Insufficient buying power for test trade.');
      } else {
        setMsg(`❌ ${e.message}`);
      }
    }
  }

  function handleSave() {
    saveSettings({ apiKey, secretKey, paper });
    onClose?.();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-md font-mono bg-[hsl(220,15%,8%)] border border-border rounded-sm shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-[hsl(220,15%,11%)]">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-[11px] font-black text-white tracking-widest">ALPACA API CONFIGURATION</span>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">

          {/* Paper / Live toggle */}
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1.5">Environment</div>
            <div className="flex gap-3">
              {[true, false].map(isPaper => (
                <label key={String(isPaper)} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={paper === isPaper}
                    onChange={() => setPaper(isPaper)}
                    className="accent-primary"
                  />
                  <span className={`text-[10px] font-bold ${paper === isPaper ? 'text-white' : 'text-muted-foreground'}`}>
                    {isPaper ? '● Paper Trading' : '● Live Trading'}
                  </span>
                </label>
              ))}
            </div>
            {!paper && (
              <div className="mt-1.5 px-2 py-1 bg-red-900/40 border border-red-600/50 text-red-400 text-[8px] font-bold rounded-sm">
                ⚠️ LIVE TRADING — real funds at risk. Use paper trading for testing.
              </div>
            )}
          </div>

          {/* API Key */}
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">API Key ID</div>
            <input
              type="text"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="PKXXXXXXXXXXXXXXXXXXXXXXXX"
              className="w-full bg-[hsl(220,15%,5%)] border border-border text-[10px] text-white px-2 py-1.5 font-mono rounded-sm focus:border-primary outline-none placeholder:text-muted-foreground/40"
            />
          </div>

          {/* Secret Key */}
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Secret Key</div>
            <div className="relative">
              <input
                type={showSec ? 'text' : 'password'}
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••"
                className="w-full bg-[hsl(220,15%,5%)] border border-border text-[10px] text-white px-2 py-1.5 pr-8 font-mono rounded-sm focus:border-primary outline-none placeholder:text-muted-foreground/40"
              />
              <button
                type="button"
                onClick={() => setShowSec(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showSec ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Base URL */}
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">Base URL (auto-filled)</div>
            <div className="bg-[hsl(220,15%,5%)] border border-border/50 text-[9px] text-muted-foreground px-2 py-1.5 rounded-sm">
              {baseUrl}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border/40" />

          {/* Test section */}
          <div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-1">🧪 Test Connection</div>
            <div className="text-[8px] text-muted-foreground mb-2">
              → Validates keys · Places 1 share of NVDA (market order) · Verifies fill
            </div>

            {msg && (
              <div className={`px-2 py-1.5 mb-2 rounded-sm text-[8px] font-mono whitespace-pre-line border ${
                status === 'ok'  ? 'bg-green-900/30 border-green-700/50 text-green-300' :
                status === 'err' ? 'bg-red-900/30 border-red-700/50 text-red-300' :
                'bg-[hsl(220,15%,5%)] border-border text-muted-foreground'
              }`}>
                {msg}
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 px-3 py-1.5 text-[9px] font-bold text-muted-foreground border border-border hover:border-foreground/30 rounded-sm transition-colors"
            >
              CANCEL
            </button>
            <button
              onClick={handleTest}
              disabled={status === 'testing'}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] font-bold bg-[hsl(220,15%,14%)] border border-border hover:border-primary text-white rounded-sm transition-colors disabled:opacity-50"
            >
              {status === 'testing' && <Loader2 className="w-3 h-3 animate-spin" />}
              {status === 'ok'      && <CheckCircle className="w-3 h-3 text-green-400" />}
              {status === 'err'     && <AlertCircle className="w-3 h-3 text-red-400" />}
              TEST CONNECTION
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 text-[9px] font-black bg-primary text-black hover:bg-primary/90 rounded-sm transition-colors"
            >
              SAVE →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
