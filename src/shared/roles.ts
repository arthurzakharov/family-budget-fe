import type { Role } from "@arthurzakharov/family-budget-be-client";

// admin: the workspace's creator, its only admin. Manages users and groups and fixes records,
//        but never belongs to a group or has records under their own name.
// contributor: adds and changes records.
// viewer: can only look.
export const roles: Role[] = ["admin", "contributor", "viewer"];

// Viewers can only look; admins and contributors can add and change records.
export const canEdit = (user: { role: Role }) => user.role !== "viewer";
