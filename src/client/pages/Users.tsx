import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, errorCode, request } from "@client/api";
import { none, queries, useDeleteMutation, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { submitWith, useAppForm } from "@client/components/form";
import { GroupCheckboxes, RoleSelect, type AssignableRole } from "@client/components/users/RoleAndGroupFields";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { Button, Chip, Input } from "@heroui/react";
import { editingRow, FormGrid, Message, PageHeader, RowActions, Section } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

type NewUser = Parameters<typeof api.users.$post>[0]["json"];
type RoleAndGroups = { role: AssignableRole; groupIds: string[] };

// What the admin is changing in a user's row.
type Editing = { id: string; field: "password" | "roleAndGroups" };

const column = recordColumns<PublicUser>();
export function Users() {
  const { t } = useI18n();
  const me = useCurrentUser();
  const users = useQuery(queries.users).data ?? none;
  // undefined while loading, so the create form only says "make a group first" once it knows.
  const groups = useQuery(queries.groups).data;
  const [editing, setEditing] = useState<Editing | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Users are also the members listed on the money pages, so those are fetched again after a change.
  const options = { invalidates: [queries.members.queryKey] };
  const create = useSaveMutation(
    queries.users,
    (json: NewUser) => request(api.users.$post({ json })),
    options,
  );
  const update = useSaveMutation(
    queries.users,
    ({ id, json }: { id: string; json: RoleAndGroups }) =>
      request(api.users[":id"].$put({ param: { id }, json })),
    options,
  );
  const remove = useDeleteMutation(queries.users, id => request(api.users[":id"].$delete({ param: { id } })), options);
  const changePassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      request(api.users[":id"].password.$put({ param: { id }, json: { password } })),
  });

  const groupNames = (user: PublicUser) =>
    user.groupIds.map(id => groups?.find(g => g.id === id)?.name ?? "?").join(", ") || "–";

  const report = (errorKey: string | null, messageKey: string | null = null) => {
    setError(errorKey);
    setMessage(messageKey);
  };

  // Runs a change and reports how it went; true when it worked.
  const run = async (change: Promise<unknown>, messageKey: string) => {
    try {
      await change;
    } catch (err) {
      report(errorCode(err));
      return false;
    }
    report(null, messageKey);
    return true;
  };

  // Each form gets one of these; it resolves to true when the change worked.
  const onCreate = (json: NewUser) => run(create.mutateAsync(json), "users.created");

  const onChangePassword = async (user: PublicUser, password: string) =>
    (await run(changePassword.mutateAsync({ id: user.id, password }), "users.passwordChanged")) && setEditing(null);

  const onChangeRoleAndGroups = async (user: PublicUser, json: RoleAndGroups) =>
    (await run(update.mutateAsync({ id: user.id, json }), "users.updated")) && setEditing(null);

  const onDelete = async (user: PublicUser) => {
    if (!confirm(t("users.confirmDelete", { name: user.name }))) return;
    await run(remove.mutateAsync(user.id), "users.deleted");
  };

  const isEditing = (user: PublicUser, field: Editing["field"]) => editing?.id === user.id && editing.field === field;

  const columns = [
    column.accessor("name", {
      header: t("users.name"),
      enableSorting: true,
      sortFn: "text",
      meta: { isRowHeader: true },
      cell: ({ row, getValue }) => (
        <>
          <span className="font-medium">{getValue()}</span>
          {row.original.id === me.id && <span className="text-muted"> ({t("users.you")})</span>}
        </>
      ),
    }),
    column.accessor(u => t(`role.${u.role}`), {
      id: "role",
      header: t("users.role"),
      enableSorting: true,
      sortFn: "text",
      cell: ({ row, getValue }) => (
        <Chip size="sm" variant="soft" color={row.original.role === "admin" ? "accent" : "default"}>
          {getValue()}
        </Chip>
      ),
    }),
    column.accessor(groupNames, { id: "groups", header: t("users.groups"), enableSorting: true, sortFn: "text" }),
    column.display({
      id: "actions",
      header: " ",
      meta: { ariaLabel: t("common.edit") },
      cell: ({ row: { original: u } }) =>
        isEditing(u, "password") ? (
          <PasswordForm onSave={password => onChangePassword(u, password)} onCancel={() => setEditing(null)} />
        ) : isEditing(u, "roleAndGroups") ? (
          <RoleAndGroupsForm
            user={u}
            groups={groups ?? []}
            onSave={json => onChangeRoleAndGroups(u, json)}
            onCancel={() => setEditing(null)}
          />
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
        ),
    }),
  ];

  return (
    <>
      <PageHeader title={t("nav.users")} />

      <Section title={t("users.create")} description={groups?.length === 0 ? t("users.noGroupsHint") : undefined}>
        {/* A user must belong to a group, so the form is disabled until one exists. */}
        <fieldset disabled={!groups?.length} className="min-w-0">
          <CreateUserForm groups={groups ?? []} onCreate={onCreate} />
        </fieldset>
      </Section>

      <Message error={error} success={message} />

      <Section>
        <RecordTable
          label={t("nav.users")}
          data={users}
          columns={columns}
          getRowId={u => u.id}
          rowClassName={u => editingRow(editing?.id === u.id)}
          paged={false}
        />
      </Section>
    </>
  );
}

