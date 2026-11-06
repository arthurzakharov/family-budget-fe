import { Chip, Table } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { useSort } from "@client/utils/sort";
import { addedBy, formatCents, nameOf } from "@client/utils/format";
import { DataTable, editingRow, Money, RowActions } from "@client/components/ui";
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
  const { sorted, column, sortProps } = useSort(entries, compare);

  return (
    <DataTable
      label={t("expenses.records")}
      emptyText={t("expenses.empty")}
      {...sortProps}
      columns={
        <>
          {showGroup && column("group", t("transactions.group"))}
          <Table.Column>{t("common.addedBy")}</Table.Column>
          <Table.Column>{t("transactions.type")}</Table.Column>
          {column("category", t("expenses.category"), true)}
          {column("date", t("common.date"))}
          {column("amount", t("transactions.amount"))}
          <Table.Column>{t("expenses.note")}</Table.Column>
          {editable && <Table.Column aria-label={t("common.edit")}> </Table.Column>}
        </>
      }
    >
      {sorted.map(e => {
        const income = kindOf(categories, e.categoryId) === "income";
        return (
          <Table.Row key={e.id} id={e.id} className={editingRow(e.id === editingId)}>
            {showGroup && <Table.Cell>{nameOf(groups, e.groupId)}</Table.Cell>}
            <Table.Cell>{addedBy(members, e.userId, t)}</Table.Cell>
            <Table.Cell>
              <Chip size="sm" color={income ? "success" : "danger"} variant="soft">
                {t(income ? "type.income" : "type.expense")}
              </Chip>
            </Table.Cell>
            <Table.Cell>{categoryName(t, e.categoryId)}</Table.Cell>
            <Table.Cell className="whitespace-nowrap">{e.date}</Table.Cell>
            <Table.Cell>
              <Money cents={signedEntry(categories, e)} format={formatCents} signed />
            </Table.Cell>
            <Table.Cell className="text-muted">{e.note}</Table.Cell>
            {editable && (
              <Table.Cell>
                <RowActions onEdit={() => onEdit!(e)} onDelete={() => onDelete!(e)} />
              </Table.Cell>
            )}
          </Table.Row>
        );
      })}
    </DataTable>
  );
}
