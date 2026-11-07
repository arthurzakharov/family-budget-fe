import { useState } from "react";
import { Button } from "@heroui/react";
import { Pencil, Plus } from "@gravity-ui/icons";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { closedDialog, FormModal, type RecordDialog } from "@client/components/form";
import { EntryForm } from "@client/components/expenses/EntryForm";
import { EntryTable } from "@client/components/expenses/EntryTable";
import { formatCents } from "@client/utils/format";
import { Message, Section } from "@client/components/ui";
import type { ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting income and expenses. Only for admins and contributors, and only
// within the groups they may see. Adding and editing happen in a dialog; the tab shows the list.
export function Manage() {
  const { t } = useI18n();
  const { entries } = useExpenses();
  const categoryName = useCategoryName();
  const [dialog, setDialog] = useState<RecordDialog<ExpenseEntry>>(closedDialog);
  // Success message, shown above the list
  const [notice, setNotice] = useState<string | null>(null);
  const remove = useDeleteMutation(queries.expenseEntries, id =>
    request(api.expenses.entries[":id"].$delete({ param: { id } })),
  );

  const open = (record: ExpenseEntry | null) => {
    setNotice(null);
    setDialog({ open: true, record });
  };

  // The form has already put the saved record in the list.
  const onSaved = () => {
    setNotice(dialog.record ? "common.saved" : "expenses.added");
    setDialog(d => ({ ...d, open: false }));
  };

  const onDelete = async (entry: ExpenseEntry) => {
    const params = { category: categoryName(t, entry.categoryId), amount: formatCents(entry.amountCents), date: entry.date };
    if (!confirm(t("expenses.confirmDelete", params))) return;
    setNotice(null);
    await remove.mutateAsync(entry.id).catch(() => {}); // a failure is shown from remove.error
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
        <Message error={errorCode(remove.error)} success={notice} />
        <EntryTable entries={entries} onEdit={open} onDelete={onDelete} editingId={dialog.open ? dialog.record?.id : undefined} />
      </Section>

      <FormModal
        isOpen={dialog.open}
        onOpenChange={isOpen => setDialog(d => ({ ...d, open: isOpen }))}
        title={dialog.record ? t("common.edit") : t("expenses.add")}
        icon={dialog.record ? <Pencil className="size-5" /> : <Plus className="size-5" />}
      >
        <EntryForm editing={dialog.record} onSaved={onSaved} />
      </FormModal>
    </>
  );
}
