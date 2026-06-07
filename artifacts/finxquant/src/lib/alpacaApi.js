/**
 * alpacaApi.js
 * ─────────────
 * Direct Alpaca API wrapper that uses keys stored in localStorage.
 * Falls back gracefully so the UI stays functional even with no keys.
 *
 * Keys stored under:  localStorage.key('fxq_alpaca')
 * Format:             { apiKey, secretKey, paper: true }
 */

const PAPER_BASE = 'https://paper-api.alpaca.markets';
const LIVE_BASE  = 'https://api.alpaca.markets';
const DATA_BASE  = 'https://data.alpaca.markets';

// ── Settings ─────────────────────────────────────────────────────────────────

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem('fxq_alpaca') || '{}'); }
  catch { return {}; }
}

export function saveSettings(s) {
  localStorage.setItem('fxq_alpaca', JSON.stringify(s));
}

export function hasKeys() {
  const { apiKey, secretKey } = loadSettings();
  return !!(apiKey && secretKey);
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function tradeBase() {
  const { paper } = loadSettings();
  return paper === false ? LIVE_BASE : PAPER_BASE;
}

function tradeHeaders() {
  const { apiKey = '', secretKey = '' } = loadSettings();
  return {
    'APCA-API-KEY-ID':     apiKey,
    'APCA-API-SECRET-KEY': secretKey,
    'Content-Type':        'application/json',
  };
}

function dataHeaders() {
  const { apiKey = '', secretKey = '' } = loadSettings();
  return {
    'APCA-API-KEY-ID':     apiKey,
    'APCA-API-SECRET-KEY': secretKey,
  };
}

async function tradeGet(path) {
  const r = await fetch(`${tradeBase()}${path}`, { headers: tradeHeaders() });
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.message || `HTTP ${r.status}`); }
  return r.json();
}

async function tradePost(path, body) {
  const r = await fetch(`${tradeBase()}${path}`, {
    method: 'POST',
    headers: tradeHeaders(),
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data.message || `HTTP ${r.status}`);
  return data;
}

async function tradeDelete(path) {
  const r = await fetch(`${tradeBase()}${path}`, { method: 'DELETE', headers: tradeHeaders() });
  if (!r.ok && r.status !== 404) throw new Error(`HTTP ${r.status}`);
  return r.status === 204 ? null : r.json().catch(() => null);
}

// ── Trading API ───────────────────────────────────────────────────────────────

export async function getAccount() {
  // Try proxy first (uses Replit Secrets when configured)
  try {
    const r = await fetch('/api/alpaca/account', { signal: AbortSignal.timeout(3000) });
    if (r.ok) { const d = await r.json(); if (d.equity) return d; }
  } catch {}
  return tradeGet('/v2/account');
}

export async function getClock() {
  try {
    const r = await fetch('/api/alpaca/clock', { signal: AbortSignal.timeout(3000) });
    if (r.ok) { const d = await r.json(); if ('is_open' in d) return d; }
  } catch {}
  return tradeGet('/v2/clock');
}

export async function getPositions() {
  try {
    const r = await fetch('/api/alpaca/positions', { signal: AbortSignal.timeout(3000) });
    if (r.ok) return r.json();
  } catch {}
  return tradeGet('/v2/positions');
}

export async function submitOrder(body) {
  if (!hasKeys()) throw new Error('No API keys configured — open ⚙️ Settings first.');
  return tradePost('/v2/orders', body);
}

export async function getOrder(orderId) {
  return tradeGet(`/v2/orders/${orderId}`);
}

export async function cancelOrder(orderId) {
  return tradeDelete(`/v2/orders/${orderId}`);
}

export async function closePosition(symbol) {
  return tradeDelete(`/v2/positions/${encodeURIComponent(symbol)}`);
}

/** Poll until filled, cancelled, or timeout (ms). */
export async function waitForFill(orderId, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await sleep(500);
    try {
      const o = await getOrder(orderId);
      if (o.status === 'filled') return o;
      if (['canceled', 'expired', 'rejected'].includes(o.status)) return o;
    } catch {}
  }
  return null;
}

// ── Data API ──────────────────────────────────────────────────────────────────

/** Latest 1-min bars for a list of equity symbols. Returns { AAPL: {t,o,h,l,c,v}, … } */
export async function getLatestBars(symbols) {
  if (!hasKeys()) return {};
  const syms = (Array.isArray(symbols) ? symbols : [symbols]).join(',');
  try {
    const r = await fetch(`${DATA_BASE}/v2/stocks/bars/latest?symbols=${encodeURIComponent(syms)}&feed=iex`, {
      headers: dataHeaders(),
    });
    if (!r.ok) return {};
    const d = await r.json();
    return d.bars || {};
  } catch { return {}; }
}

/** Latest quotes for equity symbols. Returns { AAPL: {t,ax,ap,as,bx,bp,bs}, … } */
export async function getLatestQuotes(symbols) {
  if (!hasKeys()) return {};
  const syms = (Array.isArray(symbols) ? symbols : [symbols]).join(',');
  try {
    const r = await fetch(`${DATA_BASE}/v2/stocks/quotes/latest?symbols=${encodeURIComponent(syms)}&feed=iex`, {
      headers: dataHeaders(),
    });
    if (!r.ok) return {};
    const d = await r.json();
    return d.quotes || {};
  } catch { return {}; }
}

/** Historical bars for a single equity. Returns array of {t,o,h,l,c,v}. */
export async function getBars(symbol, timeframe = '5Min', limit = 60) {
  if (!hasKeys()) return [];
  try {
    const r = await fetch(
      `${DATA_BASE}/v2/stocks/${symbol}/bars?timeframe=${timeframe}&limit=${limit}&adjustment=raw&feed=iex`,
      { headers: dataHeaders() }
    );
    if (!r.ok) return [];
    const d = await r.json();
    return d.bars || [];
  } catch { return []; }
}

/** Latest bars for crypto pairs. Returns { 'BTC/USD': {t,o,h,l,c,v}, … } */
export async function getCryptoLatestBars(symbols) {
  if (!hasKeys()) return {};
  const pairs = (Array.isArray(symbols) ? symbols : [symbols]);
  const syms = pairs.join(',');
  try {
    const r = await fetch(`${DATA_BASE}/v2/crypto/bars/latest?symbols=${encodeURIComponent(syms)}`, {
      headers: dataHeaders(),
    });
    if (!r.ok) return {};
    const d = await r.json();
    return d.bars || {};
  } catch { return {}; }
}

/** Historical bars for a crypto pair. Returns array of {t,o,h,l,c,v}. */
export async function getCryptoBars(symbol = 'BTC/USD', timeframe = '5Min', limit = 60) {
  if (!hasKeys()) return [];
  try {
    const r = await fetch(
      `${DATA_BASE}/v2/crypto/bars?symbols=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`,
      { headers: dataHeaders() }
    );
    if (!r.ok) return [];
    const d = await r.json();
    return d.bars?.[symbol] || [];
  } catch { return []; }
}

// ── Utilities ─────────────────────────────────────────────────────────────────

export const sleep = ms => new Promise(r => setTimeout(r, ms));
