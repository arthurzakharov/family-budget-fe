import { useState } from "react";
import { api, errorCode, request, type JsonRequest } from "@client/api";
import { queries, useReplaceMutation } from "@client/queries";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { categoryKinds } from "@shared/expenses";
import { Chip, Switch } from "@heroui/react";
import { submitWith, useAppForm } from "@client/components/form";
import { FormGrid, Message, Section } from "@client/components/ui";
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

  const createForm = useAppForm({
    defaultValues: { name: "", kind: "expense" as CategoryKind },
    onSubmit: async ({ value, formApi }) => {
      if (await send(() => api.expenses.categories.$post({ json: value }))) {
        formApi.reset();
        setNotice("expenses.categoryCreated");
      }
    },
  });

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
      <Section title={t("expenses.createCategory")} description={t("expenses.categoriesHint")}>
        <Message error={errorCode(save.error)} success={notice} />
        <createForm.AppForm>
          <FormGrid
            onSubmit={submitWith(createForm)}
            actions={<createForm.SubmitButton>{t("expenses.createCategory")}</createForm.SubmitButton>}
          >
            <createForm.AppField name="name">
              {field => <field.TextField label={t("expenses.categoryName")} type="text" required />}
            </createForm.AppField>
            <createForm.AppField name="kind">
              {field => (
                <field.SelectField
                  label={t("expenses.list")}
                  isRequired
                  options={categoryKinds.map(k => ({ id: k, label: t(k === "income" ? "type.income" : "type.expense") }))}
                />
              )}
            </createForm.AppField>
          </FormGrid>
        </createForm.AppForm>
      </Section>
      <div className="grid items-start gap-x-6 lg:grid-cols-2 [&>*]:min-w-0">
        {list("expense")}
        {list("income")}
      </div>
    </>
  );
}
