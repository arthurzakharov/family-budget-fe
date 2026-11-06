import { useState } from "react";
import { api, call } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { CryptoTransactionForm } from "@client/components/crypto/CryptoTransactionForm";
import { CryptoTransactionTable } from "@client/components/crypto/CryptoTransactionTable";
import type { CryptoTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting buys and sells. Only for admins and contributors,
// and only within the groups they may see.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, coins, transactions, setTransactions } = useCrypto();
  const [editing, setEditing] = useState<CryptoTransaction | null>(null);
  // Success message; the form stays on this tab and is emptied after adding.
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onSaved = (saved: CryptoTransaction) => {
    if (editing) {
      setTransactions(transactions.map(tx => (tx.id === saved.id ? saved : tx)));
      setEditing(null);
      setNotice("common.saved");
    } else {
      setTransactions([...transactions, saved]);
      setNotice("transactions.added");
    }
  };

  const edit = (tx: CryptoTransaction | null) => {
    setEditing(tx);
    setNotice(null);
  };

  const onDelete = async (tx: CryptoTransaction) => {
    const message = tx.type === "sell" ? "crypto.confirmDeleteSell" : "crypto.confirmDeleteBuy";
    if (!confirm(t(message, { amount: tx.amount, coin: tx.coin, date: tx.date }))) return;
    const result = await call(api.crypto.transactions[":id"].$delete({ param: { id: tx.id } }));
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setDeleteError(null);
    setTransactions(transactions.filter(x => x.id !== tx.id));
    if (editing?.id === tx.id) setEditing(null);
  };

  return (
    <>
      <h2>{t("transactions.title")}</h2>
      {/* The key remounts the form so it empties after adding and follows the record being edited. */}
      <CryptoTransactionForm
        key={`crypto-${editing?.id ?? `new-${transactions.length}`}`}
        editing={editing}
        groups={groups}
        members={members}
        coins={coins}
        onSaved={onSaved}
        onCancel={() => edit(null)}
      />
      {notice && <p className="success">{t(notice)}</p>}
      {deleteError && <p className="error">{t(deleteError)}</p>}
      <CryptoTransactionTable
        transactions={transactions}
        groups={groups}
        members={members}
        onEdit={edit}
        onDelete={onDelete}
        editingId={editing?.id}
      />
    </>
  );
}
