import { useEffect, useState, type FormEvent } from "react";
import { api, call, load, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

export function Groups() {
  const { t } = useI18n();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load(api.groups.$get(), setGroups);
    load(api.users.$get(), setUsers);
  }, []);

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const result = await call(api.groups.$post({ json: { name: text(new FormData(form), "name") } }));
    if (!result.ok) return setError(result.error);
    setError(null);
    setGroups([...groups, result.data]);
    form.reset();
  };

  // Membership lives on the user, so update the user's groupIds locally after the server agrees.
  const setMember = async (group: Group, userId: string, member: boolean) => {
    const result = await call(
      member
        ? api.groups[":id"].members.$post({ param: { id: group.id }, json: { userId } })
        : api.groups[":id"].members[":userId"].$delete({ param: { id: group.id, userId } }),
    );
    if (!result.ok) return setError(result.error);
    setError(null);
    setUsers(
      users.map(u =>
        u.id !== userId
          ? u
          : { ...u, groupIds: member ? [...u.groupIds, group.id] : u.groupIds.filter(id => id !== group.id) },
      ),
    );
  };

  const onAdd = (e: FormEvent<HTMLFormElement>, group: Group) => {
    e.preventDefault();
    const form = e.currentTarget;
    const userId = text(new FormData(form), "userId");
    form.reset();
    return setMember(group, userId, true);
  };

  return (
    <>
      <h1>{t("nav.groups")}</h1>

      <form onSubmit={onCreate} className="transaction-form">
        <label>
          {t("groups.name")}
          <input type="text" name="name" required />
        </label>
        <button type="submit">{t("groups.create")}</button>
      </form>

      {error && <p className="error">{t(error)}</p>}
      {groups.length === 0 && <p>{t("groups.empty")}</p>}

      {groups.map(g => {
        const members = users.filter(u => u.groupIds.includes(g.id));
        // The admin stands apart and is never offered.
        const others = users.filter(u => u.role !== "admin" && !u.groupIds.includes(g.id));
        return (
          <section key={g.id}>
            <h2>{g.name}</h2>
            <table>
              <tbody>
                {members.length === 0 ? (
                  <tr>
                    <td colSpan={2}>{t("groups.noMembers")}</td>
                  </tr>
                ) : (
                  members.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>
                        <button type="button" onClick={() => setMember(g, u.id, false)}>
                          {t("groups.remove")}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {others.length > 0 && (
              <form onSubmit={e => onAdd(e, g)} className="inline-form">
                <select name="userId" required defaultValue="">
                  <option value="" disabled>
                    {t("auth.selectUser")}
                  </option>
                  {others.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <button type="submit">{t("groups.add")}</button>
              </form>
            )}
          </section>
        );
      })}
    </>
  );
}
