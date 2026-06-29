const mongoose = require("mongoose");

const tournamentTradeSchema = new mongoose.Schema(
  {
    tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true, uppercase: true },
    type: { type: String, enum: ["BUY", "SELL"], required: true },
    shares: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    total: { type: Number, required: true },
    realizedPnL: { type: Number, default: 0 },
  },
  { timestamps: true }
);

tournamentTradeSchema.index({ tournamentId: 1, userId: 1, createdAt: -1 });

module.exports = mongoose.model("TournamentTrade", tournamentTradeSchema);