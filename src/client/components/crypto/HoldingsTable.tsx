import { useI18n } from "@client/context/i18n";
import { formatCoins, formatMoney } from "@client/utils/format";
import { coinName, type CryptoSummary, type Prices } from "@shared/crypto";

type Props = {
  summary: CryptoSummary;
  prices: Prices;
};

// Per coin: how many were bought, sold and are still held, the money put in and what it is worth now.
export function HoldingsTable({ summary, prices }: Props) {
  const { t } = useI18n();
  const coins = Object.entries(summary.byCoin);

  return (
    <table>
      <thead>
        <tr>
          <th>{t("crypto.coin")}</th>
          <th>{t("crypto.bought")}</th>
          <th>{t("crypto.sold")}</th>
          <th>{t("crypto.held")}</th>
          <th>{t("crypto.rateNow")}</th>
          <th>{t("crypto.added")}</th>
          <th>{t("crypto.value")}</th>
          <th>{t("crypto.gain")}</th>
        </tr>
      </thead>
      <tbody>
        {coins.length === 0 ? (
          <tr>
            <td colSpan={8}>{t("crypto.noHoldings")}</td>
          </tr>
        ) : (
          coins.map(([coin, h]) => (
            <tr key={coin}>
              <td>
                {coin} <small>{coinName(coin)}</small>
              </td>
              <td>{formatCoins(h.bought)}</td>
              <td>{formatCoins(h.sold)}</td>
              <td>{formatCoins(h.held)}</td>
              <td>{formatMoney(prices[coin] ?? 0)}</td>
              <td>{formatMoney(h.added)}</td>
              <td>{formatMoney(h.value)}</td>
              <td>{formatMoney(h.value - h.added)}</td>
            </tr>
          ))
        )}
      </tbody>
      <tfoot>
        <tr>
          <th colSpan={5}>{t("common.total")}</th>
          <td>{formatMoney(summary.added)}</td>
          <td>{formatMoney(summary.value)}</td>
          <td>{formatMoney(summary.value - summary.added)}</td>
        </tr>
      </tfoot>
    </table>
  );
}
