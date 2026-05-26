import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FeatureLock({
  title,
  description,
  requiredPlan = "Starter",
}: {
  title: string;
  description: string;
  requiredPlan?: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-600 shadow-sm">
        <Lock className="h-5 w-5" />
      </div>

      <h3 className="mt-4 font-bold text-slate-900">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        {description}
      </p>

      <Button className="mt-4 rounded-2xl bg-emerald-500 text-white hover:bg-emerald-600">
        Upgrade to {requiredPlan}
      </Button>
    </div>
  );
}