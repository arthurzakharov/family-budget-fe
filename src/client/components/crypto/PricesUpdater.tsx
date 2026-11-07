import { Button } from "@heroui/react";
import { ArrowsRotateRight } from "@gravity-ui/icons";
import { errorCode } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCrypto, useUpdatePrices } from "@client/context/crypto";
import { Message } from "@client/components/ui";
import { notify } from "@client/utils/notify";

// Date and time formats per app language, as in the date pickers
const locales = { en: "en-GB", ru: "ru-RU" } as const;

// The "Update prices" button over the holdings, with the time the prices were last fetched
// underneath. Prices are never fetched on their own, so the price API's limits are not used up.
export function PricesUpdater() {
  const { t, language } = useI18n();
  const { pricesFetchedAt } = useCrypto();
  const update = useUpdatePrices();

  const onPress = () =>
    update.mutate(undefined, {
      onSuccess: () => notify.updated(t("crypto.pricesUpdated")),
    });

  const fetchedAt = pricesFetchedAt
    ? new Date(pricesFetchedAt).toLocaleString(locales[language], { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="mb-4 flex flex-col items-start gap-1">
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
      {/* The backend answers 502/504 without a code when the price API fails, so say it plainly. */}
      {update.error && (
        <div className="mt-2 w-full">
          <Message error={errorCode(update.error) === "errors.unknown" ? "crypto.pricesFailed" : errorCode(update.error)} />
        </div>
      )}
    </div>
  );
}
