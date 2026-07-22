import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">
        Hola, {user.email}
      </h1>
      <dl className="mt-6 grid grid-cols-3 gap-4 text-sm">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <dt className="text-black/60 dark:text-white/60">Tokens</dt>
          <dd className="mt-1 text-xl font-semibold">{user.tokensBalance}</dd>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <dt className="text-black/60 dark:text-white/60">Plan</dt>
          <dd className="mt-1 text-xl font-semibold capitalize">{user.plan}</dd>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <dt className="text-black/60 dark:text-white/60">Rol</dt>
          <dd className="mt-1 text-xl font-semibold">{user.role}</dd>
        </div>
      </dl>
    </main>
  );
}
