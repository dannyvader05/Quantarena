const Watchlist = require("../models/Watchlist");
const { getStockPrice } = require("../services/priceService");

const getWatchlist = async (req, res) => {
  let watchlist = await Watchlist.findOne({ userId: req.user._id });
  if (!watchlist) {
    watchlist = await Watchlist.create({ userId: req.user._id, symbols: [] });
  }

  const enriched = await Promise.all(
    watchlist.symbols.map(async (s) => {
      try {
        const quote = await getStockPrice(s.symbol);
        return { ...s._doc, price: quote.price, change: quote.change, changePercent: quote.changePercent };
      } catch {
        return { ...s._doc, price: null };
      }
    })
  );

  res.status(200).json(enriched);
};

const addToWatchlist = async (req, res) => {
  const { symbol, companyName } = req.body;
  let watchlist = await Watchlist.findOne({ userId: req.user._id });
  if (!watchlist) {
    watchlist = await Watchlist.create({ userId: req.user._id, symbols: [] });
  }

  const exists = watchlist.symbols.some((s) => s.symbol === symbol.toUpperCase());
  if (exists) return res.status(400).json({ message: "Already in watchlist" });

  watchlist.symbols.push({ symbol: symbol.toUpperCase(), companyName });
  await watchlist.save();
  res.status(201).json({ message: `${symbol.toUpperCase()} added to watchlist` });
};

const removeFromWatchlist = async (req, res) => {
  const { symbol } = req.params;
  const watchlist = await Watchlist.findOne({ userId: req.user._id });
  if (!watchlist) return res.status(404).json({ message: "Watchlist not found" });

  watchlist.symbols = watchlist.symbols.filter((s) => s.symbol !== symbol.toUpperCase());
  await watchlist.save();
  res.status(200).json({ message: `${symbol.toUpperCase()} removed from watchlist` });
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };