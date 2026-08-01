type DateDisplayProps = {
  value: Date | string | number;
  locale?: string;
  options?: Intl.DateTimeFormatOptions;
};

export function DateDisplay({
  value,
  locale = "pt-BR",
  options,
}: DateDisplayProps) {
  const date =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00`)
      : new Date(value);

  return <>{new Intl.DateTimeFormat(locale, options).format(date)}</>;
}
