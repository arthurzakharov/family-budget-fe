import { useState, type FormEvent } from "react";
import { api, call, chosenUser, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { UserSelect } from "@client/components/UserSelect";
import { GroupSelect } from "@client/components/GroupSelect";
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
    <form onSubmit={onSubmit} className="transaction-form">
      {me.role === "admin" && <UserSelect members={members} defaultValue={editing?.userId ?? ""} />}
      <GroupSelect groups={groups} defaultValue={editing?.groupId} />
      <label>
        {t("crypto.coin")}
        <select name="coin" required defaultValue={editing?.coin ?? ""}>
          <option value="" disabled>
            {t("crypto.selectCoin")}
          </option>
          {coinOptions.map(c => (
            <option key={c} value={c}>
              {c} – {coinName(c)}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t("transactions.type")}
        <select name="type" required defaultValue={editing?.type ?? "buy"}>
          <option value="buy">{t("type.buy")}</option>
          <option value="sell">{t("type.sell")}</option>
        </select>
      </label>
      <label>
        {t("common.date")}
        <input type="date" name="date" required defaultValue={editing?.date} />
      </label>
      <label>
        {t("crypto.amount")}
        <input type="number" name="amount" required min="0" step="any" defaultValue={editing?.amount} />
      </label>
      <label>
        {t("crypto.rate")}
        <input type="number" name="price" required min="0" step="any" defaultValue={editing?.price} />
      </label>
      <button type="submit">{editing ? t("common.saveChanges") : t("transactions.add")}</button>
      {editing && (
        <button type="button" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      )}
      {error && <p className="error">{t(error)}</p>}
    </form>
  );
}
