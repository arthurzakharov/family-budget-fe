import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, errorCode, request } from "@client/api";
import { queries, useReplaceMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { submitWith, useAppForm } from "@client/components/form";
import { CheckboxField, Message, Section } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import { COINS } from "@shared/crypto";
import type { CoinSymbol } from "@arthurzakharov/family-budget-be-client";

const column = recordColumns<(typeof COINS)[number]>();

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
            <RecordTable
              label={t("crypto.coins")}
              data={COINS}
              columns={[
                column.display({
                  id: "available",
                  header: t("crypto.available"),
                  meta: { headerClassName: "w-24" },
                  cell: ({ row: { original: c } }) => (
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
                  ),
                }),
                column.accessor("symbol", {
                  header: t("crypto.coin"),
                  enableSorting: true,
                  sortFn: "text",
                  meta: { isRowHeader: true, className: "font-medium" },
                }),
                column.accessor("name", { header: t("crypto.name"), enableSorting: true, sortFn: "text" }),
              ]}
              getRowId={c => c.symbol}
              paged={false}
            />
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
