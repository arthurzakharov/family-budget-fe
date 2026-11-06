import { useI18n } from "@client/context/i18n";
import { addedBy } from "@client/utils/format";
import type { DepositRate, Member } from "@arthurzakharov/family-budget-be-client";

type Props = {
  rates: DepositRate[];
  members: Member[];
  // Shows an Edit button on each row when given
  onEdit?: (rate: DepositRate) => void;
  editingId?: string | null;
};

export function RateTable({ rates, members, onEdit, editingId }: Props) {
  const { t } = useI18n();
  // "From the beginning" sorts first.
  const sorted = [...rates].sort((a, b) => (a.from ?? "").localeCompare(b.from ?? ""));

  return (
    <table>
      <thead>
        <tr>
          <th>{t("rates.rate")}</th>
          <th>{t("rates.from")}</th>
          <th>{t("rates.till")}</th>
          <th>{t("common.addedBy")}</th>
          {onEdit && <th></th>}
        </tr>
      </thead>
      <tbody>
        {sorted.length === 0 ? (
          <tr>
            <td colSpan={onEdit ? 5 : 4}>{t("rates.empty")}</td>
          </tr>
        ) : (
          sorted.map(r => (
            <tr key={r.id} className={r.id === editingId ? "editing" : ""}>
              <td>{r.ratePercent}</td>
              <td>{r.from ?? t("rates.beginning")}</td>
              <td>{r.till ?? t("rates.current")}</td>
              <td>{addedBy(members, r.userId, t)}</td>
              {onEdit && (
                <td>
                  <button type="button" onClick={() => onEdit(r)}>
                    {t("common.edit")}
                  </button>
                </td>
              )}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
