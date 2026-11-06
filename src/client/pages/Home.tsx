import type { ComponentType, SVGProps } from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Card } from "@heroui/react";
import { ChartLine, Folder, Gear, Persons, Receipt, Vault } from "@gravity-ui/icons";
import { useI18n, type TranslationKey } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { PageHeader } from "@client/components/ui";

type Shortcut = {
  to: NonNullable<LinkProps["to"]>;
  label: TranslationKey;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
};

const shortcuts: Shortcut[] = [
  { to: "/crypto", label: "nav.crypto", icon: ChartLine },
  { to: "/deposit", label: "nav.deposit", icon: Vault },
  { to: "/expenses", label: "nav.expenses", icon: Receipt },
  { to: "/users", label: "nav.users", icon: Persons, adminOnly: true },
  { to: "/groups", label: "nav.groups", icon: Folder, adminOnly: true },
  { to: "/settings", label: "nav.settings", icon: Gear },
];

export function Home() {
  const { t } = useI18n();
  const user = useCurrentUser();
  return (
    <>
      <PageHeader title={t("nav.home")} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shortcuts
          .filter(s => !s.adminOnly || user.role === "admin")
          .map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} className="group rounded-3xl focus-visible:outline-2 focus-visible:outline-accent">
              <Card className="h-full transition-colors group-hover:bg-default">
                <Card.Content className="flex-row items-center gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent">
                    <Icon className="size-6" />
                  </span>
                  <span className="text-lg font-medium">{t(label)}</span>
                </Card.Content>
              </Card>
            </Link>
          ))}
      </div>
    </>
  );
}
