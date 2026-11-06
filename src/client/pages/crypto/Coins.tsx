import { useState, type FormEvent } from "react";
import { api, call } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCrypto } from "@client/context/crypto";
import { COINS } from "@shared/crypto";
import type { CoinSymbol } from "@arthurzakharov/family-budget-be-client";

// Admin only: which coins can be picked for new records. Existing records keep their coin.
export function Coins() {
  const { t } = useI18n();
  const { coins, setCoins } = useCrypto();
  // null until the admin changes something, so the list follows the loaded coins.
  const [selected, setSelected] = useState<CoinSymbol[] | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const current = selected ?? coins;

  const toggle = (coin: CoinSymbol, on: boolean) => {
    setNotice(null);
    setSelected(on ? [...current, coin] : current.filter(c => c !== coin));
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Kept in the order of the list rather than the order they were ticked.
    const enabled = COINS.map(c => c.symbol).filter(c => current.includes(c));
    const result = await call(api.crypto.coins.$put({ json: { enabled } }));
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError(null);
    setCoins(result.data);
    setSelected(null);
    setNotice("common.saved");
  };

  return (
    <form onSubmit={onSubmit}>
      <h2>{t("crypto.coins")}</h2>
      <p>{t("crypto.coinsHint")}</p>
      <table>
        <thead>
          <tr>
            <th>{t("crypto.available")}</th>
            <th>{t("crypto.coin")}</th>
            <th>{t("crypto.name")}</th>
          </tr>
        </thead>
        <tbody>
          {COINS.map(c => (
            <tr key={c.symbol}>
              <td>
                <input
                  type="checkbox"
                  aria-label={c.name}
                  checked={current.includes(c.symbol)}
                  onChange={e => toggle(c.symbol, e.target.checked)}
                />
              </td>
              <td>{c.symbol}</td>
              <td>{c.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="submit" disabled={selected === null}>
        {t("common.saveChanges")}
      </button>
      {notice && <p className="success">{t(notice)}</p>}
      {error && <p className="error">{t(error)}</p>}
    </form>
  );
}
