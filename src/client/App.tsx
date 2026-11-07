import { useEffect } from "react";
import { RouterProvider } from "@tanstack/react-router";
import { Toast } from "@heroui/react";
import "@client/index.css";
import { router } from "@client/router";
import { useAuth } from "@client/context/auth";

export function App() {
  const { status } = useAuth();

  // Logging in or out changes which routes are allowed, so re-run the route guards.
  useEffect(() => {
    router.invalidate();
  }, [status]);

  return (
    <>
      <RouterProvider router={router} context={{ auth: status }} />
      {/* Toasts confirming changes (see utils/notify.ts) show in the top left corner. */}
      <Toast.Provider placement="top start" />
    </>
  );
}

export default App;
