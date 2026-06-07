import { base44 } from "@/api/base44Client";

// Real-time market data service using InvokeLLM with internet context
export async function fetchMarketOverview() {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a financial data API. Return CURRENT real-time market data as of right now. Include actual current prices, changes, and percentages. Be as accurate as possible with real market data.

Return data for major indices, top stocks, crypto, forex, and commodities.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        indices: { type: "array", items: { type: "object", properties: {
          symbol: {type:"string"}, name: {type:"string"}, price: {type:"number"}, change: {type:"number"}, change_pct: {type:"number"}, volume: {type:"string"}
        }}},
        stocks: { type: "array", items: { type: "object", properties: {
          symbol: {type:"string"}, name: {type:"string"}, price: {type:"number"}, change: {type:"number"}, change_pct: {type:"number"}, volume: {type:"string"}, market_cap: {type:"string"}
        }}},
        crypto: { type: "array", items: { type: "object", properties: {
          symbol: {type:"string"}, name: {type:"string"}, price: {type:"number"}, change: {type:"number"}, change_pct: {type:"number"}, volume_24h: {type:"string"}
        }}},
        forex: { type: "array", items: { type: "object", properties: {
          pair: {type:"string"}, rate: {type:"number"}, change: {type:"number"}, change_pct: {type:"number"}
        }}},
        commodities: { type: "array", items: { type: "object", properties: {
          name: {type:"string"}, symbol: {type:"string"}, price: {type:"number"}, change: {type:"number"}, change_pct: {type:"number"}
        }}},
        market_status: { type: "string" },
        timestamp: { type: "string" }
      }
    }
  });
  return result;
}

export async function fetchQuoteData(symbol) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Return comprehensive real-time quote data for ${symbol}. Include current price, bid/ask, volume, OHLC, 52-week range, market cap, PE ratio, dividend yield, beta, and any other relevant metrics. Use real current data.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        symbol: {type:"string"}, name: {type:"string"}, price: {type:"number"},
        change: {type:"number"}, change_pct: {type:"number"},
        bid: {type:"number"}, ask: {type:"number"}, spread: {type:"number"},
        open: {type:"number"}, high: {type:"number"}, low: {type:"number"}, close: {type:"number"},
        volume: {type:"string"}, avg_volume: {type:"string"},
        market_cap: {type:"string"}, pe_ratio: {type:"number"}, eps: {type:"number"},
        dividend_yield: {type:"number"}, beta: {type:"number"},
        high_52w: {type:"number"}, low_52w: {type:"number"},
        sector: {type:"string"}, industry: {type:"string"},
        exchange: {type:"string"}, currency: {type:"string"}
      }
    }
  });
  return result;
}

export async function fetchLiveNews() {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Return the latest 15 financial and market news headlines from TODAY. Include breaking news, market-moving events, earnings, economic data releases, and geopolitical events affecting markets. Include sentiment scores and market impact ratings. Use REAL current news.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        news: { type: "array", items: { type: "object", properties: {
          headline: {type:"string"}, source: {type:"string"}, time: {type:"string"},
          category: {type:"string"}, sentiment: {type:"string"},
          impact_score: {type:"number"}, symbols: {type:"array", items:{type:"string"}},
          summary: {type:"string"}, is_breaking: {type:"boolean"}
        }}},
        market_mood: {type:"string"},
        fear_greed_index: {type:"number"}
      }
    }
  });
  return result;
}

export async function fetchSectorHeatmap() {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Return current sector performance heatmap data. Include all 11 GICS sectors with their daily performance, weekly performance, and top/bottom stocks in each sector. Use real current market data.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        sectors: { type: "array", items: { type: "object", properties: {
          name: {type:"string"}, change_pct: {type:"number"}, weekly_change: {type:"number"},
          top_stock: {type:"string"}, bottom_stock: {type:"string"},
          market_cap: {type:"string"}, volume: {type:"string"}
        }}},
        market_breadth: { type: "object", properties: {
          advancing: {type:"number"}, declining: {type:"number"}, unchanged: {type:"number"}
        }}
      }
    }
  });
  return result;
}

