import { useState } from "react";
import { api, errorCode, request } from "@client/api";
import { queries, useDeleteMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { EntryForm } from "@client/components/expenses/EntryForm";
import { EntryTable } from "@client/components/expenses/EntryTable";
import { formatCents } from "@client/utils/format";
import { Message, Section } from "@client/components/ui";
import type { ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

// Adding, editing and deleting income and expenses. Only for admins and contributors,
// and only within the groups they may see.
export function Manage() {
  const { t } = useI18n();
  const { entries } = useExpenses();
  const categoryName = useCategoryName();
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);
  // Success message; the form stays on this tab and is emptied after adding.
  const [notice, setNotice] = useState<string | null>(null);
  const remove = useDeleteMutation(queries.expenseEntries, id =>
    request(api.expenses.entries[":id"].$delete({ param: { id } })),
  );

  // The form has already put the saved record in the list.
  const onSaved = () => {
    setNotice(editing ? "common.saved" : "expenses.added");
    setEditing(null);
  };

  const edit = (entry: ExpenseEntry | null) => {
    setEditing(entry);
    setNotice(null);
  };

  const onDelete = async (entry: ExpenseEntry) => {
    const params = { category: categoryName(t, entry.categoryId), amount: formatCents(entry.amountCents), date: entry.date };
    if (!confirm(t("expenses.confirmDelete", params))) return;
    try {
      await remove.mutateAsync(entry.id);
    } catch {
      return; // shown from remove.error
    }
    if (editing?.id === entry.id) setEditing(null);
  };

  return (
    <>
      <Section title={editing ? t("common.edit") : t("expenses.add")}>
        <Message success={notice} />
        {/* The key remounts the form so it follows the record being edited. */}
        <EntryForm
          key={editing?.id ?? "new"}
          editing={editing}
          onSaved={onSaved}
          onCancel={() => edit(null)}
        />
      </Section>
      <Section title={t("expenses.records")}>
        <Message error={errorCode(remove.error)} />
        <EntryTable entries={entries} onEdit={edit} onDelete={onDelete} editingId={editing?.id} />
      </Section>
    </>
  );
}
