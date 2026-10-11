export type Band = "green" | "amber" | "red" | "pending";

export function band(score: number | null | undefined): Band {
  if (score == null) return "pending";
  if (score >= 0.8) return "green";
  if (score >= 0.5) return "amber";
  return "red";
}

export function pct(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${Math.round(score * 100)}%`;
}

export function raw(score: number | null | undefined): string {
  if (score == null) return "—";
  return score.toFixed(2);
}

export const bandClasses: Record<Band, string> = {
  green: "bg-success/12 text-success border-success/30",
  amber: "bg-warning/15 text-warning-foreground dark:text-warning border-warning/40",
  red: "bg-destructive/10 text-destructive border-destructive/30",
  pending: "bg-muted text-muted-foreground border-border",
};

export function bandClass(score: number | null | undefined) {
  return bandClasses[band(score)];
}

const FAILURE_BY_STATUS: Record<string, string> = {
  target_error: "The target agent could not be reached.",
  timeout: "The target agent did not respond before the timeout.",
  simulator_error: "The simulated user failed before the conversation finished.",
  interrupted: "This test was interrupted before it finished.",
  cancelled: "This test was cancelled.",
  failed: "This test failed before a score was recorded.",
};

function friendlyFailure(status?: string | null): string | null {
  if (!status) return null;
  return FAILURE_BY_STATUS[status] ?? null;
}

/** Why a finished test has no scores. Busy rows return null. */
export function failureNote(row: {
  status?: string | null;
  conversation_status?: string | null;
  end_reason?: string | null;
  scores?: { status?: string | null; error?: string | null; reason?: string | null }[] | null;
} | null | undefined): string | null {
  if (!row) return null;
  const status = row.status || "";
  const conversation = row.conversation_status || "";
  if (status === "queued" || status === "in_progress" || status === "scoring" || status === "running") return null;
  const failed =
    status === "failed" ||
    status === "cancelled" ||
    conversation === "target_error" ||
    conversation === "timeout" ||
    conversation === "simulator_error" ||
    conversation === "interrupted" ||
    conversation === "failed";
  const scoreProblem = (row.scores ?? []).find(
    (score) => score && score.status && score.status !== "ok" && (score.error || score.reason),
  );
  if (!failed && !scoreProblem) return null;
  if (scoreProblem?.error) return scoreProblem.error;
  const specific = (row.end_reason || "").trim();
  if (specific && !["goal_met", "gave_up", "stuck"].includes(specific) && !/^Conversation status '/.test(specific)) return specific;
  const reason = (scoreProblem?.reason || "").trim();
  if (reason && !/^Conversation status '/.test(reason) && reason !== "No conversation turns recorded") return reason;
  return friendlyFailure(conversation) || friendlyFailure(status) || "This test failed before a score was recorded.";
}
