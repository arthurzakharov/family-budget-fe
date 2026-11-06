import { useState } from "react";
import { api, call } from "@client/api";
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
  const { entries, setEntries } = useExpenses();
  const categoryName = useCategoryName();
  const [editing, setEditing] = useState<ExpenseEntry | null>(null);
  // Success message; the form stays on this tab and is emptied after adding.
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const onSaved = (saved: ExpenseEntry) => {
    if (editing) {
      setEntries(entries.map(e => (e.id === saved.id ? saved : e)));
      setEditing(null);
      setNotice("common.saved");
    } else {
      setEntries([...entries, saved]);
      setNotice("expenses.added");
    }
  };

  const edit = (entry: ExpenseEntry | null) => {
    setEditing(entry);
    setNotice(null);
  };

  const onDelete = async (entry: ExpenseEntry) => {
    const params = { category: categoryName(t, entry.categoryId), amount: formatCents(entry.amountCents), date: entry.date };
    if (!confirm(t("expenses.confirmDelete", params))) return;
    const result = await call(api.expenses.entries[":id"].$delete({ param: { id: entry.id } }));
    if (!result.ok) {
      setDeleteError(result.error);
      return;
    }
    setDeleteError(null);
    setEntries(entries.filter(e => e.id !== entry.id));
    if (editing?.id === entry.id) setEditing(null);
  };

  return (
    <>
      <Section title={editing ? t("common.edit") : t("expenses.add")}>
        <Message success={notice} />
        {/* The key remounts the form so it empties after adding and follows the record being edited. */}
        <EntryForm
          key={`entry-${editing?.id ?? `new-${entries.length}`}`}
          editing={editing}
          onSaved={onSaved}
          onCancel={() => edit(null)}
        />
      </Section>
      <Section title={t("expenses.records")}>
        <Message error={deleteError} />
        <EntryTable entries={entries} onEdit={edit} onDelete={onDelete} editingId={editing?.id} />
      </Section>
    </>
  );
}
