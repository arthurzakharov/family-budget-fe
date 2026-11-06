import { useState, type FormEvent } from "react";
import { api, call, text, type JsonRequest } from "@client/api";
import { useI18n } from "@client/context/i18n";
import { useCategoryName, useExpenses } from "@client/context/expenses";
import { categoryKinds } from "@shared/expenses";
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

  const list = (kind: CategoryKind) => (
    <>
      <h3>{t(kind === "income" ? "expenses.incomeCategories" : "expenses.expenseCategories")}</h3>
      <table>
        <thead>
          <tr>
            <th>{t("expenses.visible")}</th>
            <th>{t("expenses.category")}</th>
          </tr>
        </thead>
        <tbody>
          {categories
            .filter(c => c.kind === kind)
            .map(c => (
              <tr key={c.id}>
                <td>
                  <input
                    type="checkbox"
                    aria-label={categoryName(t, c.id)}
                    checked={!c.hidden}
                    onChange={e => toggle(c, e.target.checked)}
                  />
                </td>
                <td>
                  {categoryName(t, c.id)}
                  {c.name !== null && <small> ({t("expenses.custom")})</small>}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </>
  );

  return (
    <>
      <h2>{t("expenses.categories")}</h2>
      <p>{t("expenses.categoriesHint")}</p>
      <form onSubmit={onCreate} className="transaction-form">
        <label>
          {t("expenses.categoryName")}
          <input type="text" name="name" required />
        </label>
        <label>
          {t("expenses.list")}
          <select name="kind" required defaultValue="expense">
            {categoryKinds.map(k => (
              <option key={k} value={k}>
                {t(k === "income" ? "type.income" : "type.expense")}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">{t("expenses.createCategory")}</button>
      </form>
      {notice && <p className="success">{t(notice)}</p>}
      {error && <p className="error">{t(error)}</p>}
      {list("expense")}
      {list("income")}
    </>
  );
}
