import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import Link from "next/link";
import { getServerDict } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth";
import { getActiveNiche, getUserNiches } from "@/lib/niches";
import { LanguageSwitcher } from "./language-switcher";
import { NavLinks } from "./nav-links";
import { NicheSwitcher } from "./niche-switcher";

export async function SiteHeader() {
  const { dict } = await getServerDict();
  const user = await getCurrentUser();
  const userNiches = user ? await getUserNiches(user.id) : [];
  const activeNiche = user ? await getActiveNiche(userNiches) : null;

  const links = user
    ? [
        { href: "/dashboard", label: dict["nav.dashboard"] },
        { href: "/generate", label: dict["nav.generate"] },
        { href: "/extract", label: dict["nav.extract"] },
        { href: "/history", label: dict["nav.history"] },
        { href: "/niches", label: dict["nav.niches"] },
        ...(user.role === "admin"
          ? [{ href: "/admin", label: dict["nav.admin"] }]
          : []),
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-5">
          <Link
            href={user ? "/dashboard" : "/"}
            className="flex shrink-0 items-center gap-1.5 text-sm font-bold tracking-tight"
          >
            <span className="flex size-6 items-center justify-center rounded-md bg-amber-400 font-black text-zinc-950">
              F
            </span>
            Format<span className="text-amber-400">Brain</span>
          </Link>
          {links.length > 0 && <NavLinks items={links} />}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {user && (
            <>
              <NicheSwitcher
                niches={userNiches.map((n) => ({ id: n.id, name: n.name }))}
                activeId={activeNiche?.id ?? null}
              />
              <span
                className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300"
                title={dict["dash.tokens"]}
              >
                {user.tokensBalance} ⚡
              </span>
            </>
          )}
          <LanguageSwitcher />
          <Show when="signed-out">
            <SignInButton>
              <button className="cursor-pointer text-sm text-zinc-300 hover:text-white">
                {dict["nav.signIn"]}
              </button>
            </SignInButton>
            <SignUpButton>
              <button className="cursor-pointer rounded-lg bg-amber-400 px-3.5 py-1.5 text-sm font-semibold text-zinc-950 hover:bg-amber-300">
                {dict["nav.signUp"]}
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
