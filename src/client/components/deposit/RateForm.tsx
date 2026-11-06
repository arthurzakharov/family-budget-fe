import { useState, type FormEvent } from "react";
import { api, call, chosenUser, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { UserSelect } from "@client/components/UserSelect";
import type { DepositRate, Member } from "@arthurzakharov/family-budget-be-client";

type FormProps = {
  editing: DepositRate | null;
  members: Member[];
  onSaved: (rate: DepositRate) => void;
  onCancel: () => void;
};

// Adds a rate period, or edits `editing` when given.
export function RateForm({ editing, members, onSaved, onCancel }: FormProps) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const [fromBeginning, setFromBeginning] = useState(editing ? editing.from === null : false);
  const [current, setCurrent] = useState(editing ? editing.till === null : false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const json = {
      ratePercent: Number(text(data, "ratePercent")),
      from: fromBeginning ? null : text(data, "from"),
      till: current ? null : text(data, "till"),
      userId: chosenUser(data),
    };
    const result = await call(
      editing ? api.deposit.rates[":id"].$put({ param: { id: editing.id }, json }) : api.deposit.rates.$post({ json }),
    );

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved(result.data);
  };

  return (
    <form onSubmit={onSubmit} className="transaction-form">
      {me.role === "admin" && <UserSelect members={members} defaultValue={editing?.userId ?? ""} />}
      <label>
        {t("rates.rate")}
        <input type="number" name="ratePercent" required min="0" max="100" step="0.0001" defaultValue={editing?.ratePercent} />
      </label>
      <label>
        {t("rates.from")}
        <input type="date" name="from" required={!fromBeginning} disabled={fromBeginning} defaultValue={editing?.from ?? ""} />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={fromBeginning} onChange={e => setFromBeginning(e.target.checked)} />
        {t("rates.fromBeginning")}
      </label>
      <label>
        {t("rates.till")}
        <input type="date" name="till" required={!current} disabled={current} defaultValue={editing?.till ?? ""} />
      </label>
      <label className="checkbox">
        <input type="checkbox" checked={current} onChange={e => setCurrent(e.target.checked)} />
        {t("rates.current")}
      </label>
      <button type="submit">{editing ? t("common.saveChanges") : t("rates.add")}</button>
      {editing && (
        <button type="button" onClick={onCancel}>
          {t("common.cancel")}
        </button>
      )}
      {error && <p className="error">{t(error)}</p>}
    </form>
  );
}
