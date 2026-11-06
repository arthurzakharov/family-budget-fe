import { useI18n } from "@client/context/i18n";
import { roles } from "@shared/roles";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

// Role and group inputs for a user other than the admin; prefilled when a user is given.
export function RoleAndGroupFields({ groups, user }: { groups: Group[]; user?: PublicUser }) {
  const { t } = useI18n();
  return (
    <>
      <label>
        {t("users.role")}
        <select name="role" required defaultValue={user?.role ?? ""}>
          <option value="" disabled>
            {t("users.selectRole")}
          </option>
          {/* The workspace's creator is its only admin. */}
          {roles
            .filter(r => r !== "admin")
            .map(r => (
              <option key={r} value={r}>
                {t(`role.${r}`)}
              </option>
            ))}
        </select>
      </label>
      <fieldset className="settings-group">
        <legend>{t("users.groups")}</legend>
        {groups.map(g => (
          <label key={g.id}>
            <input type="checkbox" name="groupIds" value={g.id} defaultChecked={user?.groupIds.includes(g.id)} />
            {g.name}
          </label>
        ))}
      </fieldset>
    </>
  );
}
