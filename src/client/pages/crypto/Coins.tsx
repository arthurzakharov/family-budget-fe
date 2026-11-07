import { useEffect, useId, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Modal } from "@heroui/react";
import { Gear } from "@gravity-ui/icons";
import { api, errorCode, request } from "@client/api";
import { none, queries, useReplaceMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { submitWith, useAppForm } from "@client/components/form";
import { CheckboxField, Message, Section } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import { COINS } from "@shared/crypto";
import type { CoinSymbol } from "@arthurzakharov/family-budget-be-client";

type Coin = (typeof COINS)[number];

const column = recordColumns<Coin>();

// Admin only: which coins can be picked for new records. Existing records keep their coin.
// The tab lists the coins that are on; they are switched on and off in a dialog.
export function Coins() {
  const { t } = useI18n();
  const { data: enabled } = useQuery(queries.cryptoCoins);
  const [choosing, setChoosing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // In the order of the full list, like everywhere coins are offered.
  const shown = useMemo(() => COINS.filter(c => enabled?.includes(c.symbol)), [enabled]);

  const columns = useMemo(
    () => [
      column.accessor("symbol", {
        header: t("crypto.coin"),
        enableSorting: true,
        sortFn: "text",
        meta: { isRowHeader: true, className: "font-medium" },
      }),
      column.accessor("name", { header: t("crypto.name"), enableSorting: true, sortFn: "text" }),
    ],
    [t],
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">{t("crypto.coinsHint")}</p>
        {/* The dialog starts from the saved coins, so it can only open once they are loaded. */}
        <Button onPress={() => setChoosing(true)} isDisabled={!enabled}>
          <Gear className="size-4" />
          {t("crypto.chooseCoins")}
        </Button>
      </div>

      <ChooseCoinsModal
        isOpen={choosing}
        onOpenChange={setChoosing}
        enabled={enabled ?? none}
        onSaved={() => {
          setChoosing(false);
          setNotice("common.saved");
        }}
      />

      <Message success={notice} />

      <Section title={t("crypto.coins")}>
        <RecordTable
          label={t("crypto.coins")}
          emptyText={t("crypto.noCoins")}
          data={shown}
          columns={columns}
          getRowId={c => c.symbol}
          paged={false}
        />
      </Section>
    </>
  );
}

// The "Choose coins" dialog: a checkbox per coin. Closes once the choice is saved; a failure is
// shown inside it, so the ticked boxes are not lost.
function ChooseCoinsModal({
  isOpen,
  onOpenChange,
  enabled,
  onSaved,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // The coins that are on now
  enabled: CoinSymbol[];
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const formId = useId();
  // The server answers with the new list of coins.
  const save = useReplaceMutation(queries.cryptoCoins, (coins: CoinSymbol[]) =>
    request(api.crypto.coins.$put({ json: { enabled: coins } })),
  );
  const form = useAppForm({
    defaultValues: { enabled },
    onSubmit: async ({ value }) => {
      // Kept in the order of the list rather than the order they were ticked.
      const coins = COINS.map(c => c.symbol).filter(c => value.enabled.includes(c));
      try {
        await save.mutateAsync(coins);
      } catch {
        return; // shown from save.error
      }
      onSaved();
    },
  });

  // Every time it opens, the dialog starts from the saved coins.
  useEffect(() => {
    if (!isOpen) return;
    form.reset({ enabled });
    save.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on opening
  }, [isOpen]);

  return (
    <Modal.Backdrop variant="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="auto">
        <Modal.Dialog className="sm:max-w-md">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <Gear className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{t("crypto.chooseCoins")}</Modal.Heading>
            <p className="text-sm text-muted">{t("crypto.coinsHint")}</p>
          </Modal.Header>
          <form.AppForm>
            <Modal.Body>
              <Message error={errorCode(save.error)} />
              <form id={formId} onSubmit={submitWith(form)}>
                <form.Field name="enabled">
                  {field => (
                    <RecordTable
                      label={t("crypto.coins")}
                      data={COINS}
                      columns={[
                        column.display({
                          id: "available",
                          header: t("crypto.available"),
                          meta: { headerClassName: "w-24" },
                          cell: ({ row: { original: c } }) => (
                            <CheckboxField
                              label=""
                              aria-label={c.name}
                              isSelected={field.state.value.includes(c.symbol)}
                              onChange={on =>
                                field.handleChange(
                                  on ? [...field.state.value, c.symbol] : field.state.value.filter(s => s !== c.symbol),
                                )
                              }
                            />
                          ),
                        }),
                        column.accessor("symbol", {
                          header: t("crypto.coin"),
                          meta: { isRowHeader: true, className: "font-medium" },
                        }),
                        column.accessor("name", { header: t("crypto.name") }),
                      ]}
                      getRowId={c => c.symbol}
                      paged={false}
                    />
                  )}
                </form.Field>
              </form>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                {t("common.cancel")}
              </Button>
              <form.SubmitButton form={formId} requireChange>
                {t("common.saveChanges")}
              </form.SubmitButton>
            </Modal.Footer>
          </form.AppForm>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
