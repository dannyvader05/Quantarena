const express = require("express");
const router = express.Router();
const { getInsight } = require("../controllers/aiController");
const { protect } = require("../middleware/authMiddleware");

router.get("/insight", protect, getInsight);

module.exports = router;