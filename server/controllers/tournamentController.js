const Tournament = require("../models/Tournament");
const TournamentTrade = require("../models/TournamentTrade");
const { getStockPrice } = require("../services/priceService");

// @desc    Create a new tournament
// @route   POST /api/tournaments
const createTournament = async (req, res) => {
  try {
    const { name, description, startingCapital, startDate, endDate, isPublic } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ message: "Name, startDate and endDate are required" });
    }
    if (new Date(endDate) <= new Date(startDate)) {
      return res.status(400).json({ message: "endDate must be after startDate" });
    }

    const tournament = await Tournament.create({
      name,
      description,
      startingCapital: startingCapital || 100000,
      startDate,
      endDate,
      isPublic: isPublic !== false,
      createdBy: req.user._id,
      status: new Date(startDate) > new Date() ? "UPCOMING" : "ACTIVE",
    });

    res.status(201).json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    List tournaments (public ones, plus ones I've joined)
// @route   GET /api/tournaments
const getTournaments = async (req, res) => {
  try {
    await refreshStatuses();

    const tournaments = await Tournament.find({
      $or: [{ isPublic: true }, { "participants.userId": req.user._id }],
    })
      .select("-participants.holdings")
      .sort({ createdAt: -1 });

    const withMeta = tournaments.map((t) => ({
      _id: t._id,
      name: t.name,
      description: t.description,
      startingCapital: t.startingCapital,
      startDate: t.startDate,
      endDate: t.endDate,
      status: t.status,
      isPublic: t.isPublic,
      participantCount: t.participants.length,
      isJoined: t.participants.some((p) => p.userId.toString() === req.user._id.toString()),
    }));

    res.status(200).json(withMeta);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a tournament
// @route   POST /api/tournaments/:id/join
const joinTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    if (tournament.status === "ENDED") {
      return res.status(400).json({ message: "This tournament has already ended" });
    }

    const alreadyJoined = tournament.participants.some(
      (p) => p.userId.toString() === req.user._id.toString()
    );
    if (alreadyJoined) {
      return res.status(400).json({ message: "You already joined this tournament" });
    }

    tournament.participants.push({
      userId: req.user._id,
      username: req.user.username,
      cash: tournament.startingCapital,
      holdings: [],
    });

    await tournament.save();
    res.status(201).json({ message: `Joined ${tournament.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single tournament + my participant state
// @route   GET /api/tournaments/:id
const getTournamentDetail = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    const myEntry = tournament.participants.find(
      (p) => p.userId.toString() === req.user._id.toString()
      
    );
    

    let myPortfolio = null;
    if (myEntry) {
      const enrichedHoldings = await Promise.all(
        myEntry.holdings.map(async (h) => {
          try {
            const quote = await getStockPrice(h.symbol);
            const currentValue = quote.price * h.shares;
            return {
              ...h._doc,
              currentPrice: quote.price,
              currentValue,
              unrealizedPnL: (quote.price - h.averageCost) * h.shares,
            };
          } catch (err){
            console.log(`Price fetch failed for ${h.symbol} in tournament:`, err.message);
            return { ...h._doc, currentPrice: null, currentValue: h.totalInvested };
          }
        })
      );
      const investedValue = enrichedHoldings.reduce((s, h) => s + h.currentValue, 0);
      myPortfolio = {
        cash: myEntry.cash,
        holdings: enrichedHoldings,
        totalValue: myEntry.cash + investedValue,
      };
    }

    res.status(200).json({
      _id: tournament._id,
      name: tournament.name,
      description: tournament.description,
      startingCapital: tournament.startingCapital,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      status: tournament.status,
      isJoined: !!myEntry,
      myPortfolio,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Buy stock inside a tournament
// @route   POST /api/tournaments/:id/buy
const tournamentBuy = async (req, res) => {
  try {
    const { symbol, shares } = req.body;
    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ message: "Valid symbol and shares required" });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    if (tournament.status === "ENDED") {
      return res.status(400).json({ message: "Tournament has ended, trading is closed" });
    }

    const participant = tournament.participants.find(
      (p) => p.userId.toString() === req.user._id.toString()
    );
    if (!participant) return res.status(400).json({ message: "You haven't joined this tournament" });

    const quote = await getStockPrice(symbol.toUpperCase());
    const totalCost = quote.price * shares;

    if (participant.cash < totalCost) {
      return res.status(400).json({
        message: `Insufficient tournament balance. Need $${totalCost.toFixed(2)}, have $${participant.cash.toFixed(2)}`,
      });
    }

    const existingIndex = participant.holdings.findIndex((h) => h.symbol === symbol.toUpperCase());

    if (existingIndex >= 0) {
      const existing = participant.holdings[existingIndex];
      const newTotalInvested = existing.totalInvested + totalCost;
      const newShares = existing.shares + shares;
      participant.holdings[existingIndex].shares = newShares;
      participant.holdings[existingIndex].averageCost = newTotalInvested / newShares;
      participant.holdings[existingIndex].totalInvested = newTotalInvested;
    } else {
      participant.holdings.push({
        symbol: symbol.toUpperCase(),
        companyName: quote.companyName,
        shares,
        averageCost: quote.price,
        totalInvested: totalCost,
      });
    }

    participant.cash -= totalCost;
    await tournament.save();

    await TournamentTrade.create({
      tournamentId: tournament._id,
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      type: "BUY",
      shares,
      price: quote.price,
      total: totalCost,
      realizedPnL: 0,
    });

    res.status(201).json({ message: `Bought ${shares} shares of ${symbol.toUpperCase()}`, cashRemaining: participant.cash });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sell stock inside a tournament
// @route   POST /api/tournaments/:id/sell
const tournamentSell = async (req, res) => {
  try {
    const { symbol, shares } = req.body;
    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ message: "Valid symbol and shares required" });
    }

    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });
    if (tournament.status === "ENDED") {
      return res.status(400).json({ message: "Tournament has ended, trading is closed" });
    }

    const participant = tournament.participants.find(
      (p) => p.userId.toString() === req.user._id.toString()
    );
    if (!participant) return res.status(400).json({ message: "You haven't joined this tournament" });

    const holdingIndex = participant.holdings.findIndex((h) => h.symbol === symbol.toUpperCase());
    if (holdingIndex < 0) return res.status(400).json({ message: `You don't own any ${symbol}` });

    const holding = participant.holdings[holdingIndex];
    if (holding.shares < shares) {
      return res.status(400).json({ message: `You only have ${holding.shares} shares of ${symbol}` });
    }

    const quote = await getStockPrice(symbol.toUpperCase());
    const totalProceeds = quote.price * shares;
    const realizedPnL = (quote.price - holding.averageCost) * shares;

    if (holding.shares === shares) {
      participant.holdings.splice(holdingIndex, 1);
    } else {
      participant.holdings[holdingIndex].shares -= shares;
      participant.holdings[holdingIndex].totalInvested =
        participant.holdings[holdingIndex].averageCost * participant.holdings[holdingIndex].shares;
    }

    participant.cash += totalProceeds;
    await tournament.save();

    await TournamentTrade.create({
      tournamentId: tournament._id,
      userId: req.user._id,
      symbol: symbol.toUpperCase(),
      type: "SELL",
      shares,
      price: quote.price,
      total: totalProceeds,
      realizedPnL,
    });

    res.status(201).json({ message: `Sold ${shares} shares of ${symbol.toUpperCase()}`, realizedPnL, cashRemaining: participant.cash });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leaderboard — ranked by total return %
// @route   GET /api/tournaments/:id/leaderboard
const getLeaderboard = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ message: "Tournament not found" });

    const ranked = await Promise.all(
      tournament.participants.map(async (p) => {
        let investedValue = 0;
        for (const h of p.holdings) {
          try {
            const quote = await getStockPrice(h.symbol);
            investedValue += quote.price * h.shares;
          } catch {
            investedValue += h.totalInvested;
          }
        }
        const totalValue = p.cash + investedValue;
        const totalReturn = totalValue - tournament.startingCapital;
        const totalReturnPercent = (totalReturn / tournament.startingCapital) * 100;

        return {
          userId: p.userId,
          username: p.username,
          totalValue,
          totalReturn,
          totalReturnPercent,
          holdingsCount: p.holdings.length,
        };
      })
    );

    ranked.sort((a, b) => b.totalReturnPercent - a.totalReturnPercent);
    ranked.forEach((r, i) => (r.rank = i + 1));

    res.status(200).json(ranked);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// helper — flips UPCOMING -> ACTIVE -> ENDED based on current date
async function refreshStatuses() {
  const now = new Date();
  await Tournament.updateMany(
    { status: "UPCOMING", startDate: { $lte: now } },
    { $set: { status: "ACTIVE" } }
  );
  await Tournament.updateMany(
    { status: { $in: ["UPCOMING", "ACTIVE"] }, endDate: { $lte: now } },
    { $set: { status: "ENDED" } }
  );
}

module.exports = {
  createTournament,
  getTournaments,
  joinTournament,
  getTournamentDetail,
  tournamentBuy,
  tournamentSell,
  getLeaderboard,
};