import Link from "next/link";
import { APP_NAME } from "@/lib/brand";
import { getServerDict } from "@/lib/i18n/server";

export async function SiteFooter() {
  const { dict } = await getServerDict();
  return (
    <footer className="border-t border-white/8">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-zinc-500 sm:flex-row">
        <p>
          © {new Date().getFullYear()} {APP_NAME}. {dict["footer.rights"]}
        </p>
        <nav className="flex items-center gap-5">
          <Link href="/terms" className="hover:text-zinc-300">
            {dict["footer.terms"]}
          </Link>
          <Link href="/privacy" className="hover:text-zinc-300">
            {dict["footer.privacy"]}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
