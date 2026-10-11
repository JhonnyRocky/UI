/** Project type × data mode settings. Mirrors cogniai/project_settings.py. */

export type ProjectType = "agent" | "llm" | "rag";
export type DataMode = "full" | "partial" | "generate";
export type EvaluationSource = "endpoint" | "file";
export type InteractionShape = "multi_turn" | "single_turn";
export type ResponseTransport = "http" | "websocket";

export function resolveProjectSettings(connectionArgs?: Record<string, any> | null) {
  const args = connectionArgs || {};
  const dataset = (args["dataset"] || {}) as Record<string, any>;
  const profile = (args["target_profile"] || {}) as Record<string, any>;

  let project_type: ProjectType = "agent";
  const explicitType = args["project_type"];
  if (explicitType === "agent" || explicitType === "llm" || explicitType === "rag") {
    project_type = explicitType;
  }

  let data_mode: DataMode = "generate";
  const explicitMode = args["data_mode"];
  if (explicitMode === "full" || explicitMode === "partial" || explicitMode === "generate") {
    data_mode = explicitMode;
  }

  let interaction_shape: InteractionShape =
    profile["interaction_shape"] === "single_turn" || args["interaction_shape"] === "single_turn"
      ? "single_turn"
      : "multi_turn";
  if (project_type === "llm" || project_type === "rag") interaction_shape = "single_turn";

  if (data_mode === "full" && project_type === "agent" && interaction_shape === "multi_turn") {
    data_mode = "partial";
  }

  let evaluation_source: EvaluationSource =
    args["evaluation_source"] === "file" || dataset["evaluation_source"] === "file" ? "file" : "endpoint";
  if (data_mode !== "full") evaluation_source = "endpoint";

  const transportRaw = dataset["transport"] || profile["response_transport"] || args["transport"] || "http";
  const transport: ResponseTransport = transportRaw === "websocket" ? "websocket" : "http";

  const uses_dataset_journey =
    project_type === "llm" || project_type === "rag"
      ? true
      : interaction_shape === "single_turn" && (data_mode === "full" || data_mode === "partial");

  const dataset_kind = uses_dataset_journey
    ? project_type === "llm" || project_type === "rag"
      ? project_type
      : "agent"
    : null;

  return { project_type, data_mode, evaluation_source, interaction_shape, transport, uses_dataset_journey, dataset_kind };
}

export function buildConnectionArgs(input: {
  project_type: ProjectType;
  data_mode?: DataMode;
  interaction_shape?: InteractionShape;
  transport?: ResponseTransport;
}): Record<string, any> {
  const project_type = input.project_type;
  let data_mode: DataMode = input.data_mode ?? "generate";
  let interaction_shape: InteractionShape = input.interaction_shape ?? "multi_turn";
  const transport: ResponseTransport = input.transport ?? "http";
  if (project_type === "llm" || project_type === "rag") interaction_shape = "single_turn";
  if (data_mode === "full" && project_type === "agent" && interaction_shape === "multi_turn") {
    data_mode = "partial";
  }
  const evaluation_source: EvaluationSource = data_mode === "full" ? "file" : "endpoint";
  const uses_dataset = project_type === "llm" || project_type === "rag"
    ? true
    : interaction_shape === "single_turn" && (data_mode === "full" || data_mode === "partial");
  const kind = uses_dataset ? (project_type === "agent" ? "agent" : project_type) : null;
  const args: Record<string, any> = {
    project_type,
    data_mode,
    evaluation_source,
    target_profile: {
      interaction_shape,
      response_transport: transport,
      session_strategy: "stateless",
      identity_strategy: "synthetic",
    },
  };
  if (uses_dataset && kind) {
    args["mode"] = "dataset";
    args["dataset"] = { target_kind: kind, transport, evaluation_source };
  }
  return args;
}

export function projectKindLabel(project: { connection_args?: any }): string {
  const s = resolveProjectSettings(project.connection_args);
  const typeLabel =
    s.project_type === "agent"
      ? `Agent · ${s.interaction_shape === "multi_turn" ? "Conversational" : "Single-turn"}`
      : s.project_type === "llm"
        ? "LLM"
        : "RAG";
  const modeLabel =
    s.data_mode === "generate" ? "from PRDs" : s.data_mode === "partial" ? "partial dataset" : "full dataset";
  const wire = s.evaluation_source === "file" ? "file" : s.transport === "websocket" ? "WebSocket" : "HTTP";
  return `${typeLabel} · ${modeLabel} · ${wire}`;
}
