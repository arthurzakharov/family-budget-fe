import { useI18n } from "@client/context/i18n";
import { useFieldContext } from "@client/components/form";
import { SelectField } from "@client/components/ui";
import type { Member } from "@arthurzakharov/family-budget-be-client";

// Lets the admin pick which user a rate or transaction is added under. Use inside
// <form.AppField name="userId">.
// The admin only manages records, so they are never added under the admin's name.
export function UserSelect({ members }: { members: Member[] }) {
  const { t } = useI18n();
  const field = useFieldContext<string>();
  return (
    <SelectField
      label={t("common.addedBy")}
      name={field.name}
      isRequired
      placeholder={t("common.selectUser")}
      value={field.state.value}
      onChange={field.handleChange}
      options={members.filter(m => m.role !== "admin").map(m => ({ id: m.id, label: m.name }))}
    />
  );
}
