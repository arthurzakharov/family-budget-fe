import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { closedDialog, FormModal, type RecordDialog } from "@client/components/form";
import { CryptoTransactionForm } from "@client/components/crypto/CryptoTransactionForm";
import { CryptoTransactionTable } from "@client/components/crypto/CryptoTransactionTable";
import { Message, Section } from "@client/components/ui";
import type { CryptoTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting buys and sells. Only for admins and contributors, and only
// within the groups they may see. Adding and editing happen in a dialog; the tab shows the list.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, coins, transactions } = useCrypto();
  const [dialog, setDialog] = useState<RecordDialog<CryptoTransaction>>(closedDialog);
  // Success message, shown above the list
  const [notice, setNotice] = useState<string | null>(null);
  const remove = useDeleteMutation(queries.cryptoTransactions, id =>
    request(api.crypto.transactions[":id"].$delete({ param: { id } })),
  );

  const open = (record: CryptoTransaction | null) => {
    setNotice(null);
    setDialog({ open: true, record });
  };

  // The form has already put the saved record in the list.
  const onSaved = () => {
    setNotice(dialog.record ? "common.saved" : "transactions.added");
    setDialog(d => ({ ...d, open: false }));
  };

  const onDelete = async (tx: CryptoTransaction) => {
    const message = tx.type === "sell" ? "crypto.confirmDeleteSell" : "crypto.confirmDeleteBuy";
    if (!confirm(t(message, { amount: tx.amount, coin: tx.coin, date: tx.date }))) return;
    setNotice(null);
    await remove.mutateAsync(tx.id).catch(() => {}); // a failure is shown from remove.error
  };

  return (
    <>
      <Section
        title={t("transactions.title")}
        actions={
          <Button onPress={() => open(null)}>
            <Plus className="size-4" />
            {t("transactions.add")}
          </Button>
        }
      >
        <Message error={errorCode(remove.error)} success={notice} />
        <CryptoTransactionTable
          transactions={transactions}
          groups={groups}
          members={members}
          onEdit={open}
          onDelete={onDelete}
          editingId={dialog.open ? dialog.record?.id : undefined}
        />
      </Section>

      <FormModal
        isOpen={dialog.open}
        onOpenChange={isOpen => setDialog(d => ({ ...d, open: isOpen }))}
        title={dialog.record ? t("common.edit") : t("transactions.add")}
        icon={dialog.record ? <Pencil className="size-5" /> : <Plus className="size-5" />}
      >
        <CryptoTransactionForm editing={dialog.record} groups={groups} members={members} coins={coins} onSaved={onSaved} />
      </FormModal>
    </>
  );
}
