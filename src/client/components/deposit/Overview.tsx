import { useI18n } from "@client/context/i18n";
import { useDeposit } from "@client/context/deposit";
import { RateTable } from "@client/components/deposit/RateTable";
import { TransactionTable } from "@client/components/deposit/TransactionTable";
import { PayoutTable } from "@client/components/deposit/PayoutTable";
import { GroupSummaryTable } from "@client/components/deposit/GroupSummaryTable";
import { Section, Stat, StatGrid } from "@client/components/ui";
import { formatCents } from "@client/utils/format";
import { forGroups } from "@shared/interest";

type Props = {
  // The groups whose money is shown
  groupIds: string[];
  // Rates apply to the whole deposit, so only General lists them.
  showRates?: boolean;
};

// Read-only view of the deposit, narrowed to some groups.
export function Overview({ groupIds, showRates = false }: Props) {
  const { t } = useI18n();
  const { groups, members, transactions, rates, interest } = useDeposit();
  const shown = transactions.filter(tx => groupIds.includes(tx.groupId));
  const view = forGroups(interest, groupIds);

  return (
    <>
      <StatGrid>
        <Stat label={t("totals.balance")} value={formatCents(view.balance)} tone="accent" />
        <Stat label={t("totals.interestAfterTax")} value={formatCents(view.net)} tone="success" />
        <Stat label={t("totals.pending")} value={formatCents(view.pending)} />
      </StatGrid>

      {showRates && (
        <Section title={t("rates.title")}>
          <RateTable rates={rates} members={members} />
        </Section>
      )}

      <Section title={t("transactions.title")}>
        <TransactionTable transactions={shown} groups={groups} members={members} totals={view} />
      </Section>

      <Section title={t("payouts.title")}>
        <PayoutTable interest={view} groups={groups} />
      </Section>

      {/* With one group the table would only repeat the totals above, as on Crypto and Expenses. */}
      {groupIds.length > 1 && (
        <Section title={t("perGroup.title")}>
          <GroupSummaryTable interest={view} groups={groups} />
        </Section>
      )}
    </>
  );
}
