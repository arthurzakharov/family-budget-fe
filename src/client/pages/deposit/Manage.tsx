import { useState } from "react";
import { formatCents } from "@client/utils/format";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useDeposit } from "@client/context/deposit";
import { RateForm } from "@client/components/deposit/RateForm";
import { RateTable } from "@client/components/deposit/RateTable";
import { TransactionForm } from "@client/components/deposit/TransactionForm";
import { TransactionTable } from "@client/components/deposit/TransactionTable";
import { Message, Section } from "@client/components/ui";
import type { DepositRate, DepositTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting rates and transactions. Only for admins and contributors.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, transactions, rates } = useDeposit();
  const [editingRate, setEditingRate] = useState<DepositRate | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<DepositTransaction | null>(null);
  // Success messages; the forms stay on this tab and are emptied after adding.
  const [rateNotice, setRateNotice] = useState<string | null>(null);
  const [transactionNotice, setTransactionNotice] = useState<string | null>(null);
  // Deleting a transaction changes the interest, which the server works out.
  const remove = useDeleteMutation(
    queries.depositTransactions,
    id => request(api.deposit.transactions[":id"].$delete({ param: { id } })),
    { invalidates: [queries.depositInterest.queryKey] },
  );

  // The forms have already put the saved record in the lists.
  const onRateSaved = () => {
    setRateNotice(editingRate ? "common.saved" : "rates.added");
    setEditingRate(null);
  };

  const onTransactionSaved = () => {
    setTransactionNotice(editingTransaction ? "common.saved" : "transactions.added");
    setEditingTransaction(null);
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
    try {
      await remove.mutateAsync(tx.id);
    } catch {
      return; // shown from remove.error
    }
    if (editingTransaction?.id === tx.id) setEditingTransaction(null);
  };

  return (
    <>
      <Section title={editingRate ? t("common.edit") : t("rates.add")}>
        <Message success={rateNotice} />
        {/* The keys remount the forms so they follow the record being edited. */}
        <RateForm
          key={editingRate?.id ?? "new"}
          editing={editingRate}
          members={members}
          onSaved={onRateSaved}
          onCancel={() => editRate(null)}
        />
      </Section>
      <Section title={t("rates.title")}>
        <RateTable rates={rates} members={members} onEdit={editRate} editingId={editingRate?.id} />
      </Section>

      <Section title={editingTransaction ? t("common.edit") : t("transactions.add")}>
        <Message success={transactionNotice} />
        <TransactionForm
          key={editingTransaction?.id ?? "new"}
          editing={editingTransaction}
          groups={groups}
          members={members}
          onSaved={onTransactionSaved}
          onCancel={() => editTransaction(null)}
        />
      </Section>
      <Section title={t("transactions.title")}>
        <Message error={errorCode(remove.error)} />
        <TransactionTable
          transactions={transactions}
          groups={groups}
          members={members}
          onEdit={editTransaction}
          onDelete={onDelete}
          editingId={editingTransaction?.id}
        />
      </Section>
    </>
  );
}
