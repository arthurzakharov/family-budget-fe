import { useState, type FormEvent } from "react";
import { useI18n } from "@client/context/i18n";
import { useAuth } from "@client/context/auth";
import { api } from "@client/api";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";

type Step = "start" | "login" | "signupWorkspace" | "signupUser";

type Workspace = { email: string; password: string };

// Everything before a user is picked: choose log in or sign up, then the matching forms.
// The "who are you?" step after logging in to the workspace is ChooseUser.
export function Login() {
  const { t } = useI18n();
  const { send } = useAuth();
  const [step, setStep] = useState<Step>("start");
  // Sign up is sent in one request at the end, so nothing is saved halfway.
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = (next: Step) => {
    setError(null);
    setStep(next);
  };

  const formData = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    return Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
  };

  const onLogin = async (e: FormEvent<HTMLFormElement>) => {
    const { email, password } = formData(e);
    setError(await send(api.auth.login.$post({ json: { email: email ?? "", password: password ?? "" } })));
  };

  const onWorkspace = (e: FormEvent<HTMLFormElement>) => {
    const { email, password } = formData(e);
    setWorkspace({ email: email!, password: password! });
    go("signupUser");
  };

  const onRootUser = async (e: FormEvent<HTMLFormElement>) => {
    const { name, userPassword } = formData(e);
    if (!workspace) return go("signupWorkspace");
    setError(await send(api.auth.signup.$post({ json: { ...workspace, name: name ?? "", userPassword: userPassword ?? "" } })));
  };

  // Each step uses key={step} so React creates fresh inputs instead of reusing
  // the previous step's ones (which would keep the values typed there).
  if (step === "start") {
    return (
      <main key={step} className="auth">
        <h1>{t("auth.welcome")}</h1>
        <div className="transaction-form">
          <button type="button" onClick={() => go("login")}>
            {t("auth.login")}
          </button>
          <button type="button" onClick={() => go("signupWorkspace")}>
            {t("auth.signup")}
          </button>
        </div>
      </main>
    );
  }

  const back = (to: Step) => (
    <button type="button" onClick={() => go(to)}>
      {t("auth.back")}
    </button>
  );

  if (step === "login") {
    return (
      <main key={step} className="auth">
        <h1>{t("auth.loginTitle")}</h1>
        <form onSubmit={onLogin} className="transaction-form">
          <label>
            {t("auth.email")}
            <input type="email" name="email" required autoComplete="username" />
          </label>
          <label>
            {t("auth.workspacePassword")}
            <input type="password" name="password" required autoComplete="current-password" />
          </label>
          <button type="submit">{t("auth.login")}</button>
          {back("start")}
          {error && <p className="error">{t(error)}</p>}
        </form>
      </main>
    );
  }

  if (step === "signupWorkspace") {
    return (
      <main key={step} className="auth">
        <h1>{t("auth.signupWorkspaceTitle")}</h1>
        <p>{t("auth.signupWorkspaceHint")}</p>
        <form onSubmit={onWorkspace} className="transaction-form">
          <label>
            {t("auth.email")}
            <input type="email" name="email" required autoComplete="username" defaultValue={workspace?.email} />
          </label>
          <label>
            {t("auth.workspacePassword")}
            <input
              type="password"
              name="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
              defaultValue={workspace?.password}
            />
          </label>
          <button type="submit">{t("auth.next")}</button>
          {back("start")}
        </form>
      </main>
    );
  }

  return (
    <main key={step} className="auth">
      <h1>{t("auth.signupUserTitle")}</h1>
      <p>{t("auth.signupUserHint")}</p>
      <form onSubmit={onRootUser} className="transaction-form">
        <label>
          {t("auth.yourName")}
          <input type="text" name="name" required autoComplete="off" />
        </label>
        <label>
          {t("auth.yourPassword")}
          <input type="password" name="userPassword" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" />
        </label>
        <button type="submit">{t("auth.signup")}</button>
        {back("signupWorkspace")}
        {error && <p className="error">{t(error)}</p>}
      </form>
    </main>
  );
}
