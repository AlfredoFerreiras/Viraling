import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";
import { isDemoEnabled } from "@/lib/demo";

export const metadata = { title: "Sign up" };

export default async function SignUpPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <Suspense>
        <AuthForm mode="sign-up" demoEnabled={isDemoEnabled()} />
      </Suspense>
    </main>
  );
}
