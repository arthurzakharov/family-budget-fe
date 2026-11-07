import { useMemo } from "react";
import { Chip, Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { addedBy, formatCents, formatMoney, nameOf } from "@client/utils/format";
import { editingRow, Money, RowActions } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import { signedAmount } from "@shared/transactions";
import { CAPITAL_GAINS_TAX, SOLIDARITY_SURCHARGE } from "@shared/interest";
import type { DepositTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

// Interest figures for the footer, in cents: the whole deposit's or one group's.
export type Totals = { gross: number; tax: number; net: number; balance: number; pending: number };

type Props = {
  transactions: DepositTransaction[];
  groups: Group[];
  members: Member[];
  // Shows the totals underneath when given
  totals?: Totals;
  // Show Edit and Delete buttons on each row when given
  onEdit?: (transaction: DepositTransaction) => void;
  onDelete?: (transaction: DepositTransaction) => void;
  editingId?: string | null;
};

const column = recordColumns<DepositTransaction>();

// Sortable, paged list of transactions, optionally with totals underneath.
export function TransactionTable({ transactions, groups, members, totals, onEdit, onDelete, editingId }: Props) {
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
      column.display({
        id: "type",
        header: t("transactions.type"),
        cell: ({ row }) => {
          const withdrawal = row.original.type === "withdrawal";
          return (
            <Chip size="sm" color={withdrawal ? "danger" : "success"} variant="soft">
              {t(withdrawal ? "type.withdrawal" : "type.deposit")}
            </Chip>
          );
        },
      }),
      column.accessor("date", {
        header: t("common.date"),
        enableSorting: true,
        sortFn: "basic",
        meta: { isRowHeader: true, className: "whitespace-nowrap" },
      }),
      column.accessor(tx => signedAmount(tx), {
        id: "amount",
        header: t("transactions.amount"),
        enableSorting: true,
        sortFn: "basic",
        cell: ({ getValue }) => <Money cents={getValue()} format={formatCents} signed />,
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

  // The totals cover every transaction shown, not only the open page.
  const totalDeposited = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? 0 : t.amountCents), 0);
  const totalWithdrawn = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? t.amountCents : 0), 0);
  const totalAdded = totalDeposited - totalWithdrawn;
  const interestPercent = totals && totalAdded > 0 ? (totals.net / totalAdded) * 100 : 0;

  // Footer rows: the label spans the columns before the amount, the value the rest.
  const totalRow = (id: string, label: string, value: string) => (
    <Table.Row key={id} id={id} className="[&>td]:font-semibold">
      <Table.Cell colSpan={showGroup ? 4 : 3}>{label}</Table.Cell>
      <Table.Cell colSpan={editable ? 2 : 1} className="tabular-nums">
        {value}
      </Table.Cell>
    </Table.Row>
  );

  return (
    <RecordTable
      label={t("transactions.title")}
      emptyText={t("transactions.empty")}
      data={transactions}
      columns={columns}
      getRowId={tx => tx.id}
      rowClassName={tx => editingRow(tx.id === editingId)}
      footer={
        totals && (
          <>
            {totalRow("deposited", t("totals.deposited"), formatCents(totalDeposited))}
            {totalRow("withdrawn", t("totals.withdrawn"), formatCents(totalWithdrawn))}
            {totalRow("netAdded", t("totals.netAdded"), formatCents(totalAdded))}
            {totalRow("gross", t("totals.interestBeforeTax"), formatCents(totals.gross))}
            {totalRow(
              "tax",
              t("totals.taxWithheld", { capitalGains: CAPITAL_GAINS_TAX * 100, surcharge: SOLIDARITY_SURCHARGE * 100 }),
              formatCents(totals.tax),
            )}
            {totalRow("net", t("totals.interestAfterTax"), `${formatCents(totals.net)} (${formatMoney(interestPercent)}%)`)}
            {totalRow("balance", t("totals.balance"), formatCents(totals.balance))}
            {totalRow("pending", t("totals.pending"), formatCents(totals.pending))}
          </>
        )
      }
    />
  );
}
