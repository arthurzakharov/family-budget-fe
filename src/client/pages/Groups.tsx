import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorCode, request } from "@client/api";
import { none, queries, useSaveMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { Button } from "@heroui/react";
import { submitWith, useAppForm } from "@client/components/form";
import { FormGrid, Message, PageHeader, Section } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import type { Group, PublicUser } from "@arthurzakharov/family-budget-be-client";

const column = recordColumns<PublicUser>();

export function Groups() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const groups = useQuery(queries.groups).data ?? none;
  const users = useQuery(queries.users).data ?? none;
  const [error, setError] = useState<string | null>(null);

  const create = useSaveMutation(queries.groups, (name: string) => request(api.groups.$post({ json: { name } })));

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

  const createForm = useAppForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value, formApi }) => {
      if (await run(create.mutateAsync(value.name))) formApi.reset();
    },
  });

  const setMember = (group: Group, userId: string, member: boolean) =>
    run(membership.mutateAsync({ group, userId, member }));

  // The members of a group, each with a button to take them out of it.
  const memberColumns = (group: Group) => [
    column.accessor("name", { header: t("users.name"), enableSorting: true, sortFn: "text", meta: { isRowHeader: true } }),
    column.display({
      id: "remove",
      header: " ",
      meta: { ariaLabel: t("groups.remove") },
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button size="sm" variant="danger-soft" onPress={() => setMember(group, row.original.id, false)}>
            {t("groups.remove")}
          </Button>
        </div>
      ),
    }),
  ];

  return (
    <>
      <PageHeader title={t("nav.groups")} />

      <Section title={t("groups.create")}>
        <createForm.AppForm>
          <FormGrid
            onSubmit={submitWith(createForm)}
            actions={<createForm.SubmitButton>{t("groups.create")}</createForm.SubmitButton>}
          >
            <createForm.AppField name="name">
              {field => <field.TextField label={t("groups.name")} type="text" required />}
            </createForm.AppField>
          </FormGrid>
        </createForm.AppForm>
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
      <form onSubmit={submitWith(form)} className="mt-4 flex items-end gap-2">
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
        <form.SubmitButton>{t("groups.add")}</form.SubmitButton>
      </form>
    </form.AppForm>
  );
}
