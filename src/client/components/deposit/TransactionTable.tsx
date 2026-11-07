import { useMemo, useState, type ReactNode } from "react";
import { Chip, Table } from "@heroui/react";
import { ChevronDown } from "@gravity-ui/icons";
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
  // Whether a record's delete request is running
  isDeleting?: (id: string) => boolean;
};

const column = recordColumns<DepositTransaction>();

const TOTALS_OPEN_KEY = "deposit.totalsOpen";

// The open state of the totals, kept per browser. Storage can be unavailable (private mode,
// blocked site data); the totals then simply start closed.
function readTotalsOpen() {
  try {
    return localStorage.getItem(TOTALS_OPEN_KEY) === "true";
  } catch {
    return false;
  }
}

function saveTotalsOpen(open: boolean) {
  try {
    localStorage.setItem(TOTALS_OPEN_KEY, String(open));
  } catch {}
}

// Breakdown rows under the balance; their cells' padding and border fold with the content.
const detailRow =
  "[&>td]:font-normal [&>td:first-child]:pl-9 [&>td]:transition-[padding,border-width] [&>td]:duration-300 [&>td]:ease-in-out motion-reduce:[&>td]:transition-none";
const foldedRow = "[&>td]:py-0 [&>td]:border-b-0";

// The balance row. While the breakdown is folded away it is the table's visible last row, so it
// takes the rounded bottom corners the table gives its last row.
const balanceRow = (open: boolean) =>
  open
    ? "[&>td]:font-semibold"
    : "[&>td]:font-semibold [&>td:first-child]:[border-end-start-radius:min(32px,var(--radius-2xl))] [&>td:last-child]:[border-end-end-radius:min(32px,var(--radius-2xl))]";

// Sortable, paged list of transactions, optionally with totals underneath.
export function TransactionTable({ transactions, groups, members, totals, onEdit, onDelete, editingId, isDeleting }: Props) {
  const { t } = useI18n();
  // A user in one group always sees that group, so the column would say nothing.
  const showGroup = hasSeveralGroups(useCurrentUser());
  const editable = onEdit !== undefined && onDelete !== undefined;
  // Whether the totals under the list are open; closed, only the balance shows.
  // Remembered in this browser for the next visit.
  const [showTotals, setShowTotals] = useState(readTotalsOpen);
  const toggleTotals = () => {
    const open = !showTotals;
    setShowTotals(open);
    saveTotalsOpen(open);
  };

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
              cell: ({ row }) => (
                <RowActions
                  onEdit={() => onEdit(row.original)}
                  onDelete={() => onDelete(row.original)}
                  isDeleting={isDeleting?.(row.original.id)}
                />
              ),
            }),
          ]
        : []),
    ],
    [t, groups, members, showGroup, editable, onEdit, onDelete, isDeleting],
  );

  // The totals cover every transaction shown, not only the open page.
  const totalDeposited = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? 0 : t.amountCents), 0);
  const totalWithdrawn = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? t.amountCents : 0), 0);
  const totalAdded = totalDeposited - totalWithdrawn;
  const interestPercent = totals && totalAdded > 0 ? (totals.net / totalAdded) * 100 : 0;

  // Footer rows: the label spans the columns before the amount, the value the rest.
  // Breakdown rows (`isDetail`) are quieter than the balance and indented to line up with its
  // label after the chevron. They are always in the table, so the columns keep their widths when
  // the totals open or close; closed, they fold to no height (padding, border and content).
  const totalRow = (id: string, label: ReactNode, value: string, isDetail = false) => {
    const folded = isDetail && !showTotals;
    // The content's height animates between none and its own by moving the grid row from 0fr to 1fr.
    const fold = (content: ReactNode) =>
      isDetail ? (
        <div
          aria-hidden={folded}
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out motion-reduce:transition-none ${
            folded ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100"
          }`}
        >
          <div className="min-h-0 overflow-hidden">{content}</div>
        </div>
      ) : (
        content
      );
    return (
      <Table.Row key={id} id={id} className={isDetail ? `${detailRow} ${folded ? foldedRow : ""}` : balanceRow(showTotals)}>
        <Table.Cell colSpan={showGroup ? 4 : 3}>{fold(label)}</Table.Cell>
        <Table.Cell colSpan={editable ? 2 : 1} className="tabular-nums">
          {fold(value)}
        </Table.Cell>
      </Table.Row>
    );
  };

  // The totals fold like an accordion: closed, only the balance shows; its row opens the rest.
  const balanceToggle = (
    <button
      type="button"
      aria-expanded={showTotals}
      onClick={toggleTotals}
      className="-mx-1 flex items-center gap-1.5 rounded-md px-1 text-left outline-none hover:text-accent focus-visible:ring-2 focus-visible:ring-focus"
    >
      <ChevronDown
        aria-hidden
        className={`size-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${showTotals ? "rotate-180" : ""}`}
      />
      {t("totals.balance")}
    </button>
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
            {totalRow("balance", balanceToggle, formatCents(totals.balance))}
            {totalRow("deposited", t("totals.deposited"), formatCents(totalDeposited), true)}
            {totalRow("withdrawn", t("totals.withdrawn"), formatCents(totalWithdrawn), true)}
            {totalRow("netAdded", t("totals.netAdded"), formatCents(totalAdded), true)}
            {totalRow("gross", t("totals.interestBeforeTax"), formatCents(totals.gross), true)}
            {totalRow(
              "tax",
              t("totals.taxWithheld", { capitalGains: CAPITAL_GAINS_TAX * 100, surcharge: SOLIDARITY_SURCHARGE * 100 }),
              formatCents(totals.tax),
              true,
            )}
            {totalRow(
              "net",
              t("totals.interestAfterTax"),
              `${formatCents(totals.net)} (${formatMoney(interestPercent)}%)`,
              true,
            )}
            {totalRow("pending", t("totals.pending"), formatCents(totals.pending), true)}
          </>
        )
      }
    />
  );
}
