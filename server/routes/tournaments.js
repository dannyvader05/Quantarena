const express = require("express");
const router = express.Router();
const {
  createTournament,
  getTournaments,
  joinTournament,
  getTournamentDetail,
  tournamentBuy,
  tournamentSell,
  getLeaderboard,
} = require("../controllers/tournamentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createTournament);
router.get("/", protect, getTournaments);
router.get("/:id", protect, getTournamentDetail);
router.post("/:id/join", protect, joinTournament);
router.post("/:id/buy", protect, tournamentBuy);
router.post("/:id/sell", protect, tournamentSell);
router.get("/:id/leaderboard", protect, getLeaderboard);

module.exports = router;