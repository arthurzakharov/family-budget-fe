import { useI18n } from "@client/context/i18n";
import { useExpenses } from "@client/context/expenses";
import { CategoryTotalsTable } from "@client/components/expenses/CategoryTotalsTable";
import { GroupTotalsTable } from "@client/components/expenses/GroupTotalsTable";
import { EntryTable } from "@client/components/expenses/EntryTable";
import { summarizeEntries } from "@shared/expenses";

// Read-only view of income and expenses, narrowed to some groups.
export function Overview({ groupIds }: { groupIds: string[] }) {
  const { t } = useI18n();
  const { groups, categories, entries } = useExpenses();
  const shown = entries.filter(e => groupIds.includes(e.groupId));
  const summary = summarizeEntries(shown, categories, groupIds);

  return (
    <>
      <h2>{t("expenses.byCategory")}</h2>
      <CategoryTotalsTable summary={summary} />

      {groupIds.length > 1 && (
        <>
          <h2>{t("perGroup.title")}</h2>
          <GroupTotalsTable summary={summary} groupIds={groupIds} groups={groups} />
        </>
      )}

      <h2>{t("expenses.records")}</h2>
      <EntryTable entries={shown} />
    </>
  );
}
