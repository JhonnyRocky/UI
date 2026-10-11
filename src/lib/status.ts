export type StatusTone = "running" | "completed" | "maxTurns" | "error" | "pending";

export const BUSY_EXECUTION_STATUSES = ["queued", "in_progress", "scoring"] as const;

export function isBusyExecutionStatus(status?: string | null): boolean {
  return !!status && (BUSY_EXECUTION_STATUSES as readonly string[]).includes(status);
}

export function statusTone(status?: string | null): StatusTone {
  switch (status) {
    case "running":
    case "in_progress":
    case "scoring":
      return "running";
    case "completed":
      return "completed";
    case "max_turns_reached":
      return "maxTurns";
    case "target_error":
    case "simulator_error":
    case "timeout":
    case "interrupted":
    case "failed":
    case "cancelled":
      return "error";
    default:
      return "pending";
  }
}

export const toneClasses: Record<StatusTone, string> = {
  running: "bg-info/12 text-info border-info/30",
  completed: "bg-success/12 text-success border-success/30",
  maxTurns: "bg-warning/15 text-warning-foreground dark:text-warning border-warning/40",
  error: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
};
