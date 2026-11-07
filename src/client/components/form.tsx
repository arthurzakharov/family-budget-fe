// TanStack Form wired to the app's HeroUI fields (see ui.tsx). Forms are made with useAppForm;
// inside <form.AppField name="..."> the field components below read and write that field.
// Inputs keep their `name` and native attributes (required, min...), so the browser still
// checks them before the form is submitted.
import type { ComponentProps, FormEvent, ReactNode } from "react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { Button, Tooltip } from "@heroui/react";
import { CheckboxField as UiCheckbox, Field, SelectField as UiSelect, type Option } from "@client/components/ui";

export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();

type TextFieldProps = Omit<ComponentProps<typeof Field>, "name" | "value" | "defaultValue" | "onChange" | "onBlur">;

// Any native input (text, password, email, date, number...). Numbers are kept as typed text
// and converted when the form is sent.
function TextField(props: TextFieldProps) {
  const field = useFieldContext<string>();
  return (
    <Field
      {...props}
      name={field.name}
      value={field.state.value}
      onChange={e => field.handleChange(e.target.value)}
      onBlur={field.handleBlur}
    />
  );
}

type SelectProps = {
  label: ReactNode;
  options: Option[];
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
};

// A HeroUI select; "" means nothing is picked yet.
function SelectField(props: SelectProps) {
  const field = useFieldContext<string>();
  return <UiSelect {...props} name={field.name} value={field.state.value} onChange={field.handleChange} />;
}

// A checkbox whose field is true while ticked.
function CheckboxField({ label }: { label: ReactNode }) {
  const field = useFieldContext<boolean>();
  return <UiCheckbox label={label} isSelected={field.state.value} onChange={field.handleChange} />;
}

type SubmitButtonProps = {
  children: ReactNode;
  fullWidth?: boolean;
  size?: ComponentProps<typeof Button>["size"];
  // Also disabled while every field still has its starting value, e.g. for "Save changes".
  requireChange?: boolean;
  // The id of the <form> it submits, when the button sits outside it (e.g. in a modal's footer)
  form?: string;
  // Shows only this icon; `children` must then be plain text, which names the button for
  // screen readers and shows as a tooltip.
  icon?: ReactNode;
};

// The form's submit button; disabled while the form is being sent, so it cannot go twice.
function SubmitButton({ children, fullWidth, size, requireChange, form: formId, icon }: SubmitButtonProps) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={state => state.isSubmitting || (requireChange === true && state.isDefaultValue)}>
      {isDisabled =>
        icon ? (
          <Tooltip delay={300}>
            <Button
              type="submit"
              form={formId}
              isIconOnly
              size={size}
              isDisabled={isDisabled}
              aria-label={typeof children === "string" ? children : undefined}
            >
              {icon}
            </Button>
            <Tooltip.Content>{children}</Tooltip.Content>
          </Tooltip>
        ) : (
          <Button type="submit" form={formId} fullWidth={fullWidth} size={size} isDisabled={isDisabled}>
            {children}
          </Button>
        )
      }
    </form.Subscribe>
  );
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, SelectField, CheckboxField },
  formComponents: { SubmitButton },
});

// The <form onSubmit> handler for a TanStack form.
export const submitWith = (form: { handleSubmit: () => unknown }) => (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  e.stopPropagation();
  void form.handleSubmit();
};
