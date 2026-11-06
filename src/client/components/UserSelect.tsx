import { useI18n } from "@client/context/i18n";
import type { Member } from "@arthurzakharov/family-budget-be-client";

// Lets the admin pick which user a rate or transaction is added under.
// The admin only manages records, so they are never added under the admin's name.
export function UserSelect({ members, defaultValue }: { members: Member[]; defaultValue: string }) {
  const { t } = useI18n();
  return (
    <label>
      {t("common.addedBy")}
      <select name="userId" required defaultValue={defaultValue}>
        <option value="" disabled>
          {t("common.selectUser")}
        </option>
        {members
          .filter(m => m.role !== "admin")
          .map(m => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
      </select>
    </label>
  );
}
