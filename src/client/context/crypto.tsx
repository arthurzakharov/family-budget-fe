import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, load } from "@client/api";
import { latestPrices, type Prices } from "@shared/crypto";
import type { CoinSymbol, CryptoTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type CryptoData = {
  groups: Group[];
  members: Member[];
  // Coins the admin has made available for new records
  coins: CoinSymbol[];
  // Only the records of groups this user may see; the server leaves out the rest.
  transactions: CryptoTransaction[];
  // What each coin is worth now. For now: the price it was last traded at.
  prices: Prices;
  setCoins: (coins: CoinSymbol[]) => void;
  setTransactions: (transactions: CryptoTransaction[]) => void;
};

const CryptoContext = createContext<CryptoData | null>(null);

// Loads the crypto page once for all of its tabs, so switching tabs needs no new requests.
export function CryptoProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [coins, setCoins] = useState<CoinSymbol[]>([]);
  const [transactions, setTransactions] = useState<CryptoTransaction[]>([]);

  useEffect(() => {
    load(api.groups.$get(), setGroups);
    load(api.members.$get(), setMembers);
    load(api.crypto.coins.$get(), setCoins);
    load(api.crypto.transactions.$get(), setTransactions);
  }, []);

  // Live prices will replace this later.
  const prices = latestPrices(transactions);

  return (
    <CryptoContext value={{ groups, members, coins, transactions, prices, setCoins, setTransactions }}>
      {children}
    </CryptoContext>
  );
}

export function useCrypto() {
  const context = useContext(CryptoContext);
  if (!context) throw new Error("useCrypto must be used inside CryptoProvider");
  return context;
}
