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

const linkClass =
  "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 md:px-4 text-base font-medium text-muted outline-none transition-colors duration-500 hover:bg-default hover:text-foreground focus-visible:bg-default focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-focus";
const activeClass = "!bg-accent !text-accent-foreground";

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
                  <Icon className="size-5 shrink-0" />
                  <span className="sr-only md:not-sr-only">{t(label)}</span>
                </Link>
              ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Tooltip delay={300}>
              <Button isIconOnly variant="ghost" aria-label={t(`theme.${nextTheme}`)} onPress={() => setTheme(nextTheme)}>
                {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
              <Tooltip.Content>{t(`theme.${nextTheme}`)}</Tooltip.Content>
            </Tooltip>
            <Link to="/settings" className="hidden items-center gap-2 sm:flex" aria-label={user.name}>
              <Avatar>
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
