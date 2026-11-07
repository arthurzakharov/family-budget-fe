// TanStack Form wired to the app's HeroUI fields (see ui.tsx). Forms are made with useAppForm;
// inside <form.AppField name="..."> the field components below read and write that field.
// Inputs keep their `name` and native attributes (required, min...), so the browser still
// checks them before the form is submitted.
import { useId, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import { Button, Modal, Tooltip } from "@heroui/react";
import { useI18n } from "@client/context/i18n";
import {
  CheckboxField as UiCheckbox,
  Field,
  FormStack,
  Message,
  SelectField as UiSelect,
  type Option,
} from "@client/components/ui";

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

// A form's body and footer inside a FormModal: the error (a translation key), one field per
// line, then Cancel (closes the dialog) and the submit button.
function ModalForm({
  error,
  submitLabel,
  requireChange,
  children,
}: {
  error?: string | null;
  submitLabel: ReactNode;
  // Keeps the submit button off until something is changed, e.g. for "Save changes"
  requireChange?: boolean;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const form = useFormContext();
  const id = useId();
  return (
    <>
      <Modal.Body>
        <Message error={error} />
        <FormStack id={id} onSubmit={submitWith(form)}>
          {children}
        </FormStack>
      </Modal.Body>
      <Modal.Footer>
        <Button slot="close" variant="secondary">
          {t("common.cancel")}
        </Button>
        <SubmitButton form={id} requireChange={requireChange}>
          {submitLabel}
        </SubmitButton>
      </Modal.Footer>
    </>
  );
}

export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, SelectField, CheckboxField },
  formComponents: { SubmitButton, ModalForm },
});

// Which record dialog is open: adding (record null) or editing a record. The record is kept
// while the dialog closes, so its title does not change during the closing animation.
export type RecordDialog<T> = { open: boolean; record: T | null };
export const closedDialog = { open: false, record: null };

// A dialog over a blurred page, for adding or editing something. Its contents are only mounted
// while it is open, so a form inside starts afresh every time it opens.
// Widths on larger screens; on phones every dialog is nearly full width.
const modalWidths = { sm: "sm:max-w-sm", md: "sm:max-w-md", lg: "sm:max-w-lg" };

export function FormModal({
  isOpen,
  onOpenChange,
  title,
  description,
  icon,
  size = "lg",
  children,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  title: ReactNode;
  // A line under the title
  description?: ReactNode;
  icon: ReactNode;
  // "sm" for a field or two, "lg" for record forms
  size?: keyof typeof modalWidths;
  // Usually a form with <form.ModalForm> inside
  children: ReactNode;
}) {
  return (
    <Modal.Backdrop variant="blur" isOpen={isOpen} onOpenChange={onOpenChange}>
      <Modal.Container placement="auto">
        <Modal.Dialog className={modalWidths[size]}>
          <Modal.CloseTrigger />
          <Modal.Header>
            <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">{icon}</Modal.Icon>
            <Modal.Heading>{title}</Modal.Heading>
            {description && <p className="text-sm text-muted">{description}</p>}
          </Modal.Header>
          {children}
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}

// The <form onSubmit> handler for a TanStack form.
export const submitWith = (form: { handleSubmit: () => unknown }) => (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  e.stopPropagation();
  void form.handleSubmit();
};
