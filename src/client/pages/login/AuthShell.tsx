import { createContext, useContext, type ReactNode } from "react";
import { Button, Card, Spinner } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import { useTheme } from "@client/context/theme";
import logoLight from "@client/assets/logos/familienbudget-light.svg";
import logoDark from "@client/assets/logos/familienbudget-dark.svg";

// True while the card's request is running; AuthActions reads it to disable its buttons.
const LoadingContext = createContext(false);

// The centred card the login and sign-up steps are shown in. While `isLoading`, the card is
// covered by a spinner and its contents are inert (no clicks, typing, or Enter to resubmit).
export function AuthShell({
  title,
  description,
  isLoading = false,
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  isLoading?: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const { theme } = useTheme();
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_30rem_at_50%_-10%,var(--color-accent-soft),transparent)]"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <img src={theme === "dark" ? logoDark : logoLight} alt={t("auth.welcome")} className="size-20" />
        </div>
        <Card className="relative p-4" aria-busy={isLoading}>
          <Card.Header className="mb-4 items-center text-center">
            <Card.Title className="text-xl">{title}</Card.Title>
            {description && <Card.Description className="mt-2">{description}</Card.Description>}
          </Card.Header>
          <Card.Content inert={isLoading}>
            <LoadingContext value={isLoading}>{children}</LoadingContext>
          </Card.Content>
          {isLoading && (
            <div
              role="status"
              className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-surface/60 backdrop-blur-[2px]"
            >
              <Spinner size="lg" />
              <span className="sr-only">{t("common.loading")}</span>
            </div>
          )}
        </Card>
      </div>
    </main>
  );
}

type AuthAction = { label: ReactNode; onPress?: () => void };

// The two buttons at the bottom of every auth step: a filled one that moves forward and a
// secondary one that goes back or cancels. Same width, same spacing on every step.
// `forward` submits the surrounding form unless it is given its own onPress.
// Both are disabled while the surrounding AuthShell is loading.
export function AuthActions({ forward, back }: { forward: AuthAction; back: AuthAction }) {
  const isLoading = useContext(LoadingContext);
  return (
    <div className="flex flex-col gap-2">
      <Button fullWidth type={forward.onPress ? "button" : "submit"} onPress={forward.onPress} isDisabled={isLoading}>
        {forward.label}
      </Button>
      <Button fullWidth variant="secondary" onPress={back.onPress} isDisabled={isLoading}>
        {back.label}
      </Button>
    </div>
  );
}
