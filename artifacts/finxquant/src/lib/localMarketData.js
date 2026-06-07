// Local market data - no API calls needed

export const COMPANY_DATA = {
  AAPL: {
    name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide. The company offers iPhone, Mac, iPad, Apple Watch, and services including App Store, iCloud, Apple Music, and Apple TV+.',
    ceo: 'Tim Cook', employees: 164000,
    financials: { revenue: '$394.3B', net_income: '$97.0B', ebitda: '$130.1B', gross_margin: 0.452, operating_margin: 0.298, net_margin: 0.246, roe: 1.608, roa: 0.283, debt_to_equity: 1.786, current_ratio: 0.988, free_cash_flow: '$99.6B' },
    valuation: { pe: 32.4, forward_pe: 28.1, pb: 48.2, ps: 8.9, ev_ebitda: 24.3, peg: 2.8 },
    analyst_targets: { buy: 32, hold: 8, sell: 2, avg_target: 248, high_target: 275, low_target: 195 },
    insider_activity: [
      { name: 'Tim Cook', title: 'CEO', action: 'Sell', shares: 511000, date: '2024-03-01' },
      { name: 'Luca Maestri', title: 'CFO', action: 'Sell', shares: 187000, date: '2024-02-15' },
    ],
    risks: ['Dependence on iPhone revenue (~52% of total)', 'China market exposure and geopolitical risk', 'Services growth deceleration', 'Antitrust regulatory pressure on App Store'],
    quote: { price: 234.56, change: 3.21, change_pct: 1.39, market_cap: '$3.52T', high_52w: 237.23, low_52w: 164.08, beta: 1.24, dividend_yield: 0.44 },
  },
  MSFT: {
    name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software',
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide. Segments include Productivity and Business Processes, Intelligent Cloud, and More Personal Computing.',
    ceo: 'Satya Nadella', employees: 228000,
    financials: { revenue: '$245.1B', net_income: '$88.1B', ebitda: '$113.0B', gross_margin: 0.699, operating_margin: 0.429, net_margin: 0.360, roe: 0.376, roa: 0.177, debt_to_equity: 0.351, current_ratio: 1.281, free_cash_flow: '$63.3B' },
    valuation: { pe: 36.8, forward_pe: 31.2, pb: 13.1, ps: 13.2, ev_ebitda: 27.4, peg: 2.2 },
    analyst_targets: { buy: 41, hold: 5, sell: 0, avg_target: 510, high_target: 600, low_target: 420 },
    insider_activity: [
      { name: 'Satya Nadella', title: 'CEO', action: 'Sell', shares: 150000, date: '2024-02-20' },
      { name: 'Amy Hood', title: 'CFO', action: 'Sell', shares: 90000, date: '2024-02-10' },
    ],
    risks: ['Azure growth deceleration risk', 'AI Copilot monetization uncertainty', 'Antitrust scrutiny on Activision acquisition', 'Competition from Google Cloud and AWS'],
    quote: { price: 467.89, change: 5.67, change_pct: 1.23, market_cap: '$3.47T', high_52w: 468.35, low_52w: 344.79, beta: 0.90, dividend_yield: 0.73 },
  },
  NVDA: {
    name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors',
    description: 'NVIDIA Corporation provides graphics, compute and networking solutions. The company offers GPUs for gaming, data center AI workloads, professional visualization, and automotive platforms. NVIDIA is the dominant supplier of AI accelerator chips.',
    ceo: 'Jensen Huang', employees: 36000,
    financials: { revenue: '$130.5B', net_income: '$72.9B', ebitda: '$81.2B', gross_margin: 0.748, operating_margin: 0.617, net_margin: 0.558, roe: 1.233, roa: 0.540, debt_to_equity: 0.416, current_ratio: 4.174, free_cash_flow: '$60.8B' },
    valuation: { pe: 40.2, forward_pe: 26.8, pb: 42.1, ps: 22.4, ev_ebitda: 34.7, peg: 1.1 },
    analyst_targets: { buy: 48, hold: 4, sell: 1, avg_target: 175, high_target: 220, low_target: 120 },
    insider_activity: [
      { name: 'Jensen Huang', title: 'CEO', action: 'Sell', shares: 600000, date: '2024-06-01' },
      { name: 'Colette Kress', title: 'CFO', action: 'Sell', shares: 120000, date: '2024-05-15' },
    ],
    risks: ['Customer concentration (Microsoft, Google, Meta, Amazon)', 'Export control restrictions on China AI chips', 'AMD and Intel GPU competition', 'Cyclicality of semiconductor demand'],
    quote: { price: 145.23, change: 8.45, change_pct: 6.17, market_cap: '$3.56T', high_52w: 153.13, low_52w: 47.32, beta: 1.66, dividend_yield: 0.03 },
  },
  TSLA: {
    name: 'Tesla, Inc.', sector: 'Consumer Discretionary', industry: 'Electric Vehicles',
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, energy generation and storage systems, and related services. Products include Model S, 3, X, Y, Cybertruck, and the Megapack energy storage system.',
    ceo: 'Elon Musk', employees: 127855,
    financials: { revenue: '$97.7B', net_income: '$7.1B', ebitda: '$13.7B', gross_margin: 0.178, operating_margin: 0.073, net_margin: 0.073, roe: 0.115, roa: 0.044, debt_to_equity: 0.083, current_ratio: 1.831, free_cash_flow: '$2.5B' },
    valuation: { pe: 58.3, forward_pe: 72.1, pb: 11.8, ps: 4.2, ev_ebitda: 45.2, peg: 5.8 },
    analyst_targets: { buy: 18, hold: 14, sell: 12, avg_target: 295, high_target: 500, low_target: 115 },
    insider_activity: [
      { name: 'Elon Musk', title: 'CEO', action: 'Sell', shares: 10000000, date: '2024-01-10' },
      { name: 'Robyn Denholm', title: 'Chair', action: 'Sell', shares: 500000, date: '2024-03-05' },
    ],
    risks: ['Margin pressure from price wars with BYD', 'CEO distraction (xAI, SpaceX, X)', 'FSD regulatory approval uncertainty', 'Demand growth slowdown in key markets'],
    quote: { price: 345.67, change: -12.34, change_pct: -3.45, market_cap: '$1.10T', high_52w: 488.54, low_52w: 138.80, beta: 2.31, dividend_yield: 0 },
  },
  BTC: {
    name: 'Bitcoin', sector: 'Cryptocurrency', industry: 'Digital Assets',
    description: 'Bitcoin is a decentralized digital currency that enables peer-to-peer transactions without intermediaries. It operates on a blockchain with a fixed supply of 21 million coins. Institutional adoption via ETFs has accelerated since January 2024.',
    ceo: 'Satoshi Nakamoto (pseudonymous)', employees: 0,
    financials: { revenue: 'N/A', net_income: 'N/A', ebitda: 'N/A', gross_margin: 0, operating_margin: 0, net_margin: 0, roe: 0, roa: 0, debt_to_equity: 0, current_ratio: 0, free_cash_flow: 'N/A' },
    valuation: { pe: 0, forward_pe: 0, pb: 0, ps: 0, ev_ebitda: 0, peg: 0 },
    analyst_targets: { buy: 0, hold: 0, sell: 0, avg_target: 150000, high_target: 250000, low_target: 70000 },
    insider_activity: [],
    risks: ['Regulatory crackdown in major economies', 'Quantum computing threat to SHA-256', 'Energy consumption criticism', 'Market manipulation and whale activity'],
    quote: { price: 104523, change: 2341, change_pct: 2.29, market_cap: '$2.07T', high_52w: 108353, low_52w: 38555, beta: 2.10, dividend_yield: 0 },
  },
};

