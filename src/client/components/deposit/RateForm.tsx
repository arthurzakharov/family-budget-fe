import { useState, type FormEvent } from "react";
import { api, call, chosenUser, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { UserSelect } from "@client/components/UserSelect";
import { Button } from "@heroui/react";
import { CheckboxField, Field, FormGrid, Message } from "@client/components/ui";
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
    <>
      <Message error={error} />
      <FormGrid
        onSubmit={onSubmit}
        actions={
          <>
            <Button type="submit">{editing ? t("common.saveChanges") : t("rates.add")}</Button>
            {editing && (
              <Button variant="secondary" onPress={onCancel}>
                {t("common.cancel")}
              </Button>
            )}
          </>
        }
      >
        {me.role === "admin" && <UserSelect members={members} defaultValue={editing?.userId ?? ""} />}
        <Field
          label={t("rates.rate")}
          type="number"
          name="ratePercent"
          required
          min="0"
          max="100"
          step="0.0001"
          defaultValue={editing?.ratePercent}
        />
        {/* The checkboxes only switch their date field off; they are not sent with the form. */}
        <div className="flex flex-col gap-2">
          <Field
            label={t("rates.from")}
            type="date"
            name="from"
            required={!fromBeginning}
            disabled={fromBeginning}
            defaultValue={editing?.from ?? ""}
          />
          <CheckboxField label={t("rates.fromBeginning")} isSelected={fromBeginning} onChange={setFromBeginning} />
        </div>
        <div className="flex flex-col gap-2">
          <Field
            label={t("rates.till")}
            type="date"
            name="till"
            required={!current}
            disabled={current}
            defaultValue={editing?.till ?? ""}
          />
          <CheckboxField label={t("rates.current")} isSelected={current} onChange={setCurrent} />
        </div>
      </FormGrid>
    </>
  );
}
