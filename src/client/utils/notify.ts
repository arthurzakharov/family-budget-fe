import { toast } from "@heroui/react";

// A toast (top left) confirming a change the user made. Its colour says what kind of change it
// was: green for something added or created, accent for something changed, red for something
// deleted or removed. Takes already translated text; `description` names what changed.
export const notify = {
  created: (title: string, description?: string) => toast.success(title, { description }),
  updated: (title: string, description?: string) => toast(title, { variant: "accent", description }),
  deleted: (title: string, description?: string) => toast.danger(title, { description }),
};
