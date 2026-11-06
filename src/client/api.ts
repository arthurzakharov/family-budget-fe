import type { ClientResponse } from "hono/client";
import { createFamilyBudgetClient, type ErrorResponse } from "@arthurzakharov/family-budget-be-client";

// The typed family-budget-be client. Requests go to this site's /api, which the Bun server
// forwards to the backend, so the session cookie is first-party and sent automatically.
export const api = createFamilyBudgetClient(`${location.origin}/api`);

// A finished request: the response body, or an error code (a translation key).
export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// Any response of `api`.
type AnyResponse = { ok: boolean; status: number; json(): Promise<unknown> };

// A request made with `api` whose successful answer is JSON of type T.
export type JsonRequest<T> = Promise<ClientResponse<T, number, "json">>;

// What a successful response holds; `null` for 204 No Content.
// (Inferred from json() alone: ClientResponse's own type parameter also shows up in text().)
type Data<R> = R extends { status: 204 } ? null : R extends { json(): Promise<infer T> } ? T : never;

// Sends a request made with `api` and reads its answer. Errors carry the backend's code;
// an unreachable backend gives errors.unavailable, anything else errors.unknown.
export async function call<R extends AnyResponse>(request: Promise<R>): Promise<Result<Data<R>>> {
  let res: R;
  try {
    res = await request;
  } catch {
    return { ok: false, error: "errors.unavailable" };
  }
  if (res.ok) {
    const data = res.status === 204 ? null : await res.json();
    return { ok: true, data: data as Data<R> };
  }
  const body = (await res.json().catch(() => null)) as Partial<ErrorResponse> | null;
  return { ok: false, error: body?.code ?? "errors.unknown" };
}

// Loads data that a page cannot show without; failures leave the current value as it is.
export async function load<R extends AnyResponse>(request: Promise<R>, set: (data: Data<R>) => void) {
  const result = await call(request);
  if (result.ok) set(result.data);
}

// A form field as text; missing fields are "".
export const text = (data: FormData, name: string) => {
  const value = data.get(name);
  return typeof value === "string" ? value : "";
};

// The admin's choice of user in record forms; other users have no such field.
export const chosenUser = (data: FormData) => text(data, "userId") || undefined;

// Euros typed into a form, as whole cents.
export const toCents = (euros: string) => Math.round(Number(euros) * 100);
