import { useState } from "react";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { addedBy, formatCents, formatMoney, nameOf } from "@client/utils/format";
import { signedAmount } from "@shared/transactions";
import { CAPITAL_GAINS_TAX, SOLIDARITY_SURCHARGE } from "@shared/interest";
import type { DepositTransaction, Group, Member } from "@arthurzakharov/family-budget-be-client";

type SortKey = "group" | "date" | "amount";
type Sort = { key: SortKey; dir: "asc" | "desc" };

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
  const [sort, setSort] = useState<Sort | null>(null);

  // First click sorts ascending, next click flips the direction.
  const toggleSort = (key: SortKey) => {
    setSort(sort?.key === key && sort.dir === "asc" ? { key, dir: "desc" } : { key, dir: "asc" });
  };

  const sortArrow = (key: SortKey) => (sort?.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : "");

  const compare = (a: DepositTransaction, b: DepositTransaction, key: SortKey) => {
    if (key === "amount") return signedAmount(a) - signedAmount(b);
    if (key === "group") return nameOf(groups, a.groupId).localeCompare(nameOf(groups, b.groupId));
    return a.date.localeCompare(b.date);
  };

  const sorted = sort
    ? [...transactions].sort((a, b) => compare(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1))
    : transactions;

  const totalDeposited = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? 0 : t.amountCents), 0);
  const totalWithdrawn = transactions.reduce((sum, t) => sum + (t.type === "withdrawal" ? t.amountCents : 0), 0);
  const totalAdded = totalDeposited - totalWithdrawn;
  const interestPercent = totals && totalAdded > 0 ? (totals.net / totalAdded) * 100 : 0;

  // Footer rows: the label spans the data columns, the value the rest.
  const totalRow = (label: string, value: string) => (
    <tr>
      <th colSpan={showGroup ? 4 : 3}>{label}</th>
      <td colSpan={editable ? 2 : 1}>{value}</td>
    </tr>
  );

  return (
    <table>
      <thead>
        <tr>
          {showGroup && (
            <th className="sortable" onClick={() => toggleSort("group")}>
              {t("transactions.group")}
              {sortArrow("group")}
            </th>
          )}
          <th>{t("common.addedBy")}</th>
          <th>{t("transactions.type")}</th>
          <th className="sortable" onClick={() => toggleSort("date")}>
            {t("common.date")}
            {sortArrow("date")}
          </th>
          <th className="sortable" onClick={() => toggleSort("amount")}>
            {t("transactions.amount")}
            {sortArrow("amount")}
          </th>
          {editable && <th></th>}
        </tr>
      </thead>
      <tbody>
        {transactions.length === 0 ? (
          <tr>
            <td colSpan={4 + (showGroup ? 1 : 0) + (editable ? 1 : 0)}>{t("transactions.empty")}</td>
          </tr>
        ) : (
          sorted.map(tx => (
            <tr key={tx.id} className={tx.id === editingId ? "editing" : ""}>
              {showGroup && <td>{nameOf(groups, tx.groupId)}</td>}
              <td>{addedBy(members, tx.userId, t)}</td>
              <td>{t(tx.type === "withdrawal" ? "type.withdrawal" : "type.deposit")}</td>
              <td>{tx.date}</td>
              <td>{formatCents(signedAmount(tx))}</td>
              {editable && (
                <td>
                  <button type="button" onClick={() => onEdit!(tx)}>
                    {t("common.edit")}
                  </button>{" "}
                  <button type="button" onClick={() => onDelete!(tx)}>
                    {t("common.delete")}
                  </button>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
      {totals && (
        <tfoot>
          {totalRow(t("totals.deposited"), formatCents(totalDeposited))}
          {totalRow(t("totals.withdrawn"), formatCents(totalWithdrawn))}
          {totalRow(t("totals.netAdded"), formatCents(totalAdded))}
          {totalRow(t("totals.interestBeforeTax"), formatCents(totals.gross))}
          {totalRow(
            t("totals.taxWithheld", { capitalGains: CAPITAL_GAINS_TAX * 100, surcharge: SOLIDARITY_SURCHARGE * 100 }),
            formatCents(totals.tax),
          )}
          {totalRow(t("totals.interestAfterTax"), `${formatCents(totals.net)} (${formatMoney(interestPercent)}%)`)}
          {totalRow(t("totals.balance"), formatCents(totals.balance))}
          {totalRow(t("totals.pending"), formatCents(totals.pending))}
        </tfoot>
      )}
    </table>
  );
}
