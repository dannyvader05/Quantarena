# QuantArena

QuantArena is a full-stack, real-time trading simulation platform designed to replicate the competitive environment of financial markets. The platform enables users to participate in multiplayer investment tournaments, build and manage virtual portfolios, and compete on performance-based leaderboards.

Built using React, Express.js, MongoDB, and Socket.io, QuantArena leverages WebSocket-powered communication to deliver instant market updates, portfolio changes, and tournament rankings in real time.

## Key Features

* Real-time multiplayer trading environment
* Live market data simulation using WebSockets
* Portfolio creation and management
* Dynamic leaderboards and tournament rankings
* Performance analytics including P&L, Sharpe Ratio, and Drawdown
* Secure user authentication and session management
* Responsive and scalable full-stack architecture

## Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend

* Node.js
* Express.js
* Socket.io

### Database

* MongoDB

### Deployment

* Vercel
* Render

## Architecture

QuantArena follows a client-server architecture where the frontend communicates with backend services through REST APIs and persistent WebSocket connections. Socket.io is used to broadcast market events, trade executions, and leaderboard updates with minimal latency, ensuring all participants experience synchronized market conditions.

## Motivation

The project was built to combine concepts from software engineering, distributed systems, and quantitative finance into a practical application. It serves as a sandbox for experimenting with trading strategies, portfolio analytics, and real-time application design while providing users with a competitive and engaging experience.
