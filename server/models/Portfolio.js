const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema({
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
  shares: {
    type: Number,
    required: true,
    min: 0,
  },
  averageCost: {
    type: Number,
    required: true,
    min: 0,
  },
  totalInvested: {
    type: Number,
    required: true,
    min: 0,
  },
});

const portfolioSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    cash: {
      type: Number,
      default: 100000,
    },
    holdings: [holdingSchema],
    totalDeposited: {
      type: Number,
      default: 100000,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Portfolio", portfolioSchema);