import { useStore } from "@tanstack/react-form";
import { api, errorCode, request, toCents } from "@client/api";
import { queries, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { todayText, useAppForm } from "@client/components/form";
import { UserSelect } from "@client/components/UserSelect";
import { defaultGroup, GroupSelect } from "@client/components/GroupSelect";
import { kindOf, MAX_NOTE_LENGTH } from "@shared/expenses";
import type { CategoryKind, ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

type Json = Parameters<typeof api.expenses.entries.$post>[0]["json"];

type Props = {
  editing: ExpenseEntry | null;
  // Called after the server has saved the record
  onSaved: (saved: ExpenseEntry) => void;
};

// Adds an income or expense record, or edits `editing` when given. Shown inside a FormModal,
// which mounts it afresh each time it opens.
export function EntryForm({ editing, onSaved }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const { groups, members, categories } = useExpenses();
  const categoryName = useCategoryName();
  const save = useSaveMutation(queries.expenseEntries, (json: Json) =>
    request(
      editing
        ? api.expenses.entries[":id"].$put({ param: { id: editing.id }, json })
        : api.expenses.entries.$post({ json }),
    ),
  );

  const form = useAppForm({
    defaultValues: {
      userId: editing?.userId ?? "",
      groupId: defaultGroup(me, editing?.groupId),
      // Picking expense or income first narrows the category list to that list. Not sent.
      kind: (editing ? kindOf(categories, editing.categoryId) : "income") as CategoryKind,
      categoryId: editing?.categoryId ?? "",
      // New records are dated today.
      date: editing?.date ?? todayText(),
      amount: editing ? String(editing.amountCents / 100) : "",
      note: editing?.note ?? "",
    },
    onSubmit: async ({ value }) => {
      let saved;
      try {
        saved = await save.mutateAsync({
          groupId: value.groupId,
          categoryId: value.categoryId,
          date: value.date,
          amountCents: toCents(value.amount),
          note: value.note,
          userId: value.userId || undefined,
        });
      } catch {
        return; // shown from save.error
      }
      onSaved(saved);
    },
  });
  const kind = useStore(form.store, state => state.values.kind);
  // A record keeps its category even after the admin hides it.
  const options = categories.filter(c => c.kind === kind && (!c.hidden || c.id === editing?.categoryId));

  return (
    <form.AppForm>
      <form.ModalForm error={errorCode(save.error)} submitLabel={editing ? t("common.saveChanges") : t("expenses.add")}>
        {me.role === "admin" && <form.AppField name="userId">{() => <UserSelect members={members} />}</form.AppField>}
        <form.AppField name="groupId">{() => <GroupSelect groups={groups} />}</form.AppField>
        {/* The category picked from the other list no longer fits, so it is dropped. */}
        <form.AppField name="kind" listeners={{ onChange: () => form.setFieldValue("categoryId", "") }}>
          {field => (
            <field.ToggleField
              label={t("transactions.type")}
              options={[
                { id: "income", label: t("type.income"), tone: "success" },
                { id: "expense", label: t("type.expense"), tone: "danger" },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="categoryId">
          {field => (
            <field.SelectField
              label={t("expenses.category")}
              isRequired
              placeholder={t("expenses.selectCategory")}
              options={options.map(c => ({ id: c.id, label: categoryName(t, c.id) }))}
            />
          )}
        </form.AppField>
        <form.AppField name="date">
          {field => <field.DatePickerField label={t("common.date")} isRequired quickPicks />}
        </form.AppField>
        <form.AppField name="amount">
          {field => <field.TextField label={t("transactions.amount")} type="number" required min="0.01" step="0.01" />}
        </form.AppField>
        <form.AppField name="note">
          {field => (
            <field.TextField
              label={t("expenses.note")}
              type="text"
              maxLength={MAX_NOTE_LENGTH}
              className="sm:col-span-2 lg:col-span-3"
            />
          )}
        </form.AppField>
      </form.ModalForm>
    </form.AppForm>
  );
}