// A new user's name, password, role and groups. Empties itself once the user is created.
function CreateUserForm({ groups, onCreate }: { groups: Group[]; onCreate: (json: NewUser) => Promise<boolean> }) {
  const { t } = useI18n();
  const form = useAppForm({
    defaultValues: { name: "", password: "", role: "" as AssignableRole | "", groupIds: [] as string[] },
    onSubmit: async ({ value, formApi }) => {
      // The browser makes sure a role is picked.
      if (await onCreate({ ...value, role: value.role as AssignableRole })) formApi.reset();
    },
  });

  return (
    <form.AppForm>
      <FormGrid onSubmit={submitWith(form)} actions={<form.SubmitButton>{t("users.create")}</form.SubmitButton>}>
        <form.AppField name="name">{field => <field.TextField label={t("users.name")} type="text" required />}</form.AppField>
        <form.AppField name="password">
          {field => (
            <field.TextField
              label={t("auth.password")}
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          )}
        </form.AppField>
        <form.AppField name="role">{() => <RoleSelect />}</form.AppField>
        <form.AppField name="groupIds">{() => <GroupCheckboxes groups={groups} />}</form.AppField>
      </FormGrid>
    </form.AppForm>
  );
}

// A new password for a user, typed in their row.
function PasswordForm({ onSave, onCancel }: { onSave: (password: string) => Promise<unknown>; onCancel: () => void }) {
  const { t } = useI18n();
  const form = useAppForm({
    defaultValues: { password: "" },
    onSubmit: ({ value }) => onSave(value.password),
  });

  return (
    <form.AppForm>
      <form onSubmit={submitWith(form)} className="flex items-end justify-end gap-2">
        <form.Field name="password">
          {field => (
            <Input
              variant="secondary"
              className="h-8"
              type="password"
              name={field.name}
              value={field.state.value}
              onChange={e => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              placeholder={t("users.newPassword")}
              aria-label={t("users.newPassword")}
            />
          )}
        </form.Field>
        <form.SubmitButton size="sm">{t("common.saveChanges")}</form.SubmitButton>
        <Button size="sm" variant="secondary" onPress={onCancel}>
          {t("common.cancel")}
        </Button>
      </form>
    </form.AppForm>
  );
}

// A user's role and groups, changed in their row.
function RoleAndGroupsForm({
  user,
  groups,
  onSave,
  onCancel,
}: {
  user: PublicUser;
  groups: Group[];
  onSave: (json: RoleAndGroups) => Promise<unknown>;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const form = useAppForm({
    // Only users other than the admin have this form.
    defaultValues: { role: user.role as AssignableRole, groupIds: user.groupIds },
    onSubmit: ({ value }) => onSave(value),
  });

  return (
    <form.AppForm>
      <form onSubmit={submitWith(form)} className="flex min-w-64 flex-col gap-3">
        <form.AppField name="role">{() => <RoleSelect />}</form.AppField>
        <form.AppField name="groupIds">{() => <GroupCheckboxes groups={groups} />}</form.AppField>
        <div className="flex gap-2">
          <form.SubmitButton size="sm" requireChange>
            {t("common.saveChanges")}
          </form.SubmitButton>
          <Button size="sm" variant="secondary" onPress={onCancel}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </form.AppForm>
  );
}
