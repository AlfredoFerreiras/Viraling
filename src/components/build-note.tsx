/**
 * A short annotation explaining how the screen it sits on was built.
 *
 * The app is a portfolio piece, so the engineering that matters is mostly
 * invisible from the UI: row level security, the credit ledger, the prompt
 * injection guard. These notes surface it in place, next to the feature they
 * describe, instead of leaving it buried in the README.
 */
export function BuildNote({
  title,
  children,
  tags,
}: {
  title: string;
  children: React.ReactNode;
  tags?: string[];
}) {
  return (
    <aside className="rounded-xl border border-sky-400/20 bg-sky-400/[0.06] p-4">
      <div className="mb-1.5 flex items-center gap-2">
        <span
          aria-hidden
          className="grid h-5 w-5 place-items-center rounded-md bg-sky-400/20 text-[11px] font-bold text-sky-300"
        >
          i
        </span>
        <h2 className="text-sm font-semibold text-sky-200">{title}</h2>
      </div>
      <p className="text-sm leading-relaxed text-zinc-400">{children}</p>
      {tags && tags.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <li
              key={tag}
              className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-medium text-zinc-300"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
