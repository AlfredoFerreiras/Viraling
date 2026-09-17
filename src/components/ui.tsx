/**
 * Own UI kit (shadcn style, without the CLI dependency): small
 * Tailwind components, dark mode by default, amber accent.
 */
import { forwardRef, type ComponentProps } from "react";

function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export { cx };

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

export const Button = forwardRef<
  HTMLButtonElement,
  ComponentProps<"button"> & { variant?: ButtonVariant }
>(function Button({ className, variant = "primary", ...props }, ref) {
  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-amber-400 text-zinc-950 hover:bg-amber-300 disabled:hover:bg-amber-400 font-semibold shadow-[0_0_20px_-6px_rgba(251,191,36,0.5)]",
    secondary:
      "bg-white/8 text-white hover:bg-white/15 border border-white/10",
    ghost: "text-zinc-300 hover:bg-white/8 hover:text-white",
    danger:
      "bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20",
  };
  return (
    <button
      ref={ref}
      className={cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cx(
        "rounded-xl border border-white/8 bg-card p-5 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cx("mb-1.5 block text-sm font-medium text-zinc-300", className)}
      {...props}
    />
  );
}

const fieldBase =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-amber-400/60 focus:bg-white/8";

export const Input = forwardRef<HTMLInputElement, ComponentProps<"input">>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cx(fieldBase, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  ComponentProps<"textarea">
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cx(fieldBase, "min-h-24 resize-y", className)}
      {...props}
    />
  );
});

export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cx(fieldBase, "cursor-pointer appearance-none", className)}
      {...props}
    />
  );
}

export function Badge({
  className,
  color = "zinc",
  ...props
}: ComponentProps<"span"> & {
  color?: "zinc" | "amber" | "emerald" | "sky" | "rose" | "orange";
}) {
  const colors = {
    zinc: "bg-white/8 text-zinc-300 border-white/10",
    amber: "bg-amber-400/10 text-amber-300 border-amber-400/25",
    emerald: "bg-emerald-400/10 text-emerald-300 border-emerald-400/25",
    sky: "bg-sky-400/10 text-sky-300 border-sky-400/25",
    rose: "bg-rose-400/10 text-rose-300 border-rose-400/25",
    orange: "bg-orange-400/10 text-orange-300 border-orange-400/25",
  };
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        colors[color],
        className,
      )}
      {...props}
    />
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent",
        className,
      )}
      aria-label="loading"
    />
  );
}

export function EmptyState({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-12 text-center">
      <p className="text-sm text-zinc-400">{title}</p>
      {action}
    </div>
  );
}
