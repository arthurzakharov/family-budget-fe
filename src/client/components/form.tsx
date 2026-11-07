// TanStack Form wired to the app's HeroUI fields (see ui.tsx). Forms are made with useAppForm;
// inside <form.AppField name="..."> the field components below read and write that field.
// Inputs keep their `name` and native attributes (required, min...), so the browser still
// checks them before the form is submitted.
import { createContext, useContext, useEffect, useId, useState, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { createFormHook, createFormHookContexts, useStore } from "@tanstack/react-form";
import {
  Button,
  Calendar,
  DateField,
  DatePicker,
  Label,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@heroui/react";
import { getLocalTimeZone, parseDate, today, type DateValue } from "@internationalized/date";
import { I18nProvider } from "react-aria-components";
import { useI18n } from "@client/context/i18n";
import {
  CheckboxField as UiCheckbox,
  Field,
  FormStack,
  LoadingOverlay,
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

// Date formats per app language: English with the day first (dd/mm/yyyy), Russian as usual.
const dateLocales = { en: "en-GB", ru: "ru-RU" } as const;

// The field's "YYYY-MM-DD" text as a date for the picker; null while empty (or not a full date).
function toDateValue(text: string): DateValue | null {
  if (!text) return null;
  try {
    return parseDate(text);
  } catch {
    return null;
  }
}

// Today and yesterday on this device, as "YYYY-MM-DD"
export const todayText = () => today(getLocalTimeZone()).toString();
const yesterdayText = () => today(getLocalTimeZone()).subtract({ days: 1 }).toString();

// A date typed into its parts or picked from HeroUI's calendar. The field holds "YYYY-MM-DD"
// (what the backend expects), or "" while empty. Months and weekdays follow the app's language.
// With `quickPicks`, a Today | Yesterday button group sits beside it; the one matching the
// date is selected, and picking another date in the calendar selects neither.
function DatePickerField({
  label,
  isRequired,
  isDisabled,
  quickPicks = false,
}: {
  label: ReactNode;
  isRequired?: boolean;
  isDisabled?: boolean;
  quickPicks?: boolean;
}) {
  const field = useFieldContext<string>();
  const { t, language } = useI18n();
  const labelId = useId();
  const value = field.state.value;
  const quick = { today: todayText(), yesterday: yesterdayText() };
  const picked = value === quick.today ? "today" : value === quick.yesterday ? "yesterday" : null;

  return (
    <I18nProvider locale={dateLocales[language]}>
      <div className="flex flex-col gap-1">
        {/* Outside the picker so it labels the button group's row as well */}
        <Label id={labelId} isRequired={isRequired}>
          {label}
        </Label>
        <div className="flex items-center gap-2">
          <DatePicker
            className="min-w-0 flex-1"
            aria-labelledby={labelId}
            name={field.name}
            value={toDateValue(value)}
            onChange={date => field.handleChange(date ? date.toString() : "")}
            onBlur={field.handleBlur}
            isRequired={isRequired}
            isDisabled={isDisabled}
          >
            <DateField.Group fullWidth variant="secondary">
              <DateField.Input>{segment => <DateField.Segment segment={segment} />}</DateField.Input>
              <DateField.Suffix>
                <DatePicker.Trigger>
                  <DatePicker.TriggerIndicator />
                </DatePicker.Trigger>
              </DateField.Suffix>
            </DateField.Group>
            <DatePicker.Popover>
              <Calendar aria-label={typeof label === "string" ? label : undefined}>
                <Calendar.Header>
                  <Calendar.YearPickerTrigger>
                    <Calendar.YearPickerTriggerHeading />
                    <Calendar.YearPickerTriggerIndicator />
                  </Calendar.YearPickerTrigger>
                  <Calendar.NavButton slot="previous" />
                  <Calendar.NavButton slot="next" />
                </Calendar.Header>
                <Calendar.Grid>
                  <Calendar.GridHeader>{day => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
                  <Calendar.GridBody>{date => <Calendar.Cell date={date} />}</Calendar.GridBody>
                </Calendar.Grid>
                <Calendar.YearPickerGrid>
                  <Calendar.YearPickerGridBody>
                    {({ year }) => <Calendar.YearPickerCell year={year} />}
                  </Calendar.YearPickerGridBody>
                </Calendar.YearPickerGrid>
              </Calendar>
            </DatePicker.Popover>
          </DatePicker>
          {quickPicks && (
            <ToggleButtonGroup
              aria-labelledby={labelId}
              selectionMode="single"
              isDisabled={isDisabled}
              className="shrink-0"
              selectedKeys={picked ? [picked] : []}
              onSelectionChange={keys => {
                const [key] = keys;
                // Pressing the selected one again keeps its date.
                if (key === "today" || key === "yesterday") field.handleChange(quick[key]);
              }}
            >
              <ToggleButton id="today">{t("common.today")}</ToggleButton>
              <ToggleButton id="yesterday">
                <ToggleButtonGroup.Separator />
                {t("common.yesterday")}
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </div>
      </div>
    </I18nProvider>
  );
}

// Colours of a ToggleField option: a light shade of its tone, the full colour once selected
const toggleTones = {
  success:
    "bg-success-soft text-success-soft-foreground data-[selected=true]:bg-success data-[selected=true]:text-success-foreground",
  danger:
    "bg-danger-soft text-danger-soft-foreground data-[selected=true]:bg-danger data-[selected=true]:text-danger-foreground",
};

export type ToggleOption = { id: string; label: ReactNode; tone: keyof typeof toggleTones };

// A choice between a few options shown as joined buttons, e.g. Income / Expense. The selected
// one is coloured by its tone; one is always selected.
function ToggleField({ label, options }: { label: string; options: ToggleOption[] }) {
  const field = useFieldContext<string>();
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <Label id={id}>{label}</Label>
      <ToggleButtonGroup
        aria-labelledby={id}
        selectionMode="single"
        disallowEmptySelection
        fullWidth
        selectedKeys={[field.state.value]}
        onSelectionChange={keys => {
          const [key] = keys;
          if (key !== undefined) field.handleChange(String(key));
        }}
      >
        {options.map((option, i) => (
          <ToggleButton key={option.id} id={option.id} className={toggleTones[option.tone]}>
            {i > 0 && <ToggleButtonGroup.Separator />}
            {option.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </div>
  );
}

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

// Wraps a small form that is not in a dialog (e.g. inside a table row). While the form is being
// sent, a spinner covers it and its fields and buttons are inert.
function BusyArea({ children, className = "" }: { children: ReactNode; className?: string }) {
  const form = useFormContext();
  const busy = useStore(form.store, state => state.isSubmitting);
  return (
    <div className={`relative rounded-lg ${className}`} aria-busy={busy}>
      <div inert={busy} className="contents">
        {children}
      </div>
      {busy && <LoadingOverlay size="sm" />}
    </div>
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
  // Tells the surrounding FormModal while the form is being sent, so it shows its overlay.
  const setBusy = useContext(ModalBusyContext);
  const isSubmitting = useStore(form.store, state => state.isSubmitting);
  useEffect(() => {
    setBusy(isSubmitting);
    return () => setBusy(false);
  }, [isSubmitting, setBusy]);

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
  fieldComponents: { TextField, SelectField, CheckboxField, ToggleField, DatePickerField },
  formComponents: { SubmitButton, ModalForm, BusyArea },
});

// Lets a ModalForm tell its FormModal that it is being sent.
const ModalBusyContext = createContext<(busy: boolean) => void>(() => {});

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
  // While the form inside is being sent, a spinner covers the dialog, its contents are inert
  // and it cannot be closed (✕, Escape or a click outside) until the answer arrives.
  const [busy, setBusy] = useState(false);
  return (
    <Modal.Backdrop
      variant="blur"
      isOpen={isOpen}
      onOpenChange={open => (busy && !open ? undefined : onOpenChange(open))}
      isDismissable={!busy}
      isKeyboardDismissDisabled={busy}
    >
      <Modal.Container placement="auto">
        <Modal.Dialog className={`relative ${modalWidths[size]}`} aria-busy={busy}>
          <div inert={busy} className="contents">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Icon className="bg-accent-soft text-accent-soft-foreground">{icon}</Modal.Icon>
              <Modal.Heading>{title}</Modal.Heading>
              {description && <p className="text-sm text-muted">{description}</p>}
            </Modal.Header>
            <ModalBusyContext value={setBusy}>{children}</ModalBusyContext>
          </div>
          {busy && <LoadingOverlay />}
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
