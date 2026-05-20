import { redirect } from "next/navigation";
import { requireAppUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const user = await requireAppUser();

  if (user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const [userCount, reportCount, paidUsers] = await Promise.all([
    prisma.user.count(),
    prisma.report.count(),
    prisma.user.count({
      where: {
        subscriptionStatus: "ACTIVE"
      }
    })
  ]);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold">ProfitLens Admin</h1>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Total users</p>
            <h2 className="mt-2 text-4xl font-bold">{userCount}</h2>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Paid users</p>
            <h2 className="mt-2 text-4xl font-bold">{paidUsers}</h2>
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm text-gray-500">Reports created</p>
            <h2 className="mt-2 text-4xl font-bold">{reportCount}</h2>
          </div>
        </div>
      </div>
    </main>
  );
}
