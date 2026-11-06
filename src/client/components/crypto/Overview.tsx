import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { HoldingsTable } from "@client/components/crypto/HoldingsTable";
import { GroupHoldingsTable } from "@client/components/crypto/GroupHoldingsTable";
import { CryptoTransactionTable } from "@client/components/crypto/CryptoTransactionTable";
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

  return (
    <>
      <h2>{t("crypto.holdings")}</h2>
      <p>{t("crypto.rateHint")}</p>
      <HoldingsTable summary={summary} prices={prices} />

      {groupIds.length > 1 && (
        <>
          <h2>{t("perGroup.title")}</h2>
          <GroupHoldingsTable summary={summary} groupIds={groupIds} groups={groups} />
        </>
      )}

      <h2>{t("transactions.title")}</h2>
      <CryptoTransactionTable transactions={shown} groups={groups} members={members} />
    </>
  );
}
