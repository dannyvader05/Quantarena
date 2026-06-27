require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const tradingRoutes = require("./routes/trading");
const analyticsRoutes = require("./routes/analytics");
const watchlistRoutes = require("./routes/watchlist");
const { initSocket } = require("./socket/socketServer");

connectDB();

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/trading", tradingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/watchlist", watchlistRoutes);

app.get("/", (req, res) => {
  res.json({ message: "QuantArena API running" });
});

initSocket(server);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});