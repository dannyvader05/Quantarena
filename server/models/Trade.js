const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    companyName: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"],
      required: true,
    },
    shares: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    realizedPnL: {
      type: Number,
      default: 0,
    },
    cashAfter: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

tradeSchema.index({ userId: 1, createdAt: -1 });
tradeSchema.index({ userId: 1, symbol: 1 });

module.exports = mongoose.model("Trade", tradeSchema);