import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { DataTable, Money } from "@client/components/ui";
import { formatCents, nameOf } from "@client/utils/format";
import type { Group, InterestSummary } from "@arthurzakharov/family-budget-be-client";

type Props = {
  interest: InterestSummary;
  groups: Group[];
};

// Monthly interest payouts, with a column per group when there is more than one.
export function PayoutTable({ interest, groups }: Props) {
  const { t } = useI18n();
  // Groups in the order they were created, plus any only known from transactions.
  const groupIds = Object.keys(interest.byGroup);
  const groupColumns = groupIds.length > 1 ? groupIds : [];
  const money = (cents: number) => <Money cents={cents} format={formatCents} />;

  return (
    <DataTable
      label={t("payouts.title")}
      emptyText={t("payouts.empty")}
      columns={
        <>
          <Table.Column isRowHeader>{t("common.date")}</Table.Column>
          <Table.Column>{t("payouts.beforeTax")}</Table.Column>
          <Table.Column>{t("common.tax")}</Table.Column>
          <Table.Column>{t("payouts.afterTax")}</Table.Column>
          {groupColumns.map(id => (
            <Table.Column key={id} id={`group-${id}`}>
              {t("payouts.groupAfterTax", { group: nameOf(groups, id) })}
            </Table.Column>
          ))}
          <Table.Column>{t("common.balance")}</Table.Column>
        </>
      }
    >
      {interest.payouts.map(p => (
        <Table.Row key={p.date} id={p.date}>
          <Table.Cell className="whitespace-nowrap">{p.date}</Table.Cell>
          <Table.Cell>{money(p.gross)}</Table.Cell>
          <Table.Cell>{money(p.tax)}</Table.Cell>
          <Table.Cell>{money(p.net)}</Table.Cell>
          {groupColumns.map(id => (
            <Table.Cell key={id}>{money(p.netByGroup[id] ?? 0)}</Table.Cell>
          ))}
          <Table.Cell>{money(p.balance)}</Table.Cell>
        </Table.Row>
      ))}
      {/* The total row only makes sense under actual payouts; without any the empty text shows instead. */}
      {interest.payouts.length > 0 && (
        <Table.Row key="total" id="total" className="[&>td]:font-semibold">
          <Table.Cell>{t("common.total")}</Table.Cell>
          <Table.Cell>{money(interest.gross)}</Table.Cell>
          <Table.Cell>{money(interest.tax)}</Table.Cell>
          <Table.Cell>{money(interest.net)}</Table.Cell>
          {groupColumns.map(id => (
            <Table.Cell key={id}>{money(interest.byGroup[id]!.net)}</Table.Cell>
          ))}
          <Table.Cell> </Table.Cell>
        </Table.Row>
      )}
    </DataTable>
  );
}
