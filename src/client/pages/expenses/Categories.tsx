import { useState, type FormEvent } from "react";
import { api, call, text, type JsonRequest } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { categoryKinds } from "@shared/expenses";
import { Button, Chip, Switch, Table } from "@heroui/react";
import { DataTable, Field, FormGrid, Message, Section, SelectField } from "@client/components/ui";
import type { Category, CategoryKind } from "@arthurzakharov/family-budget-be-client";

// Admin only: show or hide categories, and create new ones in either list.
// Hidden categories cannot be picked for new records; existing records keep theirs.
export function Categories() {
  const { t } = useI18n();
  const { categories, setCategories } = useExpenses();
  const categoryName = useCategoryName();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Both endpoints answer with the full, updated category list.
  const send = async (request: JsonRequest<Category[]>) => {
    const result = await call(request);
    if (!result.ok) {
      setError(result.error);
      setNotice(null);
      return false;
    }
    setError(null);
    setCategories(result.data);
    return true;
  };

  const toggle = (c: Category, visible: boolean) => {
    setNotice(null);
    send(api.expenses.categories[":id"].$put({ param: { id: c.id }, json: { hidden: !visible } }));
  };

  const onCreate = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const json = { name: text(data, "name"), kind: text(data, "kind") as CategoryKind };
    if (await send(api.expenses.categories.$post({ json }))) {
      form.reset();
      setNotice("expenses.categoryCreated");
    }
  };

  const list = (kind: CategoryKind) => {
    const title = t(kind === "income" ? "expenses.incomeCategories" : "expenses.expenseCategories");
    return (
      <Section title={title}>
        <DataTable
          label={title}
          columns={
            <>
              <Table.Column isRowHeader>{t("expenses.category")}</Table.Column>
              <Table.Column className="w-24">{t("expenses.visible")}</Table.Column>
            </>
          }
        >
          {categories
            .filter(c => c.kind === kind)
            .map(c => (
              <Table.Row key={c.id} id={c.id}>
                <Table.Cell>
                  <span className={c.hidden ? "text-muted line-through" : ""}>{categoryName(t, c.id)}</span>
                  {c.name !== null && (
                    <Chip size="sm" variant="soft" className="ml-2">
                      {t("expenses.custom")}
                    </Chip>
                  )}
                </Table.Cell>
                <Table.Cell>
                  <Switch aria-label={categoryName(t, c.id)} isSelected={!c.hidden} onChange={visible => toggle(c, visible)}>
                    <Switch.Control>
                      <Switch.Thumb />
                    </Switch.Control>
                  </Switch>
                </Table.Cell>
              </Table.Row>
            ))}
        </DataTable>
      </Section>
    );
  };

  return (
    <>
      <Section title={t("expenses.createCategory")} description={t("expenses.categoriesHint")}>
        <Message error={error} success={notice} />
        <FormGrid onSubmit={onCreate} actions={<Button type="submit">{t("expenses.createCategory")}</Button>}>
          <Field label={t("expenses.categoryName")} type="text" name="name" required />
          <SelectField
            label={t("expenses.list")}
            name="kind"
            isRequired
            defaultValue="expense"
            options={categoryKinds.map(k => ({ id: k, label: t(k === "income" ? "type.income" : "type.expense") }))}
          />
        </FormGrid>
      </Section>
      <div className="grid items-start gap-x-6 lg:grid-cols-2 [&>*]:min-w-0">
        {list("expense")}
        {list("income")}
      </div>
    </>
  );
}
