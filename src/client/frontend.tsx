import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@client/App";
import { I18nProvider } from "@client/context/i18n";
import { ThemeProvider } from "@client/context/theme";
import { AuthProvider } from "@client/context/auth";

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <App />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>
);

// https://bun.com/docs/bundler/hot-reloading#import-meta-hot-data
(import.meta.hot.data.root ??= createRoot(elem)).render(app);
