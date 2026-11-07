// A list of records (transactions, expense entries...) driven by TanStack Table and drawn with
// HeroUI's Table: click a column header to sort, and long lists are split into pages.
import { useState, type ReactNode } from "react";
import {
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  FlexRender,
  metaHelper,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_basic,
  sortFn_text,
  tableFeatures,
  useTable,
  type ColumnDef,
  type PaginationState,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import { Pagination, Table, type SortDescriptor } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { DataTable } from "@client/components/ui";

// Extra settings a column can have, read when drawing it.
type RecordColumnMeta = {
  // The column that names a row for screen readers
  isRowHeader?: boolean;
  // Classes for the column's cells
  className?: string;
  // For columns without a visible header, e.g. the Edit/Delete buttons
  ariaLabel?: string;
};

// What every record table can do: sort by a column and split into pages.
// Columns pick a comparator by name: "text" for names (locale-aware), "basic" for numbers and dates.
const features = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  sortFns: { basic: sortFn_basic, text: sortFn_text },
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
  columnMeta: metaHelper<RecordColumnMeta>(),
});

// Builds typed columns for records of type T.
export const recordColumns = <T extends RowData>() => createColumnHelper<typeof features, T>();

const PAGE_SIZE = 20;

type Props<T extends RowData> = {
  label: string;
  emptyText: string;
  data: T[];
  // Columns sort only when they say `enableSorting: true`. Keep the array stable (useMemo).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- columns hold values of different types
  columns: ColumnDef<typeof features, T, any>[];
  getRowId: (record: T) => string;
  rowClassName?: (record: T) => string | undefined;
  // Rows under the records, e.g. totals. Shown on every page, and only when there are records.
  footer?: ReactNode;
};

export function RecordTable<T extends RowData>({ label, emptyText, data, columns, getRowId, rowClassName, footer }: Props<T>) {
  // Records stay in the order the server sent them until a header is clicked.
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: PAGE_SIZE });

  const table = useTable({
    features,
    data,
    columns,
    getRowId,
    defaultColumn: { enableSorting: false },
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    // Adding, editing or deleting a record keeps the page that is open.
    autoResetPageIndex: false,
  });

  // After deleting the last record of the last page, go back to the page before it.
  const pageCount = table.getPageCount();
  if (pagination.pageIndex > 0 && pagination.pageIndex >= pageCount) {
    setPagination(p => ({ ...p, pageIndex: Math.max(0, pageCount - 1) }));
  }

  // HeroUI's table works out the direction (first click ascending, second descending);
  // TanStack Table does the sorting. A new order starts again on the first page.
  const sort = sorting[0];
  const sortDescriptor: SortDescriptor | undefined = sort
    ? { column: sort.id, direction: sort.desc ? "descending" : "ascending" }
    : undefined;
  const onSortChange = (descriptor: SortDescriptor) => {
    setSorting([{ id: String(descriptor.column), desc: descriptor.direction === "descending" }]);
    setPagination(p => ({ ...p, pageIndex: 0 }));
  };

  const headers = table.getHeaderGroups()[0]?.headers ?? [];
  const rows = table.getRowModel().rows;

  return (
    <>
      <DataTable
        label={label}
        emptyText={emptyText}
        sortDescriptor={sortDescriptor}
        onSortChange={onSortChange}
        columns={headers.map(header => {
          const { meta } = header.column.columnDef;
          const title = <FlexRender header={header} />;
          return header.column.getCanSort() ? (
            <Table.Column key={header.id} id={header.id} allowsSorting isRowHeader={meta?.isRowHeader}>
              {({ sortDirection }) => (
                <Table.SortableColumnHeader sortDirection={sortDirection}>{title}</Table.SortableColumnHeader>
              )}
            </Table.Column>
          ) : (
            <Table.Column key={header.id} id={header.id} isRowHeader={meta?.isRowHeader} aria-label={meta?.ariaLabel}>
              {title}
            </Table.Column>
          );
        })}
      >
        {rows.map(row => (
          <Table.Row key={row.id} id={row.id} className={rowClassName?.(row.original)}>
            {row.getAllCells().map(cell => (
              <Table.Cell key={cell.id} className={cell.column.columnDef.meta?.className}>
                <FlexRender cell={cell} />
              </Table.Cell>
            ))}
          </Table.Row>
        ))}
        {data.length > 0 && footer}
      </DataTable>
      {pageCount > 1 && (
        <Pages
          page={pagination.pageIndex + 1}
          pageCount={pageCount}
          total={data.length}
          onChange={page => table.setPageIndex(page - 1)}
        />
      )}
    </>
  );
}

// Page numbers to show: always the first and last, and the ones next to the open page.
function pageNumbers(page: number, pageCount: number): (number | "ellipsis")[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: (number | "ellipsis")[] = [1];
  if (page > 3) pages.push("ellipsis");
  for (let p = Math.max(2, page - 1); p <= Math.min(pageCount - 1, page + 1); p++) pages.push(p);
  if (page < pageCount - 2) pages.push("ellipsis");
  pages.push(pageCount);
  return pages;
}

function Pages({
  page,
  pageCount,
  total,
  onChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const { t } = useI18n();
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  return (
    <Pagination size="sm" className="mt-4 flex-wrap gap-2">
      <Pagination.Summary>{t("table.range", { from, to, total })}</Pagination.Summary>
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous isDisabled={page === 1} onPress={() => onChange(page - 1)} aria-label={t("table.previous")}>
            <Pagination.PreviousIcon />
          </Pagination.Previous>
        </Pagination.Item>
        {pageNumbers(page, pageCount).map((p, i) =>
          p === "ellipsis" ? (
            <Pagination.Item key={`ellipsis-${i}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={p}>
              <Pagination.Link isActive={p === page} onPress={() => onChange(p)}>
                {p}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next isDisabled={page === pageCount} onPress={() => onChange(page + 1)} aria-label={t("table.next")}>
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}
