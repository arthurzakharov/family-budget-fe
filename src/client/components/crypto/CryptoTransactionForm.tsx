import { useState, type FormEvent } from "react";
import { api, call, chosenUser, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { UserSelect } from "@client/components/UserSelect";
import { GroupSelect } from "@client/components/GroupSelect";
import { Button } from "@heroui/react";
import { Field, FormGrid, Message, SelectField } from "@client/components/ui";
import { coinName } from "@shared/crypto";
import type { CoinSymbol, CryptoTransaction, CryptoTransactionType, Group, Member } from "@arthurzakharov/family-budget-be-client";

type Props = {
  editing: CryptoTransaction | null;
  groups: Group[];
  members: Member[];
  // Coins the admin has made available
  coins: CoinSymbol[];
  onSaved: (transaction: CryptoTransaction) => void;
  onCancel: () => void;
};

// Adds a buy or sell, or edits `editing` when given.
// The parent remounts it (with a key) so its default values follow the record being edited.
export function CryptoTransactionForm({ editing, groups, members, coins, onSaved, onCancel }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  // A record keeps its coin even after the admin turns that coin off.
  const coinOptions = editing && !coins.includes(editing.coin) ? [...coins, editing.coin] : coins;

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);

    const json = {
      groupId: text(data, "groupId"),
      coin: text(data, "coin") as CoinSymbol,
      type: text(data, "type") as CryptoTransactionType,
      date: text(data, "date"),
      amount: Number(text(data, "amount")),
      price: Number(text(data, "price")),
      userId: chosenUser(data),
    };
    const result = await call(
      editing
        ? api.crypto.transactions[":id"].$put({ param: { id: editing.id }, json })
        : api.crypto.transactions.$post({ json }),
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
          label={t("crypto.coin")}
          name="coin"
          isRequired
          placeholder={t("crypto.selectCoin")}
          defaultValue={editing?.coin ?? ""}
          options={coinOptions.map(c => ({ id: c, label: `${c} – ${coinName(c)}` }))}
        />
        <SelectField
          label={t("transactions.type")}
          name="type"
          isRequired
          defaultValue={editing?.type ?? "buy"}
          options={[
            { id: "buy", label: t("type.buy") },
            { id: "sell", label: t("type.sell") },
          ]}
        />
        <Field label={t("common.date")} type="date" name="date" required defaultValue={editing?.date} />
        <Field label={t("crypto.amount")} type="number" name="amount" required min="0" step="any" defaultValue={editing?.amount} />
        <Field label={t("crypto.rate")} type="number" name="price" required min="0" step="any" defaultValue={editing?.price} />
      </FormGrid>
    </>
  );
}
