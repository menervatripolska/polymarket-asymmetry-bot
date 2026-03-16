import { AppConfig, Market, MarketEvent } from "../domain/types.js";
import { asArray, asBoolean, asNumber, asString } from "../utils/parse.js";

export class GammaClient {
  constructor(private readonly config: AppConfig) {}

  async fetchMarkets(): Promise<Market[]> {
    const url = new URL(this.config.polymarket.marketsPath, this.config.polymarket.gammaBaseUrl);
    url.searchParams.set("limit", String(this.config.polymarket.marketLimit));
    url.searchParams.set("active", "true");
    url.searchParams.set("closed", "false");

    const data = await this.fetchJson(url.toString());
    return asArray<Record<string, unknown>>(data).map((item) => normalizeMarket(item));
  }

  async fetchEvents(): Promise<MarketEvent[]> {
    const url = new URL(this.config.polymarket.eventsPath, this.config.polymarket.gammaBaseUrl);
    url.searchParams.set("limit", String(this.config.polymarket.marketLimit));

    const data = await this.fetchJson(url.toString());
    return asArray<Record<string, unknown>>(data).map((item) => ({
      id: asString(item.id) ?? asString(item.slug) ?? crypto.randomUUID(),
      title: asString(item.title) ?? asString(item.name) ?? "Untitled event",
      slug: asString(item.slug),
      category: asString(item.category),
      startDate: asString(item.startDate) ?? asString(item.start_time),
      endDate: asString(item.endDate) ?? asString(item.end_time),
    }));
  }

  private async fetchJson(url: string): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMs);
    try {
      const response = await fetch(url, {
        headers: {
          accept: "application/json",
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Gamma request failed: ${response.status} ${response.statusText}`);
      }
      return await response.json();
    } finally {
      clearTimeout(timeout);
    }
  }
}

function normalizeMarket(item: Record<string, unknown>): Market {
  const question = asString(item.question) ?? asString(item.title) ?? "Unknown market";
  const closeTime =
    asString(item.endDate) ??
    asString(item.end_date_iso) ??
    asString(item.closedTime) ??
    asString(item.closeTime);
  const bestBid = maybePrice(item.bestBid);
  const bestAsk = maybePrice(item.bestAsk);
  const spreadBps = bestBid !== undefined && bestAsk !== undefined && bestAsk > 0
    ? ((bestAsk - bestBid) / bestAsk) * 10000
    : undefined;
  const eventId = asString(item.eventId) ?? asString(item.event_id) ?? asString(item.parentEventId);
  const eventTitle = asString(item.eventTitle) ?? asString(item.event_name) ?? asString(item.series);
  const familyKey = buildFamilyKey(question, eventTitle, eventId, asString(item.category));

  return {
    id: asString(item.id) ?? asString(item.conditionId) ?? asString(item.slug) ?? crypto.randomUUID(),
    question,
    slug: asString(item.slug),
    active: asBoolean(item.active, true),
    closed: asBoolean(item.closed, false),
    archived: asBoolean(item.archived, false),
    category: asString(item.category),
    eventId,
    eventTitle,
    familyKey,
    liquidityUsd: asNumber(item.liquidity, asNumber(item.liquidityNum, 0)),
    volume24hUsd: asNumber(item.volume24hr, asNumber(item.volume24h, 0)),
    volumeTotalUsd: asNumber(item.volume, 0),
    bestBid,
    bestAsk,
    lastTradePrice: maybePrice(item.lastTradePrice),
    yesPrice: maybePrice(item.outcomePrice),
    noPrice: maybePrice(item.noPrice),
    spreadBps,
    closeTime,
    endDate: asString(item.endDate),
    createdAt: asString(item.createdAt),
    updatedAt: asString(item.updatedAt) ?? asString(item.lastUpdated),
    resolutionSource: asString(item.resolutionSource) ?? asString(item.oracle),
    description: asString(item.description),
    outcomes: asArray<string>(item.outcomes),
    raw: item,
  };
}

function maybePrice(value: unknown): number | undefined {
  const parsed = asNumber(value, Number.NaN);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildFamilyKey(
  question: string,
  eventTitle?: string,
  eventId?: string,
  category?: string,
): string {
  const base = eventId ?? eventTitle ?? question;
  return `${category ?? "uncategorized"}:${base}`
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

