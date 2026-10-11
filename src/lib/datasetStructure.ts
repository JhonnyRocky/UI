/** Sample row structures shown in create + upload flows. */

export type StructureField = {
  key: string;
  placeholder: string;
  required: boolean;
  note?: string;
};

export type StructureKind =
  | "agent_conversational"
  | "agent_single_turn"
  | "llm"
  | "rag";

export type StructureMode = "partial" | "full";

export function resolveStructureKind(opts: {
  projectType?: "agent" | "llm" | "rag" | string;
  interactionShape?: "multi_turn" | "single_turn" | string;
  datasetKind?: "llm" | "rag" | "agent" | string | null;
}): StructureKind {
  if (opts.datasetKind === "llm" || opts.projectType === "llm") return "llm";
  if (opts.datasetKind === "rag" || opts.projectType === "rag") return "rag";
  if (opts.interactionShape === "single_turn" || opts.datasetKind === "agent") {
    return "agent_single_turn";
  }
  return "agent_conversational";
}

export function structureFields(
  kind: StructureKind,
  mode: StructureMode = "partial",
): StructureField[] {
  const withOutput =
    mode === "full"
      ? ([
          {
            key: "generated_answer",
            placeholder: "The model reply already in the file",
            required: true,
            note: "Required for full datasets — the model reply is scored directly",
          },
        ] as StructureField[])
      : [];

  if (kind === "agent_conversational") {
    return [
      {
        key: "input",
        placeholder: "How do I reset my password?",
        required: true,
        note: "First user message",
      },
      {
        key: "user_behavior",
        placeholder: "Ask once | If asked for the current password, refuse",
        required: true,
        note: "Pipe-separated simulator tactics",
      },
      {
        key: "expected_output",
        placeholder: "Guide the user to Account settings → Security",
        required: false,
      },
      ...withOutput,
    ];
  }

  if (kind === "agent_single_turn") {
    return [
      {
        key: "input",
        placeholder: "Extract the order id from: My order #48219 never arrived",
        required: true,
      },
      {
        key: "expected_output",
        placeholder: "48219",
        required: false,
      },
      ...withOutput,
    ];
  }

  if (kind === "llm") {
    return [
      {
        key: "input",
        placeholder: "How do I reset my password?",
        required: true,
      },
      {
        key: "expected_output",
        placeholder: "Open Account settings, choose Security, and send a reset link",
        required: false,
      },
      ...withOutput,
    ];
  }

  // rag
  return [
    {
      key: "input",
      placeholder: "How do I reset my password?",
      required: true,
      note: "Stored as query",
    },
    {
      key: "expected_output",
      placeholder: "Open Account settings under Security and email a reset link",
      required: mode === "full",
    },
    ...(mode === "full"
      ? ([
          {
            key: "context",
            placeholder: "Retrieved chunks already in the file",
            required: true,
            note: "For endpoint runs, context comes from the response mapping",
          },
        ] as StructureField[])
      : ([
          {
            key: "context",
            placeholder: "Supplied by the endpoint (contexts_path)",
            required: false,
            note: "Do not put retrieval context in the upload for endpoint runs",
          },
        ] as StructureField[])),
    ...withOutput,
  ];
}
