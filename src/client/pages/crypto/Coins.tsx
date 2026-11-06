import { useState, type FormEvent } from "react";
import { api, call } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { Button, Table } from "@heroui/react";
import { CheckboxField, DataTable, Message, Section } from "@client/components/ui";
import { COINS } from "@shared/crypto";
import type { CoinSymbol } from "@arthurzakharov/family-budget-be-client";

// Admin only: which coins can be picked for new records. Existing records keep their coin.
export function Coins() {
  const { t } = useI18n();
  const { coins, setCoins } = useCrypto();
  // null until the admin changes something, so the list follows the loaded coins.
  const [selected, setSelected] = useState<CoinSymbol[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = selected ?? coins;

  const toggle = (coin: CoinSymbol, on: boolean) => {
    setNotice(null);
    setSelected(on ? [...current, coin] : current.filter(c => c !== coin));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Kept in the order of the list rather than the order they were ticked.
    const enabled = COINS.map(c => c.symbol).filter(c => current.includes(c));
    const result = await call(api.crypto.coins.$put({ json: { enabled } }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setCoins(result.data);
    setSelected(null);
    setNotice("common.saved");
  };

  return (
    <Section title={t("crypto.coins")} description={t("crypto.coinsHint")}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
                  isSelected={current.includes(c.symbol)}
                  onChange={on => toggle(c.symbol, on)}
                />
              </Table.Cell>
              <Table.Cell className="font-medium">{c.symbol}</Table.Cell>
              <Table.Cell>{c.name}</Table.Cell>
            </Table.Row>
          ))}
        </DataTable>
        <div>
          <Button type="submit" isDisabled={selected === null}>
            {t("common.saveChanges")}
          </Button>
        </div>
        <Message error={error} success={notice} />
      </form>
    </Section>
  );
}
