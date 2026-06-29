const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { getStockPrice } = require("../services/priceService");

let io;

const socketWatches = new Map();
const symbolWatchers = new Map();

let broadcastInterval = null;

const initSocket = (server) => {
  io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === "production"
      ? "https://quantarena-rho.vercel.app"
      : true,
    credentials: true,
  },
});

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No token provided"));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socketWatches.set(socket.id, new Set());

    socket.on("watch:symbols", (symbols) => {
      if (!Array.isArray(symbols)) return;

      const prevSet = socketWatches.get(socket.id) || new Set();
      prevSet.forEach((sym) => {
        symbolWatchers.get(sym)?.delete(socket.id);
      });

      const newSet = new Set(symbols.map((s) => s.toUpperCase()));
      socketWatches.set(socket.id, newSet);

      newSet.forEach((sym) => {
        if (!symbolWatchers.has(sym)) symbolWatchers.set(sym, new Set());
        symbolWatchers.get(sym).add(socket.id);
      });
    });

    socket.on("disconnect", () => {
      const watched = socketWatches.get(socket.id) || new Set();
      watched.forEach((sym) => {
        symbolWatchers.get(sym)?.delete(socket.id);
      });
      socketWatches.delete(socket.id);
    });
  });

  startBroadcastLoop();
  return io;
};

const startBroadcastLoop = () => {
  if (broadcastInterval) clearInterval(broadcastInterval);

  broadcastInterval = setInterval(async () => {
    const symbols = Array.from(symbolWatchers.keys());
    if (symbols.length === 0) return;

    for (const symbol of symbols) {
      const watchers = symbolWatchers.get(symbol);
      if (!watchers || watchers.size === 0) {
        symbolWatchers.delete(symbol);
        continue;
      }

      try {
        const quote = await getStockPrice(symbol);
        watchers.forEach((socketId) => {
          io.to(socketId).emit("price:update", {
            symbol,
            price: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            timestamp: Date.now(),
          });
        });
      } catch (err) {
        // symbol fetch failed this tick — skip silently, retry next tick
      }
    }
  }, 5000);
};

module.exports = { initSocket };