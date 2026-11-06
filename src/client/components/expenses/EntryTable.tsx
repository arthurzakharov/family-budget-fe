import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { useSort } from "@client/utils/sort";
import { addedBy, formatCents, nameOf } from "@client/utils/format";
import { kindOf, signedEntry } from "@shared/expenses";
import type { ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

type SortKey = "group" | "category" | "date" | "amount";

type Props = {
  entries: ExpenseEntry[];
  // Show Edit and Delete buttons on each row when given
  onEdit?: (entry: ExpenseEntry) => void;
  onDelete?: (entry: ExpenseEntry) => void;
  editingId?: string | null;
};

// Sortable list of income and expense records. Expenses show as negative amounts.
export function EntryTable({ entries, onEdit, onDelete, editingId }: Props) {
  const { t } = useI18n();
  // A user in one group always sees that group, so the column would say nothing.
  const showGroup = hasSeveralGroups(useCurrentUser());
  const { groups, members, categories } = useExpenses();
  const categoryName = useCategoryName();
  const editable = onEdit !== undefined && onDelete !== undefined;

  const compare = (a: ExpenseEntry, b: ExpenseEntry, key: SortKey) => {
    if (key === "amount") return signedEntry(categories, a) - signedEntry(categories, b);
    if (key === "group") return nameOf(groups, a.groupId).localeCompare(nameOf(groups, b.groupId));
    if (key === "category") return categoryName(t, a.categoryId).localeCompare(categoryName(t, b.categoryId));
    return a.date.localeCompare(b.date);
  };
  const { sorted, header } = useSort(entries, compare);

  return (
    <table>
      <thead>
        <tr>
          {showGroup && header("group", t("transactions.group"))}
          <th>{t("common.addedBy")}</th>
          <th>{t("transactions.type")}</th>
          {header("category", t("expenses.category"))}
          {header("date", t("common.date"))}
          {header("amount", t("transactions.amount"))}
          <th>{t("expenses.note")}</th>
          {editable && <th></th>}
        </tr>
      </thead>
      <tbody>
        {entries.length === 0 ? (
          <tr>
            <td colSpan={6 + (showGroup ? 1 : 0) + (editable ? 1 : 0)}>{t("expenses.empty")}</td>
          </tr>
        ) : (
          sorted.map(e => (
            <tr key={e.id} className={e.id === editingId ? "editing" : ""}>
              {showGroup && <td>{nameOf(groups, e.groupId)}</td>}
              <td>{addedBy(members, e.userId, t)}</td>
              <td>{t(kindOf(categories, e.categoryId) === "income" ? "type.income" : "type.expense")}</td>
              <td>{categoryName(t, e.categoryId)}</td>
              <td>{e.date}</td>
              <td>{formatCents(signedEntry(categories, e))}</td>
              <td>{e.note}</td>
              {editable && (
                <td>
                  <button type="button" onClick={() => onEdit!(e)}>
                    {t("common.edit")}
                  </button>{" "}
                  <button type="button" onClick={() => onDelete!(e)}>
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
