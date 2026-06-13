type FormFieldProps = {
  label: string;
  children: React.ReactNode;
};

export function FormField({ label, children }: FormFieldProps) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-[color:var(--foreground)]">
      <span>{label}</span>
      {children}
    </label>
  );
}
