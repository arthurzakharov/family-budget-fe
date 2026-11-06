import { useI18n } from "@client/context/i18n";
import { SelectField } from "@client/components/ui";
import type { Member } from "@arthurzakharov/family-budget-be-client";

// Lets the admin pick which user a rate or transaction is added under.
// The admin only manages records, so they are never added under the admin's name.
export function UserSelect({ members, defaultValue }: { members: Member[]; defaultValue: string }) {
  const { t } = useI18n();
  return (
    <SelectField
      label={t("common.addedBy")}
      name="userId"
      isRequired
      placeholder={t("common.selectUser")}
      defaultValue={defaultValue}
      options={members.filter(m => m.role !== "admin").map(m => ({ id: m.id, label: m.name }))}
    />
  );
}
