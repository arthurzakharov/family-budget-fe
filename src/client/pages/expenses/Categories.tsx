import { useEffect, useId, useState } from "react";
import { api, errorCode, request, type JsonRequest } from "@client/api";
import { queries, useReplaceMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { categoryKinds } from "@shared/expenses";
import { Button, Chip, Modal, Switch } from "@heroui/react";
import { CirclePlus } from "@gravity-ui/icons";
import { submitWith, useAppForm } from "@client/components/form";
import { FormStack, Message, Section } from "@client/components/ui";
import { RecordTable, recordColumns } from "@client/components/RecordTable";
import type { Category, CategoryKind } from "@arthurzakharov/family-budget-be-client";

const column = recordColumns<Category>();

// Admin only: show or hide categories, and create new ones in either list.
// Hidden categories cannot be picked for new records; existing records keep theirs.
export function Categories() {
  const { t } = useI18n();
  const { categories } = useExpenses();
  const categoryName = useCategoryName();
  const [notice, setNotice] = useState<string | null>(null);
  // Whether the "Create category" dialog is open
  const [creating, setCreating] = useState(false);

  // Both endpoints answer with the full, updated category list.
  const save = useReplaceMutation(queries.expenseCategories, (req: () => JsonRequest<Category[]>) => request(req()));
  const send = (req: () => JsonRequest<Category[]>) =>
    save.mutateAsync(req).then(
      () => true,
      () => false, // shown from save.error
    );

  const toggle = (c: Category, visible: boolean) => {
    setNotice(null);
    send(() => api.expenses.categories[":id"].$put({ param: { id: c.id }, json: { hidden: !visible } }));
  };

  const columns = [
    column.accessor(c => categoryName(t, c.id), {
      id: "name",
      header: t("expenses.category"),
      enableSorting: true,
      sortFn: "text",
      meta: { isRowHeader: true },
      cell: ({ row: { original: c }, getValue }) => (
        <>
          <span className={c.hidden ? "text-muted line-through" : ""}>{getValue()}</span>
          {c.name !== null && (
            <Chip size="sm" variant="soft" className="ml-2">
              {t("expenses.custom")}
            </Chip>
          )}
        </>
      ),
    }),
    column.display({
      id: "visible",
      header: t("expenses.visible"),
      meta: { headerClassName: "w-24" },
      cell: ({ row: { original: c } }) => (
        <Switch aria-label={categoryName(t, c.id)} isSelected={!c.hidden} onChange={visible => toggle(c, visible)}>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch>
      ),
    }),
  ];

  const list = (kind: CategoryKind) => {
    const title = t(kind === "income" ? "expenses.incomeCategories" : "expenses.expenseCategories");
    return (
      <Section title={title}>
        <RecordTable
          label={title}
          data={categories.filter(c => c.kind === kind)}
          columns={columns}
          getRowId={c => c.id}
          paged={false}
        />
      </Section>
    );
  };

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted">{t("expenses.categoriesHint")}</p>
        <Button onPress={() => setCreating(true)}>
          <CirclePlus className="size-4" />
          {t("expenses.createCategory")}
        </Button>
      </div>

      <CreateCategoryModal
        isOpen={creating}
        onOpenChange={setCreating}
        onCreated={() => {
          setCreating(false);
          save.reset();
          setNotice("expenses.categoryCreated");
        }}
      />

      <Message error={errorCode(save.error)} success={notice} />

      <div className="grid items-start gap-x-6 lg:grid-cols-2 [&>*]:min-w-0">
        {list("expense")}
        {list("income")}
      </div>
    </>
  );
}

// The "Create category" dialog: a name and the list (income or expenses) it goes in. Closes once
// the category is created; a failure is shown inside it, so nothing typed is lost.
function CreateCategoryModal({
  isOpen,
  onOpenChange,
  onCreated,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onCreated: () => void;
}) {
  const { t } = useI18n();
  const formId = useId();
  // The server answers with the full, updated category list.
  const create = useReplaceMutation(queries.expenseCategories, (json: { name: string; kind: CategoryKind }) =>
    request(api.expenses.categories.$post({ json })),
  );
  const form = useAppForm({
    defaultValues: { name: "", kind: "expense" as CategoryKind },
    onSubmit: async ({ value }) => {
      try {
        await create.mutateAsync(value);
      } catch {
        return; // shown from create.error
      }
      onCreated();
    },
  });

  // Every time it opens, the dialog starts empty.
  useEffect(() => {
    if (!isOpen) return;
    form.reset();
    create.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on opening
  }, [isOpen]);

  return (
    <Modal.Backdrop variant="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="auto">
        <Modal.Dialog className="sm:max-w-sm">
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">
              <CirclePlus className="size-5" />
            </Modal.Icon>
            <Modal.Heading>{t("expenses.createCategory")}</Modal.Heading>
          </Modal.Header>
          <form.AppForm>
            <Modal.Body>
              <Message error={errorCode(create.error)} />
              <FormStack id={formId} onSubmit={submitWith(form)}>
                <form.AppField name="name">
                  {field => <field.TextField label={t("expenses.categoryName")} type="text" required autoFocus />}
                </form.AppField>
                <form.AppField name="kind">
                  {field => (
                    <field.SelectField
                      label={t("expenses.list")}
                      isRequired
                      options={categoryKinds.map(k => ({ id: k, label: t(k === "income" ? "type.income" : "type.expense") }))}
                    />
                  )}
                </form.AppField>
              </FormStack>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">
                {t("common.cancel")}
              </Button>
              <form.SubmitButton form={formId}>{t("expenses.createCategory")}</form.SubmitButton>
            </Modal.Footer>
          </form.AppForm>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
