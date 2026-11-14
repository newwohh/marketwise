// Original educational content: no fabricated news, performance promises, or provider attribution.
export const articles = [
  { slug: "what-is-trading", tag: "TRADING BASICS", title: "Trading starts with an exchange.", subtitle: "What trading is, and how it differs from investing.", minutes: 4, sections: [
    ["A transaction and a time horizon", "Trading is buying and selling assets such as shares, bonds, currencies, or commodities. A trader generally aims to benefit from shorter-term price movements. An investor more often focuses on the long-term value or income of a holding. Both can lose money, and the label does not make a strategy suitable for you."],
    ["A quote is not an execution", "Displayed prices are not guarantees of the price you will receive. The bid and ask, order size, market liquidity, and the type of order affect an execution. Fees, taxes, and currency conversion can change its total cost."],
    ["Separate research from a real order", "Marketwise is a learning and research tool. It does not provide brokerage accounts, take deposits, or execute trades. Practice describing why you are making a decision, what could invalidate your view, and what loss you could afford."]
  ] },
  { slug: "trading-accounts", tag: "GETTING STARTED", title: "Before you open an account.", subtitle: "Questions to ask a broker before you commit money.", minutes: 4, sections: [
    ["Check the provider", "Check a broker’s registration and permissions with the relevant regulator in your jurisdiction. Read the account terms, custody arrangements, withdrawal process, and complaint procedure. An attractive interface is not evidence that a provider is authorised."],
    ["Understand the costs", "Compare brokerage charges, spreads, financing costs, data fees, minimum balances, and withdrawal or currency-conversion charges. Free trading can still involve other costs. Ask whether the instruments involve leverage or complex derivatives."],
    ["Protect your access", "Use a unique password and multi-factor authentication. Verify the provider’s official domain and never share login or recovery codes. A Marketwise account, when available, will be separate from a brokerage account and will not hold money."]
  ] },
  { slug: "technical-analysis", tag: "CHART LITERACY", title: "Read a chart. Question the story.", subtitle: "Candlesticks, timeframes, indicators, and their limits.", minutes: 5, sections: [
    ["Begin with the interval", "A candle summarises the open, high, low, and close for one interval. A one-minute chart and a daily chart can show very different patterns for the same asset. Check the exchange, instrument, currency, timezone, and interval before comparing charts."],
    ["Indicators describe transformations", "A moving average smooths past prices. RSI and MACD summarise aspects of past momentum. These indicators are calculated from historical data and can lag, conflict, or give false signals. Several indicators built from the same prices are not independent evidence."],
    ["Use a process, not a promise", "Define an observation before looking for a pattern that supports it. Consider transaction costs, data quality, and how a strategy behaves outside a selected period. Marketwise’s TradingView chart pages let you explore indicators; they do not recommend trades."]
  ] },
  { slug: "practice-trading", tag: "PRACTICE & PROCESS", title: "Practice the decision, too.", subtitle: "What simulation can teach, and what it leaves out.", minutes: 3, sections: [
    ["A controlled place to ask what if", "Simulated scenarios let you explore an assumption without risking capital. Write down the assumption first, then compare several outcomes. Changing inputs until a model produces a desired result is not a reliable decision process."],
    ["Know what the tool models", "Marketwise’s investment simulator models compounding, a time horizon, and regular contributions. Its optional unit mode converts a selected asset’s quoted price and quantity into starting capital. It is not a historical backtest or a paper-order execution engine."],
    ["Keep a journal", "Use the notebook to record a hypothesis, evidence, alternatives, and what would change your mind. Simulated returns leave out fees, taxes, slippage, liquidity, emotions, and the consequences of losing real money."]
  ] },
  { slug: "risk-management", tag: "RISK MANAGEMENT", title: "Plan for being wrong.", subtitle: "A practical foundation for thinking about losses.", minutes: 4, sections: [
    ["Start with capacity for loss", "Risk tolerance is how a loss feels; risk capacity is how it affects your life and obligations. Consider emergency savings, debts, income stability, and when you need the money. Do not rely on a market position to meet an immediate essential expense."],
    ["Size and concentration matter", "A small position in a volatile asset can behave differently from a concentrated portfolio. Consider correlated holdings, leverage, and liquidity. A stop order is not a guaranteed loss limit: gaps and poor liquidity can produce a worse execution."],
    ["Review the whole plan", "Look at the possible range of outcomes rather than a single target return. Keep records, question assumptions, and review as your circumstances change. Seek qualified, regulated advice for decisions specific to your situation."]
  ] },
  { slug: "compounding", tag: "THE LONG VIEW", title: "Time is an ingredient, too.", subtitle: "How compounding turns time into part of the equation.", minutes: 4, sections: [
    ["Growth on top of growth", "Compounding means that returns can earn returns of their own. If an investment grows, the next period starts from a larger base. The same mechanism also works against you when losses reduce that base. A steady assumed rate makes the maths easy to model, but real markets never move in a straight line."],
    ["Contributions change the picture", "Adding money regularly increases the capital exposed to future returns. The timing matters: a contribution at the end of a month has one less month to grow than a contribution at the beginning. Marketwise uses end-of-month contributions and converts the annual assumption into its equivalent monthly rate."],
    ["A scenario is not a promise", "Try several rates, including zero and negative returns. Consider fees, taxes, inflation, and your need to access the money. A useful model helps you ask better questions; it does not tell you what will happen."]
  ] },
  { slug: "diversification", tag: "THE FOUNDATIONS", title: "Don’t let one idea be the whole plan.", subtitle: "Understanding diversification and its limits.", minutes: 5, sections: [
    ["Different names can hide the same risk", "Owning several assets does not automatically make a portfolio diverse. Companies in the same industry can respond to the same conditions. Crypto assets can move together during market stress. Consider the economic forces behind each holding, not just the number of tickers."],
    ["Spread risk deliberately", "Diversification spreads exposure across sources of risk, such as asset classes, sectors, and regions. It can reduce the impact of a single holding performing poorly. It cannot eliminate market risk or guarantee a profit."],
    ["Start with your own constraints", "Your time horizon, emergency savings, debt, and tolerance for losses matter more than someone else’s portfolio. Review how much a loss would affect your plans. Seek regulated, qualified advice for decisions that depend on your circumstances."]
  ] },
  { slug: "reading-market-data", tag: "MARKET LITERACY", title: "A price is only part of the story.", subtitle: "Read the source, the timestamp, and the context.", minutes: 3, sections: [
    ["Check when and where", "A quote describes a source at a moment in time. A five-minute cached quote is not a live executable price. Daily exchange rates are reference values, not a broker’s offered rate. Always read the source and timestamp before comparing numbers."],
    ["Understand the measures", "Market capitalisation is usually price multiplied by circulating supply or outstanding shares. Volume measures traded activity during a period. A percentage change needs a time window to mean anything. These measures describe a market; none predicts the next move."],
    ["Recognise missing data", "Missing data should not be silently replaced by invented values. Marketwise labels illustrative data and leaves unavailable measures blank. Treat a sample chart as a product demonstration, never as evidence of past or future performance."]
  ] },
];
