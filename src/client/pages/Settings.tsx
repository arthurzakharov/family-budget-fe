import { languages, useI18n, type Language } from "@client/context/i18n";
import { themes, useTheme, type Theme } from "@client/context/theme";
import { useAuth, useCurrentUser } from "@client/context/auth";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { api, call, text } from "@client/api";
import { useState, type FormEvent } from "react";
import { Avatar, Button, ToggleButton, ToggleButtonGroup, type Key } from "@heroui/react";
import { Field, FormStack, Message, PageHeader, Section } from "@client/components/ui";

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
  const { send } = useAuth();
  const user = useCurrentUser();
  const [error, setError] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);

  const onChangePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const result = await call(api.auth.password.$post({ json: { current: text(data, "current"), next: text(data, "next") } }));
    setChanged(result.ok);
    setError(result.ok ? null : result.error);
    if (result.ok) form.reset();
  };

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
            <Button variant="secondary" onPress={() => send(api.auth["switch-user"].$post())}>
              {t("settings.switchUser")}
            </Button>
            <Button variant="danger-soft" onPress={() => send(api.auth.logout.$post())}>
              {t("auth.logout")}
            </Button>
          </div>
        </Section>

        <Section title={t("settings.changePassword")} className="mb-0">
          <Message error={error} success={changed ? "users.passwordChanged" : null} />
          <FormStack onSubmit={onChangePassword}>
            <Field label={t("settings.currentPassword")} type="password" name="current" required autoComplete="current-password" />
            <Field
              label={t("users.newPassword")}
              type="password"
              name="next"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
            <div>
              <Button type="submit">{t("settings.changePassword")}</Button>
            </div>
          </FormStack>
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
