// Forwards /api/* to family-budget-be, so the browser only ever talks to this server.
// The backend's session cookie then belongs to this site (first-party): browsers that
// block or partition third-party cookies (Safari, Firefox) still keep the user logged in.

const PREFIX = "/api";

// Hop-by-hop headers and ones fetch() sets itself; never forwarded.
const DROPPED_REQUEST_HEADERS = ["host", "connection", "keep-alive", "transfer-encoding", "content-length", "accept-encoding"];

// fetch() has already decompressed the body, so the original encoding and length no longer apply.
const DROPPED_RESPONSE_HEADERS = ["connection", "keep-alive", "transfer-encoding", "content-encoding", "content-length"];

// `apiUrl` is the backend's base URL, e.g. https://family-budget-be.onrender.com
export function createApiProxy(apiUrl: string) {
  const base = new URL(apiUrl);
  const basePath = base.pathname.replace(/\/$/, "");

  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    // /api/auth/login?x=1 -> <apiUrl>/auth/login?x=1
    const target = new URL(base);
    target.pathname = basePath + (url.pathname.slice(PREFIX.length) || "/");
    target.search = url.search;

    const headers = new Headers(req.headers);
    for (const name of DROPPED_REQUEST_HEADERS) headers.delete(name);
    // Lets the backend log the real client; it does not rely on these for access checks.
    headers.set("x-forwarded-host", url.host);
    headers.set("x-forwarded-proto", url.protocol.replace(":", ""));

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    let res: Response;
    try {
      res = await fetch(target, {
        method: req.method,
        headers,
        body: hasBody ? await req.arrayBuffer() : undefined,
        redirect: "manual",
      });
    } catch {
      // Same shape as the backend's errors, so the browser handles it the same way.
      return Response.json(
        { error: "Bad Gateway", code: "errors.unavailable", requestId: crypto.randomUUID() },
        { status: 502 },
      );
    }

    const out = new Headers(res.headers);
    for (const name of DROPPED_RESPONSE_HEADERS) out.delete(name);
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: out });
  };
}
