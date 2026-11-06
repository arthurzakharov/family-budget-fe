import { useState, type FormEvent } from "react";
import { api, call, chosenUser, text, toCents } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { UserSelect } from "@client/components/UserSelect";
import { GroupSelect } from "@client/components/GroupSelect";
import { Button } from "@heroui/react";
import { Field, FormGrid, Message, SelectField } from "@client/components/ui";
import type { DepositTransactionType, DepositTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type Props = {
  editing: DepositTransaction | null;
  groups: Group[];
  members: Member[];
  onSaved: (transaction: DepositTransaction) => void;
  onCancel: () => void;
};

// Adds a transaction, or edits `editing` when given.
// The parent remounts it (with a key) so its default values follow the record being edited.
export function TransactionForm({ editing, groups, members, onSaved, onCancel }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const json = {
      groupId: text(data, "groupId"),
      type: text(data, "type") as DepositTransactionType,
      date: text(data, "date"),
      amountCents: toCents(text(data, "amount")),
      userId: chosenUser(data),
    };
    const result = await call(
      editing
        ? api.deposit.transactions[":id"].$put({ param: { id: editing.id }, json })
        : api.deposit.transactions.$post({ json }),
    );

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    if (!editing) form.reset();
    onSaved(result.data);
  };

  return (
    <>
      <Message error={error} />
      <FormGrid
        onSubmit={onSubmit}
        actions={
          <>
            <Button type="submit">{editing ? t("common.saveChanges") : t("transactions.add")}</Button>
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
          name="type"
          isRequired
          defaultValue={editing?.type ?? "deposit"}
          options={[
            { id: "deposit", label: t("type.deposit") },
            { id: "withdrawal", label: t("type.withdrawal") },
          ]}
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
      </FormGrid>
    </>
  );
}
