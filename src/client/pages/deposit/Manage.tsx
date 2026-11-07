import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import { formatCents } from "@client/utils/format";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useDeposit } from "@client/context/deposit";
import { closedDialog, FormModal, type RecordDialog } from "@client/components/form";
import { RateForm } from "@client/components/deposit/RateForm";
import { RateTable } from "@client/components/deposit/RateTable";
import { TransactionForm } from "@client/components/deposit/TransactionForm";
import { TransactionTable } from "@client/components/deposit/TransactionTable";
import { Message, Section } from "@client/components/ui";
import type { DepositRate, DepositTransaction } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting rates and transactions. Only for admins and contributors.
// Adding and editing happen in dialogs; the tab shows the lists.
export function Manage() {
  const { t } = useI18n();
  const { groups, members, transactions, rates } = useDeposit();
  const [rateDialog, setRateDialog] = useState<RecordDialog<DepositRate>>(closedDialog);
  const [transactionDialog, setTransactionDialog] = useState<RecordDialog<DepositTransaction>>(closedDialog);
  // Success messages, shown above the list that changed
  const [rateNotice, setRateNotice] = useState<string | null>(null);
  const [transactionNotice, setTransactionNotice] = useState<string | null>(null);
  // Deleting a transaction changes the interest, which the server works out.
  const remove = useDeleteMutation(
    queries.depositTransactions,
    id => request(api.deposit.transactions[":id"].$delete({ param: { id } })),
    { invalidates: [queries.depositInterest.queryKey] },
  );

  const openRate = (record: DepositRate | null) => {
    setRateNotice(null);
    setRateDialog({ open: true, record });
  };
  const openTransaction = (record: DepositTransaction | null) => {
    setTransactionNotice(null);
    setTransactionDialog({ open: true, record });
  };

  // The forms have already put the saved record in the lists.
  const onRateSaved = () => {
    setRateNotice(rateDialog.record ? "common.saved" : "rates.added");
    setRateDialog(d => ({ ...d, open: false }));
  };
  const onTransactionSaved = () => {
    setTransactionNotice(transactionDialog.record ? "common.saved" : "transactions.added");
    setTransactionDialog(d => ({ ...d, open: false }));
  };

  const onDelete = async (tx: DepositTransaction) => {
    const message = tx.type === "withdrawal" ? "transactions.confirmDeleteWithdrawal" : "transactions.confirmDeleteDeposit";
    if (!confirm(t(message, { amount: formatCents(tx.amountCents), date: tx.date }))) return;
    setTransactionNotice(null);
    await remove.mutateAsync(tx.id).catch(() => {}); // a failure is shown from remove.error
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
        <Message success={rateNotice} />
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
        <Message error={errorCode(remove.error)} success={transactionNotice} />
        <TransactionTable
          transactions={transactions}
          groups={groups}
          members={members}
          onEdit={openTransaction}
          onDelete={onDelete}
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
    </>
  );
}
