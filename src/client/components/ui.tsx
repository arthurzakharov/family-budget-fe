// Small building blocks on top of HeroUI, so every page lays out forms, tables and
// messages the same way.
import { useId, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Alert, Button, Card, Checkbox, Input, Label, ListBox, Select, Table } from "@heroui/react";
import type { Key } from "@heroui/react";
import { useI18n } from "@client/context/i18n";

// A page's title with an optional line under it.
export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions}
    </header>
  );
}

// A titled card around one part of a page, e.g. a table or a form.
export function Section({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`mb-6 min-w-0 ${className ?? ""}`}>
      {(title || actions) && (
        <Card.Header className="flex-row flex-wrap items-start justify-between gap-2">
          <div>
            {title && <Card.Title className="text-lg">{title}</Card.Title>}
            {description && <Card.Description>{description}</Card.Description>}
          </div>
          {actions}
        </Card.Header>
      )}
      <Card.Content>{children}</Card.Content>
    </Card>
  );
}

// A form laid out as a responsive grid of fields with the buttons underneath.
export function FormGrid({
  onSubmit,
  children,
  actions,
  className,
}: {
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
  actions: ReactNode;
  className?: string;
}) {
  return (
    <form onSubmit={onSubmit} className={`flex flex-col gap-4 ${className ?? ""}`}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </form>
  );
}

// A form with one field per line, for narrow places such as the login card.
// `id` lets a submit button outside the form (e.g. in a modal's footer) send it.
export function FormStack({
  id,
  onSubmit,
  children,
}: {
  id?: string;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <form id={id} onSubmit={onSubmit} className="flex flex-col gap-4">
      {children}
    </form>
  );
}

type FieldProps = Omit<ComponentProps<typeof Input>, "id"> & { label: ReactNode; className?: string };

// A labelled native input (text, password, email, date, number...). It stays a plain
// <input>, so FormData and the browser's own validation work as before.
// Fields sit on cards, so they use HeroUI's "secondary" (filled) look; the default one has
// the same colour as a card in dark mode.
export function Field({ label, className, ...input }: FieldProps) {
  const id = useId();
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <Label htmlFor={id} isRequired={Boolean(input.required)}>{label}</Label>
      <Input id={id} fullWidth variant="secondary" {...input} />
    </div>
  );
}

export type Option = { id: string; label: ReactNode; text?: string };

type SelectFieldProps = {
  label: ReactNode;
  // Sent with the form under this name; leave out for selects that only drive the UI.
  name?: string;
  options: Option[];
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
} & (
  | { value: string; onChange: (value: string) => void; defaultValue?: never }
  | { value?: never; onChange?: (value: string) => void; defaultValue?: string }
);

// A labelled HeroUI select. An empty string means nothing is picked yet.
export function SelectField({
  label,
  name,
  options,
  placeholder,
  isRequired,
  isDisabled,
  className,
  value,
  defaultValue,
  onChange,
}: SelectFieldProps) {
  const controlled = value !== undefined ? { value: value || null } : { defaultValue: defaultValue || null };
  return (
    <Select
      className={`w-full ${className ?? ""}`}
      name={name}
      placeholder={placeholder}
      isRequired={isRequired}
      isDisabled={isDisabled}
      fullWidth
      variant="secondary"
      {...controlled}
      onChange={(key: Key | Key[] | null) => onChange?.(key == null ? "" : String(key))}
    >
      <Label>{label}</Label>
      <Select.Trigger>
        <Select.Value />
        <Select.Indicator />
      </Select.Trigger>
      <Select.Popover>
        <ListBox>
          {options.map(o => (
            <ListBox.Item key={o.id} id={o.id} textValue={o.text ?? (typeof o.label === "string" ? o.label : o.id)}>
              {o.label}
              <ListBox.ItemIndicator />
            </ListBox.Item>
          ))}
        </ListBox>
      </Select.Popover>
    </Select>
  );
}

// A checkbox that is sent with the form as name=value when ticked.
export function CheckboxField({
  label,
  ...props
}: { label: ReactNode } & Omit<ComponentProps<typeof Checkbox>, "children">) {
  return (
    <Checkbox variant="secondary" {...props}>
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
        {label}
      </Checkbox.Content>
    </Checkbox>
  );
}

// An error or success message. Takes a translation key, like the rest of the app's messages.
export function Message({ error, success }: { error?: string | null; success?: string | null }) {
  const { t } = useI18n();
  const key = error ?? success;
  if (!key) return null;
  return (
    <Alert status={error ? "danger" : "success"} className="mb-4">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Description>{t(key)}</Alert.Description>
      </Alert.Content>
    </Alert>
  );
}

// Edit and Delete buttons for a table row.
export function RowActions({ onEdit, onDelete, extra }: { onEdit?: () => void; onDelete?: () => void; extra?: ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex justify-end gap-1">
      {extra}
      {onEdit && (
        <Button size="sm" variant="ghost" onPress={onEdit}>
          {t("common.edit")}
        </Button>
      )}
      {onDelete && (
        <Button size="sm" variant="danger-soft" onPress={onDelete}>
          {t("common.delete")}
        </Button>
      )}
    </div>
  );
}

type DataTableProps = Pick<ComponentProps<typeof Table.Content>, "sortDescriptor" | "onSortChange"> & {
  label: string;
  // <Table.Column> elements
  columns: ReactNode;
  // <Table.Row> elements
  children: ReactNode;
  emptyText?: string;
};

// A HeroUI table with horizontal scrolling on small screens and an empty-state message.
export function DataTable({ label, columns, children, emptyText, sortDescriptor, onSortChange }: DataTableProps) {
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content aria-label={label} className="min-w-full" sortDescriptor={sortDescriptor} onSortChange={onSortChange}>
          <Table.Header>{columns}</Table.Header>
          <Table.Body renderEmptyState={() => <p className="py-6 text-center text-sm text-muted">{emptyText ?? "—"}</p>}>
            {children}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}

// Highlights the row being edited.
export const editingRow = (isEditing: boolean) => (isEditing ? "[&>td]:bg-accent-soft" : undefined);

// Money cells line up on the right and colour by sign.
export function Money({ cents, format, signed }: { cents: number; format: (cents: number) => string; signed?: boolean }) {
  const tone = !signed ? "" : cents < 0 ? "text-danger" : cents > 0 ? "text-success" : "";
  return <span className={`tabular-nums ${tone}`}>{format(cents)}</span>;
}

// A headline number, e.g. total income, shown in a row of stat cards.
export function Stat({ label, value, tone }: { label: ReactNode; value: ReactNode; tone?: "success" | "danger" | "accent" }) {
  const color = tone === "success" ? "text-success" : tone === "danger" ? "text-danger" : tone === "accent" ? "text-accent" : "";
  return (
    <Card>
      <Card.Content className="gap-1">
        <span className="text-sm text-muted">{label}</span>
        <span className={`text-2xl font-semibold tabular-nums ${color}`}>{value}</span>
      </Card.Content>
    </Card>
  );
}

export function StatGrid({ children }: { children: ReactNode }) {
  return <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
