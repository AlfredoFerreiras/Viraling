import { redirect } from "next/navigation";
import { NavLinks } from "@/components/nav-links";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  if (user.role !== "admin") redirect("/dashboard");

  const { dict } = await getServerDict();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">
          {dict["admin.title"]}
        </h1>
        <NavLinks
          items={[
            { href: "/admin", label: dict["admin.users"] + " & IA" },
            { href: "/admin/library", label: dict["admin.library"] },
            { href: "/admin/users", label: dict["admin.users"] },
          ]}
        />
      </div>
      {children}
    </main>
  );
}
