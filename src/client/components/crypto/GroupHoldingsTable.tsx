import { useMemo } from "react";
import { useI18n } from "@client/context/i18n";
import { formatMoney, nameOf } from "@client/utils/format";
import { moneyColumn, RecordTable, recordColumns } from "@client/components/RecordTable";
import type { CryptoSummary } from "@shared/crypto";
import type { Group } from "@arthurzakharov/family-budget-be-client";

type Props = {
  summary: CryptoSummary;
  groupIds: string[];
  groups: Group[];
};

type Row = { id: string; name: string; added: number; value: number; gain: number };

const column = recordColumns<Row>();

// Per group: money put in and what its coins are worth now.
export function GroupHoldingsTable({ summary, groupIds, groups }: Props) {
  const { t } = useI18n();

  const rows = useMemo(
    () =>
      groupIds.map((id): Row => {
        const added = summary.byGroup[id]?.added ?? 0;
        const value = summary.byGroup[id]?.value ?? 0;
        return { id, name: nameOf(groups, id), added, value, gain: value - added };
      }),
    [summary, groupIds, groups],
  );

  const columns = useMemo(
    () => [
      column.accessor("name", { header: t("transactions.group"), enableSorting: true, sortFn: "text", meta: { isRowHeader: true } }),
      column.accessor("added", moneyColumn(t("crypto.added"), formatMoney)),
      column.accessor("value", moneyColumn(t("crypto.value"), formatMoney)),
      column.accessor("gain", moneyColumn(t("crypto.gain"), formatMoney, true)),
    ],
    [t],
  );

  return <RecordTable label={t("perGroup.title")} data={rows} columns={columns} getRowId={row => row.id} paged={false} />;
}
