import { redirect } from "next/navigation";
import type { Plan, SubscriptionStatus } from "@prisma/client";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateUserSubscription } from "@/app/admin/actions";

const plans: Plan[] = ["FREE", "STARTER", "GROWTH", "PRO"];
const statuses: SubscriptionStatus[] = ["NONE", "ACTIVE", "PAST_DUE", "CANCELLED"];

async function requireAdminUser() {
  const user = await requireAppUser();

  if (user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  return user;
}

export default async function AdminPage({
  searchParams
}: {
  searchParams?: Promise<{ q?: string; message?: string }>;
}) {
  await requireAdminUser();

  const params = await searchParams;
  const query = params?.q?.trim() || "";
  const message = params?.message || "";

  const userWhere = query
    ? {
        OR: [
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } }
        ]
      }
    : {};

  const [userCount, reportCount, paidUsers, users] = await Promise.all([
    prisma.user.count(),
    prisma.report.count(),
    prisma.user.count({
      where: {
        subscriptionStatus: "ACTIVE"
      }
    }),
    prisma.user.findMany({
      where: userWhere,
      orderBy: { updatedAt: "desc" },
      take: 25,
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { reports: true }
        }
      }
    })
  ]);

  const messageText =
    message === "updated"
      ? "Subscription updated."
      : message === "not-found"
        ? "No user found for that email."
        : message === "missing-user"
          ? "Enter an email or choose a user."
          : "";

  return (
    <main className="min-h-screen bg-gray-50 p-6 text-slate-950">
      <div className="mx-auto max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
          <h1 className="mt-2 text-4xl font-bold">ProfitLens Admin</h1>
          <p className="mt-2 text-sm text-slate-500">
            Search users, grant paid plans, downgrade access, or cancel manual subscriptions.
          </p>
        </div>

        {messageText && (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            {messageText}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <StatCard label="Total users" value={userCount} />
          <StatCard label="Paid users" value={paidUsers} />
          <StatCard label="Reports created" value={reportCount} />
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.4fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-xl font-bold">Grant Plan By Email</h2>
            <p className="mt-2 text-sm text-slate-500">
              Use this for manual access, free trials, influencer accounts, or support fixes.
            </p>

            <form action={updateUserSubscription} className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-slate-600">User email</span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="customer@example.com"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
                />
              </label>

              <AdminSelect label="Plan" name="plan" values={plans} defaultValue="STARTER" />
              <AdminSelect label="Subscription status" name="subscriptionStatus" values={statuses} defaultValue="ACTIVE" />

              <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
                Update Subscription
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-bold">Users</h2>
                <p className="mt-1 text-sm text-slate-500">Showing latest 25 users or search results.</p>
              </div>

              <form className="flex gap-2" action="/admin">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search email or name"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-emerald-400 md:w-64"
                />
                <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
                  Search
                </button>
              </form>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-slate-500">
                    <th className="py-3 font-medium">User</th>
                    <th className="font-medium">Current Access</th>
                    <th className="font-medium">Reports</th>
                    <th className="font-medium">Updated</th>
                    <th className="font-medium">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((appUser) => (
                    <tr key={appUser.id} className="border-b border-slate-100 last:border-none">
                      <td className="py-4">
                        <p className="font-semibold text-slate-900">{appUser.email || "No email"}</p>
                        <p className="text-xs text-slate-500">{appUser.name || "Unnamed user"}</p>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                            {appUser.plan}
                          </span>
                          <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                            {appUser.subscriptionStatus}
                          </span>
                        </div>
                      </td>
                      <td>{appUser._count.reports}</td>
                      <td className="text-slate-500">{appUser.updatedAt.toLocaleDateString()}</td>
                      <td>
                        <form action={updateUserSubscription} className="flex flex-wrap gap-2">
                          <input type="hidden" name="userId" value={appUser.id} />
                          <select
                            name="plan"
                            defaultValue={appUser.plan}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs"
                          >
                            {plans.map((plan) => (
                              <option key={plan} value={plan}>
                                {plan}
                              </option>
                            ))}
                          </select>
                          <select
                            name="subscriptionStatus"
                            defaultValue={appUser.subscriptionStatus}
                            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs"
                          >
                            {statuses.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <button className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                            Save
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}

                  {users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p className="text-sm text-gray-500">{label}</p>
      <h2 className="mt-2 text-4xl font-bold">{value}</h2>
    </div>
  );
}

function AdminSelect({
  label,
  name,
  values,
  defaultValue
}: {
  label: string;
  name: string;
  values: readonly string[];
  defaultValue: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-emerald-400"
      >
        {values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
