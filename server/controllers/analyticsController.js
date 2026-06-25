const Trade = require("../models/Trade");
const Portfolio = require("../models/Portfolio");
const { getStockPrice } = require("../services/priceService");

// @desc    Get full analytics for logged in user
// @route   GET /api/analytics/summary
const getAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const portfolio = await Portfolio.findOne({ userId });
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    const allTrades = await Trade.find({ userId }).sort({ createdAt: 1 });
    const sellTrades = allTrades.filter((t) => t.type === "SELL");

    // ---- Current portfolio value ----
    let investedValue = 0;
    for (const h of portfolio.holdings) {
      const quote = await getStockPrice(h.symbol);
      investedValue += quote.price * h.shares;
    }
    const totalValue = portfolio.cash + investedValue;
    const totalReturn = totalValue - portfolio.totalDeposited;
    const totalReturnPercent = (totalReturn / portfolio.totalDeposited) * 100;

    // ---- Daily portfolio value series (reconstructed from cashAfter) ----
    const dailyValues = reconstructDailySeries(allTrades, portfolio.totalDeposited);
    const dailyReturns = computeDailyReturns(dailyValues);

    // ---- Volatility (annualized standard deviation of daily returns) ----
    const volatility = computeVolatility(dailyReturns);

    // ---- Sharpe Ratio ----
    const sharpeRatio = computeSharpeRatio(dailyReturns);

    // ---- Max Drawdown ----
    const maxDrawdown = computeMaxDrawdown(dailyValues);

    // ---- Win / Loss ratio ----
    const wins = sellTrades.filter((t) => t.realizedPnL > 0).length;
    const losses = sellTrades.filter((t) => t.realizedPnL <= 0).length;
    const winRate = sellTrades.length > 0 ? (wins / sellTrades.length) * 100 : 0;

    // ---- Realized P&L total ----
    const totalRealizedPnL = sellTrades.reduce((sum, t) => sum + t.realizedPnL, 0);

    // ---- Allocation breakdown ----
    const allocation = await Promise.all(
      portfolio.holdings.map(async (h) => {
        const quote = await getStockPrice(h.symbol);
        const value = quote.price * h.shares;
        return {
          symbol: h.symbol,
          value,
          percent: (value / totalValue) * 100,
        };
      })
    );
    allocation.push({
      symbol: "CASH",
      value: portfolio.cash,
      percent: (portfolio.cash / totalValue) * 100,
    });

    res.status(200).json({
      totalValue,
      totalReturn,
      totalReturnPercent,
      volatility,
      sharpeRatio,
      maxDrawdown,
      winRate,
      totalTrades: sellTrades.length,
      wins,
      losses,
      totalRealizedPnL,
      allocation,
      performanceHistory: dailyValues,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ---------------- Helper functions ----------------

// Reconstructs an approximate daily portfolio value series from trade history.
// Between trades, cash stays flat — this gives a simplified equity curve.
function reconstructDailySeries(trades, startCapital) {
  if (trades.length === 0) {
    return [{ date: new Date(), value: startCapital }];
  }
  const series = [{ date: trades[0].createdAt, value: startCapital }];
  for (const t of trades) {
    series.push({ date: t.createdAt, value: t.cashAfter });
  }
  return series;
}

function computeDailyReturns(series) {
  const returns = [];
  for (let i = 1; i < series.length; i++) {
    const prev = series[i - 1].value;
    const curr = series[i].value;
    if (prev > 0) returns.push((curr - prev) / prev);
  }
  return returns;
}

// Annualized volatility = std deviation of daily returns * sqrt(252)
function computeVolatility(dailyReturns) {
  if (dailyReturns.length < 2) return 0;
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    dailyReturns.length;
  const dailyStd = Math.sqrt(variance);
  return dailyStd * Math.sqrt(252) * 100; // as percentage
}

// Sharpe Ratio = (annualized return - risk free rate) / annualized volatility
function computeSharpeRatio(dailyReturns, riskFreeRate = 0.04) {
  if (dailyReturns.length < 2) return 0;
  const mean = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const annualizedReturn = mean * 252;
  const variance =
    dailyReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) /
    dailyReturns.length;
  const annualizedVol = Math.sqrt(variance) * Math.sqrt(252);
  if (annualizedVol === 0) return 0;
  return (annualizedReturn - riskFreeRate) / annualizedVol;
}

// Max Drawdown = largest peak-to-trough decline
function computeMaxDrawdown(series) {
  let peak = -Infinity;
  let maxDD = 0;
  for (const point of series) {
    if (point.value > peak) peak = point.value;
    const drawdown = peak > 0 ? ((point.value - peak) / peak) * 100 : 0;
    if (drawdown < maxDD) maxDD = drawdown;
  }
  return maxDD;
}

module.exports = { getAnalytics };