import { useI18n } from "@client/context/i18n";
import { useDeposit } from "@client/context/deposit";
import { RateTable } from "@client/components/deposit/RateTable";
import { TransactionTable } from "@client/components/deposit/TransactionTable";
import { PayoutTable } from "@client/components/deposit/PayoutTable";
import { GroupSummaryTable } from "@client/components/deposit/GroupSummaryTable";
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
      {showRates && (
        <>
          <h2>{t("rates.title")}</h2>
          <RateTable rates={rates} members={members} />
        </>
      )}

      <h2>{t("transactions.title")}</h2>
      <TransactionTable transactions={shown} groups={groups} members={members} totals={view} />

      <h2>{t("payouts.title")}</h2>
      <PayoutTable interest={view} groups={groups} />

      {/* With one group the table would only repeat the totals above, as on Crypto and Expenses. */}
      {groupIds.length > 1 && (
        <>
          <h2>{t("perGroup.title")}</h2>
          <GroupSummaryTable interest={view} groups={groups} />
        </>
      )}
    </>
  );
}
