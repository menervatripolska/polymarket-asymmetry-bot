# Railway Deployment

## Required settings

- Runtime: Node.js 20+
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Healthcheck path: `/health`

## Environment variables

### Platform

- `PORT`: Railway injects this automatically. Local default is `3000`.
- `HOST`: Bind host. Use `0.0.0.0`.
- `NODE_ENV`: Set to `production` on Railway.
- `LOG_LEVEL`: `debug`, `info`, `warn`, or `error`.

### Scan cadence

- `ENABLE_AUTO_SCAN`: `true` or `false`
- `SCAN_INTERVAL_MS`: automatic rescan interval in milliseconds
- `REQUEST_TIMEOUT_MS`: outbound HTTP timeout

### Public Polymarket endpoints

- `POLYMARKET_GAMMA_BASE_URL`: default `https://gamma-api.polymarket.com`
- `POLYMARKET_MARKETS_PATH`: default `/markets`
- `POLYMARKET_EVENTS_PATH`: default `/events`
- `POLYMARKET_MARKET_LIMIT`: max markets fetched per scan

### Guardrail tuning

- `MIN_LIQUIDITY_USD`
- `MIN_VOLUME_24H_USD`
- `MAX_SPREAD_BPS`
- `MIN_DAYS_TO_CLOSE`
- `MAX_DAYS_TO_CLOSE`
- `MIN_NET_EDGE_BPS`
- `FAMILY_SOFT_CAP`
- `FAMILY_HARD_CAP`

## Recommended first deploy

- Keep `ENABLE_AUTO_SCAN=true`
- Use one replica
- Start with the defaults from `.env.example`
- Review `/scan` output before changing thresholds

## Observability

The service logs JSON lines to stdout, which works well with Railway log streaming. No persistent disk is required for the MVP.

