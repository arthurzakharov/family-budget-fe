import { languages, useI18n, type Language } from "@client/context/i18n";
import { themes, useTheme, type Theme } from "@client/context/theme";
import { useAuthMutation, useCurrentUser } from "@client/context/auth";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { notify } from "@client/utils/notify";
import { api, errorCode, request } from "@client/api";
import { useMutation } from "@tanstack/react-query";
import { Avatar, Button, ToggleButton, ToggleButtonGroup, type Key } from "@heroui/react";
import { submitWith, useAppForm } from "@client/components/form";
import { FormStack, Message, PageHeader, Section } from "@client/components/ui";

// Language names are shown in their own language, so they are not translated.
const languageNames: Record<Language, string> = {
  en: "English",
  ru: "Русский",
};

// The single key picked in a single-selection ToggleButtonGroup.
const picked = (keys: Set<Key>) => {
  const [key] = keys;
  return key === undefined ? null : String(key);
};

export function Settings() {
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();
  const user = useCurrentUser();
  const switchUser = useAuthMutation(() => api.auth["switch-user"].$post());
  const logout = useAuthMutation(() => api.auth.logout.$post());
  const changePassword = useMutation({
    mutationFn: (json: { current: string; next: string }) => request(api.auth.password.$post({ json })),
  });
  const passwordForm = useAppForm({
    defaultValues: { current: "", next: "" },
    onSubmit: async ({ value, formApi }) => {
      try {
        await changePassword.mutateAsync(value);
      } catch {
        return; // shown from changePassword.error
      }
      formApi.reset();
      notify.updated(t("users.passwordChanged"));
    },
  });

  return (
    <>
      <PageHeader title={t("nav.settings")} />

      <div className="grid items-start gap-6 md:grid-cols-2 [&>*]:min-w-0">
        <Section title={t("settings.account")} className="mb-0">
          <div className="mb-4 flex items-center gap-3">
            <Avatar>
              <Avatar.Fallback>{user.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
            </Avatar>
            <p className="text-sm">{t("settings.loggedInAs", { name: user.name, role: t(`role.${user.role}`) })}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" isDisabled={switchUser.isPending} onPress={() => switchUser.mutate()}>
              {t("settings.switchUser")}
            </Button>
            <Button variant="danger-soft" isDisabled={logout.isPending} onPress={() => logout.mutate()}>
              {t("auth.logout")}
            </Button>
          </div>
        </Section>

        <Section title={t("settings.changePassword")} className="mb-0">
          <Message error={errorCode(changePassword.error)} />
          <passwordForm.AppForm>
            <FormStack onSubmit={submitWith(passwordForm)}>
              <passwordForm.AppField name="current">
                {field => (
                  <field.TextField label={t("settings.currentPassword")} type="password" required autoComplete="current-password" />
                )}
              </passwordForm.AppField>
              <passwordForm.AppField name="next">
                {field => (
                  <field.TextField
                    label={t("users.newPassword")}
                    type="password"
                    required
                    minLength={MIN_PASSWORD_LENGTH}
                    autoComplete="new-password"
                  />
                )}
              </passwordForm.AppField>
              <div>
                <passwordForm.SubmitButton>{t("settings.changePassword")}</passwordForm.SubmitButton>
              </div>
            </FormStack>
          </passwordForm.AppForm>
        </Section>

        <Section title={t("settings.theme")} className="mb-0">
          <ToggleButtonGroup
            aria-label={t("settings.theme")}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[theme]}
            onSelectionChange={keys => {
              const th = picked(keys);
              if (th) setTheme(th as Theme);
            }}
          >
            {themes.map((th, i) => (
              <ToggleButton key={th} id={th}>
                {i > 0 && <ToggleButtonGroup.Separator />}
                {t(`theme.${th}`)}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Section>

        <Section title={t("settings.language")} className="mb-0">
          <ToggleButtonGroup
            aria-label={t("settings.language")}
            selectionMode="single"
            disallowEmptySelection
            selectedKeys={[language]}
            onSelectionChange={keys => {
              const l = picked(keys);
              if (l) setLanguage(l as Language);
            }}
          >
            {(Object.keys(languages) as Language[]).map((l, i) => (
              <ToggleButton key={l} id={l}>
                {i > 0 && <ToggleButtonGroup.Separator />}
                {languageNames[l]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Section>
      </div>
    </>
  );
}
