import type { ComponentType, SVGProps } from "react";
import { Link, Outlet, type LinkProps } from "@tanstack/react-router";
import { Avatar, Button, Tooltip } from "@heroui/react";
import { ChartLine, Folder, Gear, House, Moon, Persons, Receipt, Sun, Vault } from "@gravity-ui/icons";
import { useI18n, type TranslationKey } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { useTheme } from "@client/context/theme";
import logoLight from "@client/assets/logos/familienbudget-light.svg";
import logoDark from "@client/assets/logos/familienbudget-dark.svg";

type NavItem = {
  to: NonNullable<LinkProps["to"]>;
  label: TranslationKey;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { to: "/", label: "nav.home", icon: House },
  { to: "/crypto", label: "nav.crypto", icon: ChartLine },
  { to: "/deposit", label: "nav.deposit", icon: Vault },
  { to: "/expenses", label: "nav.expenses", icon: Receipt },
  { to: "/users", label: "nav.users", icon: Persons, adminOnly: true },
  { to: "/groups", label: "nav.groups", icon: Folder, adminOnly: true },
  { to: "/settings", label: "nav.settings", icon: Gear },
];

// Every tab is an icon button; only the active tab, and the one under the pointer or keyboard
// focus, also shows its text. The label is always in the DOM (it names the link for screen
// readers) and slides open by animating its max-width.
const linkClass =
  "group flex shrink-0 items-center rounded-full px-2.5 py-1.5 text-sm font-medium text-muted outline-none transition-colors duration-500 hover:bg-default hover:text-foreground focus-visible:bg-default focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-focus";
const activeClass = "!bg-accent !text-accent-foreground";

const labelClass =
  "overflow-hidden whitespace-nowrap transition-[max-width,margin,opacity] duration-500 ease-in-out motion-reduce:transition-none";
const collapsed =
  "ml-0 max-w-0 opacity-0 group-hover:delay-200 group-hover:ml-2 group-hover:max-w-40 group-hover:opacity-100 group-focus-visible:ml-2 group-focus-visible:max-w-40 group-focus-visible:opacity-100";
const expanded = "ml-2 max-w-40 opacity-100";

export function Layout() {
  const { t } = useI18n();
  const user = useCurrentUser();
  const { theme, setTheme } = useTheme();
  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-separator bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex shrink-0 items-center" aria-label={t("auth.welcome")}>
            <img src={theme === "dark" ? logoDark : logoLight} alt="" className="size-14" />
          </Link>

          <nav className="-mx-1 -my-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 py-1">
            {navItems
              .filter(item => !item.adminOnly || user.role === "admin")
              .map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={linkClass}
                  activeProps={{ className: activeClass }}
                  activeOptions={{ exact: to === "/" }}
                >
                  {({ isActive }) => (
                    <>
                      <Icon className="size-4 shrink-0" />
                      <span className={`${labelClass} ${isActive ? expanded : collapsed}`}>{t(label)}</span>
                    </>
                  )}
                </Link>
              ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Tooltip delay={300}>
              <Button isIconOnly size="sm" variant="ghost" aria-label={t(`theme.${nextTheme}`)} onPress={() => setTheme(nextTheme)}>
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
              <Tooltip.Content>{t(`theme.${nextTheme}`)}</Tooltip.Content>
            </Tooltip>
            <Link to="/settings" className="hidden items-center gap-2 sm:flex" aria-label={user.name}>
              <Avatar size="sm">
                <Avatar.Fallback>{user.name.slice(0, 2).toUpperCase()}</Avatar.Fallback>
              </Avatar>
              <span className="hidden text-sm font-medium lg:inline">{user.name}</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
