import { api, errorCode, request } from "@client/api";
import { queries, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { todayText, useAppForm } from "@client/components/form";
import { UserSelect } from "@client/components/UserSelect";
import { defaultGroup, GroupSelect } from "@client/components/GroupSelect";
import { coinName } from "@shared/crypto";
import type { CoinSymbol, CryptoTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type Json = Parameters<typeof api.crypto.transactions.$post>[0]["json"];

type Props = {
  editing: CryptoTransaction | null;
  groups: Group[];
  members: Member[];
  // Coins the admin has made available
  coins: CoinSymbol[];
  // Called after the server has saved the transaction
  onSaved: (saved: CryptoTransaction) => void;
};

// Adds a buy or sell, or edits `editing` when given. Shown inside a FormModal,
// which mounts it afresh each time it opens.
export function CryptoTransactionForm({ editing, groups, members, coins, onSaved }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();
  // A record keeps its coin even after the admin turns that coin off.
  const coinOptions = editing && !coins.includes(editing.coin) ? [...coins, editing.coin] : coins;
  const save = useSaveMutation(queries.cryptoTransactions, (json: Json) =>
    request(
      editing
        ? api.crypto.transactions[":id"].$put({ param: { id: editing.id }, json })
        : api.crypto.transactions.$post({ json }),
    ),
  );

  const form = useAppForm({
    defaultValues: {
      userId: editing?.userId ?? "",
      groupId: defaultGroup(me, editing?.groupId),
      coin: editing?.coin ?? "",
      type: editing?.type ?? "buy",
      // New records are dated today.
      date: editing?.date ?? todayText(),
      amount: editing ? String(editing.amount) : "",
      price: editing ? String(editing.price) : "",
    },
    onSubmit: async ({ value }) => {
      let saved;
      try {
        saved = await save.mutateAsync({
          groupId: value.groupId,
          // The select only offers coins, and the browser makes sure one is picked.
          coin: value.coin as CoinSymbol,
          type: value.type,
          date: value.date,
          amount: Number(value.amount),
          price: Number(value.price),
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
        <form.AppField name="type">
          {field => (
            <field.ToggleField
              label={t("transactions.type")}
              options={[
                { id: "buy", label: t("type.buy"), tone: "success" },
                { id: "sell", label: t("type.sell"), tone: "danger" },
              ]}
            />
          )}
        </form.AppField>
        {me.role === "admin" && <form.AppField name="userId">{() => <UserSelect members={members} />}</form.AppField>}
        <form.AppField name="groupId">{() => <GroupSelect groups={groups} />}</form.AppField>
        <form.AppField name="coin">
          {field => (
            <field.SelectField
              label={t("crypto.coin")}
              isRequired
              placeholder={t("crypto.selectCoin")}
              options={coinOptions.map(c => ({ id: c, label: `${c} – ${coinName(c)}` }))}
            />
          )}
        </form.AppField>
        <form.AppField name="date">
          {field => <field.DatePickerField label={t("common.date")} isRequired quickPicks />}
        </form.AppField>
        <form.AppField name="amount">
          {field => <field.TextField label={t("crypto.amount")} type="number" required min="0" step="any" />}
        </form.AppField>
        <form.AppField name="price">
          {field => <field.TextField label={t("crypto.rate")} type="number" required min="0" step="any" />}
        </form.AppField>
      </form.ModalForm>
    </form.AppForm>
  );
}
