import { Chip, Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { useSort } from "@client/utils/sort";
import { addedBy, formatCents, formatMoney, nameOf } from "@client/utils/format";
import { DataTable, editingRow, Money, RowActions } from "@client/components/ui";
import { signedAmount } from "@shared/transactions";
import { CAPITAL_GAINS_TAX, SOLIDARITY_SURCHARGE } from "@shared/interest";
import type { DepositTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type SortKey = "group" | "date" | "amount";

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

// Sortable list of transactions, optionally with totals underneath.
export function TransactionTable({ transactions, groups, members, totals, onEdit, onDelete, editingId }: Props) {
  const { t } = useI18n();
  // A user in one group always sees that group, so the column would say nothing.
  const showGroup = hasSeveralGroups(useCurrentUser());
  const editable = onEdit !== undefined && onDelete !== undefined;

  const compare = (a: DepositTransaction, b: DepositTransaction, key: SortKey) => {
    if (key === "amount") return signedAmount(a) - signedAmount(b);
    if (key === "group") return nameOf(groups, a.groupId).localeCompare(nameOf(groups, b.groupId));
    return a.date.localeCompare(b.date);
  };
  const { sorted, column, sortProps } = useSort(transactions, compare);

  const totalDeposited = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? 0 : t.amountCents), 0);
  const totalWithdrawn = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? t.amountCents : 0), 0);
  const totalAdded = totalDeposited - totalWithdrawn;
  const interestPercent = totals && totalAdded > 0 ? (totals.net / totalAdded) * 100 : 0;

  // Footer rows: the label spans the data columns, the value the rest.
  const totalRow = (id: string, label: string, value: string) => (
    <Table.Row key={id} id={id} className="[&>td]:font-semibold">
      <Table.Cell colSpan={showGroup ? 4 : 3}>{label}</Table.Cell>
      <Table.Cell colSpan={editable ? 2 : 1} className="tabular-nums">
        {value}
      </Table.Cell>
    </Table.Row>
  );

  return (
    <DataTable
      label={t("transactions.title")}
      emptyText={t("transactions.empty")}
      {...sortProps}
      columns={
        <>
          {showGroup && column("group", t("transactions.group"))}
          <Table.Column>{t("common.addedBy")}</Table.Column>
          <Table.Column>{t("transactions.type")}</Table.Column>
          {column("date", t("common.date"), true)}
          {column("amount", t("transactions.amount"))}
          {editable && <Table.Column aria-label={t("common.edit")}> </Table.Column>}
        </>
      }
    >
      {sorted.map(tx => {
        const withdrawal = tx.type === "withdrawal";
        return (
          <Table.Row key={tx.id} id={tx.id} className={editingRow(tx.id === editingId)}>
            {showGroup && <Table.Cell>{nameOf(groups, tx.groupId)}</Table.Cell>}
            <Table.Cell>{addedBy(members, tx.userId, t)}</Table.Cell>
            <Table.Cell>
              <Chip size="sm" color={withdrawal ? "danger" : "success"} variant="soft">
                {t(withdrawal ? "type.withdrawal" : "type.deposit")}
              </Chip>
            </Table.Cell>
            <Table.Cell className="whitespace-nowrap">{tx.date}</Table.Cell>
            <Table.Cell>
              <Money cents={signedAmount(tx)} format={formatCents} signed />
            </Table.Cell>
            {editable && (
              <Table.Cell>
                <RowActions onEdit={() => onEdit!(tx)} onDelete={() => onDelete!(tx)} />
              </Table.Cell>
            )}
          </Table.Row>
        );
      })}
      {/* Totals only follow actual transactions; without any the empty text shows instead. */}
      {totals && transactions.length > 0 && (
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
      )}
    </DataTable>
  );
}
