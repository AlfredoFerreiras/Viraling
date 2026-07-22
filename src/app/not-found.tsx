import Link from "next/link";
import { getServerDict } from "@/lib/i18n/server";

export default async function NotFound() {
  const { dict } = await getServerDict();
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <div className="text-6xl font-black text-amber-400">404</div>
      <h1 className="text-2xl font-bold tracking-tight">
        {dict["notfound.title"]}
      </h1>
      <p className="max-w-md text-sm text-zinc-400">{dict["notfound.desc"]}</p>
      <Link
        href="/dashboard"
        className="mt-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300"
      >
        {dict["error.home"]}
      </Link>
    </main>
  );
}
