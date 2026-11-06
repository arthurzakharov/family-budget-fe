import type { CoinSymbol, CryptoTransaction } from "@arthurzakharov/family-budget-be-client";

// The coins the admin can choose from, by market capitalisation (the backend's list, with names).
export const COINS: { symbol: CoinSymbol; name: string }[] = [
  { symbol: "BTC", name: "Bitcoin" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "USDT", name: "Tether" },
  { symbol: "XRP", name: "XRP" },
  { symbol: "BNB", name: "BNB" },
  { symbol: "SOL", name: "Solana" },
  { symbol: "USDC", name: "USD Coin" },
  { symbol: "DOGE", name: "Dogecoin" },
  { symbol: "TRX", name: "TRON" },
  { symbol: "ADA", name: "Cardano" },
  { symbol: "LINK", name: "Chainlink" },
  { symbol: "XLM", name: "Stellar" },
  { symbol: "SUI", name: "Sui" },
  { symbol: "BCH", name: "Bitcoin Cash" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "HBAR", name: "Hedera" },
  { symbol: "LTC", name: "Litecoin" },
  { symbol: "TON", name: "Toncoin" },
  { symbol: "SHIB", name: "Shiba Inu" },
  { symbol: "DOT", name: "Polkadot" },
];

export const coinName = (symbol: string) => COINS.find(c => c.symbol === symbol)?.name ?? symbol;

// Crypto money stays in euros (not cents): prices need fractions of a cent.

// Coins: buys add, sells take away.
export const signedCoins = (t: CryptoTransaction) => (t.type === "sell" ? -t.amount : t.amount);

// Money: buys put money in, sells take it out.
export const signedMoney = (t: CryptoTransaction) => signedCoins(t) * t.price;

// The price each coin is worth now, keyed by symbol.
export type Prices = Record<string, number>;

// Until live prices are fetched, a coin is worth what it was last traded at.
export function latestPrices(transactions: CryptoTransaction[]): Prices {
  const prices: Prices = {};
  const dates: Record<string, string> = {};
  for (const t of transactions) {
    if (!(t.coin in dates) || t.date >= dates[t.coin]!) {
      dates[t.coin] = t.date;
      prices[t.coin] = t.price;
    }
  }
  return prices;
}

export type Holding = {
  // Coins bought, sold and still held
  bought: number;
  sold: number;
  held: number;
  // Money put in (buys minus sells)
  added: number;
  // What the coins still held are worth now
  value: number;
};

export type CryptoSummary = {
  byCoin: Record<string, Holding>;
  byGroup: Record<string, Holding & { coins: Record<string, number> }>;
  added: number;
  value: number;
};

const empty = (): Holding => ({ bought: 0, sold: 0, held: 0, added: 0, value: 0 });

// Adds up what each coin and each group holds and is worth at `prices`.
// `groupIds` lists groups to report even when they have no transactions yet.
export function summarizeCrypto(
  transactions: CryptoTransaction[],
  prices: Prices,
  groupIds: string[] = [],
): CryptoSummary {
  const byCoin: CryptoSummary["byCoin"] = {};
  const byGroup: CryptoSummary["byGroup"] = Object.fromEntries(groupIds.map(id => [id, { ...empty(), coins: {} }]));

  const add = (h: Holding, t: CryptoTransaction) => {
    if (t.type === "sell") h.sold += t.amount;
    else h.bought += t.amount;
    h.held += signedCoins(t);
    h.added += signedMoney(t);
  };

  for (const t of transactions) {
    add((byCoin[t.coin] ??= empty()), t);
    const group = (byGroup[t.groupId] ??= { ...empty(), coins: {} });
    add(group, t);
    group.coins[t.coin] = (group.coins[t.coin] ?? 0) + signedCoins(t);
  }

  for (const [coin, h] of Object.entries(byCoin)) h.value = h.held * (prices[coin] ?? 0);
  for (const g of Object.values(byGroup)) {
    g.value = Object.entries(g.coins).reduce((sum, [coin, held]) => sum + held * (prices[coin] ?? 0), 0);
  }

  const total = (key: "added" | "value") => Object.values(byCoin).reduce((sum, h) => sum + h[key], 0);
  return { byCoin, byGroup, added: total("added"), value: total("value") };
}
