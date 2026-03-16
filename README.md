# Polymarket Asymmetry Bot MVP

Safe MVP for a Railway-deployable Polymarket scanner. It ingests public Polymarket Gamma data, normalizes markets and events, applies conservative heuristic modules, scores candidate asymmetry setups, and exposes HTTP endpoints for health, config, and scan results.

This repository does **not** place orders and contains **no secrets**. It is structured so a later CLOB/relayer execution layer can be added without rewriting the ingestion and decision surfaces.

## MVP scope

- Public data only via Gamma/public endpoints
- Rule-based asymmetry scoring instead of predictive trading
- Conservative guardrails:
  - stale-book detector stub
  - duplicate suppressor stub
  - event-family cap logic
  - liquidity gate
  - resolution filter
  - fee-aware placeholder
- HTTP API for health, config, scan state, and manual rescans
- Railway-ready `PORT` binding and stateless runtime design

## Project structure

```text
src/
  clients/        Public Polymarket API client
  config/         Typed env loading
  domain/         Domain models and scan result types
  execution/      Future live-trading boundary
  http/           Lightweight HTTP server and routing
  logging/        JSON logger
  modules/        Heuristic modules and scoring pipeline
  services/       Scan orchestration and lifecycle
  utils/          Parsing and time helpers
docs/
  railway.md      Deployment and env vars
  live-trading.md Future CLOB/relayer integration notes
```

## Endpoints

- `GET /health` - liveness and last scan state
- `GET /config` - sanitized runtime config
- `GET /scan` - cached latest scan result
- `POST /scan/run` - trigger a fresh scan
- `GET /` - service summary

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

The service auto-loads `.env` on startup with no extra dependency.

3. Run locally:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
npm start
```

## Railway deployment

Railway can detect the app as a standard Node service.

- Build command: `npm install && npm run build`
- Start command: `npm start`
- Healthcheck path: `/health`

Set environment variables from [.env.example](/C:/Users/mener/.openclaw/workspace/polymarket-asymmetry-bot/.env.example). The service already honors Railway's injected `PORT`.

See [railway.md](/C:/Users/mener/.openclaw/workspace/polymarket-asymmetry-bot/docs/railway.md) for the full list.

## Current heuristic model

The scanner computes a conservative opportunity score from public metadata only. It is intentionally biased toward false negatives over false positives.

Score inputs:

- normalized liquidity
- recent volume
- days to market close
- resolution clarity
- category/family crowding
- placeholder fee penalty
- spread proxy from public price fields when available

Because this MVP does not ingest live CLOB orderbooks yet:

- stale-book detection is a stub that uses metadata freshness proxies
- duplicate suppression is intent-oriented and scan-local
- fee handling is a placeholder heuristic, not venue-exact execution math
- opportunities are research candidates, not executable trade instructions

## Future live trading integration

Add later, behind explicit feature flags:

1. CLOB orderbook + websocket market data ingestion
2. authenticated wallet and signer handling
3. relayer/gasless execution support
4. order manager, cancel/replace, and reconciliation
5. persistent state store for intents, fills, and exposure

See [live-trading.md](/C:/Users/mener/.openclaw/workspace/polymarket-asymmetry-bot/docs/live-trading.md).

## Safety notes

- No secrets are committed.
- No live trading paths are enabled.
- No assumptions are made about profitability.
- The default thresholds are intentionally conservative.
