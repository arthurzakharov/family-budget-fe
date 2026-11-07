import { useState } from "react";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { CryptoTransactionForm } from "@client/components/crypto/CryptoTransactionForm";
import { CryptoTransactionTable } from "@client/components/crypto/CryptoTransactionTable";
import { Message, Section } from "@client/components/ui";
import type { CryptoTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting buys and sells. Only for admins and contributors,
// and only within the groups they may see.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, coins, transactions } = useCrypto();
  const [editing, setEditing] = useState<CryptoTransaction | null>(null);
  // Success message; the form stays on this tab and is emptied after adding.
  const [notice, setNotice] = useState<string | null>(null);
  const remove = useDeleteMutation(queries.cryptoTransactions, id =>
    request(api.crypto.transactions[":id"].$delete({ param: { id } })),
  );

  // The form has already put the saved record in the list.
  const onSaved = () => {
    setNotice(editing ? "common.saved" : "transactions.added");
    setEditing(null);
  };

  const edit = (tx: CryptoTransaction | null) => {
    setEditing(tx);
    setNotice(null);
  };

  const onDelete = async (tx: CryptoTransaction) => {
    const message = tx.type === "sell" ? "crypto.confirmDeleteSell" : "crypto.confirmDeleteBuy";
    if (!confirm(t(message, { amount: tx.amount, coin: tx.coin, date: tx.date }))) return;
    try {
      await remove.mutateAsync(tx.id);
    } catch {
      return; // shown from remove.error
    }
    if (editing?.id === tx.id) setEditing(null);
  };

  return (
    <>
      <Section title={editing ? t("common.edit") : t("transactions.add")}>
        <Message success={notice} />
        {/* The key remounts the form so it follows the record being edited. */}
        <CryptoTransactionForm
          key={editing?.id ?? "new"}
          editing={editing}
          groups={groups}
          members={members}
          coins={coins}
          onSaved={onSaved}
          onCancel={() => edit(null)}
        />
      </Section>
      <Section title={t("transactions.title")}>
        <Message error={errorCode(remove.error)} />
        <CryptoTransactionTable
          transactions={transactions}
          groups={groups}
          members={members}
          onEdit={edit}
          onDelete={onDelete}
          editingId={editing?.id}
        />
      </Section>
    </>
  );
}
