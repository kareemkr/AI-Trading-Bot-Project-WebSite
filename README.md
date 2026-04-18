# AI Trading Bot

A public web platform for an automated, ML-powered crypto trading bot with technical indicators, strategy logic, risk controls, and a modern dashboard.

The project combines a Python/FastAPI backend, machine learning signal generation, trading execution modules, wallet/account flows, and a Next.js frontend for monitoring and interacting with the system.

## Overview

This bot is designed to scan live crypto market data, generate trading signals, and execute configurable rule-based plus machine learning strategies. It is built as a full-stack system rather than a notebook-only experiment, with API routes, database models, authentication, dashboards, and operational tooling.

Core areas include:

- Machine learning price movement prediction
- Technical indicator feature engineering
- Strategy engine and signal generation
- Position sizing and risk management
- Live market scanning
- Dashboard, bot controls, wallet views, and assistant UI

## Features

### Machine Learning Prediction

- Predicts short-term price movement from OHLCV-derived features
- Supports model training and inference workflows
- Designed to work with sklearn-style models and custom ML pipelines
- Includes feature engineering modules for market data

### Technical Indicators Engine

The strategy layer can use common technical indicators, including:

- EMA and SMA
- RSI
- MACD
- Bollinger Bands
- ATR
- Volume-based signals
- Volatility features

### Strategy and Signal Engine

- Hybrid rule-based plus ML signal generation
- Configurable strategy logic
- Market scanner for active pairs
- Backtesting and simulation support
- Demo trading flow for safer testing

### Trade Execution and Risk Management

- Automatic position sizing
- Long and short trade support
- Stop-loss and take-profit logic
- Configurable leverage controls
- Drawdown and loss-cooldown protections
- Exchange integration structure for live execution

### Full-Stack Dashboard

- Next.js frontend
- Bot control pages
- Market intelligence views
- Wallet and transaction UI
- Authentication and user account flow
- Assistant/chat interface for bot interaction
- Responsive landing page for public project presentation

## Tech Stack

### Backend

- Python
- FastAPI
- SQLAlchemy
- Alembic
- SQLite/PostgreSQL-ready database layer
- Redis/Mongo integration structure
- Machine learning modules
- Binance trading client structure

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Radix UI components
- Recharts
- Lucide icons

## Project Structure

```text
backend/
  app/
    api/          API routes
    models/       Database models
    services/     Trading, wallet, auth, news, and bot services
    ml/           ML training, features, scanner, and backtesting
    trading/      Risk, engine, executor, and exchange client
  alembic/        Database migrations
  scripts/        Verification and operational scripts

frontend/
  app/            Next.js app routes
  components/     UI, bot, dashboard, and wallet components
  lib/            API, auth, language, and utility helpers
  public/         Static assets
```

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` by default. The backend runs on the FastAPI/Uvicorn port, usually `http://localhost:8000`.

## Environment Variables

Before running in production, configure the required secrets and deployment settings.

| Variable | Description |
| --- | --- |
| `ENV` | Environment mode, for example `production`. |
| `JWT_SECRET` | Backend auth secret. Use a long random value. |
| `SESSION_SECRET` | Session middleware secret. |
| `ALLOWED_ORIGINS` | Allowed frontend domains for CORS. |
| `NEXT_PUBLIC_API_URL` | Public API URL used by the frontend. |
| `DATABASE_URL` | Database connection string when using PostgreSQL or another external database. |
| `BINANCE_API_KEY` | Exchange API key, if live exchange integration is enabled. |
| `BINANCE_SECRET_KEY` | Exchange secret key, if live exchange integration is enabled. |

Never commit real API keys, exchange secrets, JWT secrets, or private credentials.

## Validation

Frontend production build:

```bash
cd frontend
npm run build
```

Backend health check after starting the API:

```bash
GET /health
```

## Disclaimer

This project is for educational and research purposes only. Crypto trading is risky and can result in financial loss. Nothing in this repository is financial advice. Use live trading features only after careful testing, paper trading, and risk review.

## License and Commercial Use

No commercial license is granted unless written permission is provided by the author. If you want to use, review, or adapt this project for company work, contact me first.

## Author

Kareem Radwan

- LinkedIn: [kareem-radwan-11515b2a8](https://www.linkedin.com/in/kareem-radwan-11515b2a8)
- Email: [kareemradwan09@gmail.com](mailto:kareemradwan09@gmail.com)
