import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { formatCoins, formatMoney } from "@client/utils/format";
import { DataTable, Money } from "@client/components/ui";
import { coinName, type CryptoSummary, type Prices } from "@shared/crypto";

type Props = {
  summary: CryptoSummary;
  prices: Prices;
};

// Per coin: how many were bought, sold and are still held, the money put in and what it is worth now.
export function HoldingsTable({ summary, prices }: Props) {
  const { t } = useI18n();
  const coins = Object.entries(summary.byCoin);

  return (
    <DataTable
      label={t("crypto.holdings")}
      emptyText={t("crypto.noHoldings")}
      columns={
        <>
          <Table.Column isRowHeader>{t("crypto.coin")}</Table.Column>
          <Table.Column>{t("crypto.bought")}</Table.Column>
          <Table.Column>{t("crypto.sold")}</Table.Column>
          <Table.Column>{t("crypto.held")}</Table.Column>
          <Table.Column>{t("crypto.rateNow")}</Table.Column>
          <Table.Column>{t("crypto.added")}</Table.Column>
          <Table.Column>{t("crypto.value")}</Table.Column>
          <Table.Column>{t("crypto.gain")}</Table.Column>
        </>
      }
    >
      {/* The total row only shows with coins, so an empty table shows its empty message instead. */}
      {coins.length === 0
        ? []
        : [
          ...coins.map(([coin, h]) => (
            <Table.Row key={coin} id={coin}>
              <Table.Cell>
                <span className="font-medium">{coin}</span> <span className="text-sm text-muted">{coinName(coin)}</span>
              </Table.Cell>
              <Table.Cell className="tabular-nums">{formatCoins(h.bought)}</Table.Cell>
              <Table.Cell className="tabular-nums">{formatCoins(h.sold)}</Table.Cell>
              <Table.Cell className="tabular-nums">{formatCoins(h.held)}</Table.Cell>
              <Table.Cell>
                <Money cents={prices[coin] ?? 0} format={formatMoney} />
              </Table.Cell>
              <Table.Cell>
                <Money cents={h.added} format={formatMoney} />
              </Table.Cell>
              <Table.Cell>
                <Money cents={h.value} format={formatMoney} />
              </Table.Cell>
              <Table.Cell>
                <Money cents={h.value - h.added} format={formatMoney} signed />
              </Table.Cell>
            </Table.Row>
          )),
          <Table.Row key="total" id="total" className="[&>td]:font-semibold">
            <Table.Cell>{t("common.total")}</Table.Cell>
            <Table.Cell> </Table.Cell>
            <Table.Cell> </Table.Cell>
            <Table.Cell> </Table.Cell>
            <Table.Cell> </Table.Cell>
            <Table.Cell>
              <Money cents={summary.added} format={formatMoney} />
            </Table.Cell>
            <Table.Cell>
              <Money cents={summary.value} format={formatMoney} />
            </Table.Cell>
            <Table.Cell>
              <Money cents={summary.value - summary.added} format={formatMoney} signed />
            </Table.Cell>
          </Table.Row>,
        ]}
    </DataTable>
  );
}
