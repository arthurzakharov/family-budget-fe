import { useI18n } from "@client/context/i18n";
import { formatCents, nameOf } from "@client/utils/format";
import type { Group, InterestSummary } from "@arthurzakharov/family-budget-be-client";

type Props = {
  interest: InterestSummary;
  groups: Group[];
};

// Monthly interest payouts, with a column per group when there is more than one.
export function PayoutTable({ interest, groups }: Props) {
  const { t } = useI18n();
  // Groups in the order they were created, plus any only known from transactions.
  const groupIds = Object.keys(interest.byGroup);
  const groupColumns = groupIds.length > 1 ? groupIds : [];

  return (
    <table>
      <thead>
        <tr>
          <th>{t("common.date")}</th>
          <th>{t("payouts.beforeTax")}</th>
          <th>{t("common.tax")}</th>
          <th>{t("payouts.afterTax")}</th>
          {groupColumns.map(id => (
            <th key={id}>{t("payouts.groupAfterTax", { group: nameOf(groups, id) })}</th>
          ))}
          <th>{t("common.balance")}</th>
        </tr>
      </thead>
      <tbody>
        {interest.payouts.length === 0 ? (
          <tr>
            <td colSpan={5 + groupColumns.length}>{t("payouts.empty")}</td>
          </tr>
        ) : (
          interest.payouts.map(p => (
            <tr key={p.date}>
              <td>{p.date}</td>
              <td>{formatCents(p.gross)}</td>
              <td>{formatCents(p.tax)}</td>
              <td>{formatCents(p.net)}</td>
              {groupColumns.map(id => (
                <td key={id}>{formatCents(p.netByGroup[id] ?? 0)}</td>
              ))}
              <td>{formatCents(p.balance)}</td>
            </tr>
          ))
        )}
      </tbody>
      <tfoot>
        <tr>
          <th>{t("common.total")}</th>
          <td>{formatCents(interest.gross)}</td>
          <td>{formatCents(interest.tax)}</td>
          <td>{formatCents(interest.net)}</td>
          {groupColumns.map(id => (
            <td key={id}>{formatCents(interest.byGroup[id]!.net)}</td>
          ))}
          <td></td>
        </tr>
      </tfoot>
    </table>
  );
}
