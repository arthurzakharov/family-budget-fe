// Numbers are always shown with two decimals: crypto money (euros) and percentages.
export const formatMoney = (n: number) => n.toFixed(2);

// Deposit and expense money comes from the backend in cents.
export const formatCents = (cents: number) => (cents / 100).toFixed(2);

// Looks up a group's or user's name by id; "?" if it is gone.
export const nameOf = (items: { id: string; name: string }[], id: string) =>
  items.find(item => item.id === id)?.name ?? "?";

// Who added a record; the backend sends null once that user has been deleted.
export const addedBy = (
  members: { id: string; name: string }[],
  userId: string | null,
  t: (key: "common.deletedUser") => string,
) => (userId === null ? t("common.deletedUser") : nameOf(members, userId));

// Coin amounts can be tiny, so they keep up to eight decimals without trailing zeros.
export const formatCoins = (n: number) => String(Number(n.toFixed(8)));
