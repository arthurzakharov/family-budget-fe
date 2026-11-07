import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { App } from "@client/App";
import { queryClient } from "@client/queries";
import { I18nProvider } from "@client/context/i18n";
import { ThemeProvider } from "@client/context/theme";
import { AuthProvider } from "@client/context/auth";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
