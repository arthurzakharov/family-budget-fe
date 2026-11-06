import type { FormEvent } from "react";
import { useI18n } from "@client/context/i18n";
import { useAuth } from "@client/context/auth";
import { api, text } from "@client/api";
import { AuthActions, AuthShell, useAuthRequest } from "@client/pages/login/AuthShell";
import { Field, FormStack, Message, SelectField } from "@client/components/ui";

// Step 2: pick who you are and enter your own password.
export function ChooseUser() {
  const { t } = useI18n();
  const { status } = useAuth();
  const users = status.stage === "workspace" ? status.users : [];
  const { isLoading, error, submit } = useAuthRequest();

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await submit(() => api.auth["user-login"].$post({ json: { userId: text(data, "userId"), password: text(data, "password") } }));
  };

  return (
    <AuthShell title={t("auth.chooseUserTitle")} isLoading={isLoading}>
      <FormStack onSubmit={onSubmit}>
        <Message error={error} />
        <SelectField
          label={t("auth.user")}
          name="userId"
          isRequired
          placeholder={t("auth.selectUser")}
          options={users.map(u => ({ id: u.id, label: u.name }))}
        />
        <Field label={t("auth.password")} type="password" name="password" required autoComplete="current-password" />
        <AuthActions
          forward={{ label: t("auth.login") }}
          back={{ label: t("auth.logout"), onPress: () => submit(() => api.auth.logout.$post()) }}
        />
      </FormStack>
    </AuthShell>
  );
}
