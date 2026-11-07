import { Outlet } from "@tanstack/react-router";
import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { SectionTabs } from "@client/components/SectionTabs";
import { PageHeader } from "@client/components/ui";

// The crypto page: the same tabs as the deposit, plus the admin's coin list.
export function Crypto() {
  const { t } = useI18n();
  return (
    <>
      <PageHeader title={t("nav.crypto")} />
      <Tabs />
      <Outlet />
    </>
  );
}

function Tabs() {
  const { groups } = useCrypto();
  return <SectionTabs section="crypto" groups={groups} adminTabs={[{ to: "/crypto/coins", label: "crypto.coins" }]} />;
}
