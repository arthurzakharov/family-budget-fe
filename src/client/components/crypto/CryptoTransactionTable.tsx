import { useMemo } from "react";
import { Chip } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { addedBy, formatCoins, formatMoney, nameOf } from "@client/utils/format";
import { editingRow, Money, RowActions } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import { signedCoins, signedMoney } from "@shared/crypto";
import type { CryptoTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type Props = {
  transactions: CryptoTransaction[];
  groups: Group[];
  members: Member[];
  // Show Edit and Delete buttons on each row when given
  onEdit?: (transaction: CryptoTransaction) => void;
  onDelete?: (transaction: CryptoTransaction) => void;
  editingId?: string | null;
};

const column = recordColumns<CryptoTransaction>();

// Sortable, paged list of buys and sells.
export function CryptoTransactionTable({ transactions, groups, members, onEdit, onDelete, editingId }: Props) {
  const { t } = useI18n();
  // A user in one group always sees that group, so the column would say nothing.
  const showGroup = hasSeveralGroups(useCurrentUser());
  const editable = onEdit !== undefined && onDelete !== undefined;

  const columns = useMemo(
    () => [
      ...(showGroup
        ? [column.accessor(tx => nameOf(groups, tx.groupId), { id: "group", header: t("transactions.group"), enableSorting: true, sortFn: "text" })]
        : []),
      column.display({ id: "addedBy", header: t("common.addedBy"), cell: ({ row }) => addedBy(members, row.original.userId, t) }),
      column.accessor("coin", {
        header: t("crypto.coin"),
        enableSorting: true,
        sortFn: "text",
        meta: { isRowHeader: true, className: "font-medium" },
      }),
      column.display({
        id: "type",
        header: t("transactions.type"),
        cell: ({ row }) => {
          const sell = row.original.type === "sell";
          return (
            <Chip size="sm" color={sell ? "danger" : "success"} variant="soft">
              {t(sell ? "type.sell" : "type.buy")}
            </Chip>
          );
        },
      }),
      column.accessor("date", { header: t("common.date"), enableSorting: true, sortFn: "basic", meta: { className: "whitespace-nowrap" } }),
      column.accessor(tx => signedCoins(tx), {
        id: "amount",
        header: t("crypto.amount"),
        cell: ({ getValue }) => formatCoins(getValue()),
        meta: { className: "tabular-nums" },
      }),
      column.accessor("price", {
        header: t("crypto.rate"),
        cell: ({ getValue }) => <Money cents={getValue()} format={formatMoney} />,
      }),
      column.accessor(tx => signedMoney(tx), {
        id: "money",
        header: t("crypto.money"),
        enableSorting: true,
        sortFn: "basic",
        cell: ({ getValue }) => <Money cents={getValue()} format={formatMoney} signed />,
      }),
      ...(editable
        ? [
            column.display({
              id: "actions",
              header: " ",
              meta: { ariaLabel: t("common.edit") },
              cell: ({ row }) => <RowActions onEdit={() => onEdit(row.original)} onDelete={() => onDelete(row.original)} />,
            }),
          ]
        : []),
    ],
    [t, groups, members, showGroup, editable, onEdit, onDelete],
  );

  return (
    <RecordTable
      label={t("transactions.title")}
      emptyText={t("transactions.empty")}
      data={transactions}
      columns={columns}
      getRowId={tx => tx.id}
      rowClassName={tx => editingRow(tx.id === editingId)}
    />
  );
}
