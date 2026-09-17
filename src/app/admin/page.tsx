import { sql } from "drizzle-orm";
import { KillSwitch } from "@/components/admin/kill-switch";
import { Card } from "@/components/ui";
import { withDbContext } from "@/db/context";
import { getCurrentUser } from "@/lib/auth";
import { getServerDict } from "@/lib/i18n/server";
import { isAiEnabled } from "@/lib/settings";

/** Estimated cost per Anthropic API call (sonnet, ~2k in/2k out). */
const COST_PER_CALL_USD = 0.04;

export default async function AdminDashboardPage() {
  const user = (await getCurrentUser())!; // the layout already validated admin
  const { dict } = await getServerDict();

  const stats = await withDbContext(
    { userId: user.id, role: "admin" },
    async (tx) => {
      const [totals] = (
        await tx.execute(sql`
          select
            count(*)::int as total,
            count(*) filter (where created_at > now() - interval '7 days')::int as new7,
            count(*) filter (where created_at > now() - interval '30 days')::int as new30
          from users
        `)
      ).rows as [{ total: number; new7: number; new30: number }];

      const [active] = (
        await tx.execute(sql`
          select count(distinct user_id)::int as active7
          from token_transactions
          where created_at > now() - interval '7 days'
        `)
      ).rows as [{ active7: number }];

      const plans = (
        await tx.execute(sql`
          select plan, count(*)::int as n from users group by plan order by n desc
        `)
      ).rows as { plan: string; n: number }[];

      const perDay = (
        await tx.execute(sql`
          select to_char(created_at, 'MM-DD') as day, count(*)::int as n
          from token_transactions
          where amount < 0 and created_at > now() - interval '14 days'
          group by 1 order by 1
        `)
      ).rows as { day: string; n: number }[];

      const [consumption] = (
        await tx.execute(sql`
          select
            coalesce(sum(-amount), 0)::int as tokens30,
            count(*)::int as calls30
          from token_transactions
          where amount < 0 and created_at > now() - interval '30 days'
        `)
      ).rows as [{ tokens30: number; calls30: number }];

      return { totals, active, plans, perDay, consumption };
    },
  );

  const maxDay = Math.max(1, ...stats.perDay.map((d) => d.n));

  return (
    <div className="space-y-6">
      {/* Usuarios */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {dict["admin.users"]}
        </h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <Card>
            <p className="text-xs text-zinc-500">{dict["admin.usersTotal"]}</p>
            <p className="mt-1 text-2xl font-bold">{stats.totals.total}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-500">{dict["admin.users7d"]}</p>
            <p className="mt-1 text-2xl font-bold">{stats.totals.new7}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-500">{dict["admin.users30d"]}</p>
            <p className="mt-1 text-2xl font-bold">{stats.totals.new30}</p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-500">{dict["admin.active7d"]}</p>
            <p className="mt-1 text-2xl font-bold">{stats.active.active7}</p>
          </Card>
        </div>
        <Card className="mt-3">
          <p className="mb-2 text-xs text-zinc-500">{dict["admin.byPlan"]}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            {stats.plans.map((p) => (
              <span key={p.plan}>
                <span className="capitalize text-zinc-400">{p.plan}:</span>{" "}
                <span className="font-bold">{p.n}</span>
              </span>
            ))}
          </div>
        </Card>
      </section>

      {/* Consumo IA */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          {dict["admin.ai"]}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs text-zinc-500">{dict["admin.aiTokens"]}</p>
            <p className="mt-1 text-2xl font-bold text-amber-300">
              {stats.consumption.tokens30}
            </p>
          </Card>
          <Card>
            <p className="text-xs text-zinc-500">{dict["admin.aiCost"]}</p>
            <p className="mt-1 text-2xl font-bold">
              ${(stats.consumption.calls30 * COST_PER_CALL_USD).toFixed(2)}
            </p>
          </Card>
          <KillSwitch
            initialEnabled={await isAiEnabled()}
            labels={{
              title: dict["admin.kill"],
              on: dict["admin.killOn"],
              off: dict["admin.killOff"],
              desc: dict["admin.killDesc"],
            }}
          />
        </div>
        <Card className="mt-3">
          <p className="mb-3 text-xs text-zinc-500">{dict["admin.aiPerDay"]}</p>
          {stats.perDay.length === 0 ? (
            <p className="text-sm text-zinc-600">—</p>
          ) : (
            <div className="flex h-28 items-end gap-1.5">
              {stats.perDay.map((d) => (
                <div
                  key={d.day}
                  className="flex flex-1 flex-col items-center gap-1"
                  title={`${d.day}: ${d.n}`}
                >
                  <span className="text-[10px] text-zinc-500">{d.n}</span>
                  <div
                    className="w-full rounded-t bg-amber-400/70"
                    style={{ height: `${(d.n / maxDay) * 70}px` }}
                  />
                  <span className="text-[9px] text-zinc-600">{d.day}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
