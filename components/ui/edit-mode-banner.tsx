import Link from "next/link";

type EditModeBannerProps = {
  cancelHref: string;
  entity: string;
  summary: string;
};

export function EditModeBanner({ cancelHref, entity, summary }: EditModeBannerProps) {
  return (
    <div className="edit-banner">
      <div>
        <span className="edit-chip">Editando</span>
        <p className="mt-2 text-sm font-black">{entity}</p>
        <p className="mt-1 text-xs leading-5 text-[color:var(--muted)]">{summary}</p>
      </div>
      <Link className="edit-cancel-link" href={cancelHref}>
        Cancelar edição
      </Link>
    </div>
  );
}
