import { Chip, Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { useSort } from "@client/utils/sort";
import { addedBy, formatCoins, formatMoney, nameOf } from "@client/utils/format";
import { DataTable, editingRow, Money, RowActions } from "@client/components/ui";
import { signedCoins, signedMoney } from "@shared/crypto";
import type { CryptoTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type SortKey = "group" | "coin" | "date" | "money";

type Props = {
  transactions: CryptoTransaction[];
  groups: Group[];
  members: Member[];
  // Show Edit and Delete buttons on each row when given
  onEdit?: (transaction: CryptoTransaction) => void;
  onDelete?: (transaction: CryptoTransaction) => void;
  editingId?: string | null;
};

// Sortable list of buys and sells.
export function CryptoTransactionTable({ transactions, groups, members, onEdit, onDelete, editingId }: Props) {
  const { t } = useI18n();
  // A user in one group always sees that group, so the column would say nothing.
  const showGroup = hasSeveralGroups(useCurrentUser());
  const editable = onEdit !== undefined && onDelete !== undefined;
  const compare = (a: CryptoTransaction, b: CryptoTransaction, key: SortKey) => {
    if (key === "money") return signedMoney(a) - signedMoney(b);
    if (key === "group") return nameOf(groups, a.groupId).localeCompare(nameOf(groups, b.groupId));
    if (key === "coin") return a.coin.localeCompare(b.coin);
    return a.date.localeCompare(b.date);
  };
  const { sorted, column, sortProps } = useSort(transactions, compare);

  return (
    <DataTable
      label={t("transactions.title")}
      emptyText={t("transactions.empty")}
      {...sortProps}
      columns={
        <>
          {showGroup && column("group", t("transactions.group"))}
          <Table.Column>{t("common.addedBy")}</Table.Column>
          {column("coin", t("crypto.coin"), true)}
          <Table.Column>{t("transactions.type")}</Table.Column>
          {column("date", t("common.date"))}
          <Table.Column>{t("crypto.amount")}</Table.Column>
          <Table.Column>{t("crypto.rate")}</Table.Column>
          {column("money", t("crypto.money"))}
          {editable && <Table.Column aria-label={t("common.edit")}> </Table.Column>}
        </>
      }
    >
      {sorted.map(tx => {
        const sell = tx.type === "sell";
        return (
          <Table.Row key={tx.id} id={tx.id} className={editingRow(tx.id === editingId)}>
            {showGroup && <Table.Cell>{nameOf(groups, tx.groupId)}</Table.Cell>}
            <Table.Cell>{addedBy(members, tx.userId, t)}</Table.Cell>
            <Table.Cell className="font-medium">{tx.coin}</Table.Cell>
            <Table.Cell>
              <Chip size="sm" color={sell ? "danger" : "success"} variant="soft">
                {t(sell ? "type.sell" : "type.buy")}
              </Chip>
            </Table.Cell>
            <Table.Cell className="whitespace-nowrap">{tx.date}</Table.Cell>
            <Table.Cell className="tabular-nums">{formatCoins(signedCoins(tx))}</Table.Cell>
            <Table.Cell>
              <Money cents={tx.price} format={formatMoney} />
            </Table.Cell>
            <Table.Cell>
              <Money cents={signedMoney(tx)} format={formatMoney} signed />
            </Table.Cell>
            {editable && (
              <Table.Cell>
                <RowActions onEdit={() => onEdit!(tx)} onDelete={() => onDelete!(tx)} />
              </Table.Cell>
            )}
          </Table.Row>
        );
      })}
    </DataTable>
  );
}
