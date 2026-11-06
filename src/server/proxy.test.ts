import { afterAll, expect, test } from "bun:test";
import { createApiProxy } from "@server/proxy";

// A stand-in backend that echoes what it received.
const backend = Bun.serve({
  port: 0,
  async fetch(req) {
    const url = new URL(req.url);
    const headers = new Headers({ "content-type": "application/json" });
    headers.append("set-cookie", "session=abc; HttpOnly; Path=/");
    headers.append("set-cookie", "other=1; Path=/");
    return new Response(
      JSON.stringify({
        method: req.method,
        path: url.pathname,
        search: url.search,
        cookie: req.headers.get("cookie"),
        origin: req.headers.get("origin"),
        host: req.headers.get("host"),
        forwardedHost: req.headers.get("x-forwarded-host"),
        body: await req.text(),
      }),
      { status: url.pathname === "/missing" ? 404 : 200, headers },
    );
  },
});

afterAll(() => backend.stop(true));

const proxy = createApiProxy(backend.url.href);

test("strips /api and forwards method, query, body, cookie and origin", async () => {
  const res = await proxy(
    new Request("https://app.example.com/api/auth/login?x=1", {
      method: "POST",
      headers: { cookie: "session=old", origin: "https://app.example.com", "content-type": "application/json" },
      body: JSON.stringify({ email: "a@b.c" }),
    }),
  );
  const echo = await res.json();
  expect(echo).toMatchObject({
    method: "POST",
    path: "/auth/login",
    search: "?x=1",
    cookie: "session=old",
    origin: "https://app.example.com",
    forwardedHost: "app.example.com",
    body: JSON.stringify({ email: "a@b.c" }),
  });
  // The backend sees its own host, not the frontend's.
  expect(echo.host).toBe(backend.url.host);
});

test("passes back status and every Set-Cookie header", async () => {
  const res = await proxy(new Request("https://app.example.com/api/missing"));
  expect(res.status).toBe(404);
  expect(res.headers.getSetCookie()).toEqual(["session=abc; HttpOnly; Path=/", "other=1; Path=/"]);
});

test("keeps a path prefix in the backend URL", async () => {
  const res = await createApiProxy(`${backend.url.origin}/v1/`)(new Request("https://app.example.com/api/health"));
  expect((await res.json()).path).toBe("/v1/health");
});

test("answers 502 errors.unavailable when the backend is down", async () => {
  const res = await createApiProxy("http://127.0.0.1:1")(new Request("https://app.example.com/api/health"));
  expect(res.status).toBe(502);
  expect(await res.json()).toMatchObject({ code: "errors.unavailable" });
});
