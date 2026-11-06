import { useState, type FormEvent } from "react";
import { api, call, chosenUser, text, toCents } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { UserSelect } from "@client/components/UserSelect";
import { GroupSelect } from "@client/components/GroupSelect";
import { kindOf, MAX_NOTE_LENGTH } from "@shared/expenses";
import type { CategoryKind, ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

type Props = {
  editing: ExpenseEntry | null;
  onSaved: (entry: ExpenseEntry) => void;
  onCancel: () => void;
};

// Adds an income or expense record, or edits `editing` when given.
// The parent remounts it (with a key) so its default values follow the record being edited.
export function EntryForm({ editing, onSaved, onCancel }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const { groups, members, categories } = useExpenses();
  const categoryName = useCategoryName();
  const [error, setError] = useState<string | null>(null);
  // Picking expense or income first narrows the category list to that list.
  const [kind, setKind] = useState<CategoryKind>(editing ? kindOf(categories, editing.categoryId) : "expense");
  // A record keeps its category even after the admin hides it.
  const options = categories.filter(c => c.kind === kind && (!c.hidden || c.id === editing?.categoryId));

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const json = {
      groupId: text(data, "groupId"),
      categoryId: text(data, "categoryId"),
      date: text(data, "date"),
      amountCents: toCents(text(data, "amount")),
      note: text(data, "note"),
      userId: chosenUser(data),
    };
    const result = await call(
      editing
        ? api.expenses.entries[":id"].$put({ param: { id: editing.id }, json })
        : api.expenses.entries.$post({ json }),
    );

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    onSaved(result.data);
  };

  return (
    <form onSubmit={onSubmit} className="transaction-form">
      {me.role === "admin" && <UserSelect members={members} defaultValue={editing?.userId ?? ""} />}
      <GroupSelect groups={groups} defaultValue={editing?.groupId} />
      <label>
        {t("transactions.type")}
        <select value={kind} onChange={e => setKind(e.target.value as CategoryKind)}>
          <option value="expense">{t("type.expense")}</option>
          <option value="income">{t("type.income")}</option>
        </select>
      </label>
      <label>
        {t("expenses.category")}
        {/* Remounted when the type changes, so the choice from the other list is dropped. */}
        <select key={kind} name="categoryId" required defaultValue={editing?.categoryId ?? ""}>
          <option value="" disabled>
            {t("expenses.selectCategory")}
          </option>
          {options.map(c => (
            <option key={c.id} value={c.id}>
              {categoryName(t, c.id)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("common.date")}
        <input type="date" name="date" required defaultValue={editing?.date} />
      </label>
      <label>
        {t("transactions.amount")}
        <input type="number" name="amount" required min="0.01" step="0.01" defaultValue={editing ? editing.amountCents / 100 : undefined} />
      </label>
      <label>
        {t("expenses.note")}
        <input type="text" name="note" maxLength={MAX_NOTE_LENGTH} defaultValue={editing?.note} />
      </label>
      <button type="submit">{editing ? t("common.saveChanges") : t("expenses.add")}</button>
      {editing && (
        <button type="button" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      )}
      {error && <p className="error">{t(error)}</p>}
    </form>
  );
}
