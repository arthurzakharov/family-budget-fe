import type { DepositTransaction } from "@arthurzakharov/family-budget-be-client";

// Deposits add to the balance, withdrawals take from it. In cents.
export const signedAmount = (t: DepositTransaction) => (t.type === "withdrawal" ? -t.amountCents : t.amountCents);
