import { useState } from "react";
import { formatCents } from "@client/utils/format";
import { api, call } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useDeposit } from "@client/context/deposit";
import { RateForm } from "@client/components/deposit/RateForm";
import { RateTable } from "@client/components/deposit/RateTable";
import { TransactionForm } from "@client/components/deposit/TransactionForm";
import { TransactionTable } from "@client/components/deposit/TransactionTable";
import type { DepositRate, DepositTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting rates and transactions. Only for admins and contributors.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, transactions, rates, setTransactions, setRates } = useDeposit();
  const [editingRate, setEditingRate] = useState<DepositRate | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<DepositTransaction | null>(null);
  // Success messages; the forms stay on this tab and are emptied after adding.
  const [rateNotice, setRateNotice] = useState<string | null>(null);
  const [transactionNotice, setTransactionNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onRateSaved = (saved: DepositRate) => {
    if (editingRate) {
      setRates(rates.map(r => (r.id === saved.id ? saved : r)));
      setEditingRate(null);
      setRateNotice("common.saved");
    } else {
      setRates([...rates, saved]);
      setRateNotice("rates.added");
    }
  };

  const onTransactionSaved = (saved: DepositTransaction) => {
    if (editingTransaction) {
      setTransactions(transactions.map(tx => (tx.id === saved.id ? saved : tx)));
      setEditingTransaction(null);
      setTransactionNotice("common.saved");
    } else {
      setTransactions([...transactions, saved]);
      setTransactionNotice("transactions.added");
    }
  };

  const editRate = (rate: DepositRate | null) => {
    setEditingRate(rate);
    setRateNotice(null);
  };

  const editTransaction = (tx: DepositTransaction | null) => {
    setEditingTransaction(tx);
    setTransactionNotice(null);
  };

  const onDelete = async (tx: DepositTransaction) => {
    const message = tx.type === "withdrawal" ? "transactions.confirmDeleteWithdrawal" : "transactions.confirmDeleteDeposit";
    if (!confirm(t(message, { amount: formatCents(tx.amountCents), date: tx.date }))) return;
    const result = await call(api.deposit.transactions[":id"].$delete({ param: { id: tx.id } }));
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setDeleteError(null);
    setTransactions(transactions.filter(x => x.id !== tx.id));
    if (editingTransaction?.id === tx.id) setEditingTransaction(null);
  };

  return (
    <>
      <h2>{t("rates.title")}</h2>
      {/* The keys remount the forms so they empty after adding and follow the record being edited. */}
      <RateForm
        key={`rate-${editingRate?.id ?? `new-${rates.length}`}`}
        editing={editingRate}
        members={members}
        onSaved={onRateSaved}
        onCancel={() => editRate(null)}
      />
      {rateNotice && <p className="success">{t(rateNotice)}</p>}
      <RateTable rates={rates} members={members} onEdit={editRate} editingId={editingRate?.id} />

      <h2>{t("transactions.title")}</h2>
      <TransactionForm
        key={`transaction-${editingTransaction?.id ?? `new-${transactions.length}`}`}
        editing={editingTransaction}
        groups={groups}
        members={members}
        onSaved={onTransactionSaved}
        onCancel={() => editTransaction(null)}
      />
      {transactionNotice && <p className="success">{t(transactionNotice)}</p>}
      {deleteError && <p className="error">{t(deleteError)}</p>}
      <TransactionTable
        transactions={transactions}
        groups={groups}
        members={members}
        onEdit={editTransaction}
        onDelete={onDelete}
        editingId={editingTransaction?.id}
      />
    </>
  );
}
