import { useState } from "react";

type Sort<K> = { key: K; dir: "asc" | "desc" };

// Sorting for a table: click a header to sort ascending, click again to flip the direction.
// Rows stay in their original order until a header is clicked.
export function useSort<T, K extends string>(rows: T[], compare: (a: T, b: T, key: K) => number) {
  const [sort, setSort] = useState<Sort<K> | null>(null);

  const toggle = (key: K) =>
    setSort(sort?.key === key && sort.dir === "asc" ? { key, dir: "desc" } : { key, dir: "asc" });

  const sorted = sort ? [...rows].sort((a, b) => compare(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1)) : rows;

  // A clickable header cell showing the direction it sorts in.
  const header = (key: K, label: string) => (
    <th className="sortable" onClick={() => toggle(key)}>
      {label}
      {sort?.key === key ? (sort.dir === "asc" ? " ▲" : " ▼") : ""}
    </th>
  );

  return { sorted, header };
}
