import { useState } from "react";
import { Table, type SortDescriptor } from "@heroui/react";

// Sorting for a HeroUI table: click a column header to sort ascending, click again to flip.
// Rows stay in their original order until a header is clicked.
export function useSort<T, K extends string>(rows: T[], compare: (a: T, b: T, key: K) => number) {
  const [sort, setSort] = useState<SortDescriptor | undefined>(undefined);

  const sorted = sort
    ? [...rows].sort((a, b) => compare(a, b, sort.column as K) * (sort.direction === "ascending" ? 1 : -1))
    : rows;

  // A sortable column header showing the direction it sorts in.
  const column = (key: K, label: string, isRowHeader?: boolean) => (
    <Table.Column id={key} allowsSorting isRowHeader={isRowHeader}>
      {({ sortDirection }) => <Table.SortableColumnHeader sortDirection={sortDirection}>{label}</Table.SortableColumnHeader>}
    </Table.Column>
  );

  // Spread onto DataTable.
  const sortProps = { sortDescriptor: sort, onSortChange: setSort };

  return { sorted, column, sortProps };
}
