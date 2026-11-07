import { useI18n } from "@client/context/i18n";
import { useAuth, useAuthMutation } from "@client/context/auth";
import { api, errorCode } from "@client/api";
import { AuthActions, AuthShell } from "@client/pages/login/AuthShell";
import { submitWith, useAppForm } from "@client/components/form";
import { FormStack, Message } from "@client/components/ui";

// Step 2: pick who you are and enter your own password.
export function ChooseUser() {
  const { t } = useI18n();
  const { status } = useAuth();
  const users = status.stage === "workspace" ? status.users : [];
  const login = useAuthMutation((json: { userId: string; password: string }) => api.auth["user-login"].$post({ json }));
  const logout = useAuthMutation(() => api.auth.logout.$post());
  const form = useAppForm({
    defaultValues: { userId: "", password: "" },
    // A failure is shown from login.error; on success the router moves on to the app.
    onSubmit: ({ value }) => login.mutateAsync(value).catch(() => {}),
  });

  return (
    <AuthShell title={t("auth.chooseUserTitle")} isLoading={login.isPending || logout.isPending}>
      <FormStack onSubmit={submitWith(form)}>
        <Message error={errorCode(login.error ?? logout.error)} />
        <form.AppField name="userId">
          {field => (
            <field.SelectField
              label={t("auth.user")}
              isRequired
              placeholder={t("auth.selectUser")}
              options={users.map(u => ({ id: u.id, label: u.name }))}
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {field => <field.TextField label={t("auth.password")} type="password" required autoComplete="current-password" />}
        </form.AppField>
        <AuthActions
          forward={{ label: t("auth.login") }}
          back={{ label: t("auth.logout"), onPress: () => logout.mutate() }}
        />
      </FormStack>
    </AuthShell>
  );
}
