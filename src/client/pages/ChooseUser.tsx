import { useState, type FormEvent } from "react";
import { useI18n } from "@client/context/i18n";
import { useAuth } from "@client/context/auth";
import { api, text } from "@client/api";

// Step 2: pick who you are and enter your own password.
export function ChooseUser() {
  const { t } = useI18n();
  const { status, send } = useAuth();
  const users = status.stage === "workspace" ? status.users : [];
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setError(await send(api.auth["user-login"].$post({ json: { userId: text(data, "userId"), password: text(data, "password") } })));
  };

  return (
    <main className="auth">
      <h1>{t("auth.chooseUserTitle")}</h1>

      <form onSubmit={onSubmit} className="transaction-form">
        <label>
          {t("auth.user")}
          <select name="userId" required defaultValue="">
            <option value="" disabled>
              {t("auth.selectUser")}
            </option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("auth.password")}
          <input type="password" name="password" required autoComplete="current-password" />
        </label>
        <button type="submit">{t("auth.login")}</button>
        <button type="button" onClick={() => send(api.auth.logout.$post())}>
          {t("auth.logout")}
        </button>
        {error && <p className="error">{t(error)}</p>}
      </form>
    </main>
  );
}