// Prediction engine based on technical signals
export function generatePrediction(sym) {
  const signals = {
    NVDA: { rsi: 72, macd: 1.23, vol: 2.34, news: 2, sector: 1, momentum: 2 },
    BTC:  { rsi: 65, macd: 0.89, vol: 1.45, news: 2, sector: 2, momentum: 1 },
    AAPL: { rsi: 55, macd: 0.12, vol: 1.12, news: 0, sector: 0, momentum: 0 },
    TSLA: { rsi: 38, macd: -0.67, vol: 1.87, news: -2, sector: -1, momentum: -1 },
    ETH:  { rsi: 61, macd: 0.45, vol: 1.34, news: 1, sector: 2, momentum: 1 },
    MSFT: { rsi: 58, macd: 0.23, vol: 1.05, news: 1, sector: 0, momentum: 1 },
    GOLD: { rsi: 52, macd: 0.05, vol: 0.89, news: 0, sector: 0, momentum: 0 },
    SOL:  { rsi: 68, macd: 0.78, vol: 1.67, news: 2, sector: 2, momentum: 2 },
    SPX:  { rsi: 60, macd: 0.34, vol: 1.20, news: 1, sector: 1, momentum: 1 },
    OIL:  { rsi: 42, macd: -0.45, vol: 1.10, news: -1, sector: -1, momentum: -1 },
  };

  const s = signals[sym] || { rsi: 50, macd: 0, vol: 1, news: 0, sector: 0, momentum: 0 };

  let score = 0;
  if (s.rsi < 30) score += 3;
  else if (s.rsi < 45) score += 1;
  else if (s.rsi > 75) score -= 3;
  else if (s.rsi > 65) score -= 1;
  if (s.macd > 0.5) score += 2;
  else if (s.macd > 0) score += 1;
  else if (s.macd < -0.5) score -= 2;
  else if (s.macd < 0) score -= 1;
  if (s.vol > 2) score += 2;
  else if (s.vol > 1.5) score += 1;
  score += s.news;
  score += s.sector;
  score += s.momentum;

  const isStrong = Math.abs(score) >= 4;
  const isMod = Math.abs(score) >= 2;
  const isUp = score >= 0;

  const confidence = Math.min(95, 45 + Math.abs(score) * 6);

  let move1h, move4h, move1d, move3d, timeLabel;
  if (score >= 4) {
    move1h = '+0.4–0.8%'; move4h = '+1–2%'; move1d = '+2–4%'; move3d = '+4–8%';
    timeLabel = { label: '~2–4 hours', direction: 'UP' };
  } else if (score >= 2) {
    move1h = '+0.2–0.5%'; move4h = '+0.5–1.2%'; move1d = '+1–2%'; move3d = '+2–4%';
    timeLabel = { label: '~6–12 hours', direction: 'UP' };
  } else if (score >= 0) {
    move1h = '±0.1–0.2%'; move4h = '±0.3–0.6%'; move1d = '±0.5–1%'; move3d = '±1–2%';
    timeLabel = { label: '~2–3 days', direction: 'NEUTRAL' };
  } else if (score >= -2) {
    move1h = '-0.2–0.5%'; move4h = '-0.5–1.2%'; move1d = '-1–2%'; move3d = '-2–4%';
    timeLabel = { label: '~6–12 hours', direction: 'DOWN' };
  } else {
    move1h = '-0.4–0.8%'; move4h = '-1–2%'; move1d = '-2–4%'; move3d = '-4–8%';
    timeLabel = { label: '~2–4 hours', direction: 'DOWN' };
  }

  return { score, confidence, move1h, move4h, move1d, move3d, timeLabel, rsi: s.rsi, macd: s.macd, relVol: s.vol };
}

export function getResearchData(sym) {
  return COMPANY_DATA[sym.toUpperCase()] || null;
}