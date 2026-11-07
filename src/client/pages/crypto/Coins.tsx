import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, errorCode, request } from "@client/api";
import { queries, useReplaceMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { Table } from "@heroui/react";
import { submitWith, useAppForm } from "@client/components/form";
import { CheckboxField, DataTable, Message, Section } from "@client/components/ui";
import { COINS } from "@shared/crypto";
import type { CoinSymbol } from "@arthurzakharov/family-budget-be-client";

// Admin only: which coins can be picked for new records. Existing records keep their coin.
export function Coins() {
  const { t } = useI18n();
  const { data: coins } = useQuery(queries.cryptoCoins);
  return (
    <Section title={t("crypto.coins")} description={t("crypto.coinsHint")}>
      {/* The form starts from the saved coins, so it waits until they are loaded. */}
      {coins && <CoinsForm coins={coins} />}
    </Section>
  );
}

function CoinsForm({ coins }: { coins: CoinSymbol[] }) {
  const { t } = useI18n();
  const [notice, setNotice] = useState<string | null>(null);
  // The server answers with the new list of coins.
  const save = useReplaceMutation(queries.cryptoCoins, (enabled: CoinSymbol[]) =>
    request(api.crypto.coins.$put({ json: { enabled } })),
  );

  const form = useAppForm({
    defaultValues: { enabled: coins },
    onSubmit: async ({ value, formApi }) => {
      // Kept in the order of the list rather than the order they were ticked.
      const enabled = COINS.map(c => c.symbol).filter(c => value.enabled.includes(c));
      try {
        await save.mutateAsync(enabled);
      } catch {
        return; // shown from save.error
      }
      // The saved coins are the new starting point, so "Save changes" is off again.
      formApi.reset({ enabled });
      setNotice("common.saved");
    },
  });

  return (
    <form.AppForm>
      <form onSubmit={submitWith(form)} className="flex flex-col gap-4">
        <form.Field name="enabled" listeners={{ onChange: () => setNotice(null) }}>
          {field => (
            <DataTable
              label={t("crypto.coins")}
              columns={
                <>
                  <Table.Column className="w-24">{t("crypto.available")}</Table.Column>
                  <Table.Column isRowHeader>{t("crypto.coin")}</Table.Column>
                  <Table.Column>{t("crypto.name")}</Table.Column>
                </>
              }
            >
              {COINS.map(c => (
                <Table.Row key={c.symbol} id={c.symbol}>
                  <Table.Cell>
                    <CheckboxField
                      label=""
                      aria-label={c.name}
                      isSelected={field.state.value.includes(c.symbol)}
                      onChange={on =>
                        field.handleChange(
                          on ? [...field.state.value, c.symbol] : field.state.value.filter(s => s !== c.symbol),
                        )
                      }
                    />
                  </Table.Cell>
                  <Table.Cell className="font-medium">{c.symbol}</Table.Cell>
                  <Table.Cell>{c.name}</Table.Cell>
                </Table.Row>
              ))}
            </DataTable>
          )}
        </form.Field>
        <div>
          <form.SubmitButton requireChange>{t("common.saveChanges")}</form.SubmitButton>
        </div>
        <Message error={errorCode(save.error)} success={notice} />
      </form>
    </form.AppForm>
  );
}
