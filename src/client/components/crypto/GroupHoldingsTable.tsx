import { useI18n } from "@client/context/i18n";
import { formatMoney, nameOf } from "@client/utils/format";
import type { CryptoSummary } from "@shared/crypto";
import type { Group } from "@arthurzakharov/family-budget-be-client";

type Props = {
  summary: CryptoSummary;
  groupIds: string[];
  groups: Group[];
};

// Per group: money put in and what its coins are worth now.
export function GroupHoldingsTable({ summary, groupIds, groups }: Props) {
  const { t } = useI18n();

  return (
    <table>
      <thead>
        <tr>
          <th>{t("transactions.group")}</th>
          <th>{t("crypto.added")}</th>
          <th>{t("crypto.value")}</th>
          <th>{t("crypto.gain")}</th>
        </tr>
      </thead>
      <tbody>
        {groupIds.map(id => {
          const g = summary.byGroup[id];
          const added = g?.added ?? 0;
          const value = g?.value ?? 0;
          return (
            <tr key={id}>
              <td>{nameOf(groups, id)}</td>
              <td>{formatMoney(added)}</td>
              <td>{formatMoney(value)}</td>
              <td>{formatMoney(value - added)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
