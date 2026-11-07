import { Receipt } from "@gravity-ui/icons";
import { useI18n } from "@client/context/i18n";
import { NoRecords } from "@client/components/NoRecords";
import { useExpenses } from "@client/context/expenses";
import { CategoryTotalsTable } from "@client/components/expenses/CategoryTotalsTable";
import { GroupTotalsTable } from "@client/components/expenses/GroupTotalsTable";
import { EntryTable } from "@client/components/expenses/EntryTable";
import { Section, Stat, StatGrid } from "@client/components/ui";
import { formatCents } from "@client/utils/format";
import { summarizeEntries } from "@shared/expenses";

// Read-only view of income and expenses, narrowed to some groups.
export function Overview({ groupIds }: { groupIds: string[] }) {
  const { t } = useI18n();
  const { groups, categories, entries, isLoading } = useExpenses();
  const shown = entries.filter(e => groupIds.includes(e.groupId));
  // Nothing recorded for these groups yet (once the data has arrived): say so instead of
  // showing empty tables and zero totals.
  if (!isLoading && shown.length === 0) {
    return <NoRecords icon={Receipt} title="empty.expenses" manage="/expenses/manage" />;
  }
  const summary = summarizeEntries(shown, categories, groupIds);

  return (
    <>
      <StatGrid>
        <Stat label={t("expenses.income")} value={formatCents(summary.income)} tone="success" />
        <Stat label={t("expenses.expenses")} value={formatCents(summary.expenses)} tone="danger" />
        <Stat label={t("expenses.net")} value={formatCents(summary.net)} tone={summary.net < 0 ? "danger" : "accent"} />
      </StatGrid>

      <div className="grid items-start gap-x-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Section title={t("expenses.byCategory")}>
          <CategoryTotalsTable summary={summary} />
        </Section>

        {groupIds.length > 1 && (
          <Section title={t("perGroup.title")}>
            <GroupTotalsTable summary={summary} groupIds={groupIds} groups={groups} />
          </Section>
        )}
      </div>

      <Section title={t("expenses.records")}>
        <EntryTable entries={shown} />
      </Section>
    </>
  );
}
