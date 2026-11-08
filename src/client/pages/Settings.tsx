import { useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Button, Chip, Skeleton, ToggleButton, ToggleButtonGroup } from "@heroui/react";
import { ArrowRightArrowLeft, ArrowRightFromSquare, At, Key, Pencil } from "@gravity-ui/icons";
import { languages, useI18n, type Language } from "@client/context/i18n";
import { useAuthMutation, useCurrentUser } from "@client/context/auth";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { notify } from "@client/utils/notify";
import { api, errorCode, request } from "@client/api";
import { queries } from "@client/queries";
import { FormModal, useAppForm } from "@client/components/form";
import { IconAction, Message, PageHeader, Section } from "@client/components/ui";

// Language names are shown in their own language, so they are not translated.
const languageNames: Record<Language, string> = {
  en: "English",
  ru: "Русский",
};

// Stands in for a password, which is never shown or even known to the app.
const HIDDEN_PASSWORD = "••••••••";

type Editing = "password" | "workspaceEmail" | "workspacePassword" | null;

// Everything a user can change about themselves and the workspace, one row per thing.
// The theme is switched from the header, so it is not repeated here.
export function Settings() {
  const { language, setLanguage, t } = useI18n();
  const user = useCurrentUser();
  const isAdmin = user.role === "admin";
  const workspace = useQuery(queries.workspace);
  const switchUser = useAuthMutation(() => api.auth["switch-user"].$post());
  const logout = useAuthMutation(() => api.auth.logout.$post());
  const [editing, setEditing] = useState<Editing>(null);
  const close = () => setEditing(null);

  return (
    <>
      <PageHeader
        title={t("nav.settings")}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" isDisabled={switchUser.isPending} onPress={() => switchUser.mutate()}>
              <ArrowRightArrowLeft className="size-4" />
              {t("settings.switchUser")}
            </Button>
            <Button variant="danger-soft" isDisabled={logout.isPending} onPress={() => logout.mutate()}>
              <ArrowRightFromSquare className="size-4" />
              {t("auth.logout")}
            </Button>
          </div>
        }
      />

      <div className="flex flex-col gap-6 [&>*]:mb-0">
        <Section title={t("settings.account")}>
          <SettingList>
            <SettingRow label={t("auth.user")}>
              <span className="flex items-center gap-3">
                <Avatar size="sm">
                  <Avatar.Fallback>{user.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
                </Avatar>
                <span className="truncate">{user.name}</span>
                <Chip size="sm" variant="soft" color={isAdmin ? "accent" : "default"}>
                  {t(`role.${user.role}`)}
                </Chip>
              </span>
            </SettingRow>
            <SettingRow
              label={t("auth.password")}
              action={
                <IconAction label={t("settings.changePassword")} icon={<Pencil className="size-4" />} onPress={() => setEditing("password")} />
              }
            >
              {HIDDEN_PASSWORD}
            </SettingRow>
          </SettingList>
        </Section>

        <Section
          title={t("settings.workspace")}
          description={isAdmin ? t("settings.workspaceHint") : t("settings.workspaceAdminOnly")}
        >
          <Message error={errorCode(workspace.error)} />
          <SettingList>
            <SettingRow
              label={t("auth.email")}
              action={
                isAdmin && (
                  <IconAction
                    label={t("settings.changeEmail")}
                    icon={<Pencil className="size-4" />}
                    onPress={() => setEditing("workspaceEmail")}
                    isDisabled={!workspace.data}
                  />
                )
              }
            >
              {workspace.data ? workspace.data.email : <Skeleton className="h-5 w-48 rounded-md" />}
            </SettingRow>
            <SettingRow
              label={t("auth.workspacePassword")}
              action={
                isAdmin && (
                  <IconAction
                    label={t("settings.changeWorkspacePassword")}
                    icon={<Pencil className="size-4" />}
                    onPress={() => setEditing("workspacePassword")}
                  />
                )
              }
            >
              {HIDDEN_PASSWORD}
            </SettingRow>
          </SettingList>
        </Section>

        <Section title={t("settings.preferences")}>
          <SettingList>
            <SettingRow label={t("settings.language")}>
              <ToggleButtonGroup
                aria-label={t("settings.language")}
                selectionMode="single"
                disallowEmptySelection
                size="sm"
                selectedKeys={[language]}
                onSelectionChange={keys => {
                  const [l] = keys;
                  if (l !== undefined) setLanguage(String(l) as Language);
                }}
              >
                {(Object.keys(languages) as Language[]).map((l, i) => (
                  <ToggleButton key={l} id={l}>
                    {i > 0 && <ToggleButtonGroup.Separator />}
                    {languageNames[l]}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </SettingRow>
          </SettingList>
        </Section>
      </div>

      <FormModal
        isOpen={editing === "password"}
        onOpenChange={open => !open && close()}
        title={t("settings.changePassword")}
        icon={<Key className="size-5" />}
        size="sm"
      >
        <PasswordForm
          currentLabel={t("settings.currentPassword")}
          send={json => request(api.auth.password.$post({ json }))}
          onSaved={close}
        />
      </FormModal>

      <FormModal
        isOpen={editing === "workspaceEmail"}
        onOpenChange={open => !open && close()}
        title={t("settings.changeEmail")}
        icon={<At className="size-5" />}
        size="sm"
      >
        <WorkspaceEmailForm email={workspace.data?.email ?? ""} onSaved={close} />
      </FormModal>

      <FormModal
        isOpen={editing === "workspacePassword"}
        onOpenChange={open => !open && close()}
        title={t("settings.changeWorkspacePassword")}
        icon={<Key className="size-5" />}
        size="sm"
      >
        <PasswordForm
          currentLabel={t("settings.currentWorkspacePassword")}
          send={json => request(api.auth.workspace.password.$post({ json }))}
          onSaved={close}
        />
      </FormModal>
    </>
  );
}

// Rows separated by thin lines
function SettingList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col divide-y divide-separator">{children}</div>;
}

// One thing that can be seen or changed: its name above its value, and an action on the right.
function SettingRow({ label, action, children }: { label: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex min-h-16 items-center gap-4 py-3 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm text-muted">{label}</span>
        <div className="min-w-0 truncate font-medium">{children}</div>
      </div>
      {action}
    </div>
  );
}

// Changes a password (the user's own or the workspace's): the current one, then the new one.
function PasswordForm({
  currentLabel,
  send,
  onSaved,
}: {
  currentLabel: string;
  send: (json: { current: string; next: string }) => Promise<unknown>;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const save = useMutation({ mutationFn: send });
  const form = useAppForm({
    defaultValues: { current: "", next: "" },
    onSubmit: async ({ value }) => {
      try {
        await save.mutateAsync(value);
      } catch {
        return; // shown from save.error
      }
      notify.updated(t("users.passwordChanged"));
      onSaved();
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm error={errorCode(save.error)} submitLabel={t("common.saveChanges")}>
        <form.AppField name="current">
          {field => <field.TextField label={currentLabel} type="password" required autoComplete="current-password" />}
        </form.AppField>
        <form.AppField name="next">
          {field => (
            <field.TextField
              label={t("users.newPassword")}
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          )}
        </form.AppField>
      </form.ModalForm>
    </form.AppForm>
  );
}

// Changes the email the family logs in with; the workspace password confirms it.
function WorkspaceEmailForm({ email, onSaved }: { email: string; onSaved: () => void }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const save = useMutation({
    mutationFn: (json: { email: string; password: string }) => request(api.auth.workspace.email.$put({ json })),
    onSuccess: saved => qc.setQueryData(queries.workspace.queryKey, saved),
  });
  const form = useAppForm({
    defaultValues: { email, password: "" },
    onSubmit: async ({ value }) => {
      let saved;
      try {
        saved = await save.mutateAsync(value);
      } catch {
        return; // shown from save.error
      }
      notify.updated(t("settings.emailChanged"), saved.email);
      onSaved();
    },
  });

  return (
    <form.AppForm>
      <form.ModalForm error={errorCode(save.error)} submitLabel={t("common.saveChanges")} requireChange>
        <form.AppField name="email">
          {field => <field.TextField label={t("settings.newEmail")} type="email" required autoComplete="email" />}
        </form.AppField>
        <form.AppField name="password">
          {field => (
            <field.TextField
              label={t("settings.currentWorkspacePassword")}
              type="password"
              required
              autoComplete="current-password"
            />
          )}
        </form.AppField>
      </form.ModalForm>
    </form.AppForm>
  );
}
