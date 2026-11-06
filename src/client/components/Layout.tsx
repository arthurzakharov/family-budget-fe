import { Link, Outlet, type LinkProps } from "@tanstack/react-router";
import { useI18n, type TranslationKey } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";

type NavItem = { to: NonNullable<LinkProps["to"]>; label: TranslationKey; adminOnly?: boolean };

const navItems: NavItem[] = [
  { to: "/", label: "nav.home" },
  { to: "/crypto", label: "nav.crypto" },
  { to: "/deposit", label: "nav.deposit" },
  { to: "/expenses", label: "nav.expenses" },
  { to: "/users", label: "nav.users", adminOnly: true },
  { to: "/groups", label: "nav.groups", adminOnly: true },
  { to: "/settings", label: "nav.settings" },
];

export function Layout() {
  const { t } = useI18n();
  const user = useCurrentUser();

  return (
    <>
      <nav>
        {navItems
          .filter(item => !item.adminOnly || user.role === "admin")
          .map(item => (
            <Link key={item.to} to={item.to} activeProps={{ className: "active" }} activeOptions={{ exact: item.to === "/" }}>
              {t(item.label)}
            </Link>
          ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
