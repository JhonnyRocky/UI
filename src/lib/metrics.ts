export const SINGLE_TURN_STREAM = "single_turn";

export function metricShape(m: { stream?: string | null }): string {
  const value = m.stream ?? "chat";
  if (value.startsWith("dataset_")) return value;
  const stream = value === "text_based" ? "chat" : value;
  return stream === SINGLE_TURN_STREAM ? "single_turn" : "multi_turn";
}

export function isSingleTurnProject(project: any): boolean {
  return project?.connection_args?.target_profile?.interaction_shape === "single_turn";
}
