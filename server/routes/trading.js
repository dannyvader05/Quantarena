const express = require("express");
const router = express.Router();
const {
  getPortfolio,
  buyStock,
  sellStock,
  getTradeHistory,
  searchStock,
  getQuote,
  getChartData,
} = require("../controllers/tradingController");
const { protect } = require("../middleware/authMiddleware");

router.get("/portfolio", protect, getPortfolio);
router.post("/buy", protect, buyStock);
router.post("/sell", protect, sellStock);
router.get("/history", protect, getTradeHistory);
router.get("/search", protect, searchStock);
router.get("/quote/:symbol", protect, getQuote);
router.get("/chart/:symbol", protect, getChartData);

module.exports = router;