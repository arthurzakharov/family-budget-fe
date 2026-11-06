import { useEffect, useState, type FormEvent } from "react";
import { api, call, load, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { Button, Table } from "@heroui/react";
import { DataTable, Field, FormGrid, Message, PageHeader, Section, SelectField } from "@client/components/ui";
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
      <PageHeader title={t("nav.groups")} />

      <Section title={t("groups.create")}>
        <FormGrid onSubmit={onCreate} actions={<Button type="submit">{t("groups.create")}</Button>}>
          <Field label={t("groups.name")} type="text" name="name" required />
        </FormGrid>
      </Section>

      <Message error={error} />
      {groups.length === 0 && <p className="text-sm text-muted">{t("groups.empty")}</p>}

      <div className="grid items-start gap-x-6 lg:grid-cols-2 [&>*]:min-w-0">
        {groups.map(g => {
          const members = users.filter(u => u.groupIds.includes(g.id));
          // The admin stands apart and is never offered.
          const others = users.filter(u => u.role !== "admin" && !u.groupIds.includes(g.id));
          return (
            <Section key={g.id} title={g.name}>
              <DataTable
                label={g.name}
                emptyText={t("groups.noMembers")}
                columns={
                  <>
                    <Table.Column isRowHeader>{t("users.name")}</Table.Column>
                    <Table.Column aria-label={t("groups.remove")}> </Table.Column>
                  </>
                }
              >
                {members.map(u => (
                  <Table.Row key={u.id} id={u.id}>
                    <Table.Cell>{u.name}</Table.Cell>
                    <Table.Cell>
                      <div className="flex justify-end">
                        <Button size="sm" variant="danger-soft" onPress={() => setMember(g, u.id, false)}>
                          {t("groups.remove")}
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </DataTable>
              {others.length > 0 && (
                <form onSubmit={e => onAdd(e, g)} className="mt-4 flex items-end gap-2">
                  <SelectField
                    label={t("auth.selectUser")}
                    name="userId"
                    isRequired
                    placeholder={t("auth.selectUser")}
                    options={others.map(u => ({ id: u.id, label: u.name }))}
                  />
                  <Button type="submit">{t("groups.add")}</Button>
                </form>
              )}
            </Section>
          );
        })}
      </div>
    </>
  );
}
