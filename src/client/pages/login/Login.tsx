import { useState, type FormEvent } from "react";
import { useI18n } from "@client/context/i18n";
import { api } from "@client/api";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { AuthActions, AuthShell, useAuthRequest } from "@client/pages/login/AuthShell";
import { Field, FormStack, Message } from "@client/components/ui";

type Step = "start" | "login" | "signupWorkspace" | "signupUser";

type Workspace = { email: string; password: string };

// Everything before a user is picked: choose log in or sign up, then the matching forms.
// The "who are you?" step after logging in to the workspace is ChooseUser.
export function Login() {
  const { t } = useI18n();
  const { isLoading, error, setError, submit } = useAuthRequest();
  const [step, setStep] = useState<Step>("start");
  // Sign up is sent in one request at the end, so nothing is saved halfway.
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

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
    await submit(() => api.auth.login.$post({ json: { email: email ?? "", password: password ?? "" } }));
  };

  const onWorkspace = (e: FormEvent<HTMLFormElement>) => {
    const { email, password } = formData(e);
    setWorkspace({ email: email!, password: password! });
    go("signupUser");
  };

  const onRootUser = async (e: FormEvent<HTMLFormElement>) => {
    const { name, userPassword } = formData(e);
    if (!workspace) return go("signupWorkspace");
    await submit(() => api.auth.signup.$post({ json: { ...workspace, name: name ?? "", userPassword: userPassword ?? "" } }));
  };

  // Each step uses key={step} so React creates fresh inputs instead of reusing
  // the previous step's ones (which would keep the values typed there).
  if (step === "start") {
    return (
      <AuthShell key={step} title={t("auth.welcome")}>
        <AuthActions
          forward={{ label: t("auth.login"), onPress: () => go("login") }}
          back={{ label: t("auth.signup"), onPress: () => go("signupWorkspace") }}
        />
      </AuthShell>
    );
  }

  // The submit button plus "Back" to the given step.
  const actions = (label: string, to: Step) => (
    <AuthActions forward={{ label }} back={{ label: t("auth.back"), onPress: () => go(to) }} />
  );

  if (step === "login") {
    return (
      <AuthShell key={step} title={t("auth.loginTitle")} isLoading={isLoading}>
        <FormStack onSubmit={onLogin}>
          <Message error={error} />
          <Field label={t("auth.email")} type="email" name="email" required autoComplete="username" />
          <Field label={t("auth.workspacePassword")} type="password" name="password" required autoComplete="current-password" />
          {actions(t("auth.login"), "start")}
        </FormStack>
      </AuthShell>
    );
  }

  if (step === "signupWorkspace") {
    return (
      <AuthShell key={step} title={t("auth.signupWorkspaceTitle")} description={t("auth.signupWorkspaceHint")}>
        <FormStack onSubmit={onWorkspace}>
          <Field
            label={t("auth.email")}
            type="email"
            name="email"
            required
            autoComplete="username"
            defaultValue={workspace?.email}
          />
          <Field
            label={t("auth.workspacePassword")}
            type="password"
            name="password"
            required
            minLength={MIN_PASSWORD_LENGTH}
            autoComplete="new-password"
            defaultValue={workspace?.password}
          />
          {actions(t("auth.next"), "start")}
        </FormStack>
      </AuthShell>
    );
  }

  return (
    <AuthShell key={step} title={t("auth.signupUserTitle")} description={t("auth.signupUserHint")} isLoading={isLoading}>
      <FormStack onSubmit={onRootUser}>
        <Message error={error} />
        <Field label={t("auth.yourName")} type="text" name="name" required autoComplete="off" />
        <Field
          label={t("auth.yourPassword")}
          type="password"
          name="userPassword"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
        />
        {actions(t("auth.signup"), "signupWorkspace")}
      </FormStack>
    </AuthShell>
  );
}
