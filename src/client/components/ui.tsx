// Small building blocks on top of HeroUI, so every page lays out forms, tables and
// messages the same way.
import { useId, type ComponentProps, type FormEvent, type ReactNode } from "react";
import { Alert, Button, Card, Checkbox, Input, Label, ListBox, Select, Spinner, Table, Tooltip } from "@heroui/react";
import type { Key } from "@heroui/react";
import { Pencil, TrashBin } from "@gravity-ui/icons";
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

// A spinner over a card or dialog while it is sending something. Put it last inside a
// `relative` container; it takes the container's rounded corners. Make the container's
// contents `inert` at the same time, so nothing can be clicked or typed meanwhile.
// `size` "sm" suits small areas such as a form inside a table row.
export function LoadingOverlay({ size = "lg" }: { size?: "sm" | "lg" }) {
  const { t } = useI18n();
  return (
    <div
      role="status"
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-surface/60 backdrop-blur-[2px]"
    >
      <Spinner size={size} />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
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

// Edit and Delete icon buttons for a table row, named by their tooltips.
// While `isDeleting`, the delete button shows a spinner and both are locked.
export function RowActions({
  onEdit,
  onDelete,
  isDeleting = false,
}: {
  onEdit?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="flex justify-end gap-1">
      {onEdit && (
        <IconAction label={t("common.edit")} icon={<Pencil className="size-4" />} onPress={onEdit} isDisabled={isDeleting} />
      )}
      {onDelete && (
        <IconAction
          label={t("common.delete")}
          icon={<TrashBin className="size-4" />}
          onPress={onDelete}
          isPending={isDeleting}
          danger
        />
      )}
    </div>
  );
}

// A small icon-only button for a table row. The label names it for screen readers and shows
// as a tooltip on hover or keyboard focus.
// While `isPending` (its request is running) it shows a spinner instead of the icon and
// cannot be pressed again.
export function IconAction({
  label,
  icon,
  onPress,
  danger,
  isPending = false,
  isDisabled = false,
}: {
  label: string;
  icon: ReactNode;
  onPress: () => void;
  danger?: boolean;
  isPending?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <Tooltip delay={300}>
      <Button
        isIconOnly
        size="sm"
        variant={danger ? "danger-soft" : "ghost"}
        aria-label={label}
        onPress={onPress}
        isPending={isPending}
        isDisabled={isDisabled}
      >
        {isPending ? <Spinner color="current" size="sm" /> : icon}
      </Button>
      <Tooltip.Content>{label}</Tooltip.Content>
    </Tooltip>
  );
}

// Keeps a row's icon buttons lined up with the rows above and below when this row has fewer.
export const IconActionGap = () => <span aria-hidden className="inline-block size-8 shrink-0" />;

type DataTableProps = Pick<ComponentProps<typeof Table.Content>, "sortDescriptor" | "onSortChange"> & {
  label: string;
  // <Table.Column> elements
  columns: ReactNode;
  // <Table.Row> elements
  children: ReactNode;
  emptyText?: string;
  // The data has not arrived yet
  isLoading?: boolean;
};

// A HeroUI table with horizontal scrolling on small screens and an empty-state message.
// While `isLoading`, pass no rows: the body then shows a spinner instead of the empty text.
export function DataTable({ label, columns, children, emptyText, isLoading = false, sortDescriptor, onSortChange }: DataTableProps) {
  const { t } = useI18n();
  return (
    <Table>
      <Table.ScrollContainer>
        <Table.Content
          aria-label={label}
          aria-busy={isLoading}
          className="min-w-full"
          sortDescriptor={sortDescriptor}
          onSortChange={onSortChange}
        >
          <Table.Header>{columns}</Table.Header>
          <Table.Body
            renderEmptyState={() =>
              isLoading ? (
                <div role="status" className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                  <Spinner size="sm" />
                  {t("common.loading")}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted">{emptyText ?? "—"}</p>
              )
            }
          >
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
