import { useState } from "react";
import { useI18n } from "@client/context/i18n";
import { useAuthMutation } from "@client/context/auth";
import { api, errorCode } from "@client/api";
import { MIN_PASSWORD_LENGTH } from "@shared/validation";
import { AuthActions, AuthShell } from "@client/pages/login/AuthShell";
import { submitWith, useAppForm } from "@client/components/form";
import { FormStack, Message } from "@client/components/ui";

type Step = "start" | "login" | "signupWorkspace" | "signupUser";

type Workspace = { email: string; password: string };

// Everything before a user is picked: choose log in or sign up, then the matching forms.
// The "who are you?" step after logging in to the workspace is ChooseUser.
export function Login() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>("start");
  // Sign up is sent in one request at the end, so nothing is saved halfway.
  const [workspace, setWorkspace] = useState<Workspace | null>(null);

  // Each step is its own component with its own form, so going back and forth starts each
  // step with fresh values (except the workspace, which is kept for going back to it).
  if (step === "start") {
    return (
      <AuthShell title={t("auth.welcome")}>
        <AuthActions
          forward={{ label: t("auth.login"), onPress: () => setStep("login") }}
          back={{ label: t("auth.signup"), onPress: () => setStep("signupWorkspace") }}
        />
      </AuthShell>
    );
  }

  if (step === "login") return <LoginStep onBack={() => setStep("start")} />;

  if (step === "signupWorkspace" || !workspace) {
    return (
      <WorkspaceStep
        initial={workspace}
        onNext={ws => {
          setWorkspace(ws);
          setStep("signupUser");
        }}
        onBack={() => setStep("start")}
      />
    );
  }

  return <RootUserStep workspace={workspace} onBack={() => setStep("signupWorkspace")} />;
}

function LoginStep({ onBack }: { onBack: () => void }) {
  const { t } = useI18n();
  const login = useAuthMutation((json: Workspace) => api.auth.login.$post({ json }));
  const form = useAppForm({
    defaultValues: { email: "", password: "" },
    // A failure is shown from login.error; on success the router moves on to the next step.
    onSubmit: ({ value }) => login.mutateAsync(value).catch(() => {}),
  });

  return (
    <AuthShell title={t("auth.loginTitle")} isLoading={login.isPending}>
      <FormStack onSubmit={submitWith(form)}>
        <Message error={errorCode(login.error)} />
        <form.AppField name="email">
          {field => <field.TextField label={t("auth.email")} type="email" required autoComplete="username" />}
        </form.AppField>
        <form.AppField name="password">
          {field => (
            <field.TextField label={t("auth.workspacePassword")} type="password" required autoComplete="current-password" />
          )}
        </form.AppField>
        <AuthActions forward={{ label: t("auth.login") }} back={{ label: t("auth.back"), onPress: onBack }} />
      </FormStack>
    </AuthShell>
  );
}

function WorkspaceStep({
  initial,
  onNext,
  onBack,
}: {
  initial: Workspace | null;
  onNext: (workspace: Workspace) => void;
  onBack: () => void;
}) {
  const { t } = useI18n();
  const form = useAppForm({
    defaultValues: initial ?? { email: "", password: "" },
    onSubmit: ({ value }) => onNext(value),
  });

  return (
    <AuthShell title={t("auth.signupWorkspaceTitle")} description={t("auth.signupWorkspaceHint")}>
      <FormStack onSubmit={submitWith(form)}>
        <form.AppField name="email">
          {field => <field.TextField label={t("auth.email")} type="email" required autoComplete="username" />}
        </form.AppField>
        <form.AppField name="password">
          {field => (
            <field.TextField
              label={t("auth.workspacePassword")}
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          )}
        </form.AppField>
        <AuthActions forward={{ label: t("auth.next") }} back={{ label: t("auth.back"), onPress: onBack }} />
      </FormStack>
    </AuthShell>
  );
}

function RootUserStep({ workspace, onBack }: { workspace: Workspace; onBack: () => void }) {
  const { t } = useI18n();
  const signup = useAuthMutation((json: Workspace & { name: string; userPassword: string }) =>
    api.auth.signup.$post({ json }),
  );
  const form = useAppForm({
    defaultValues: { name: "", userPassword: "" },
    // A failure is shown from signup.error; on success the router moves on to the app.
    onSubmit: ({ value }) => signup.mutateAsync({ ...workspace, ...value }).catch(() => {}),
  });

  return (
    <AuthShell title={t("auth.signupUserTitle")} description={t("auth.signupUserHint")} isLoading={signup.isPending}>
      <FormStack onSubmit={submitWith(form)}>
        <Message error={errorCode(signup.error)} />
        <form.AppField name="name">
          {field => <field.TextField label={t("auth.yourName")} type="text" required autoComplete="off" />}
        </form.AppField>
        <form.AppField name="userPassword">
          {field => (
            <field.TextField
              label={t("auth.yourPassword")}
              type="password"
              required
              minLength={MIN_PASSWORD_LENGTH}
              autoComplete="new-password"
            />
          )}
        </form.AppField>
        <AuthActions forward={{ label: t("auth.signup") }} back={{ label: t("auth.back"), onPress: onBack }} />
      </FormStack>
    </AuthShell>
  );
}
