import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { usePendingIds } from "@client/utils/pending";
import { notify } from "@client/utils/notify";
import { useCrypto } from "@client/context/crypto";
import { closedDialog, FormModal, type RecordDialog } from "@client/components/form";
import { CryptoTransactionForm } from "@client/components/crypto/CryptoTransactionForm";
import { CryptoTransactionTable } from "@client/components/crypto/CryptoTransactionTable";
import { Message, Section } from "@client/components/ui";
import { useConfirmDelete } from "@client/components/ConfirmDelete";
import type { CryptoTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting buys and sells. Only for admins and contributors, and only
// within the groups they may see. Adding and editing happen in a dialog; the tab shows the list.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, coins, transactions } = useCrypto();
  const [dialog, setDialog] = useState<RecordDialog<CryptoTransaction>>(closedDialog);
  const remove = useDeleteMutation(queries.cryptoTransactions, id =>
    request(api.crypto.transactions[":id"].$delete({ param: { id } })),
  );
  // Rows whose delete request is running; their buttons show a spinner meanwhile.
  const deleting = usePendingIds();
  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  const open = (record: CryptoTransaction | null) => setDialog({ open: true, record });

  // A buy or sell's coins and date, naming it in toasts
  const describe = (tx: CryptoTransaction) => `${t(tx.type === "sell" ? "type.sell" : "type.buy")} ${tx.amount} ${tx.coin} · ${tx.date}`;

  // The form has already put the saved record in the list.
  const onSaved = (tx: CryptoTransaction) => {
    if (dialog.record) notify.updated(t("transactions.updated"), describe(tx));
    else notify.created(t("transactions.added"), describe(tx));
    setDialog(d => ({ ...d, open: false }));
  };

  const onDelete = async (tx: CryptoTransaction) => {
    const message = tx.type === "sell" ? "crypto.confirmDeleteSell" : "crypto.confirmDeleteBuy";
    if (!(await confirmDelete(t(message, { amount: tx.amount, coin: tx.coin, date: tx.date })))) return;
    try {
      await deleting.track(tx.id, () => remove.mutateAsync(tx.id));
    } catch {
      return; // shown from remove.error
    }
    notify.deleted(t("transactions.deleted"), describe(tx));
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
        <Message error={errorCode(remove.error)} />
        <CryptoTransactionTable
          transactions={transactions}
          groups={groups}
          members={members}
          onEdit={open}
          onDelete={onDelete}
          isDeleting={deleting.isPending}
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

      {confirmDialog}
    </>
  );
}
