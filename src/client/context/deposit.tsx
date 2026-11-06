import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api, load } from "@client/api";
import type { DepositRate, DepositTransaction, Group, InterestSummary, Member } from "@arthurzakharov/family-budget-be-client";

type DepositData = {
  groups: Group[];
  members: Member[];
  // Only the transactions of groups this user may see; the server leaves out the rest.
  transactions: DepositTransaction[];
  rates: DepositRate[];
  // Worked out by the server on the whole deposit, narrowed to the user's groups
  interest: InterestSummary;
  setTransactions: (transactions: DepositTransaction[]) => void;
  setRates: (rates: DepositRate[]) => void;
};

const noInterest: InterestSummary = { balance: 0, payouts: [], gross: 0, tax: 0, net: 0, pending: 0, byGroup: {} };

const DepositContext = createContext<DepositData | null>(null);

// Loads the deposit once for all of its tabs, so switching tabs needs no new requests.
export function DepositProvider({ children }: { children: ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [transactions, setTransactions] = useState<DepositTransaction[]>([]);
  const [rates, setRates] = useState<DepositRate[]>([]);
  const [interest, setInterest] = useState<InterestSummary>(noInterest);

  useEffect(() => {
    load(api.groups.$get(), setGroups);
    load(api.members.$get(), setMembers);
    load(api.deposit.transactions.$get(), setTransactions);
    load(api.deposit.rates.$get(), setRates);
  }, []);

  // Any change to the transactions or rates changes the interest, so ask the server again.
  // Answers to earlier requests that arrive late are ignored.
  useEffect(() => {
    let latest = true;
    load(api.deposit.interest.$get(), data => latest && setInterest(data));
    return () => {
      latest = false;
    };
  }, [transactions, rates]);

  return (
    <DepositContext value={{ groups, members, transactions, rates, interest, setTransactions, setRates }}>
      {children}
    </DepositContext>
  );
}

export function useDeposit() {
  const context = useContext(DepositContext);
  if (!context) throw new Error("useDeposit must be used inside DepositProvider");
  return context;
}
