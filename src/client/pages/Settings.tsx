import { languages, useI18n, type Language } from "@client/context/i18n";
import { themes, useTheme } from "@client/context/theme";
import { useAuth, useCurrentUser } from "@client/context/auth";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { api, call, text } from "@client/api";
import { useState, type FormEvent } from "react";

// Language names are shown in their own language, so they are not translated.
const languageNames: Record<Language, string> = {
  en: "English",
  ru: "Русский",
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
      <h1>{t("nav.settings")}</h1>

      <fieldset className="settings-group">
        <legend>{t("settings.account")}</legend>
        <p>{t("settings.loggedInAs", { name: user.name, role: t(`role.${user.role}`) })}</p>
        <button type="button" onClick={() => send(api.auth["switch-user"].$post())}>
          {t("settings.switchUser")}
        </button>
        <button type="button" onClick={() => send(api.auth.logout.$post())}>
          {t("auth.logout")}
        </button>
      </fieldset>

      <fieldset className="settings-group">
        <legend>{t("settings.changePassword")}</legend>
        <form onSubmit={onChangePassword} className="transaction-form">
          <label>
            {t("settings.currentPassword")}
            <input type="password" name="current" required autoComplete="current-password" />
          </label>
          <label>
            {t("users.newPassword")}
            <input type="password" name="next" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
          </label>
          <button type="submit">{t("settings.changePassword")}</button>
          {error && <p className="error">{t(error)}</p>}
          {changed && <p className="success">{t("users.passwordChanged")}</p>}
        </form>
      </fieldset>

      <fieldset className="settings-group">
        <legend>{t("settings.theme")}</legend>
        {themes.map(th => (
          <label key={th}>
            <input type="radio" name="theme" checked={th === theme} onChange={() => setTheme(th)} />
            {t(`theme.${th}`)}
          </label>
        ))}
      </fieldset>

      <fieldset className="settings-group">
        <legend>{t("settings.language")}</legend>
        {(Object.keys(languages) as Language[]).map(l => (
          <label key={l}>
            <input type="radio" name="language" checked={l === language} onChange={() => setLanguage(l)} />
            {languageNames[l]}
          </label>
        ))}
      </fieldset>
    </>
  );
}
