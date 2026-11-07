import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { usePendingIds } from "@client/utils/pending";
import { notify } from "@client/utils/notify";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { closedDialog, FormModal, type RecordDialog } from "@client/components/form";
import { EntryForm } from "@client/components/expenses/EntryForm";
import { EntryTable } from "@client/components/expenses/EntryTable";
import { formatCents } from "@client/utils/format";
import { Message, Section } from "@client/components/ui";
import { useConfirmDelete } from "@client/components/ConfirmDelete";
import type { ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting income and expenses. Only for admins and contributors, and only
// within the groups they may see. Adding and editing happen in a dialog; the tab shows the list.
export function Manage() {
  const { t } = useI18n();
  const { entries } = useExpenses();
  const categoryName = useCategoryName();
  const [dialog, setDialog] = useState<RecordDialog<ExpenseEntry>>(closedDialog);
  const remove = useDeleteMutation(queries.expenseEntries, id =>
    request(api.expenses.entries[":id"].$delete({ param: { id } })),
  );
  // Rows whose delete request is running; their buttons show a spinner meanwhile.
  const deleting = usePendingIds();
  const { confirmDelete, dialog: confirmDialog } = useConfirmDelete();

  const open = (record: ExpenseEntry | null) => setDialog({ open: true, record });

  // A record's category, amount and date, naming it in toasts
  const describe = (entry: ExpenseEntry) =>
    `${categoryName(t, entry.categoryId)} · ${formatCents(entry.amountCents)} · ${entry.date}`;

  // The form has already put the saved record in the list.
  const onSaved = (entry: ExpenseEntry) => {
    if (dialog.record) notify.updated(t("expenses.updated"), describe(entry));
    else notify.created(t("expenses.added"), describe(entry));
    setDialog(d => ({ ...d, open: false }));
  };

  const onDelete = async (entry: ExpenseEntry) => {
    const params = { category: categoryName(t, entry.categoryId), amount: formatCents(entry.amountCents), date: entry.date };
    if (!(await confirmDelete(t("expenses.confirmDelete", params)))) return;
    try {
      await deleting.track(entry.id, () => remove.mutateAsync(entry.id));
    } catch {
      return; // shown from remove.error
    }
    notify.deleted(t("expenses.deleted"), describe(entry));
  };

  return (
    <>
      <Section
        title={t("expenses.records")}
        actions={
          <Button onPress={() => open(null)}>
            <Plus className="size-4" />
            {t("expenses.add")}
          </Button>
        }
      >
        <Message error={errorCode(remove.error)} />
        <EntryTable
          entries={entries}
          onEdit={open}
          onDelete={onDelete}
          isDeleting={deleting.isPending}
          editingId={dialog.open ? dialog.record?.id : undefined}
        />
      </Section>

      <FormModal
        isOpen={dialog.open}
        onOpenChange={isOpen => setDialog(d => ({ ...d, open: isOpen }))}
        title={dialog.record ? t("common.edit") : t("expenses.add")}
        icon={dialog.record ? <Pencil className="size-5" /> : <Plus className="size-5" />}
      >
        <EntryForm editing={dialog.record} onSaved={onSaved} />
      </FormModal>

      {confirmDialog}
    </>
  );
}
