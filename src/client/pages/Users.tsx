import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, errorCode, request } from "@client/api";
import { none, queries, useDeleteMutation, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { usePendingIds } from "@client/utils/pending";
import { notify } from "@client/utils/notify";
import { useCurrentUser } from "@client/context/auth";
import { FormModal, submitWith, useAppForm } from "@client/components/form";
import { GroupCheckboxes, RoleSelect, type AssignableRole } from "@client/components/users/RoleAndGroupFields";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { Button, Chip, Input } from "@heroui/react";
import { Key, PersonGear, PersonPlus, TrashBin } from "@gravity-ui/icons";
import { editingRow, IconAction, IconActionGap, Message, PageHeader, Section } from "@client/components/ui";
import { RecordTable, recordColumns, TablesLoading } from "@client/components/RecordTable";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

type NewUser = Parameters<typeof api.users.$post>[0]["json"];
type RoleAndGroups = { role: AssignableRole; groupIds: string[] };

// What the admin is changing in a user's row.
type Editing = { id: string; field: "password" | "roleAndGroups" };

const column = recordColumns<PublicUser>();
export function Users() {
  const { t } = useI18n();
  const me = useCurrentUser();
  const usersQuery = useQuery(queries.users);
  const users = usersQuery.data ?? none;
  // undefined while loading, so the create form only says "make a group first" once it knows.
  const groups = useQuery(queries.groups).data;
  const [editing, setEditing] = useState<Editing | null>(null);
  // Whether the "Create user" dialog is open
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Users are also the members listed on the money pages, so those are fetched again after a change.
  const options = { invalidates: [queries.members.queryKey] };
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

  // Runs a change; a failure is shown above the table, success is confirmed by `done` (a toast).
  // True when it worked.
  const run = async (change: Promise<unknown>, done: () => void) => {
    try {
      await change;
    } catch (err) {
      setError(errorCode(err));
      return false;
    }
    setError(null);
    done();
    return true;
  };

  // The row forms get one of these; it resolves to true when the change worked.
  const onChangePassword = async (user: PublicUser, password: string) =>
    (await run(changePassword.mutateAsync({ id: user.id, password }), () =>
      notify.updated(t("users.passwordChanged"), user.name),
    )) && setEditing(null);

  const onChangeRoleAndGroups = async (user: PublicUser, json: RoleAndGroups) =>
    (await run(update.mutateAsync({ id: user.id, json }), () => notify.updated(t("users.updated"), user.name))) &&
    setEditing(null);

  // Users whose delete request is running; their row's buttons are locked meanwhile.
  const deleting = usePendingIds();

  const onDelete = async (user: PublicUser) => {
    if (!confirm(t("users.confirmDelete", { name: user.name }))) return;
    await run(
      deleting.track(user.id, () => remove.mutateAsync(user.id)),
      () => notify.deleted(t("users.deleted"), user.name),
    );
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
          // The admin's role and groups are fixed, and the admin cannot be deleted; their slots
          // stay empty so the icons line up with the other rows.
          <div className="flex justify-end gap-1">
            <IconAction
              label={t("users.changePassword")}
              icon={<Key className="size-4" />}
              onPress={() => setEditing({ id: u.id, field: "password" })}
              isDisabled={deleting.isPending(u.id)}
            />
            {u.role !== "admin" ? (
              <>
                <IconAction
                  label={t("users.editRoleAndGroups")}
                  icon={<PersonGear className="size-4" />}
                  onPress={() => setEditing({ id: u.id, field: "roleAndGroups" })}
                  isDisabled={deleting.isPending(u.id)}
                />
                <IconAction
                  label={t("common.delete")}
                  icon={<TrashBin className="size-4" />}
                  onPress={() => onDelete(u)}
                  isPending={deleting.isPending(u.id)}
                  danger
                />
              </>
            ) : (
              <>
                <IconActionGap />
                <IconActionGap />
              </>
            )}
          </div>
        ),
    }),
  ];

  return (
    <>
      <PageHeader
        title={t("nav.users")}
        // A user must belong to a group, so users can only be created once a group exists.
        description={groups?.length === 0 ? t("users.noGroupsHint") : undefined}
        actions={
          <Button onPress={() => setCreating(true)} isDisabled={!groups?.length}>
            <PersonPlus className="size-4" />
            {t("users.create")}
          </Button>
        }
      />

      <CreateUserModal
        isOpen={creating}
        onOpenChange={setCreating}
        groups={groups ?? []}
        onCreated={user => {
          setCreating(false);
          setError(null);
          notify.created(t("users.created"), user.name);
        }}
      />

      <Message error={error} />

      {/* The table names each user's groups, so it waits for both lists. */}
      <TablesLoading isLoading={usersQuery.isPending || groups === undefined}>
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
      </TablesLoading>
    </>
  );
}

// The "Create user" dialog. Closes once the user is created; a failure is shown inside it, so
// nothing typed is lost.
function CreateUserModal({
  isOpen,
  onOpenChange,
  groups,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  groups: Group[];
  onCreated: (user: PublicUser) => void;
}) {
  const { t } = useI18n();
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("users.create")}
      icon={<PersonPlus className="size-5" />}
      size="md"
    >
      <CreateUserForm groups={groups} onCreated={onCreated} />
    </FormModal>
  );
}

// A new user's name, password, role and groups.
function CreateUserForm({ groups, onCreated }: { groups: Group[]; onCreated: (user: PublicUser) => void }) {
  const { t } = useI18n();
  // Users are also the members listed on the money pages, so those are fetched again.
  const create = useSaveMutation(queries.users, (json: NewUser) => request(api.users.$post({ json })), {
    invalidates: [queries.members.queryKey],
  });
  const form = useAppForm({
    defaultValues: { name: "", password: "", role: "" as AssignableRole | "", groupIds: [] as string[] },
    onSubmit: async ({ value }) => {
      let user;
      try {
        // The browser makes sure a role is picked.
        user = await create.mutateAsync({ ...value, role: value.role as AssignableRole });
      } catch {
        return; // shown from create.error
      }
      onCreated(user);
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm error={errorCode(create.error)} submitLabel={t("users.create")}>
        <form.AppField name="name">
          {field => <field.TextField label={t("users.name")} type="text" required autoFocus />}
        </form.AppField>
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
      </form.ModalForm>
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
      <form.BusyArea>
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
      </form.BusyArea>
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
      <form.BusyArea>
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
      </form.BusyArea>
    </form.AppForm>
  );
}