export async function fetchEconomicCalendar() {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Return today's and upcoming economic calendar events for this week. Include actual values, forecasts, and previous values. Include GDP, CPI, employment, Fed decisions, earnings dates, etc. Use REAL current data.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        events: { type: "array", items: { type: "object", properties: {
          date: {type:"string"}, time: {type:"string"}, event: {type:"string"},
          country: {type:"string"}, impact: {type:"string"},
          actual: {type:"string"}, forecast: {type:"string"}, previous: {type:"string"}
        }}}
      }
    }
  });
  return result;
}

export async function fetchOrderBook(symbol) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Simulate a realistic order book for ${symbol} based on current market price. Generate 10 bid levels and 10 ask levels with realistic price levels, quantities, and order counts. Make it look like a real Level 2 order book.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        symbol: {type:"string"},
        last_price: {type:"number"},
        bids: { type: "array", items: { type: "object", properties: {
          price: {type:"number"}, size: {type:"number"}, orders: {type:"number"}, total: {type:"number"}
        }}},
        asks: { type: "array", items: { type: "object", properties: {
          price: {type:"number"}, size: {type:"number"}, orders: {type:"number"}, total: {type:"number"}
        }}},
        spread: {type:"number"},
        mid_price: {type:"number"}
      }
    }
  });
  return result;
}

export async function fetchCompanyResearch(symbol) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Return comprehensive company research data for ${symbol}. Include: company overview, key financial metrics, income statement summary (last 4 quarters), balance sheet summary, valuation metrics (PE, PB, PS, EV/EBITDA), analyst targets (buy/hold/sell count, avg target, high/low), recent insider activity, institutional ownership %, and key risks. Use REAL current data.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        symbol: {type:"string"}, name: {type:"string"}, sector: {type:"string"}, industry: {type:"string"},
        description: {type:"string"}, employees: {type:"number"}, ceo: {type:"string"},
        financials: { type: "object", properties: {
          revenue: {type:"string"}, net_income: {type:"string"}, ebitda: {type:"string"},
          gross_margin: {type:"number"}, operating_margin: {type:"number"}, net_margin: {type:"number"},
          roe: {type:"number"}, roa: {type:"number"}, debt_to_equity: {type:"number"},
          current_ratio: {type:"number"}, free_cash_flow: {type:"string"}
        }},
        valuation: { type: "object", properties: {
          pe: {type:"number"}, forward_pe: {type:"number"}, pb: {type:"number"},
          ps: {type:"number"}, ev_ebitda: {type:"number"}, peg: {type:"number"}
        }},
        analyst_targets: { type: "object", properties: {
          buy: {type:"number"}, hold: {type:"number"}, sell: {type:"number"},
          avg_target: {type:"number"}, high_target: {type:"number"}, low_target: {type:"number"}
        }},
        insider_activity: { type: "array", items: { type: "object", properties: {
          name: {type:"string"}, title: {type:"string"}, action: {type:"string"},
          shares: {type:"number"}, date: {type:"string"}
        }}},
        institutional_ownership: {type:"number"},
        risks: { type: "array", items: {type:"string"} }
      }
    }
  });
  return result;
}

export async function fetchPredictions(symbols) {
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Based on current market conditions, recent news, and technical analysis, provide price predictions and trend analysis for these assets: ${symbols.join(', ')}. For each, include: current trend direction, predicted short-term move (1 week), key support/resistance levels, sentiment from news, and a confidence score. Include the hottest trades and prevailing market trends RIGHT NOW. Use REAL current market intelligence.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        predictions: { type: "array", items: { type: "object", properties: {
          symbol: {type:"string"}, current_price: {type:"number"},
          trend: {type:"string"}, predicted_move: {type:"string"},
          target_1w: {type:"number"}, support: {type:"number"}, resistance: {type:"number"},
          sentiment: {type:"string"}, confidence: {type:"number"},
          catalyst: {type:"string"}
        }}},
        hottest_trades: { type: "array", items: { type: "object", properties: {
          symbol: {type:"string"}, reason: {type:"string"}, direction: {type:"string"}, momentum: {type:"string"}
        }}},
        prevailing_trends: { type: "array", items: { type: "object", properties: {
          trend: {type:"string"}, description: {type:"string"}, sectors: {type:"array", items:{type:"string"}}
        }}},
        market_regime: {type:"string"}
      }
    }
  });
  return result;
}

