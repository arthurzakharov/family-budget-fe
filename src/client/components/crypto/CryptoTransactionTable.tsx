import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { useSort } from "@client/utils/sort";
import { addedBy, formatCoins, formatMoney, nameOf } from "@client/utils/format";
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
  const { sorted, header: sortable } = useSort(transactions, compare);

  return (
    <table>
      <thead>
        <tr>
          {showGroup && sortable("group", t("transactions.group"))}
          <th>{t("common.addedBy")}</th>
          {sortable("coin", t("crypto.coin"))}
          <th>{t("transactions.type")}</th>
          {sortable("date", t("common.date"))}
          <th>{t("crypto.amount")}</th>
          <th>{t("crypto.rate")}</th>
          {sortable("money", t("crypto.money"))}
          {editable && <th></th>}
        </tr>
      </thead>
      <tbody>
        {transactions.length === 0 ? (
          <tr>
            <td colSpan={7 + (showGroup ? 1 : 0) + (editable ? 1 : 0)}>{t("transactions.empty")}</td>
          </tr>
        ) : (
          sorted.map(tx => (
            <tr key={tx.id} className={tx.id === editingId ? "editing" : ""}>
              {showGroup && <td>{nameOf(groups, tx.groupId)}</td>}
              <td>{addedBy(members, tx.userId, t)}</td>
              <td>{tx.coin}</td>
              <td>{t(tx.type === "sell" ? "type.sell" : "type.buy")}</td>
              <td>{tx.date}</td>
              <td>{formatCoins(signedCoins(tx))}</td>
              <td>{formatMoney(tx.price)}</td>
              <td>{formatMoney(signedMoney(tx))}</td>
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
    </table>
  );
}
