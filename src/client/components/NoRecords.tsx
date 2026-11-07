import type { ComponentType, SVGProps } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button, Card, EmptyState } from "@heroui/react";
import { ArrowRight } from "@gravity-ui/icons";
import { useI18n, type TranslationKey } from "@client/context/i18n";
import { useCurrentUser } from "@client/context/auth";
import { canEdit } from "@shared/roles";

type Props = {
  // The section's icon, as in the navigation
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  // e.g. "No crypto transactions yet"
  title: TranslationKey;
  // Where records of this section are added
  manage: "/crypto/manage" | "/deposit/manage" | "/expenses/manage";
};

// Shown on a money page's overview tabs instead of empty tables and zero totals while there are
// no records yet. People who may add records get a way to the Manage records tab; viewers,
// who have no such tab, are told that records will show up here.
export function NoRecords({ icon: Icon, title, manage }: Props) {
  const { t } = useI18n();
  const navigate = useNavigate();
  const editor = canEdit(useCurrentUser());

  return (
    <Card>
      <Card.Content>
        <EmptyState className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <span className="mb-1 flex size-16 items-center justify-center rounded-3xl bg-accent-soft text-accent" aria-hidden>
            <Icon className="size-8" />
          </span>
          <h2 className="text-lg font-semibold text-foreground">{t(title)}</h2>
          <p className="max-w-sm">{t(editor ? "empty.editorHint" : "empty.viewerHint")}</p>
          {editor && (
            <Button className="mt-2" onPress={() => navigate({ to: manage })}>
              {t("tabs.manage")}
              <ArrowRight className="size-4" />
            </Button>
          )}
        </EmptyState>
      </Card.Content>
    </Card>
  );
}
