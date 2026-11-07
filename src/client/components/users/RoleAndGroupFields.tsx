import { useI18n } from "@client/context/i18n";
import { roles } from "@shared/roles";
import { useFieldContext } from "@client/components/form";
import { CheckboxField, SelectField } from "@client/components/ui";
import type { Group, Role } from "@arthurzakharov/family-budget-be-client";

// The roles the admin can give; the workspace's creator is its only admin.
export type AssignableRole = Exclude<Role, "admin">;

// Picks a user's role. Use inside <form.AppField name="role">; "" means none picked yet.
export function RoleSelect() {
  const { t } = useI18n();
  const field = useFieldContext<AssignableRole | "">();
  return (
    <SelectField
      label={t("users.role")}
      name={field.name}
      isRequired
      placeholder={t("users.selectRole")}
      value={field.state.value}
      onChange={value => field.handleChange(value as AssignableRole)}
      options={roles.filter(r => r !== "admin").map(r => ({ id: r, label: t(`role.${r}`) }))}
    />
  );
}

// One checkbox per group. Use inside <form.AppField name="groupIds">; the field holds the ticked ids.
export function GroupCheckboxes({ groups }: { groups: Group[] }) {
  const { t } = useI18n();
  const field = useFieldContext<string[]>();
  const ids = field.state.value;
  return (
    <fieldset className="flex flex-col gap-2 sm:col-span-2 lg:col-span-3">
      <legend className="mb-2 text-sm font-medium">{t("users.groups")}</legend>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {groups.map(g => (
          <CheckboxField
            key={g.id}
            label={g.name}
            isSelected={ids.includes(g.id)}
            onChange={on => field.handleChange(on ? [...ids, g.id] : ids.filter(id => id !== g.id))}
          />
        ))}
      </div>
    </fieldset>
  );
}
