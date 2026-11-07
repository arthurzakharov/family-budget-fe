import { ChartLine } from "@gravity-ui/icons";
import { useI18n } from "@client/context/i18n";
import { NoRecords } from "@client/components/NoRecords";
import { useCrypto, useUpdatePrices } from "@client/context/crypto";
import { HoldingsTable } from "@client/components/crypto/HoldingsTable";
import { PricesError, PricesUpdater } from "@client/components/crypto/PricesUpdater";
import { GroupHoldingsTable } from "@client/components/crypto/GroupHoldingsTable";
import { CryptoTransactionTable } from "@client/components/crypto/CryptoTransactionTable";
import { Section, Stat, StatGrid } from "@client/components/ui";
import { formatMoney } from "@client/utils/format";
import { summarizeCrypto } from "@shared/crypto";

type Props = {
  // The groups whose coins are shown
  groupIds: string[];
};

// Read-only view of the crypto holdings, narrowed to some groups.
export function Overview({ groupIds }: Props) {
  const { t } = useI18n();
  // "Update prices" in the holdings' header; its error shows in the holdings' body.
  const updatePrices = useUpdatePrices();
  const { groups, members, transactions, prices, isLoading } = useCrypto();
  const shown = transactions.filter(tx => groupIds.includes(tx.groupId));
  // Nothing recorded for these groups yet (once the data has arrived): say so instead of
  // showing empty tables and zero totals.
  if (!isLoading && shown.length === 0) {
    return <NoRecords icon={ChartLine} title="empty.crypto" manage="/crypto/manage" />;
  }
  const summary = summarizeCrypto(shown, prices, groupIds);
  const gain = summary.value - summary.added;

  return (
    <>
      <StatGrid>
        <Stat label={t("crypto.added")} value={formatMoney(summary.added)} />
        <Stat label={t("crypto.value")} value={formatMoney(summary.value)} tone="accent" />
        <Stat label={t("crypto.gain")} value={formatMoney(gain)} tone={gain < 0 ? "danger" : gain > 0 ? "success" : undefined} />
      </StatGrid>

      <Section
        title={t("crypto.holdings")}
        description={t("crypto.rateHint")}
        actions={<PricesUpdater update={updatePrices} />}
      >
        <PricesError update={updatePrices} />
        <HoldingsTable summary={summary} prices={prices} />
      </Section>

      {groupIds.length > 1 && (
        <Section title={t("perGroup.title")}>
          <GroupHoldingsTable summary={summary} groupIds={groupIds} groups={groups} />
        </Section>
      )}

      <Section title={t("transactions.title")}>
        <CryptoTransactionTable transactions={shown} groups={groups} members={members} />
      </Section>
    </>
  );
}
