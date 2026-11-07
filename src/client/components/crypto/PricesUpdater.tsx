import { Button } from "@heroui/react";
import { ArrowsRotateRight } from "@gravity-ui/icons";
import { errorCode } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCrypto, type useUpdatePrices } from "@client/context/crypto";
import { Message } from "@client/components/ui";
import { notify } from "@client/utils/notify";

// Date and time formats per app language, as in the date pickers
const locales = { en: "en-GB", ru: "ru-RU" } as const;

// The page's "Update prices" request (see useUpdatePrices), shared by the button and its error
type PricesUpdate = ReturnType<typeof useUpdatePrices>;

// The "Update prices" button for the holdings' header, with the time the prices were last
// fetched underneath, both aligned to the right. Prices are never fetched on their own, so the
// price API's limits are not used up.
export function PricesUpdater({ update }: { update: PricesUpdate }) {
  const { t, language } = useI18n();
  const { pricesFetchedAt } = useCrypto();

  const onPress = () =>
    update.mutate(undefined, {
      onSuccess: () => notify.updated(t("crypto.pricesUpdated")),
    });

  const fetchedAt = pricesFetchedAt
    ? new Date(pricesFetchedAt).toLocaleString(locales[language], { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="flex shrink-0 flex-col items-end gap-1 text-right">
      <Button size="sm" variant="secondary" onPress={onPress} isPending={update.isPending}>
        <ArrowsRotateRight className={`size-4 ${update.isPending ? "animate-spin" : ""}`} />
        {t("crypto.updatePrices")}
      </Button>
      <span className="text-xs text-muted">
        {pricesFetchedAt && fetchedAt ? (
          <time dateTime={pricesFetchedAt}>{t("crypto.pricesFrom", { time: fetchedAt })}</time>
        ) : (
          t("crypto.pricesNever")
        )}
      </span>
    </div>
  );
}

// Why the last "Update prices" failed, for the holdings' body. The backend answers 502/504
// without a code when the price API fails, so that case is said plainly.
export function PricesError({ update }: { update: PricesUpdate }) {
  if (!update.error) return null;
  const code = errorCode(update.error);
  return <Message error={code === "errors.unknown" ? "crypto.pricesFailed" : code} />;
}
