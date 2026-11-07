import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import { formatCents } from "@client/utils/format";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { usePendingIds } from "@client/utils/pending";
import { notify } from "@client/utils/notify";
import { useDeposit } from "@client/context/deposit";
import { closedDialog, FormModal, type RecordDialog } from "@client/components/form";
import { RateForm } from "@client/components/deposit/RateForm";
import { RateTable } from "@client/components/deposit/RateTable";
import { TransactionForm } from "@client/components/deposit/TransactionForm";
import { TransactionTable } from "@client/components/deposit/TransactionTable";
import { Message, Section } from "@client/components/ui";
import { useConfirmDelete } from "@client/components/ConfirmDelete";
import type { DepositRate, DepositTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting rates and transactions. Only for admins and contributors.
// Adding and editing happen in dialogs; the tab shows the lists.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, transactions, rates } = useDeposit();
  const [rateDialog, setRateDialog] = useState<RecordDialog<DepositRate>>(closedDialog);
  const [transactionDialog, setTransactionDialog] = useState<RecordDialog<DepositTransaction>>(closedDialog);
  // Deleting a transaction changes the interest, which the server works out.
  const remove = useDeleteMutation(
    queries.depositTransactions,
    id => request(api.deposit.transactions[":id"].$delete({ param: { id } })),
    { invalidates: [queries.depositInterest.queryKey] },
  );
  // Rows whose delete request is running; their buttons show a spinner meanwhile.
  const deleting = usePendingIds();
  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  const openRate = (record: DepositRate | null) => setRateDialog({ open: true, record });
  const openTransaction = (record: DepositTransaction | null) => setTransactionDialog({ open: true, record });

  // A transaction's amount and date, naming it in toasts
  const describe = (tx: DepositTransaction) => `${formatCents(tx.amountCents)} · ${tx.date}`;

  // The forms have already put the saved record in the lists.
  const onRateSaved = (rate: DepositRate) => {
    if (rateDialog.record) notify.updated(t("rates.updated"), `${rate.ratePercent}%`);
    else notify.created(t("rates.added"), `${rate.ratePercent}%`);
    setRateDialog(d => ({ ...d, open: false }));
  };
  const onTransactionSaved = (tx: DepositTransaction) => {
    if (transactionDialog.record) notify.updated(t("transactions.updated"), describe(tx));
    else notify.created(t("transactions.added"), describe(tx));
    setTransactionDialog(d => ({ ...d, open: false }));
  };

  const onDelete = async (tx: DepositTransaction) => {
    const message = tx.type === "withdrawal" ? "transactions.confirmDeleteWithdrawal" : "transactions.confirmDeleteDeposit";
    if (!(await confirmDelete(t(message, { amount: formatCents(tx.amountCents), date: tx.date })))) return;
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
        title={t("rates.title")}
        actions={
          <Button onPress={() => openRate(null)}>
            <Plus className="size-4" />
            {t("rates.add")}
          </Button>
        }
      >
        <RateTable
          rates={rates}
          members={members}
          onEdit={openRate}
          editingId={rateDialog.open ? rateDialog.record?.id : undefined}
        />
      </Section>

      <Section
        title={t("transactions.title")}
        actions={
          <Button onPress={() => openTransaction(null)}>
            <Plus className="size-4" />
            {t("transactions.add")}
          </Button>
        }
      >
        <Message error={errorCode(remove.error)} />
        <TransactionTable
          transactions={transactions}
          groups={groups}
          members={members}
          onEdit={openTransaction}
          onDelete={onDelete}
          isDeleting={deleting.isPending}
          editingId={transactionDialog.open ? transactionDialog.record?.id : undefined}
        />
      </Section>

      <FormModal
        isOpen={rateDialog.open}
        onOpenChange={open => setRateDialog(d => ({ ...d, open }))}
        title={rateDialog.record ? t("common.edit") : t("rates.add")}
        icon={rateDialog.record ? <Pencil className="size-5" /> : <Plus className="size-5" />}
      >
        <RateForm editing={rateDialog.record} members={members} onSaved={onRateSaved} />
      </FormModal>

      <FormModal
        isOpen={transactionDialog.open}
        onOpenChange={open => setTransactionDialog(d => ({ ...d, open }))}
        title={transactionDialog.record ? t("common.edit") : t("transactions.add")}
        icon={transactionDialog.record ? <Pencil className="size-5" /> : <Plus className="size-5" />}
      >
        <TransactionForm
          editing={transactionDialog.record}
          groups={groups}
          members={members}
          onSaved={onTransactionSaved}
        />
      </FormModal>

      {confirmDialog}
    </>
  );
}
