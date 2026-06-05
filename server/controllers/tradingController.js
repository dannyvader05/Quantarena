const Portfolio = require("../models/Portfolio");
const Trade = require("../models/Trade");
const { getStockPrice, searchStocks, getHistoricalData } = require("../services/priceService");

// @desc    Get or create portfolio for logged in user
// @route   GET /api/trading/portfolio
const getPortfolio = async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });

    if (!portfolio) {
      portfolio = await Portfolio.create({
        userId: req.user._id,
        cash: 100000,
        holdings: [],
      });
    }

    // enrich holdings with current prices
    const enrichedHoldings = await Promise.all(
      portfolio.holdings.map(async (holding) => {
        try {
          const quote = await getStockPrice(holding.symbol);
          const currentValue = quote.price * holding.shares;
          const unrealizedPnL = (quote.price - holding.averageCost) * holding.shares;
          const unrealizedPnLPercent = ((quote.price - holding.averageCost) / holding.averageCost) * 100;

          return {
            symbol: holding.symbol,
            companyName: holding.companyName,
            shares: holding.shares,
            averageCost: holding.averageCost,
            totalInvested: holding.totalInvested,
            currentPrice: quote.price,
            currentValue,
            unrealizedPnL,
            unrealizedPnLPercent,
            change: quote.change,
            changePercent: quote.changePercent,
          };
        } catch {
          return {
            symbol: holding.symbol,
            companyName: holding.companyName,
            shares: holding.shares,
            averageCost: holding.averageCost,
            totalInvested: holding.totalInvested,
            currentPrice: null,
            currentValue: holding.totalInvested,
            unrealizedPnL: 0,
            unrealizedPnLPercent: 0,
          };
        }
      })
    );

    const investedValue = enrichedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalValue = portfolio.cash + investedValue;
    const totalReturn = totalValue - portfolio.totalDeposited;
    const totalReturnPercent = (totalReturn / portfolio.totalDeposited) * 100;

    res.status(200).json({
      cash: portfolio.cash,
      holdings: enrichedHoldings,
      totalValue,
      investedValue,
      totalReturn,
      totalReturnPercent,
      totalDeposited: portfolio.totalDeposited,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buy stock
// @route   POST /api/trading/buy
const buyStock = async (req, res) => {
  try {
    const { symbol, shares } = req.body;

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ message: "Valid symbol and shares required" });
    }

    // get current price
    const quote = await getStockPrice(symbol.toUpperCase());
    const totalCost = quote.price * shares;

    // get or create portfolio
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      portfolio = await Portfolio.create({
        userId: req.user._id,
        cash: 100000,
        holdings: [],
      });
    }

    // validate balance
    if (portfolio.cash < totalCost) {
      return res.status(400).json({
        message: `Insufficient balance. Need $${totalCost.toFixed(2)}, have $${portfolio.cash.toFixed(2)}`,
      });
    }

    // check if holding already exists
    const existingIndex = portfolio.holdings.findIndex(
      (h) => h.symbol === symbol.toUpperCase()
    );

    if (existingIndex >= 0) {
      // update existing holding — recalculate average cost
      const existing = portfolio.holdings[existingIndex];
      const newTotalInvested = existing.totalInvested + totalCost;
      const newShares = existing.shares + shares;
      const newAverageCost = newTotalInvested / newShares;

      portfolio.holdings[existingIndex].shares = newShares;
      portfolio.holdings[existingIndex].averageCost = newAverageCost;
      portfolio.holdings[existingIndex].totalInvested = newTotalInvested;
    } else {
      // new holding
      portfolio.holdings.push({
        symbol: symbol.toUpperCase(),
        companyName: quote.companyName,
        shares,
        averageCost: quote.price,
        totalInvested: totalCost,
      });
    }

    // deduct cash
    portfolio.cash -= totalCost;
    await portfolio.save();

    // record trade
    const trade = await Trade.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName: quote.companyName,
      type: "BUY",
      shares,
      price: quote.price,
      total: totalCost,
      realizedPnL: 0,
      cashAfter: portfolio.cash,
    });

    res.status(201).json({
      message: `Bought ${shares} shares of ${symbol.toUpperCase()} at $${quote.price}`,
      trade,
      cashRemaining: portfolio.cash,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sell stock
// @route   POST /api/trading/sell
const sellStock = async (req, res) => {
  try {
    const { symbol, shares } = req.body;

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ message: "Valid symbol and shares required" });
    }

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!portfolio) {
      return res.status(404).json({ message: "Portfolio not found" });
    }

    // check holding exists
    const holdingIndex = portfolio.holdings.findIndex(
      (h) => h.symbol === symbol.toUpperCase()
    );

    if (holdingIndex < 0) {
      return res.status(400).json({ message: `You don't own any ${symbol} shares` });
    }

    const holding = portfolio.holdings[holdingIndex];

    // validate shares
    if (holding.shares < shares) {
      return res.status(400).json({
        message: `You only have ${holding.shares} shares of ${symbol}`,
      });
    }

    // get current price
    const quote = await getStockPrice(symbol.toUpperCase());
    const totalProceeds = quote.price * shares;

    // calculate realized P&L
    const realizedPnL = (quote.price - holding.averageCost) * shares;

    // update holding
    if (holding.shares === shares) {
      // sold all shares — remove holding entirely
      portfolio.holdings.splice(holdingIndex, 1);
    } else {
      // partial sell — update shares and totalInvested
      portfolio.holdings[holdingIndex].shares -= shares;
      portfolio.holdings[holdingIndex].totalInvested =
        portfolio.holdings[holdingIndex].averageCost *
        portfolio.holdings[holdingIndex].shares;
    }

    // add cash back
    portfolio.cash += totalProceeds;
    await portfolio.save();

    // record trade
    const trade = await Trade.create({
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      companyName: quote.companyName,
      type: "SELL",
      shares,
      price: quote.price,
      total: totalProceeds,
      realizedPnL,
      cashAfter: portfolio.cash,
    });

    res.status(201).json({
      message: `Sold ${shares} shares of ${symbol.toUpperCase()} at $${quote.price}`,
      trade,
      realizedPnL,
      cashRemaining: portfolio.cash,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get trade history
// @route   GET /api/trading/history
const getTradeHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const trades = await Trade.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Trade.countDocuments({ userId: req.user._id });

    res.status(200).json({
      trades,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search stocks
// @route   GET /api/trading/search?q=apple
const searchStock = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query required" });
    const results = await searchStocks(q);
    res.status(200).json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get stock quote
// @route   GET /api/trading/quote/:symbol
const getQuote = async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await getStockPrice(symbol.toUpperCase());
    res.status(200).json(quote);
  } catch (error) {
    res.status(500).json({ message: `Could not fetch quote for ${req.params.symbol}` });
  }
};

// @desc    Get historical chart data
// @route   GET /api/trading/history/:symbol?period=1mo
const getChartData = async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period } = req.query;
    const data = await getHistoricalData(symbol.toUpperCase(), period);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getPortfolio,
  buyStock,
  sellStock,
  getTradeHistory,
  searchStock,
  getQuote,
  getChartData,
};