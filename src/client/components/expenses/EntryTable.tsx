import { useMemo } from "react";
import { Chip } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups } from "@client/utils/access";
import { addedBy, formatCents, nameOf } from "@client/utils/format";
import { editingRow, Money, RowActions } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import { kindOf, signedEntry } from "@shared/expenses";
import type { ExpenseEntry } from "@arthurzakharov/family-budget-be-client";

type Props = {
  entries: ExpenseEntry[];
  // Show Edit and Delete buttons on each row when given
  onEdit?: (entry: ExpenseEntry) => void;
  onDelete?: (entry: ExpenseEntry) => void;
  editingId?: string | null;
};

const column = recordColumns<ExpenseEntry>();

// Sortable, paged list of income and expense records. Expenses show as negative amounts.
export function EntryTable({ entries, onEdit, onDelete, editingId }: Props) {
  const { t } = useI18n();
  // A user in one group always sees that group, so the column would say nothing.
  const showGroup = hasSeveralGroups(useCurrentUser());
  const { groups, members, categories } = useExpenses();
  const categoryName = useCategoryName();
  const editable = onEdit !== undefined && onDelete !== undefined;

  const columns = useMemo(
    () => [
      ...(showGroup
        ? [column.accessor(e => nameOf(groups, e.groupId), { id: "group", header: t("transactions.group"), enableSorting: true, sortFn: "text" })]
        : []),
      column.display({ id: "addedBy", header: t("common.addedBy"), cell: ({ row }) => addedBy(members, row.original.userId, t) }),
      column.display({
        id: "type",
        header: t("transactions.type"),
        cell: ({ row }) => {
          const income = kindOf(categories, row.original.categoryId) === "income";
          return (
            <Chip size="sm" color={income ? "success" : "danger"} variant="soft">
              {t(income ? "type.income" : "type.expense")}
            </Chip>
          );
        },
      }),
      column.accessor(e => categoryName(t, e.categoryId), {
        id: "category",
        header: t("expenses.category"),
        enableSorting: true,
        sortFn: "text",
        meta: { isRowHeader: true },
      }),
      column.accessor("date", { header: t("common.date"), enableSorting: true, sortFn: "basic", meta: { className: "whitespace-nowrap" } }),
      column.accessor(e => signedEntry(categories, e), {
        id: "amount",
        header: t("transactions.amount"),
        enableSorting: true,
        sortFn: "basic",
        cell: ({ getValue }) => <Money cents={getValue()} format={formatCents} signed />,
      }),
      column.accessor("note", { header: t("expenses.note"), meta: { className: "text-muted" } }),
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
    // categoryName is rebuilt from `categories` on every render, so `categories` stands in for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, groups, members, categories, showGroup, editable, onEdit, onDelete],
  );

  return (
    <RecordTable
      label={t("expenses.records")}
      emptyText={t("expenses.empty")}
      data={entries}
      columns={columns}
      getRowId={e => e.id}
      rowClassName={e => editingRow(e.id === editingId)}
    />
  );
}
