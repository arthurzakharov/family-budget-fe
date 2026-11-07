import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorCode, request } from "@client/api";
import { none, queries, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { usePendingIds } from "@client/utils/pending";
import { notify } from "@client/utils/notify";
import { Button, Spinner } from "@heroui/react";
import { FolderPlus, PersonPlus, PersonXmark } from "@gravity-ui/icons";
import { FormModal, submitWith, useAppForm } from "@client/components/form";
import { IconAction, Message, PageHeader, Section } from "@client/components/ui";
import { RecordTable, recordColumns, TablesLoading } from "@client/components/RecordTable";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

const column = recordColumns<PublicUser>();

export function Groups() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const groupsQuery = useQuery(queries.groups);
  const usersQuery = useQuery(queries.users);
  const groups = groupsQuery.data ?? none;
  const users = usersQuery.data ?? none;
  const [error, setError] = useState<string | null>(null);
  // Whether the "Create group" dialog is open
  const [creating, setCreating] = useState(false);

  // Membership lives on the user, so update the user's groupIds in the cache after the server agrees.
  type Membership = { group: Group; userId: string; member: boolean };
  const membership = useMutation({
    mutationFn: ({ group, userId, member }: Membership) =>
      request(
        member
          ? api.groups[":id"].members.$post({ param: { id: group.id }, json: { userId } })
          : api.groups[":id"].members[":userId"].$delete({ param: { id: group.id, userId } }),
      ),
    onSuccess: (_, { group, userId, member }) => {
      qc.setQueryData<PublicUser[]>(queries.users.queryKey, cached =>
        cached?.map(u =>
          u.id !== userId
            ? u
            : { ...u, groupIds: member ? [...u.groupIds, group.id] : u.groupIds.filter(id => id !== group.id) },
        ),
      );
      qc.invalidateQueries({ queryKey: queries.members.queryKey });
    },
  });

  // Runs a change and shows its error, if any; true when it worked.
  const run = async (change: Promise<unknown>) => {
    try {
      await change;
    } catch (err) {
      setError(errorCode(err));
      return false;
    }
    setError(null);
    return true;
  };

  // Adds or removes a member; a toast names who and which group. True when it worked.
  const setMember = async (group: Group, userId: string, member: boolean) => {
    // Read before the change, while the user is still in the list either way
    const name = users.find(u => u.id === userId)?.name ?? "?";
    const ok = await run(membership.mutateAsync({ group, userId, member }));
    if (ok) {
      const description = `${name} · ${group.name}`;
      if (member) notify.created(t("groups.memberAdded"), description);
      else notify.deleted(t("groups.memberRemoved"), description);
    }
    return ok;
  };

  // Members whose removal is running (keyed by group and user); their button shows a spinner.
  const removing = usePendingIds();
  const removeKey = (group: Group, userId: string) => `${group.id}:${userId}`;
  const removeMember = (group: Group, userId: string) =>
    removing.track(removeKey(group, userId), () => setMember(group, userId, false));

  // The members of a group, each with a button to take them out of it.
  const memberColumns = (group: Group) => [
    column.accessor("name", { header: t("users.name"), enableSorting: true, sortFn: "text", meta: { isRowHeader: true } }),
    column.display({
      id: "remove",
      header: " ",
      meta: { ariaLabel: t("groups.remove") },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <IconAction
            label={t("groups.remove")}
            icon={<PersonXmark className="size-4" />}
            onPress={() => removeMember(group, row.original.id)}
            isPending={removing.isPending(removeKey(group, row.original.id))}
            danger
          />
        </div>
      ),
    }),
  ];

  return (
    <>
      <PageHeader
        title={t("nav.groups")}
        actions={
          <Button onPress={() => setCreating(true)}>
            <FolderPlus className="size-4" />
            {t("groups.create")}
          </Button>
        }
      />

      <CreateGroupModal
        isOpen={creating}
        onOpenChange={setCreating}
        onCreated={group => {
          setCreating(false);
          setError(null);
          notify.created(t("groups.created"), group.name);
        }}
      />

      <Message error={error} />
      {groupsQuery.isPending ? (
        <div role="status" className="flex items-center gap-2 text-sm text-muted">
          <Spinner size="sm" />
          {t("common.loading")}
        </div>
      ) : (
        groups.length === 0 && <p className="text-sm text-muted">{t("groups.empty")}</p>
      )}

      {/* Each group's member list waits for the users. */}
      <TablesLoading isLoading={usersQuery.isPending}>
        <div className="grid items-start gap-x-6 lg:grid-cols-2 [&>*]:min-w-0">
          {groups.map(g => {
            const members = users.filter(u => u.groupIds.includes(g.id));
            // The admin stands apart and is never offered.
            const others = users.filter(u => u.role !== "admin" && !u.groupIds.includes(g.id));
            return (
              <Section key={g.id} title={g.name}>
                <RecordTable
                  label={g.name}
                  emptyText={t("groups.noMembers")}
                  data={members}
                  columns={memberColumns(g)}
                  getRowId={u => u.id}
                  paged={false}
                />
                {others.length > 0 && (
                  <AddMemberForm users={others} onAdd={userId => setMember(g, userId, true)} />
                )}
              </Section>
            );
          })}
        </div>
      </TablesLoading>
    </>
  );
}

// Picks a user who is not in the group yet and adds them.
function AddMemberForm({ users, onAdd }: { users: PublicUser[]; onAdd: (userId: string) => Promise<boolean> }) {
  const { t } = useI18n();
  const form = useAppForm({
    defaultValues: { userId: "" },
    onSubmit: async ({ value, formApi }) => {
      if (await onAdd(value.userId)) formApi.reset();
    },
  });

  return (
    <form.AppForm>
      <form.BusyArea className="mt-4">
        <form onSubmit={submitWith(form)} className="flex items-end gap-2">
          <form.AppField name="userId">
            {field => (
              <field.SelectField
                label={t("auth.selectUser")}
                isRequired
                placeholder={t("auth.selectUser")}
                options={users.map(u => ({ id: u.id, label: u.name }))}
              />
            )}
          </form.AppField>
          <form.SubmitButton icon={<PersonPlus className="size-4" />}>{t("groups.add")}</form.SubmitButton>
        </form>
      </form.BusyArea>
    </form.AppForm>
  );
}

// The "Create group" dialog. Closes once the group is created; a failure is shown inside it,
// so the typed name is not lost.
function CreateGroupModal({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated: (group: Group) => void;
}) {
  const { t } = useI18n();
  return (
    <FormModal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={t("groups.create")}
      icon={<FolderPlus className="size-5" />}
      size="sm"
    >
      <CreateGroupForm onCreated={onCreated} />
    </FormModal>
  );
}

function CreateGroupForm({ onCreated }: { onCreated: (group: Group) => void }) {
  const { t } = useI18n();
  const create = useSaveMutation(queries.groups, (name: string) => request(api.groups.$post({ json: { name } })));
  const form = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      let group;
      try {
        group = await create.mutateAsync(value.name);
      } catch {
        return; // shown from create.error
      }
      onCreated(group);
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm error={errorCode(create.error)} submitLabel={t("groups.create")}>
        <form.AppField name="name">
          {field => <field.TextField label={t("groups.name")} type="text" required autoFocus />}
        </form.AppField>
      </form.ModalForm>
    </form.AppForm>
  );
}
