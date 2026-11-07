import { api, errorCode, request, toCents } from "@client/api";
import { queries, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { submitWith, useAppForm } from "@client/components/form";
import { UserSelect } from "@client/components/UserSelect";
import { defaultGroup, GroupSelect } from "@client/components/GroupSelect";
import { Button } from "@heroui/react";
import { FormGrid, Message } from "@client/components/ui";
import type { DepositTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type Json = Parameters<typeof api.deposit.transactions.$post>[0]["json"];

type Props = {
  editing: DepositTransaction | null;
  groups: Group[];
  members: Member[];
  // Called after the server has saved the transaction
  onSaved: () => void;
  onCancel: () => void;
};

// Adds a transaction, or edits `editing` when given. It empties itself after adding.
// The parent remounts it (with a key) so its starting values follow the record being edited.
export function TransactionForm({ editing, groups, members, onSaved, onCancel }: Props) {
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
    onSubmit: async ({ value, formApi }) => {
      try {
        await save.mutateAsync({
          groupId: value.groupId,
          type: value.type,
          date: value.date,
          amountCents: toCents(value.amount),
          userId: value.userId || undefined,
        });
      } catch {
        return; // shown from save.error
      }
      if (!editing) formApi.reset();
      onSaved();
    },
  });

  return (
    <form.AppForm>
      <Message error={errorCode(save.error)} />
      <FormGrid
        onSubmit={submitWith(form)}
        actions={
          <>
            <form.SubmitButton>{editing ? t("common.saveChanges") : t("transactions.add")}</form.SubmitButton>
            {editing && (
              <Button variant="secondary" onPress={onCancel}>
                {t("common.cancel")}
              </Button>
            )}
          </>
        }
      >
        {me.role === "admin" && <form.AppField name="userId">{() => <UserSelect members={members} />}</form.AppField>}
        <form.AppField name="groupId">{() => <GroupSelect groups={groups} />}</form.AppField>
        <form.AppField name="type">
          {field => (
            <field.SelectField
              label={t("transactions.type")}
              isRequired
              options={[
                { id: "deposit", label: t("type.deposit") },
                { id: "withdrawal", label: t("type.withdrawal") },
              ]}
            />
          )}
        </form.AppField>
        <form.AppField name="date">
          {field => <field.TextField label={t("common.date")} type="date" required />}
        </form.AppField>
        <form.AppField name="amount">
          {field => <field.TextField label={t("transactions.amount")} type="number" required min="0.01" step="0.01" />}
        </form.AppField>
      </FormGrid>
    </form.AppForm>
  );
}
