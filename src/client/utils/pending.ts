import { useState } from "react";

// Tracks which records have a request running (deleting a row, flipping a switch...), so their
// controls can show a spinner and be locked until it finishes. Several can run at once.
export function usePendingIds<V = true>() {
  // Each pending id with the value it is changing to, e.g. a switch's new position
  const [pending, setPending] = useState<ReadonlyMap<string, V>>(new Map());

  // Runs `work` for `id`, marking the id pending until it settles. Resolves or rejects like `work`.
  const track = async <T>(id: string, work: () => Promise<T>, value?: V) => {
    setPending(map => new Map(map).set(id, value ?? (true as V)));
    try {
      return await work();
    } finally {
      setPending(map => {
        const next = new Map(map);
        next.delete(id);
        return next;
      });
    }
  };

  return {
    isPending: (id: string) => pending.has(id),
    // The value a pending id is changing to, or undefined when nothing is running for it
    pendingValue: (id: string) => pending.get(id),
    track,
  };
}
