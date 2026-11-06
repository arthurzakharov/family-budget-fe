import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Outlet,
  redirect,
} from "@tanstack/react-router";
import { Layout } from "@client/components/Layout";
import { Home } from "@client/pages/Home";
import { Crypto } from "@client/pages/crypto/Crypto";
import { General as CryptoGeneral } from "@client/pages/crypto/General";
import { GroupTab as CryptoGroupTab } from "@client/pages/crypto/GroupTab";
import { Manage as CryptoManage } from "@client/pages/crypto/Manage";
import { Coins } from "@client/pages/crypto/Coins";
import { Expenses } from "@client/pages/expenses/Expenses";
import { General as ExpensesGeneral } from "@client/pages/expenses/General";
import { GroupTab as ExpensesGroupTab } from "@client/pages/expenses/GroupTab";
import { Manage as ExpensesManage } from "@client/pages/expenses/Manage";
import { Categories } from "@client/pages/expenses/Categories";
import { Deposit } from "@client/pages/deposit/Deposit";
import { General } from "@client/pages/deposit/General";
import { GroupTab } from "@client/pages/deposit/GroupTab";
import { Manage } from "@client/pages/deposit/Manage";
import { canOpenGroupTab } from "@client/utils/access";
import { api, call } from "@client/api";
import { canEdit } from "@shared/roles";
import { Settings } from "@client/pages/Settings";
import { Users } from "@client/pages/Users";
import { Groups } from "@client/pages/Groups";
import { Login } from "@client/pages/Login";
import { ChooseUser } from "@client/pages/ChooseUser";
import type { AuthStatus } from "@arthurzakharov/family-budget-be-client";

// The router reads who is logged in from here; App passes the current auth status in.
type RouterContext = { auth: AuthStatus };

const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: Outlet,
});

// Login screens: only reachable while the matching login step is pending.

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: ({ context }) => {
    if (context.auth.stage === "workspace") throw redirect({ to: "/choose-user" });
    if (context.auth.stage === "user") throw redirect({ to: "/" });
  },
  component: Login,
});

const chooseUserRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/choose-user",
  beforeLoad: ({ context }) => {
    if (context.auth.stage === "none") throw redirect({ to: "/login" });
    if (context.auth.stage === "user") throw redirect({ to: "/" });
  },
  component: ChooseUser,
});

// Everything under here needs a logged-in user; anyone else is sent to the login step they are at.
const protectedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "protected",
  beforeLoad: ({ context }) => {
    if (context.auth.stage === "none") throw redirect({ to: "/login" });
    if (context.auth.stage === "workspace") throw redirect({ to: "/choose-user" });
  },
  component: Layout,
});

// Admin-only pages; other users are sent home.
const adminRoute = createRoute({
  getParentRoute: () => protectedRoute,
  id: "admin",
  beforeLoad: ({ context }) => {
    if (context.auth.stage !== "user" || context.auth.user.role !== "admin") throw redirect({ to: "/" });
  },
});

const homeRoute = createRoute({ getParentRoute: () => protectedRoute, path: "/", component: Home });
const cryptoRoute = createRoute({ getParentRoute: () => protectedRoute, path: "/crypto", component: Crypto });
const expensesRoute = createRoute({ getParentRoute: () => protectedRoute, path: "/expenses", component: Expenses });
const depositRoute = createRoute({ getParentRoute: () => protectedRoute, path: "/deposit", component: Deposit });

// Shared by the deposit and crypto tabs.

// A group's tab: only for groups that exist and have a tab for this user; otherwise home.
async function groupTabGuard({ context, params }: { context: RouterContext; params: { groupId: string } }) {
  if (context.auth.stage !== "user" || !canOpenGroupTab(context.auth.user, params.groupId)) {
    throw redirect({ to: "/" });
  }
  const result = await call(api.groups.$get());
  if (!result.ok || !result.data.some(g => g.id === params.groupId)) throw redirect({ to: "/" });
}

// Adding and changing records: not for viewers.
function editorGuard({ context }: { context: RouterContext }) {
  if (context.auth.stage !== "user" || !canEdit(context.auth.user)) throw redirect({ to: "/" });
}

// Admin-only tabs.
function adminGuard({ context }: { context: RouterContext }) {
  if (context.auth.stage !== "user" || context.auth.user.role !== "admin") throw redirect({ to: "/" });
}

// Deposit tabs
const depositGeneralRoute = createRoute({ getParentRoute: () => depositRoute, path: "/", component: General });
const depositGroupRoute = createRoute({
  getParentRoute: () => depositRoute,
  path: "/groups/$groupId",
  beforeLoad: groupTabGuard,
  component: GroupTab,
});
const depositManageRoute = createRoute({
  getParentRoute: () => depositRoute,
  path: "/manage",
  beforeLoad: editorGuard,
  component: Manage,
});

// Crypto tabs: the same as the deposit's, plus the admin's coin list.
const cryptoGeneralRoute = createRoute({ getParentRoute: () => cryptoRoute, path: "/", component: CryptoGeneral });
const cryptoGroupRoute = createRoute({
  getParentRoute: () => cryptoRoute,
  path: "/groups/$groupId",
  beforeLoad: groupTabGuard,
  component: CryptoGroupTab,
});
const cryptoManageRoute = createRoute({
  getParentRoute: () => cryptoRoute,
  path: "/manage",
  beforeLoad: editorGuard,
  component: CryptoManage,
});
const cryptoCoinsRoute = createRoute({
  getParentRoute: () => cryptoRoute,
  path: "/coins",
  beforeLoad: adminGuard,
  component: Coins,
});

// Expenses tabs: the same as the deposit's, plus the admin's category lists.
const expensesGeneralRoute = createRoute({ getParentRoute: () => expensesRoute, path: "/", component: ExpensesGeneral });
const expensesGroupRoute = createRoute({
  getParentRoute: () => expensesRoute,
  path: "/groups/$groupId",
  beforeLoad: groupTabGuard,
  component: ExpensesGroupTab,
});
const expensesManageRoute = createRoute({
  getParentRoute: () => expensesRoute,
  path: "/manage",
  beforeLoad: editorGuard,
  component: ExpensesManage,
});
const expensesCategoriesRoute = createRoute({
  getParentRoute: () => expensesRoute,
  path: "/categories",
  beforeLoad: adminGuard,
  component: Categories,
});

const settingsRoute = createRoute({ getParentRoute: () => protectedRoute, path: "/settings", component: Settings });
const usersRoute = createRoute({ getParentRoute: () => adminRoute, path: "/users", component: Users });
const groupsRoute = createRoute({ getParentRoute: () => adminRoute, path: "/groups", component: Groups });

// Unknown paths go home, which in turn sends logged-out visitors to the login screen.
const notFoundRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "$",
  beforeLoad: () => {
    throw redirect({ to: "/" });
  },
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  chooseUserRoute,
  protectedRoute.addChildren([
    homeRoute,
    cryptoRoute.addChildren([cryptoGeneralRoute, cryptoGroupRoute, cryptoManageRoute, cryptoCoinsRoute]),
    expensesRoute.addChildren([expensesGeneralRoute, expensesGroupRoute, expensesManageRoute, expensesCategoriesRoute]),
    depositRoute.addChildren([depositGeneralRoute, depositGroupRoute, depositManageRoute]),
    settingsRoute,
    adminRoute.addChildren([usersRoute, groupsRoute]),
  ]),
  notFoundRoute,
]);

export const router = createRouter({
  routeTree,
  // Replaced by App with the real status on every render.
  context: { auth: { stage: "none" } },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
