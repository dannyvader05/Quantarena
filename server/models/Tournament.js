const mongoose = require("mongoose");

const tournamentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    startingCapital: { type: Number, default: 100000 },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["UPCOMING", "ACTIVE", "ENDED"],
      default: "UPCOMING",
    },
    isPublic: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        username: { type: String, required: true },
        cash: { type: Number, required: true },
        holdings: [
          {
            symbol: { type: String, required: true, uppercase: true },
            companyName: { type: String, default: "" },
            shares: { type: Number, required: true, min: 0 },
            averageCost: { type: Number, required: true, min: 0 },
            totalInvested: { type: Number, required: true, min: 0 },
          },
        ],
        joinedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

tournamentSchema.index({ status: 1, startDate: 1 });
tournamentSchema.index({ "participants.userId": 1 });

module.exports = mongoose.model("Tournament", tournamentSchema);