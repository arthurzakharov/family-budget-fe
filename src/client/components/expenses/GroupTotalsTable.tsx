import { useI18n } from "@client/context/i18n";
import { formatCents, nameOf } from "@client/utils/format";
import type { EntrySummary } from "@shared/expenses";
import type { Group } from "@arthurzakharov/family-budget-be-client";

type Props = {
  summary: EntrySummary;
  groupIds: string[];
  groups: Group[];
};

// Per group: income, expenses and what is left.
export function GroupTotalsTable({ summary, groupIds, groups }: Props) {
  const { t } = useI18n();

  return (
    <table>
      <thead>
        <tr>
          <th>{t("transactions.group")}</th>
          <th>{t("expenses.income")}</th>
          <th>{t("expenses.expenses")}</th>
          <th>{t("expenses.net")}</th>
        </tr>
      </thead>
      <tbody>
        {groupIds.map(id => {
          const g = summary.byGroup[id] ?? { income: 0, expenses: 0, net: 0 };
          return (
            <tr key={id}>
              <td>{nameOf(groups, id)}</td>
              <td>{formatCents(g.income)}</td>
              <td>{formatCents(g.expenses)}</td>
              <td>{formatCents(g.net)}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
