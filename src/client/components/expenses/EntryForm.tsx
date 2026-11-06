import { useState, type FormEvent } from "react";
import { api, call, chosenUser, text, toCents } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { UserSelect } from "@client/components/UserSelect";
import { GroupSelect } from "@client/components/GroupSelect";
import { Button } from "@heroui/react";
import { Field, FormGrid, Message, SelectField } from "@client/components/ui";
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
    <>
      <Message error={error} />
      <FormGrid
        onSubmit={onSubmit}
        actions={
          <>
            <Button type="submit">{editing ? t("common.saveChanges") : t("expenses.add")}</Button>
            {editing && (
              <Button variant="secondary" onPress={onCancel}>
                {t("common.cancel")}
              </Button>
            )}
          </>
        }
      >
        {me.role === "admin" && <UserSelect members={members} defaultValue={editing?.userId ?? ""} />}
        <GroupSelect groups={groups} defaultValue={editing?.groupId} />
        <SelectField
          label={t("transactions.type")}
          value={kind}
          onChange={v => v && setKind(v as CategoryKind)}
          options={[
            { id: "expense", label: t("type.expense") },
            { id: "income", label: t("type.income") },
          ]}
        />
        {/* Remounted when the type changes, so the choice from the other list is dropped. */}
        <SelectField
          key={kind}
          label={t("expenses.category")}
          name="categoryId"
          isRequired
          placeholder={t("expenses.selectCategory")}
          defaultValue={editing?.categoryId}
          options={options.map(c => ({ id: c.id, label: categoryName(t, c.id) }))}
        />
        <Field label={t("common.date")} type="date" name="date" required defaultValue={editing?.date} />
        <Field
          label={t("transactions.amount")}
          type="number"
          name="amount"
          required
          min="0.01"
          step="0.01"
          defaultValue={editing ? editing.amountCents / 100 : undefined}
        />
        <Field
          label={t("expenses.note")}
          type="text"
          name="note"
          maxLength={MAX_NOTE_LENGTH}
          defaultValue={editing?.note}
          className="sm:col-span-2 lg:col-span-3"
        />
      </FormGrid>
    </>
  );
}
