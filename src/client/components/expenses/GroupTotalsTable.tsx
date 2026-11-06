import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { DataTable, Money } from "@client/components/ui";
import { formatCents, nameOf } from "@client/utils/format";
import type { EntrySummary } from "@shared/expenses";
import type { Group } from "@arthurzakharov/family-budget-be-client";

type Props = {
  summary: EntrySummary;
  groupIds: string[];
  groups: Group[];
};

// Per group: income, expenses and what is left.
export function GroupTotalsTable({ summary, groupIds, groups }: Props) {
  const { t } = useI18n();

  return (
    <DataTable
      label={t("perGroup.title")}
      columns={
        <>
          <Table.Column isRowHeader>{t("transactions.group")}</Table.Column>
          <Table.Column>{t("expenses.income")}</Table.Column>
          <Table.Column>{t("expenses.expenses")}</Table.Column>
          <Table.Column>{t("expenses.net")}</Table.Column>
        </>
      }
    >
      {groupIds.map(id => {
        const g = summary.byGroup[id] ?? { income: 0, expenses: 0, net: 0 };
        return (
          <Table.Row key={id} id={id}>
            <Table.Cell>{nameOf(groups, id)}</Table.Cell>
            <Table.Cell>
              <Money cents={g.income} format={formatCents} />
            </Table.Cell>
            <Table.Cell>
              <Money cents={g.expenses} format={formatCents} />
            </Table.Cell>
            <Table.Cell>
              <Money cents={g.net} format={formatCents} signed />
            </Table.Cell>
          </Table.Row>
        );
      })}
    </DataTable>
  );
}
