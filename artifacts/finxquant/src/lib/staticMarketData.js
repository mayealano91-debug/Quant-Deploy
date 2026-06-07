// Static market data for Risk Terminal - no API calls needed

export const STATIC_RISK = {
  var_95: -2.34, var_99: -4.12, cvar: -5.67,
  sharpe_ratio: 1.45, sortino_ratio: 1.89,
  max_drawdown: -12.34, volatility: 18.56,
  beta: 1.12, alpha: 3.45, risk_score: 65,
  risk_assessment: 'Moderate risk. Portfolio is equity-heavy with significant tech concentration. Crypto allocation adds tail risk. Consider diversifying into bonds or defensive sectors.',
  correlation_matrix: [
    { pair: 'AAPL-MSFT',  correlation: 0.78 },
    { pair: 'NVDA-AAPL',  correlation: 0.65 },
    { pair: 'BTC-ETH',    correlation: 0.89 },
    { pair: 'AAPL-BTC',   correlation: 0.23 },
    { pair: 'GOLD-SPX',   correlation: -0.12 },
    { pair: 'NVDA-BTC',   correlation: 0.34 },
  ],
  stress_tests: [
    { scenario: 'Market Crash -10%',  portfolio_impact: -11.2, dollar_loss: -45234 },
    { scenario: 'Market Crash -20%',  portfolio_impact: -23.5, dollar_loss: -95023 },
    { scenario: 'Market Crash -30%',  portfolio_impact: -34.8, dollar_loss: -140567 },
    { scenario: 'Crypto Winter -50%', portfolio_impact: -8.9,  dollar_loss: -35987 },
    { scenario: 'Tech Selloff -15%',  portfolio_impact: -12.3, dollar_loss: -49734 },
    { scenario: 'Rate Hike Shock',    portfolio_impact: -6.7,  dollar_loss: -27123 },
  ],
  sector_exposure: [
    { sector: 'Technology',   weight: 52.3 },
    { sector: 'Crypto',       weight: 18.7 },
    { sector: 'Communication',weight: 8.4  },
    { sector: 'Consumer Disc',weight: 7.2  },
    { sector: 'Commodities',  weight: 13.4 },
  ],
};