import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { hasSeveralGroups, visibleGroups } from "@client/utils/access";
import { useFieldContext } from "@client/components/form";
import { SelectField } from "@client/components/ui";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

// Picks the group a record belongs to. Use inside <form.AppField name="groupId">.
// Only the admin and users in several groups have a choice; everyone else gets nothing to
// pick, and the field keeps its starting value (see defaultGroup).
export function GroupSelect({ groups }: { groups: Group[] }) {
  const { t } = useI18n();
  const me = useCurrentUser();
  const field = useFieldContext<string>();

  if (!hasSeveralGroups(me)) return null;

  return (
    <SelectField
      label={t("transactions.group")}
      name={field.name}
      isRequired
      placeholder={t("transactions.selectGroup")}
      value={field.state.value}
      onChange={field.handleChange}
      options={visibleGroups(me, groups).map(g => ({ id: g.id, label: g.name }))}
    />
  );
}

// The groupId a record form starts with: the edited record's group, or else the user's one
// group when they have no choice to make.
export const defaultGroup = (me: PublicUser, editedGroupId?: string) =>
  editedGroupId ?? (hasSeveralGroups(me) ? "" : (me.groupIds[0] ?? ""));
