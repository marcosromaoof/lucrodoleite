type PageCardProps = {
  children: React.ReactNode;
  title?: string;
  description?: string;
};

export function PageCard({ children, title, description }: PageCardProps) {
  return (
    <section className="rounded-lg border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
      {title ? <h2 className="text-xl font-bold">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{description}</p> : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </section>
  );
}
