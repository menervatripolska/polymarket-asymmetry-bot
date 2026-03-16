# Future Live Trading Integration

This MVP deliberately stops at public-data scanning. To extend it into a live bot, keep the current scanner as the research and policy layer and add execution as a separate subsystem.

## Planned additions

### 1. Public market microstructure

- CLOB orderbook snapshots
- websocket streams for freshness and queue drift
- better spread, depth, and stale-book detection

### 2. Authenticated execution

- signer and wallet management
- relayer or direct CLOB order placement
- cancel/replace state machine
- idempotent client order IDs

### 3. Persistent state

- intents
- open orders
- fills
- market and family exposure
- reconciliation logs

### 4. Risk controls to make real

- exact duplicate suppressor across restarts
- exact fee and slippage model
- per-market and per-family capital caps
- kill switches on reconciliation mismatch

## Suggested environment variables for a future live layer

Do not add these until execution is implemented:

- `POLYMARKET_CLOB_BASE_URL`
- `POLYMARKET_WS_URL`
- `POLYMARKET_PRIVATE_KEY`
- `POLYMARKET_PROXY_ADDRESS`
- `POLYMARKET_FUNDER`
- `ENABLE_LIVE_TRADING`
- `DRY_RUN`
- `MAX_ORDER_NOTIONAL_USD`
- `MAX_FAMILY_EXPOSURE_USD`

## Integration boundary

Keep this contract stable:

- scanner produces normalized candidates
- policy engine produces allow, reduce, or reject decisions
- execution consumes approved intents only

That separation reduces the chance of mixing data bugs with execution bugs.

