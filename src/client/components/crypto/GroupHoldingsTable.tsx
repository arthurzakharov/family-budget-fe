import { Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { formatMoney, nameOf } from "@client/utils/format";
import { DataTable, Money } from "@client/components/ui";
import type { CryptoSummary } from "@shared/crypto";
import type { Group } from "@arthurzakharov/family-budget-be-client";

type Props = {
  summary: CryptoSummary;
  groupIds: string[];
  groups: Group[];
};

// Per group: money put in and what its coins are worth now.
export function GroupHoldingsTable({ summary, groupIds, groups }: Props) {
  const { t } = useI18n();

  return (
    <DataTable
      label={t("perGroup.title")}
      columns={
        <>
          <Table.Column isRowHeader>{t("transactions.group")}</Table.Column>
          <Table.Column>{t("crypto.added")}</Table.Column>
          <Table.Column>{t("crypto.value")}</Table.Column>
          <Table.Column>{t("crypto.gain")}</Table.Column>
        </>
      }
    >
      {groupIds.map(id => {
        const g = summary.byGroup[id];
        const added = g?.added ?? 0;
        const value = g?.value ?? 0;
        return (
          <Table.Row key={id} id={id}>
            <Table.Cell>{nameOf(groups, id)}</Table.Cell>
            <Table.Cell>
              <Money cents={added} format={formatMoney} />
            </Table.Cell>
            <Table.Cell>
              <Money cents={value} format={formatMoney} />
            </Table.Cell>
            <Table.Cell>
              <Money cents={value - added} format={formatMoney} signed />
            </Table.Cell>
          </Table.Row>
        );
      })}
    </DataTable>
  );
}
