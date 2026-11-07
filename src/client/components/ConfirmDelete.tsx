import { useCallback, useRef, useState, type ReactNode } from "react";
import { AlertDialog, Button } from "@heroui/react";
import { TrashBin } from "@gravity-ui/icons";
import { useI18n } from "@client/context/i18n";

// Asks before deleting something, in a HeroUI alert dialog instead of the browser's confirm().
// `confirmDelete(question)` opens the dialog and resolves to true once Delete is pressed,
// false on Cancel; render `dialog` once in the component that uses it.
export function useConfirmDelete(): { confirmDelete: (question: string) => Promise<boolean>; dialog: ReactNode } {
  const { t } = useI18n();
  const [question, setQuestion] = useState<string | null>(null);
  const resolve = useRef<((ok: boolean) => void) | null>(null);

  const confirmDelete = useCallback((text: string) => {
    resolve.current?.(false);
    setQuestion(text);
    return new Promise<boolean>(r => {
      resolve.current = r;
    });
  }, []);

  const answer = (ok: boolean) => {
    resolve.current?.(ok);
    resolve.current = null;
    setQuestion(null);
  };

  const dialog = (
    <AlertDialog.Backdrop isOpen={question !== null} onOpenChange={isOpen => !isOpen && answer(false)}>
      <AlertDialog.Container>
        <AlertDialog.Dialog className="sm:max-w-[400px]">
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger">
              <TrashBin className="size-5" />
            </AlertDialog.Icon>
            <AlertDialog.Heading>{question}</AlertDialog.Heading>
          </AlertDialog.Header>
          <AlertDialog.Body>
            <p>{t("common.cannotUndo")}</p>
          </AlertDialog.Body>
          <AlertDialog.Footer>
            <Button variant="tertiary" onPress={() => answer(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="danger" onPress={() => answer(true)}>
              {t("common.delete")}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );

  return { confirmDelete, dialog };
}
