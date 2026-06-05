const axios = require("axios");

const cache = new Map();
const CACHE_DURATION = 30000;
const BASE = "https://finnhub.io/api/v1";
const KEY = process.env.FINNHUB_API_KEY;
console.log("FINNHUB KEY:", KEY);

const getStockPrice = async (symbol) => {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const [quoteRes, profileRes] = await Promise.all([
    axios.get(`${BASE}/quote?symbol=${symbol}&token=${KEY}`),
    axios.get(`${BASE}/stock/profile2?symbol=${symbol}&token=${KEY}`),
  ]);

  const q = quoteRes.data;
  const p = profileRes.data;

  if (!q.c || q.c === 0) throw new Error(`Invalid symbol: ${symbol}`);

  const data = {
    symbol,
    companyName: p.name || symbol,
    price: q.c,
    change: q.d,
    changePercent: q.dp,
    high: q.h,
    low: q.l,
    open: q.o,
    previousClose: q.pc,
  };

  cache.set(symbol, { data, timestamp: Date.now() });
  return data;
};

const searchStocks = async (query) => {
   console.log("SEARCHING:", query, "KEY:", KEY)
  const res = await axios.get(
    `https://finnhub.io/api/v1/search?q=${query}&exchange=US&token=${KEY}`
  );
  
  return (res.data.result || [])
    .filter((r) => r.type === "Common Stock" && !r.symbol.includes("."))
    .slice(0, 8)
    .map((r) => ({
      symbol: r.symbol,
      companyName: r.description,
      exchange: r.primaryExchange || "US",
    }));
};

const getHistoricalData = async (symbol, period = "1mo") => {
  const now = Math.floor(Date.now() / 1000);
  const periodMap = {
    "1w":  now - 7   * 24 * 60 * 60,
    "1mo": now - 30  * 24 * 60 * 60,
    "3mo": now - 90  * 24 * 60 * 60,
    "1y":  now - 365 * 24 * 60 * 60,
  };

  const from = periodMap[period] || periodMap["1mo"];
  const res = await axios.get(
    `${BASE}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${now}&token=${KEY}`
  );

  if (res.data.s === "no_data") throw new Error(`No data for ${symbol}`);

  return res.data.t.map((timestamp, i) => ({
    date: new Date(timestamp * 1000),
    open:   res.data.o[i],
    high:   res.data.h[i],
    low:    res.data.l[i],
    close:  res.data.c[i],
    volume: res.data.v[i],
  }));
};

module.exports = { getStockPrice, searchStocks, getHistoricalData };