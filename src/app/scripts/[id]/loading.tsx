import { Skeleton } from "@/components/skeleton";

/** Skeleton específico de la vista de guion (secciones + portadas). */
export default function ScriptLoading() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-8 w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <div className="mb-10 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        <Skeleton className="aspect-[4/5]" />
        <Skeleton className="aspect-[4/5]" />
        <Skeleton className="aspect-[4/5]" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
      </div>
    </main>
  );
}
