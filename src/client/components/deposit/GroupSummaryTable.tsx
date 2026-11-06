import { useI18n } from "@client/context/i18n";
import { formatCents, formatMoney, nameOf } from "@client/utils/format";
import type { Group, InterestSummary } from "@arthurzakharov/family-budget-be-client";

type Props = {
  interest: InterestSummary;
  groups: Group[];
};

// Per group: money added, interest earned, and what the group's share is worth now.
export function GroupSummaryTable({ interest, groups }: Props) {
  const { t } = useI18n();

  return (
    <table>
      <thead>
        <tr>
          <th>{t("transactions.group")}</th>
          <th>{t("perGroup.added")}</th>
          <th>{t("totals.interestBeforeTax")}</th>
          <th>{t("common.tax")}</th>
          <th>{t("totals.interestAfterTax")}</th>
          <th>{t("perGroup.gained")}</th>
          <th>{t("common.balance")}</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(interest.byGroup).map(([id, s]) => (
          <tr key={id}>
            <td>{nameOf(groups, id)}</td>
            <td>{formatCents(s.added)}</td>
            <td>{formatCents(s.gross)}</td>
            <td>{formatCents(s.tax)}</td>
            <td>{formatCents(s.net)}</td>
            <td>{s.added > 0 ? formatMoney((s.net / s.added) * 100) : "–"}</td>
            <td>{formatCents(s.balance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
