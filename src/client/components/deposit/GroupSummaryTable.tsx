import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { DataTable, Money } from "@client/components/ui";
import { formatCents, formatMoney, nameOf } from "@client/utils/format";
import type { Group, InterestSummary } from "@arthurzakharov/family-budget-be-client";

type Props = {
  interest: InterestSummary;
  groups: Group[];
};

// Per group: money added, interest earned, and what the group's share is worth now.
export function GroupSummaryTable({ interest, groups }: Props) {
  const { t } = useI18n();

  return (
    <DataTable
      label={t("perGroup.title")}
      columns={
        <>
          <Table.Column isRowHeader>{t("transactions.group")}</Table.Column>
          <Table.Column>{t("perGroup.added")}</Table.Column>
          <Table.Column>{t("totals.interestBeforeTax")}</Table.Column>
          <Table.Column>{t("common.tax")}</Table.Column>
          <Table.Column>{t("totals.interestAfterTax")}</Table.Column>
          <Table.Column>{t("perGroup.gained")}</Table.Column>
          <Table.Column>{t("common.balance")}</Table.Column>
        </>
      }
    >
      {Object.entries(interest.byGroup).map(([id, s]) => (
        <Table.Row key={id} id={id}>
          <Table.Cell>{nameOf(groups, id)}</Table.Cell>
          <Table.Cell>
            <Money cents={s.added} format={formatCents} />
          </Table.Cell>
          <Table.Cell>
            <Money cents={s.gross} format={formatCents} />
          </Table.Cell>
          <Table.Cell>
            <Money cents={s.tax} format={formatCents} />
          </Table.Cell>
          <Table.Cell>
            <Money cents={s.net} format={formatCents} />
          </Table.Cell>
          <Table.Cell className="tabular-nums">{s.added > 0 ? formatMoney((s.net / s.added) * 100) : "–"}</Table.Cell>
          <Table.Cell>
            <Money cents={s.balance} format={formatCents} />
          </Table.Cell>
        </Table.Row>
      ))}
    </DataTable>
  );
}
