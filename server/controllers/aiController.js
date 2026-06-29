const { getStockInsight } = require("../services/aiService");

// simple in-memory cache so repeated requests for the same stock
// within 1 hour don't re-call the API unnecessarily
const insightCache = new Map();
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

const getInsight = async (req, res) => {
  try {
    const { symbol, companyName } = req.query;
    if (!symbol) return res.status(400).json({ message: "Symbol required" });

    const cached = insightCache.get(symbol);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json({ insight: cached.text, cached: true });
    }

    const insight = await getStockInsight(symbol, companyName || symbol);
    insightCache.set(symbol, { text: insight, timestamp: Date.now() });

    res.status(200).json({ insight, cached: false });
  } catch (error) {
    console.error("Gemini error:", error.message);
    res.status(500).json({ message: "Could not generate insight right now" });
  }
};

module.exports = { getInsight };