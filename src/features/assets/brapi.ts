export type Quote = {
  ticker: string;
  price: number | null;
  change: number | null;
  currency: string | null;
  shortName?: string | null;
  error?: string;
};

// Brapi public quote endpoint. Token opcional — sem token funciona com limites.
export async function fetchQuote(ticker: string): Promise<Quote> {
  const symbol = ticker.trim().toUpperCase();
  try {
    const res = await fetch(`https://brapi.dev/api/quote/${encodeURIComponent(symbol)}?range=1d&interval=1d`);
    if (!res.ok) {
      return { ticker: symbol, price: null, change: null, currency: null, error: `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { results?: Array<{ symbol: string; regularMarketPrice?: number; regularMarketChangePercent?: number; currency?: string; shortName?: string }> };
    const r = json.results?.[0];
    if (!r) return { ticker: symbol, price: null, change: null, currency: null, error: "Não encontrado" };
    return {
      ticker: r.symbol ?? symbol,
      price: r.regularMarketPrice ?? null,
      change: r.regularMarketChangePercent ?? null,
      currency: r.currency ?? "BRL",
      shortName: r.shortName ?? null,
    };
  } catch (e) {
    return { ticker: symbol, price: null, change: null, currency: null, error: (e as Error).message };
  }
}