import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { DataTable, editingRow, RowActions } from "@client/components/ui";
import { addedBy } from "@client/utils/format";
import type { DepositRate, Member } from "@arthurzakharov/family-budget-be-client";

type Props = {
  rates: DepositRate[];
  members: Member[];
  // Shows an Edit button on each row when given
  onEdit?: (rate: DepositRate) => void;
  editingId?: string | null;
};

export function RateTable({ rates, members, onEdit, editingId }: Props) {
  const { t } = useI18n();
  // "From the beginning" sorts first.
  const sorted = [...rates].sort((a, b) => (a.from ?? "").localeCompare(b.from ?? ""));

  return (
    <DataTable
      label={t("rates.title")}
      emptyText={t("rates.empty")}
      columns={
        <>
          <Table.Column isRowHeader>{t("rates.rate")}</Table.Column>
          <Table.Column>{t("rates.from")}</Table.Column>
          <Table.Column>{t("rates.till")}</Table.Column>
          <Table.Column>{t("common.addedBy")}</Table.Column>
          {onEdit && <Table.Column aria-label={t("common.edit")}> </Table.Column>}
        </>
      }
    >
      {sorted.map(r => (
        <Table.Row key={r.id} id={r.id} className={editingRow(r.id === editingId)}>
          <Table.Cell className="tabular-nums">{r.ratePercent}</Table.Cell>
          <Table.Cell className="whitespace-nowrap">{r.from ?? t("rates.beginning")}</Table.Cell>
          <Table.Cell className="whitespace-nowrap">{r.till ?? t("rates.current")}</Table.Cell>
          <Table.Cell>{addedBy(members, r.userId, t)}</Table.Cell>
          {onEdit && (
            <Table.Cell>
              <RowActions onEdit={() => onEdit(r)} />
            </Table.Cell>
          )}
        </Table.Row>
      ))}
    </DataTable>
  );
}
