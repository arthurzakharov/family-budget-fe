// Serves src/client/assets/favicons at stable URLs (/favicons/<light|dark>/<file>, plus /favicon.ico).
// index.html links its icons through the bundler (hashed URLs), but the bundler does not rewrite
// the paths inside site.webmanifest, and browsers request /favicon.ico on their own; both need
// fixed URLs, which these routes provide.

const DIR = new URL("../client/assets/favicons/", import.meta.url);

const VARIANTS = ["light", "dark"];
const FILES = [
  "android-chrome-192x192.png",
  "android-chrome-512x512.png",
  "apple-touch-icon.png",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "favicon.ico",
  "site.webmanifest",
];

const CACHE_CONTROL = "public, max-age=86400";

function serve(variant: string, file: string): Response {
  const headers: Record<string, string> = { "cache-control": CACHE_CONTROL };
  if (file.endsWith(".webmanifest")) headers["content-type"] = "application/manifest+json";
  return new Response(Bun.file(new URL(`${variant}/${file}`, DIR)), { headers });
}

export const faviconRoutes = {
  "/favicon.ico": () => serve("light", "favicon.ico"),
  "/favicons/:variant/:file": (req: Bun.BunRequest<"/favicons/:variant/:file">) => {
    const { variant, file } = req.params;
    // Only the known files: the params never reach the file system otherwise.
    if (!VARIANTS.includes(variant) || !FILES.includes(file)) return new Response("Not found", { status: 404 });
    return serve(variant, file);
  },
};
