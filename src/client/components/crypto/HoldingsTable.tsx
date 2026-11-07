import { useMemo } from "react";
import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { formatCoins, formatMoney } from "@client/utils/format";
import { Money } from "@client/components/ui";
import { moneyColumn, RecordTable, recordColumns } from "@client/components/RecordTable";
import { coinName, type CryptoSummary, type Holding, type Prices } from "@shared/crypto";

type Props = {
  summary: CryptoSummary;
  prices: Prices;
};

type Row = Holding & { coin: string; price: number; gain: number };

const column = recordColumns<Row>();

// Per coin: how many were bought, sold and are still held, the money put in and what it is worth now.
export function HoldingsTable({ summary, prices }: Props) {
  const { t } = useI18n();

  const rows = useMemo(
    () =>
      Object.entries(summary.byCoin).map(([coin, h]): Row => ({ ...h, coin, price: prices[coin] ?? 0, gain: h.value - h.added })),
    [summary, prices],
  );

  const columns = useMemo(() => {
    const coins = (header: string) => ({
      header,
      enableSorting: true,
      sortFn: "basic" as const,
      cell: ({ getValue }: { getValue: () => number }) => formatCoins(getValue()),
      meta: { className: "tabular-nums" },
    });
    return [
      column.accessor("coin", {
        header: t("crypto.coin"),
        enableSorting: true,
        sortFn: "text",
        meta: { isRowHeader: true },
        cell: ({ getValue }) => (
          <>
            <span className="font-medium">{getValue()}</span> <span className="text-sm text-muted">{coinName(getValue())}</span>
          </>
        ),
      }),
      column.accessor("bought", coins(t("crypto.bought"))),
      column.accessor("sold", coins(t("crypto.sold"))),
      column.accessor("held", coins(t("crypto.held"))),
      column.accessor("price", moneyColumn(t("crypto.rateNow"), formatMoney)),
      column.accessor("added", moneyColumn(t("crypto.added"), formatMoney)),
      column.accessor("value", moneyColumn(t("crypto.value"), formatMoney)),
      column.accessor("gain", moneyColumn(t("crypto.gain"), formatMoney, true)),
    ];
  }, [t]);

  return (
    <RecordTable
      label={t("crypto.holdings")}
      emptyText={t("crypto.noHoldings")}
      data={rows}
      columns={columns}
      getRowId={row => row.coin}
      paged={false}
      footer={
        <Table.Row key="total" id="total" className="[&>td]:font-semibold">
          <Table.Cell colSpan={5}>{t("common.total")}</Table.Cell>
          <Table.Cell>
            <Money cents={summary.added} format={formatMoney} />
          </Table.Cell>
          <Table.Cell>
            <Money cents={summary.value} format={formatMoney} />
          </Table.Cell>
          <Table.Cell>
            <Money cents={summary.value - summary.added} format={formatMoney} signed />
          </Table.Cell>
        </Table.Row>
      }
    />
  );
}
