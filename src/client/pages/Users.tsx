import { useEffect, useState, type FormEvent } from "react";
import { api, call, load, text } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { RoleAndGroupFields } from "@client/components/users/RoleAndGroupFields";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { Button, Chip, Input, Table } from "@heroui/react";
import { DataTable, editingRow, Field, FormGrid, Message, PageHeader, RowActions, Section } from "@client/components/ui";
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
      <PageHeader title={t("nav.users")} />

      <Section title={t("users.create")} description={groups?.length === 0 ? t("users.noGroupsHint") : undefined}>
        {/* A user must belong to a group, so the form is disabled until one exists. */}
        <fieldset disabled={!groups?.length} className="min-w-0">
          <FormGrid onSubmit={onCreate} actions={<Button type="submit">{t("users.create")}</Button>}>
            <Field label={t("users.name")} type="text" name="name" required />
            <Field
              label={t("auth.password")}
              type="password"
              name="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
            <RoleAndGroupFields groups={groups ?? []} />
          </FormGrid>
        </fieldset>
      </Section>

      <Message error={error} success={message} />

      <Section>
        <DataTable
          label={t("nav.users")}
          columns={
            <>
              <Table.Column isRowHeader>{t("users.name")}</Table.Column>
              <Table.Column>{t("users.role")}</Table.Column>
              <Table.Column>{t("users.groups")}</Table.Column>
              <Table.Column aria-label={t("common.edit")}> </Table.Column>
            </>
          }
        >
          {users.map(u => (
            <Table.Row key={u.id} id={u.id} className={editingRow(editing?.id === u.id)}>
              <Table.Cell>
                <span className="font-medium">{u.name}</span>
                {u.id === me.id && <span className="text-muted"> ({t("users.you")})</span>}
              </Table.Cell>
              <Table.Cell>
                <Chip size="sm" variant="soft" color={u.role === "admin" ? "accent" : "default"}>
                  {t(`role.${u.role}`)}
                </Chip>
              </Table.Cell>
              <Table.Cell>{groupNames(u)}</Table.Cell>
              <Table.Cell>
                {isEditing(u, "password") ? (
                  <form onSubmit={e => onChangePassword(e, u)} className="flex items-end justify-end gap-2">
                    <Input
                      variant="secondary"
                      className="h-8"
                      type="password"
                      name="password"
                      required
                      minLength={MIN_PASSWORD_LENGTH}
                      autoComplete="new-password"
                      placeholder={t("users.newPassword")}
                      aria-label={t("users.newPassword")}
                    />
                    <Button size="sm" type="submit">
                      {t("common.saveChanges")}
                    </Button>
                    <Button size="sm" variant="secondary" onPress={() => setEditing(null)}>
                      {t("common.cancel")}
                    </Button>
                  </form>
                ) : isEditing(u, "roleAndGroups") ? (
                  <form onSubmit={e => onChangeRoleAndGroups(e, u)} className="flex min-w-64 flex-col gap-3">
                    <RoleAndGroupFields groups={groups ?? []} user={u} />
                    <div className="flex gap-2">
                      <Button size="sm" type="submit">
                        {t("common.saveChanges")}
                      </Button>
                      <Button size="sm" variant="secondary" onPress={() => setEditing(null)}>
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <RowActions
                    // The admin's role and groups are fixed, and the admin cannot be deleted.
                    onDelete={u.role !== "admin" ? () => onDelete(u) : undefined}
                    extra={
                      <>
                        <Button size="sm" variant="ghost" onPress={() => setEditing({ id: u.id, field: "password" })}>
                          {t("users.changePassword")}
                        </Button>
                        {u.role !== "admin" && (
                          <Button size="sm" variant="ghost" onPress={() => setEditing({ id: u.id, field: "roleAndGroups" })}>
                            {t("users.editRoleAndGroups")}
                          </Button>
                        )}
                      </>
                    }
                  />
                )}
              </Table.Cell>
            </Table.Row>
          ))}
        </DataTable>
      </Section>
    </>
  );
}
