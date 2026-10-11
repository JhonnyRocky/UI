import { bandClass, raw } from "@/lib/scores";
import { toneClasses, statusTone } from "@/lib/status";
import { cn } from "@/lib/utils";

export function ScoreBadge({ score }: { score: number | null | undefined }) {
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums", bandClass(score))}>
      {raw(score)}
    </span>
  );
}

export function StatusBadge({ status }: { status?: string | null }) {
  return (
    <span className={cn("inline-flex rounded-md border px-2 py-0.5 text-xs font-medium", toneClasses[statusTone(status)])}>
      {(status || "pending").replace(/_/g, " ")}
    </span>
  );
}
