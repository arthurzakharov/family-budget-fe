import { api, errorCode, request, toCents } from "@client/api";
import { queries, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { useAppForm } from "@client/components/form";
import { UserSelect } from "@client/components/UserSelect";
import { defaultGroup, GroupSelect } from "@client/components/GroupSelect";
import type { DepositTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type Json = Parameters<typeof api.deposit.transactions.$post>[0]["json"];

type Props = {
  editing: DepositTransaction | null;
  groups: Group[];
  members: Member[];
  // Called after the server has saved the transaction
  onSaved: (saved: DepositTransaction) => void;
};

// Adds a transaction, or edits `editing` when given. Shown inside a FormModal,
// which mounts it afresh each time it opens.
export function TransactionForm({ editing, groups, members, onSaved }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  // Transactions change the interest, which the server works out.
  const save = useSaveMutation(
    queries.depositTransactions,
    (json: Json) =>
      request(
        editing
          ? api.deposit.transactions[":id"].$put({ param: { id: editing.id }, json })
          : api.deposit.transactions.$post({ json }),
      ),
    { invalidates: [queries.depositInterest.queryKey] },
  );

  const form = useAppForm({
    defaultValues: {
      userId: editing?.userId ?? "",
      groupId: defaultGroup(me, editing?.groupId),
      type: editing?.type ?? "deposit",
      date: editing?.date ?? "",
      amount: editing ? String(editing.amountCents / 100) : "",
    },
    onSubmit: async ({ value }) => {
      let saved;
      try {
        saved = await save.mutateAsync({
          groupId: value.groupId,
          type: value.type,
          date: value.date,
          amountCents: toCents(value.amount),
          userId: value.userId || undefined,
        });
      } catch {
        return; // shown from save.error
      }
      onSaved(saved);
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm error={errorCode(save.error)} submitLabel={editing ? t("common.saveChanges") : t("transactions.add")}>
        {me.role === "admin" && <form.AppField name="userId">{() => <UserSelect members={members} />}</form.AppField>}
        <form.AppField name="groupId">{() => <GroupSelect groups={groups} />}</form.AppField>
        <form.AppField name="type">
          {field => (
            <field.ToggleField
              label={t("transactions.type")}
              options={[
                { id: "deposit", label: t("type.deposit"), tone: "success" },
                { id: "withdrawal", label: t("type.withdrawal"), tone: "danger" },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="date">
          {field => <field.DatePickerField label={t("common.date")} isRequired />}
        </form.AppField>
        <form.AppField name="amount">
          {field => <field.TextField label={t("transactions.amount")} type="number" required min="0.01" step="0.01" />}
        </form.AppField>
      </form.ModalForm>
    </form.AppForm>
  );
}
