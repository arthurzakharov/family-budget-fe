import { useEffect, useState, type FormEvent } from "react";
import { api, call, load, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { RoleAndGroupFields } from "@client/components/users/RoleAndGroupFields";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

// The role and groups picked in RoleAndGroupFields. The backend rejects any other role.
const roleAndGroups = (data: FormData) => ({
  role: text(data, "role") as "contributor" | "viewer",
  groupIds: data.getAll("groupIds").filter(id => typeof id === "string"),
});

// What the admin is changing in a user's row.
type Editing = { id: string; field: "password" | "roleAndGroups" };

export function Users() {
  const { t } = useI18n();
  const me = useCurrentUser();
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    load(api.users.$get(), setUsers);
    load(api.groups.$get(), setGroups);
  }, []);

  const groupNames = (user: PublicUser) =>
    user.groupIds.map(id => groups?.find(g => g.id === id)?.name ?? "?").join(", ") || "–";

  const report = (errorCode: string | null, messageKey: string | null = null) => {
    setError(errorCode);
    setMessage(messageKey);
  };

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const result = await call(
      api.users.$post({
        json: { name: text(data, "name"), password: text(data, "password"), ...roleAndGroups(data) },
      }),
    );
    if (!result.ok) return report(result.error);
    setUsers([...users, result.data]);
    form.reset();
    report(null, "users.created");
  };

  const onChangePassword = async (e: FormEvent<HTMLFormElement>, user: PublicUser) => {
    e.preventDefault();
    const password = text(new FormData(e.currentTarget), "password");
    const result = await call(api.users[":id"].password.$put({ param: { id: user.id }, json: { password } }));
    if (!result.ok) return report(result.error);
    setEditing(null);
    report(null, "users.passwordChanged");
  };

  const onChangeRoleAndGroups = async (e: FormEvent<HTMLFormElement>, user: PublicUser) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const result = await call(api.users[":id"].$put({ param: { id: user.id }, json: roleAndGroups(data) }));
    if (!result.ok) return report(result.error);
    const updated = result.data;
    setUsers(users.map(u => (u.id === updated.id ? updated : u)));
    setEditing(null);
    report(null, "users.updated");
  };

  const onDelete = async (user: PublicUser) => {
    if (!confirm(t("users.confirmDelete", { name: user.name }))) return;
    const result = await call(api.users[":id"].$delete({ param: { id: user.id } }));
    if (!result.ok) return report(result.error);
    setUsers(users.filter(u => u.id !== user.id));
    report(null, "users.deleted");
  };

  const isEditing = (user: PublicUser, field: Editing["field"]) => editing?.id === user.id && editing.field === field;

  return (
    <>
      <h1>{t("nav.users")}</h1>

      <h2>{t("users.create")}</h2>
      {groups?.length === 0 && <p>{t("users.noGroupsHint")}</p>}
      {/* A user must belong to a group, so the form is disabled until one exists. */}
      <form onSubmit={onCreate} className="transaction-form">
        <fieldset disabled={!groups?.length} className="plain-fieldset">
          <label>
            {t("users.name")}
            <input type="text" name="name" required />
          </label>
          <label>
            {t("auth.password")}
            <input type="password" name="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          </label>
          <RoleAndGroupFields groups={groups ?? []} />
          <button type="submit">{t("users.create")}</button>
        </fieldset>
      </form>

      {error && <p className="error">{t(error)}</p>}
      {message && <p className="success">{t(message)}</p>}

      <table>
        <thead>
          <tr>
            <th>{t("users.name")}</th>
            <th>{t("users.role")}</th>
            <th>{t("users.groups")}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>
                {u.name}
                {u.id === me.id && ` (${t("users.you")})`}
              </td>
              <td>{t(`role.${u.role}`)}</td>
              <td>{groupNames(u)}</td>
              <td>
                {isEditing(u, "password") ? (
                  <form onSubmit={e => onChangePassword(e, u)} className="inline-form">
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      placeholder={t("users.newPassword")}
                    />
                    <button type="submit">{t("common.saveChanges")}</button>
                    <button type="button" onClick={() => setEditing(null)}>
                      {t("common.cancel")}
                    </button>
                  </form>
                ) : isEditing(u, "roleAndGroups") ? (
                  <form onSubmit={e => onChangeRoleAndGroups(e, u)} className="inline-form">
                    <RoleAndGroupFields groups={groups ?? []} user={u} />
                    <button type="submit">{t("common.saveChanges")}</button>
                    <button type="button" onClick={() => setEditing(null)}>
                      {t("common.cancel")}
                    </button>
                  </form>
                ) : (
                  <>
                    <button type="button" onClick={() => setEditing({ id: u.id, field: "password" })}>
                      {t("users.changePassword")}
                    </button>
                    {/* The admin's role and groups are fixed, and the admin cannot be deleted. */}
                    {u.role !== "admin" && (
                      <>
                        {" "}
                        <button type="button" onClick={() => setEditing({ id: u.id, field: "roleAndGroups" })}>
                          {t("users.editRoleAndGroups")}
                        </button>{" "}
                        <button type="button" onClick={() => onDelete(u)}>
                          {t("common.delete")}
                        </button>
                      </>
                    )}
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
