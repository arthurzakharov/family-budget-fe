import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups, visibleGroups } from "@client/utils/access";
import type { Group } from "@arthurzakharov/family-budget-be-client";

type Props = {
  groups: Group[];
  // The group of the record being edited, if any
  defaultValue?: string;
};

// Picks the group a record belongs to. Only the admin and users in several groups have a
// choice; for everyone else the form quietly sends their one group (or keeps the edited
// record's group).
export function GroupSelect({ groups, defaultValue }: Props) {
  const { t } = useI18n();
  const me = useCurrentUser();

  if (!hasSeveralGroups(me)) {
    return <input type="hidden" name="groupId" value={defaultValue ?? me.groupIds[0] ?? ""} />;
  }

  return (
    <label>
      {t("transactions.group")}
      <select name="groupId" required defaultValue={defaultValue ?? ""}>
        <option value="" disabled>
          {t("transactions.selectGroup")}
        </option>
        {visibleGroups(me, groups).map(g => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </label>
  );
}
