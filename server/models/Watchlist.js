const mongoose = require("mongoose");

const watchlistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    symbols: [
      {
        symbol: { type: String, required: true, uppercase: true },
        companyName: { type: String, default: "" },
        addedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Watchlist", watchlistSchema);