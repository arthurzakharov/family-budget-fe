import { useI18n } from "@client/context/i18n";

export function Home() {
  const { t } = useI18n();
  return <h1>{t("nav.home")}</h1>;
}
