import { Outlet } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { SectionTabs } from "@client/components/SectionTabs";
import { PageHeader } from "@client/components/ui";
import { TablesLoading } from "@client/components/RecordTable";

// The crypto page: the same tabs as the deposit, plus the admin's coin list.
export function Crypto() {
  const { t } = useI18n();
  const { isLoading } = useCrypto();
  return (
    <>
      <PageHeader title={t("nav.crypto")} />
      <Tabs />
      {/* Every tab's tables show a spinner until the page's data has arrived. */}
      <TablesLoading isLoading={isLoading}>
        <Outlet />
      </TablesLoading>
    </>
  );
}

function Tabs() {
  const { groups } = useCrypto();
  return <SectionTabs section="crypto" groups={groups} adminTabs={[{ to: "/crypto/coins", label: "crypto.coins" }]} />;
}
