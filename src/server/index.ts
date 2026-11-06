import { serve } from "bun";
import index from "@client/index.html";
import { createApiProxy } from "@server/proxy";

// family-budget-be's base URL; every /api/* request is forwarded there.
const apiUrl = process.env.API_URL?.trim();
if (!apiUrl) {
  console.error("API_URL is not set: point it at family-budget-be, e.g. API_URL=http://localhost:3000");
  process.exit(1);
}

const server = serve({
  routes: {
    // Serve index.html for all routes; the client handles routing.
    "/*": index,
    "/api/*": createApiProxy(apiUrl),
  },

  development: process.env.NODE_ENV !== "production" && {
    hmr: true,
    console: true,
  },
});

console.log(`Server running at ${server.url}, proxying /api/* to ${apiUrl}`);