export async function runAIAgentAnalysis(agentName, symbol, analysisType) {
  const agentPrompts = {
    buffett: "You are Warren Buffett. Analyze this investment using value investing principles: intrinsic value, economic moats, management quality, margin of safety. Be conservative and focus on long-term fundamentals.",
    graham: "You are Benjamin Graham. Apply strict value investing criteria: net-net analysis, Graham number, earnings stability, dividend record, moderate P/E and P/B ratios.",
    lynch: "You are Peter Lynch. Categorize this stock (slow grower, stalwart, fast grower, cyclical, turnaround, asset play) and apply your investment philosophy focusing on what you know.",
    munger: "You are Charlie Munger. Apply mental models and inversion thinking. Look for quality businesses at fair prices. Focus on competitive advantages and management rationality.",
    dalio: "You are Ray Dalio. Analyze through macro lens: debt cycles, monetary policy impact, global diversification. Apply All Weather portfolio principles.",
    marks: "You are Howard Marks. Focus on risk assessment, market cycles, second-level thinking. Evaluate where we are in the cycle and margin of safety.",
    klarman: "You are Seth Klarman. Apply deep value and margin of safety analysis. Look for catalyst-driven opportunities and assess downside risk rigorously.",
    druckenmiller: "You are Stanley Druckenmiller. Focus on macro trends, capital flows, and momentum. Identify asymmetric risk/reward opportunities.",
    simons: "You are Jim Simons. Apply quantitative analysis: statistical patterns, mean reversion, momentum factors, correlation analysis."
  };

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `${agentPrompts[agentName]}

Analyze ${symbol} for ${analysisType}. Provide a detailed institutional-grade analysis with specific numbers, price targets, and actionable conclusions. Use current real market data.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        agent: {type:"string"}, symbol: {type:"string"},
        analysis_type: {type:"string"},
        rating: {type:"string"},
        conviction: {type:"number"},
        price_target: {type:"number"},
        upside: {type:"number"},
        thesis: {type:"string"},
        key_metrics: { type: "array", items: { type: "object", properties: {
          metric: {type:"string"}, value: {type:"string"}, assessment: {type:"string"}
        }}},
        risks: { type: "array", items: {type:"string"} },
        catalysts: { type: "array", items: {type:"string"} },
        recommendation: {type:"string"},
        time_horizon: {type:"string"}
      }
    }
  });
  return result;
}

export async function fetchRiskMetrics(holdings) {
  const holdingsList = holdings.map(h => `${h.symbol}: ${h.shares} shares @ $${h.avg_cost}`).join(', ');
  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `Calculate comprehensive risk metrics for this portfolio: ${holdingsList}. Include VaR (95%, 99%), CVaR, Sharpe ratio, Sortino ratio, max drawdown, portfolio beta, alpha, volatility, correlation matrix between holdings, sector concentration risk, and stress test results for -10%, -20%, -30% market drops. Use current market data.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        var_95: {type:"number"}, var_99: {type:"number"}, cvar: {type:"number"},
        sharpe_ratio: {type:"number"}, sortino_ratio: {type:"number"},
        max_drawdown: {type:"number"}, volatility: {type:"number"},
        beta: {type:"number"}, alpha: {type:"number"},
        correlation_matrix: { type: "array", items: { type: "object", properties: {
          pair: {type:"string"}, correlation: {type:"number"}
        }}},
        stress_tests: { type: "array", items: { type: "object", properties: {
          scenario: {type:"string"}, portfolio_impact: {type:"number"}, dollar_loss: {type:"number"}
        }}},
        sector_exposure: { type: "array", items: { type: "object", properties: {
          sector: {type:"string"}, weight: {type:"number"}
        }}},
        risk_score: {type:"number"},
        risk_assessment: {type:"string"}
      }
    }
  });
  return result;
}