import { Vault } from "@gravity-ui/icons";
import { useI18n } from "@client/context/i18n";
import { NoRecords } from "@client/components/NoRecords";
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
  const { groups, members, transactions, rates, interest, isLoading } = useDeposit();
  const shown = transactions.filter(tx => groupIds.includes(tx.groupId));
  const view = forGroups(interest, groupIds);

  // The deposit's rates, on General only. They are added before the first transaction, so they
  // stay visible above the empty screen too (once there are any).
  const ratesSection = showRates && (
    <Section title={t("rates.title")}>
      <RateTable rates={rates} members={members} />
    </Section>
  );

  // No transactions for these groups yet (once the data has arrived): say so instead of
  // showing empty tables and zero totals.
  if (!isLoading && shown.length === 0) {
    return (
      <>
        {rates.length > 0 && ratesSection}
        <NoRecords icon={Vault} title="empty.deposit" manage="/deposit/manage" />
      </>
    );
  }

  return (
    <>
      <StatGrid>
        <Stat label={t("totals.balance")} value={formatCents(view.balance)} tone="accent" />
        <Stat label={t("totals.interestAfterTax")} value={formatCents(view.net)} tone="success" />
        <Stat label={t("totals.pending")} value={formatCents(view.pending)} />
      </StatGrid>

      {ratesSection}

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
