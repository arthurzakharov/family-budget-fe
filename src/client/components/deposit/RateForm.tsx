import { useStore } from "@tanstack/react-form";
import { api, errorCode, request } from "@client/api";
import { queries, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { useAppForm } from "@client/components/form";
import { UserSelect } from "@client/components/UserSelect";
import type { DepositRate, Member } from "@arthurzakharov/family-budget-be-client";

type Json = Parameters<typeof api.deposit.rates.$post>[0]["json"];

type FormProps = {
  editing: DepositRate | null;
  members: Member[];
  // Called after the server has saved the rate
  onSaved: (saved: DepositRate) => void;
};

// Adds a rate period, or edits `editing` when given. Shown inside a FormModal.
export function RateForm({ editing, members, onSaved }: FormProps) {
  const { t } = useI18n();
  const me = useCurrentUser();
  // Rates change the interest, which the server works out.
  const save = useSaveMutation(
    queries.depositRates,
    (json: Json) =>
      request(editing ? api.deposit.rates[":id"].$put({ param: { id: editing.id }, json }) : api.deposit.rates.$post({ json })),
    { invalidates: [queries.depositInterest.queryKey] },
  );

  const form = useAppForm({
    defaultValues: {
      userId: editing?.userId ?? "",
      ratePercent: editing ? String(editing.ratePercent) : "",
      from: editing?.from ?? "",
      till: editing?.till ?? "",
      // "From the beginning" and "current" switch their date off; the date is then sent as null.
      fromBeginning: editing ? editing.from === null : false,
      current: editing ? editing.till === null : false,
    },
    onSubmit: async ({ value }) => {
      let saved;
      try {
        saved = await save.mutateAsync({
          ratePercent: Number(value.ratePercent),
          from: value.fromBeginning ? null : value.from,
          till: value.current ? null : value.till,
          userId: value.userId || undefined,
        });
      } catch {
        return; // shown from save.error
      }
      onSaved(saved);
    },
  });
  const fromBeginning = useStore(form.store, state => state.values.fromBeginning);
  const current = useStore(form.store, state => state.values.current);

  return (
    <form.AppForm>
      <form.ModalForm error={errorCode(save.error)} submitLabel={editing ? t("common.saveChanges") : t("rates.add")}>
        {me.role === "admin" && <form.AppField name="userId">{() => <UserSelect members={members} />}</form.AppField>}
        <form.AppField name="ratePercent">
          {field => <field.TextField label={t("rates.rate")} type="number" required min="0" max="100" step="0.0001" />}
        </form.AppField>
        <div className="flex flex-col gap-2">
          <form.AppField name="from">
            {field => <field.DatePickerField label={t("rates.from")} isRequired={!fromBeginning} isDisabled={fromBeginning} />}
          </form.AppField>
          <form.AppField name="fromBeginning">{field => <field.CheckboxField label={t("rates.fromBeginning")} />}</form.AppField>
        </div>
        <div className="flex flex-col gap-2">
          <form.AppField name="till">
            {field => <field.DatePickerField label={t("rates.till")} isRequired={!current} isDisabled={current} />}
          </form.AppField>
          <form.AppField name="current">{field => <field.CheckboxField label={t("rates.current")} />}</form.AppField>
        </div>
      </form.ModalForm>
    </form.AppForm>
  );
}
