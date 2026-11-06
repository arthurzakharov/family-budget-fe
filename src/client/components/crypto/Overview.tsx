import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { HoldingsTable } from "@client/components/crypto/HoldingsTable";
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
  const { groups, members, transactions, prices } = useCrypto();
  const shown = transactions.filter(tx => groupIds.includes(tx.groupId));
  const summary = summarizeCrypto(shown, prices, groupIds);
  const gain = summary.value - summary.added;

  return (
    <>
      <StatGrid>
        <Stat label={t("crypto.added")} value={formatMoney(summary.added)} />
        <Stat label={t("crypto.value")} value={formatMoney(summary.value)} tone="accent" />
        <Stat label={t("crypto.gain")} value={formatMoney(gain)} tone={gain < 0 ? "danger" : gain > 0 ? "success" : undefined} />
      </StatGrid>

      <Section title={t("crypto.holdings")} description={t("crypto.rateHint")}>
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
