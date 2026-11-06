import { useI18n } from "@client/context/i18n";
import { roles } from "@shared/roles";
import { CheckboxField, SelectField } from "@client/components/ui";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

// Role and group inputs for a user other than the admin; prefilled when a user is given.
export function RoleAndGroupFields({ groups, user }: { groups: Group[]; user?: PublicUser }) {
  const { t } = useI18n();
  return (
    <>
      <SelectField
        label={t("users.role")}
        name="role"
        isRequired
        placeholder={t("users.selectRole")}
        defaultValue={user?.role}
        // The workspace's creator is its only admin.
        options={roles.filter(r => r !== "admin").map(r => ({ id: r, label: t(`role.${r}`) }))}
      />
      <fieldset className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
        <legend className="mb-2 text-sm font-medium">{t("users.groups")}</legend>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          {groups.map(g => (
            <CheckboxField key={g.id} name="groupIds" value={g.id} defaultSelected={user?.groupIds.includes(g.id)} label={g.name} />
          ))}
        </div>
      </fieldset>
    </>
  );
}
