/** Lightweight mock fixtures for the CogniAI Test Lab UI mock. No backend. */

export type ConnectionArgs = Record<string, any>;

export type MockProject = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  connection_args: ConnectionArgs;
  score: number | null;
  scenario_count: number;
  run_count: number;
  test_data_mode?: "synthetic" | "profile";
  default_test_profile_id?: string | null;
  evaluation_selection?: { selected_scenario_ids: string[]; selected_metric_ids: string[] };
};

export type MockScenario = {
  id: string;
  scenario_id: string;
  title: string;
  description: string;
  persona: string;
  category: string;
  max_turns: number;
  input: string;
  user_behavior: string[];
  desired_output: string;
  status: string;
  identity_mode?: "synthetic" | "profile";
  identity_values?: Record<string, any>;
  identity_label?: string;
  test_profile_row_id?: string | null;
};

export type MockRunScenario = {
  scenario_id: string;
  execution_id: string;
  status: string;
  run_number: number;
  attempt: number;
  conversation_path: string | null;
};

export type MockRun = {
  id: string;
  run_number: number;
  attempt: number;
  status: string;
  created_at: string;
  config: { scenario_ids: string[]; metric_ids: string[]; concurrency: number };
  scenarios: MockRunScenario[];
};

export type MockScore = { metric_id: string; score: number | null; reason?: string };
export type MockEvalScenario = {
  scenario_id: string;
  execution_id: string;
  title: string;
  persona: string;
  turns: number;
  status: string;
  overall: number | null;
  evaluated: number;
  scores: MockScore[];
  highlights: string[];
  action_items: string[];
  reasoning: string;
};
export type MockEvaluations = { overall: number | null; scenarios: MockEvalScenario[] };

export type MockTurn = { role: "user" | "agent"; text: string };
export type MockConversation = { end_reason: string; turns: MockTurn[] };

export type MockMetric = {
  id: string;
  metric_id: string;
  name: string;
  category: string;
  stream: string;
  description: string;
  is_custom: boolean;
  is_recommended: boolean;
  tags: string[];
  threshold: number | null;
  rubric?: Record<string, any>;
};

export type MockPersona = {
  id: string;
  persona_name: string;
  stream: string;
  description: string;
  prompt: string;
};

export type MockField = {
  key: string;
  label: string;
  type: string;
  source: string;
  required: boolean;
  selected: boolean;
};
export type MockProfileRow = { id: string; values: Record<string, string | null> };
export type MockTestProfile = {
  id: string;
  name: string;
  description: string;
  updated_at: string;
  fields: MockField[];
  rows: MockProfileRow[];
};

export const now = new Date("2026-06-12T10:00:00Z");

const iso = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000).toISOString();

export const projects: MockProject[] = [
  {
    id: "p-support",
    name: "Support assistant",
    description: "Customer support agent for an online store. Order status, refunds, escalations.",
    created_at: iso(2),
    connection_args: {
      project_type: "agent",
      data_mode: "generate",
      evaluation_source: "endpoint",
      target_profile: { interaction_shape: "multi_turn", response_transport: "http", session_strategy: "stateless", identity_strategy: "synthetic" },
    },
    score: 0.82,
    scenario_count: 8,
    run_count: 2,
    test_data_mode: "synthetic",
  },
  {
    id: "p-billing",
    name: "Billing bot",
    description: "Handles billing questions with real customer profiles from a Test Profile.",
    created_at: iso(6),
    connection_args: {
      project_type: "agent",
      data_mode: "generate",
      evaluation_source: "endpoint",
      target_profile: { interaction_shape: "multi_turn", response_transport: "websocket", session_strategy: "stateless", identity_strategy: "synthetic" },
    },
    score: 0.64,
    scenario_count: 5,
    run_count: 1,
    test_data_mode: "profile",
    default_test_profile_id: "tp-staging",
  },
  {
    id: "p-task",
    name: "Task extraction agent",
    description: "Single-turn agent that extracts structured fields from free text.",
    created_at: iso(9),
    connection_args: {
      project_type: "agent",
      data_mode: "partial",
      evaluation_source: "endpoint",
      target_profile: { interaction_shape: "single_turn", response_transport: "http", session_strategy: "stateless", identity_strategy: "synthetic" },
      mode: "dataset",
      dataset: { target_kind: "agent", transport: "http", evaluation_source: "endpoint" },
    },
    score: null,
    scenario_count: 0,
    run_count: 0,
  },
  {
    id: "p-llm",
    name: "Prompt assistant",
    description: "Prompt-completion evaluation across a full dataset.",
    created_at: iso(14),
    connection_args: {
      project_type: "llm",
      data_mode: "generate",
      evaluation_source: "endpoint",
      target_profile: { interaction_shape: "single_turn", response_transport: "http", session_strategy: "stateless", identity_strategy: "synthetic" },
      mode: "dataset",
      dataset: { target_kind: "llm", transport: "http", evaluation_source: "endpoint" },
    },
    score: 0.91,
    scenario_count: 6,
    run_count: 3,
  },
  {
    id: "p-rag",
    name: "Support RAG",
    description: "Retrieve-and-answer assistant over the product knowledge base.",
    created_at: iso(20),
    connection_args: {
      project_type: "rag",
      data_mode: "partial",
      evaluation_source: "endpoint",
      target_profile: { interaction_shape: "single_turn", response_transport: "http", session_strategy: "stateless", identity_strategy: "synthetic" },
      mode: "dataset",
      dataset: { target_kind: "rag", transport: "http", evaluation_source: "endpoint" },
    },
    score: 0.74,
    scenario_count: 10,
    run_count: 2,
  },
  {
    id: "p-onboarding",
    name: "Onboarding agent",
    description: "Guides new users through setup with a friendly tone.",
    created_at: iso(27),
    connection_args: {
      project_type: "agent",
      data_mode: "generate",
      evaluation_source: "endpoint",
      target_profile: { interaction_shape: "multi_turn", response_transport: "http", session_strategy: "stateless", identity_strategy: "synthetic" },
    },
    score: 0.55,
    scenario_count: 4,
    run_count: 1,
  },
];

const supportScenarios: MockScenario[] = [
  ["Password reset", "User forgot their password and wants it reset.", "confused_new_user", "Account", 6,
    "Hi, I can't log in anymore — I think I forgot my password.",
    ["Ask once for the reset steps.", "If the agent asks for the current password, refuse and insist on an email reset."],
    "• Guide the user to Account settings → Security.\n• Never ask for the current password.\n• Offer to send a reset link by email."],
  ["Refund status", "User asks where their refund is after a return.", "impatient_customer", "Refunds", 8,
    "Where is my refund? I returned the shoes two weeks ago.",
    ["Stay polite but firm.", "If the agent stalls, ask for a ticket number."],
    "• Look up the order and state the refund policy clearly.\n• Give a concrete timeline.\n• Escalate if the refund is past the SLA."],
  ["Duplicate charge", "User was charged twice for one order.", "frustrated_customer", "Billing", 8,
    "I got charged twice for order #48219. Fix this now.",
    ["Demand a refund for the duplicate charge.", "If told to wait, ask for a supervisor."],
    "• Confirm the duplicate charge.\n• Offer a refund within 30 days per policy.\n• Stay calm with an angry user."],
  ["Cancel subscription", "User wants to cancel their subscription tomorrow.", "hesitant_user", "Account", 6,
    "I want to cancel my subscription. It ends tomorrow, right?",
    ["Confirm the cancellation.", "Ask whether a pause is available."],
    "• Explain the effective date clearly.\n• Do not schedule the cancellation without confirmation."],
  ["Fraud escalation", "User reports a suspicious transaction.", "worried_customer", "Security", 10,
    "There's a $900 charge I never made. Did my account get hacked?",
    ["Express urgency.", "Ask for next steps and whether the card is frozen."],
    "• Escalate suspected fraud to a human.\n• Advise freezing the card.\n• Do not speculate about the cause."],
  ["Order tracking", "User wants to track a shipment.", "busy_customer", "Orders", 4,
    "Can you tell me where my package is?",
    ["Provide the order number when asked."],
    "• Provide the tracking link.\n• State the estimated delivery date."],
  ["Damaged item", "User received a damaged item.", "disappointed_customer", "Returns", 8,
    "The mug arrived shattered. What are my options?",
    ["Ask for a replacement.", "Refuse to pay return shipping."],
    "• Apologize and offer a replacement or refund.\n• Do not ask the user to ship a broken item back."],
  ["Policy question", "User asks about the return window.", "curious_shopper", "Policy", 4,
    "How many days do I have to return something?",
    ["Ask for the exact policy."],
    "• State the 30-day return window.\n• Mention the item must be unused."],
].map(([title, description, persona, category, max_turns, input, user_behavior, desired_output], i) => {
  const id = `s-support-${i + 1}`;
  return {
    id,
    scenario_id: id,
    title: title as string,
    description: description as string,
    persona: persona as string,
    category: category as string,
    max_turns: max_turns as number,
    input: input as string,
    user_behavior: user_behavior as string[],
    desired_output: desired_output as string,
    status: i < 6 ? "completed" : "pending",
  } as MockScenario;
});

const billingScenarios: MockScenario[] = [
  ["Invoice question", "User asks about a line item on their invoice.", "detail_oriented_user", "Billing", 6,
    "Why was I charged $29 this month? It used to be $19.",
    ["Ask for a breakdown.", "Request the old plan back if possible."],
    "• Explain the plan change.\n• Offer to revert to the previous plan."],
  ["Payment method update", "User needs to update a card.", "non_technical_user", "Billing", 4,
    "My card expired. How do I add a new one?",
    ["Walk through the update step by step."],
    "• Guide the user to Billing → Payment methods.\n• Confirm the new card is saved."],
  ["Failed payment", "User's payment failed and account is limited.", "anxious_customer", "Billing", 8,
    "My payment failed and now I can't use my account. Help!",
    ["Ask how to restore access quickly."],
    "• Explain why the payment failed.\n• Provide a retry link."],
  ["Upgrade plan", "User wants to upgrade mid-cycle.", "ambitious_user", "Billing", 6,
    ["Ask about prorating."],
    "• Explain proration.\n• Confirm the new plan takes effect immediately."],
  ["Refund request", "User wants a refund for an unused month.", "polite_customer", "Refunds", 6,
    "I didn't use my account last month. Can I get a refund?",
    ["Ask once, accept the policy answer."],
    "• Check the refund policy.\n• Do not promise a refund outside policy."],
].map(([title, description, persona, category, max_turns, input, user_behavior, desired_output], i) => {
  const id = `s-billing-${i + 1}`;
  const values: Record<string, any> = { email: `customer${i + 1}@example.com`, customer_id: `cust-${1024 + i}`, session_id: "assigned at runtime" };
  return {
    id,
    scenario_id: id,
    title: title as string,
    description: description as string,
    persona: persona as string,
    category: category as string,
    max_turns: max_turns as number,
    input: (Array.isArray(input) ? input[0] : input) as string,
    user_behavior: user_behavior as string[],
    desired_output: desired_output as string,
    status: i < 3 ? "completed" : "pending",
    identity_mode: "profile",
    test_profile_row_id: `row-${i + 1}`,
    identity_values: values,
    identity_label: `email: customer${i + 1}@example.com`,
  } as MockScenario;
});

export const scenarios: Record<string, MockScenario[]> = {
  "p-support": supportScenarios,
  "p-billing": billingScenarios,
  "p-llm": Array.from({ length: 6 }, (_, i) => ({
    id: `s-llm-${i + 1}`,
    scenario_id: `s-llm-${i + 1}`,
    title: ["Summarize article", "Answer FAQ", "Rewrite tone", "Extract entities", "Translate", "Classify intent"][i]!,
    description: "Prompt-completion case from the dataset.",
    persona: "",
    category: "Dataset",
    max_turns: 1,
    input: `Prompt #${i + 1}: example input for the task.`,
    user_behavior: [],
    desired_output: "• Expected completion from the dataset.",
    status: i < 5 ? "completed" : "pending",
  })),
  "p-rag": Array.from({ length: 10 }, (_, i) => ({
    id: `s-rag-${i + 1}`,
    scenario_id: `s-rag-${i + 1}`,
    title: `RAG question ${i + 1}`,
    description: "Retrieve-and-answer case.",
    persona: "",
    category: "Dataset",
    max_turns: 1,
    input: `Question ${i + 1} about the product documentation.`,
    user_behavior: [],
    desired_output: "• Grounded answer with citation.",
    status: i < 8 ? "completed" : "pending",
  })),
};

export function buildRun(projectId: string, runNumber: number, list: MockScenario[], metricIds: string[], attemptsAgo = 0): MockRun {
  const scored = list.filter((s) => s.status === "completed");
  return {
    id: `${projectId}-run-${runNumber}`,
    run_number: runNumber,
    attempt: attemptsAgo,
    status: scored.length === list.length ? "completed" : "completed",
    created_at: iso(attemptsAgo + (3 - runNumber)),
    config: { scenario_ids: scored.map((s) => s.scenario_id), metric_ids: metricIds, concurrency: 4 },
    scenarios: list.map((s, i) => ({
      scenario_id: s.scenario_id,
      execution_id: `${s.scenario_id}-exec-${runNumber}`,
      status: i < scored.length ? "completed" : "queued",
      run_number: runNumber,
      attempt: attemptsAgo,
      conversation_path: i < scored.length ? `conversations/${s.scenario_id}.json` : null,
    })),
  };
}

export const runs: Record<string, MockRun[]> = {
  "p-support": [
    buildRun("p-support", 2, supportScenarios, ["m-empathy", "m-resolution", "m-policy", "m-tone", "m-escalation"]),
    buildRun("p-support", 1, supportScenarios.slice(0, 6), ["m-empathy", "m-resolution", "m-policy"]),
  ],
  "p-billing": [buildRun("p-billing", 1, billingScenarios, ["m-empathy", "m-resolution", "m-policy"])],
  "p-llm": [
    buildRun("p-llm", 3, scenarios["p-llm"]!, ["m-llm-correct", "m-llm-faithful", "m-llm-concise"]),
    buildRun("p-llm", 2, scenarios["p-llm"]!.slice(0, 5), ["m-llm-correct", "m-llm-faithful"]),
    buildRun("p-llm", 1, scenarios["p-llm"]!.slice(0, 4), ["m-llm-correct"]),
  ],
  "p-rag": [
    buildRun("p-rag", 2, scenarios["p-rag"]!, ["m-rag-relevance", "m-rag-grounded", "m-rag-correct", "m-rag-citation"]),
    buildRun("p-rag", 1, scenarios["p-rag"]!.slice(0, 8), ["m-rag-relevance", "m-rag-grounded"]),
  ],
  "p-onboarding": [buildRun("p-onboarding", 1, [
    { id: "s-onb-1", scenario_id: "s-onb-1", title: "Welcome flow", description: "", persona: "new_user", category: "Setup", max_turns: 6, input: "I just signed up. Where do I start?", user_behavior: ["Ask for the first step."], desired_output: "• Point to the setup checklist.", status: "completed" },
  ], ["m-empathy", "m-tone"])],
};

const metricDefs: [string, string, string, string, string, boolean, boolean, string[], number | null][] = [
  ["m-empathy", "Empathy", "Core", "chat", "Does the agent acknowledge the user's feelings before answering?", false, true, [], 0.75],
  ["m-resolution", "Resolution Accuracy", "Core", "chat", "Did the agent actually resolve the user's problem correctly?", false, true, [], 0.8],
  ["m-policy", "Policy Compliance", "Compliance", "chat", "Does the answer follow company policy without over-promising?", false, true, [], 0.8],
  ["m-tone", "Tone & Brand", "Quality", "chat", "Is the tone on-brand, professional and friendly?", false, false, [], 0.7],
  ["m-escalation", "Escalation Handling", "Core", "chat", "Does the agent escalate when it should?", false, true, [], 0.75],
  ["m-hallucination", "No Hallucination", "Compliance", "chat", "The agent must not invent facts it cannot verify.", false, false, ["programmatic"], 0.85],
  ["m-task-fidelity", "Task Fidelity", "Core", "single_turn", "Was the single-turn task completed as specified?", false, true, [], 0.8],
  ["m-format", "Format Compliance", "Quality", "single_turn", "Does the output match the required format?", false, true, ["programmatic"], 0.9],
  ["m-no-extra", "No Extra Fields", "Compliance", "single_turn", "The agent must not invent fields not present in the input.", false, false, [], 0.8],
  ["m-llm-correct", "Answer Correctness", "Core", "dataset_llm", "Is the completion correct relative to expected?", false, true, [], 0.8],
  ["m-llm-faithful", "Faithfulness", "Core", "dataset_llm", "Is the answer faithful to the prompt without inventing facts?", false, true, [], 0.8],
  ["m-llm-concise", "Conciseness", "Quality", "dataset_llm", "Is the answer appropriately concise?", false, false, [], 0.6],
  ["m-rag-relevance", "Retrieval Relevance", "Core", "dataset_rag", "Were the retrieved chunks relevant to the query?", false, true, [], 0.75],
  ["m-rag-grounded", "Groundedness", "Core", "dataset_rag", "Is the answer grounded in the retrieved context?", false, true, [], 0.85],
  ["m-rag-correct", "Answer Correctness", "Core", "dataset_rag", "Is the answer correct?", false, true, [], 0.8],
  ["m-rag-citation", "Citation Accuracy", "Quality", "dataset_rag", "Do citations point to the right sources?", false, false, ["programmatic"], 0.75],
];

export const metrics: MockMetric[] = metricDefs.map(([id, name, category, stream, description, is_custom, is_recommended, tags, threshold]) => ({
  id,
  metric_id: id,
  name,
  category,
  stream,
  description,
  is_custom,
  is_recommended,
  tags,
  threshold,
  rubric: { scale: "0.0-1.0", higher_is_better: true, pass_threshold: threshold ?? 0.75 },
}));

export const customMetrics: MockMetric[] = [
  {
    id: "m-brand-voice",
    metric_id: "m-brand-voice",
    name: "Brand voice",
    category: "custom",
    stream: "chat",
    description: "Does the agent sound like our brand — warm, concise, never robotic?",
    is_custom: true,
    is_recommended: false,
    tags: [],
    threshold: 0.7,
    rubric: { scale: "0.0-1.0", higher_is_better: true, pass_threshold: 0.7 },
  },
];

export const personas: MockPersona[] = [
  { id: "pe-1", persona_name: "Frustrated Customer", stream: "chat", description: "Has hit an issue and is not happy.", prompt: "Be direct and a little impatient. If the agent stalls, ask for a supervisor." },
  { id: "pe-2", persona_name: "Confused New User", stream: "chat", description: "Not technical, needs step-by-step help.", prompt: "Ask simple questions. Ask for clarification when the agent uses jargon." },
  { id: "pe-3", persona_name: "Impatient Customer", stream: "chat", description: "Wants a fast answer.", prompt: "Keep replies short. Push for a concrete timeline." },
  { id: "pe-4", persona_name: "Careful Privacy User", stream: "chat", description: "Refuses to share sensitive data.", prompt: "Never share passwords or card numbers. Challenge any request for them." },
  { id: "pe-5", persona_name: "Polite Shopper", stream: "chat", description: "Easy-going and cooperative.", prompt: "Be friendly and appreciative." },
  { id: "pe-6", persona_name: "Ambitious Buyer", stream: "chat", description: "Interested in upgrading.", prompt: "Ask about features and pricing, and negotiate." },
  { id: "pe-7", persona_name: "Angry Churn Risk", stream: "chat", description: "Threatening to cancel.", prompt: "Express frustration and mention competitors." },
  { id: "pe-8", persona_name: "Curious Shopper", stream: "chat", description: "Browsing before buying.", prompt: "Ask open questions about the product." },
];

export const testProfiles: MockTestProfile[] = [
  {
    id: "tp-staging",
    name: "Staging chat users",
    description: "Reusable identities for the staging assistant.",
    updated_at: iso(3),
    fields: [
      { key: "email", label: "Email", type: "email", source: "fixed", required: true, selected: true },
      { key: "customer_id", label: "Customer ID", type: "string", source: "fixed", required: true, selected: true },
      { key: "session_id", label: "Session ID", type: "uuid", source: "generated_uuid", required: false, selected: true },
    ],
    rows: [
      { id: "row-1", values: { email: "customer1@example.com", customer_id: "cust-1024" } },
      { id: "row-2", values: { email: "customer2@example.com", customer_id: "cust-1025" } },
      { id: "row-3", values: { email: "customer3@example.com", customer_id: "cust-1026" } },
      { id: "row-4", values: { email: "customer4@example.com", customer_id: "cust-1027" } },
      { id: "row-5", values: { email: "customer5@example.com", customer_id: "cust-1028" } },
    ],
  },
  {
    id: "tp-prod",
    name: "Production smoke users",
    description: "A small set for smoke tests against production.",
    updated_at: iso(11),
    fields: [
      { key: "email", label: "Email", type: "email", source: "fixed", required: true, selected: true },
      { key: "user_id", label: "User ID", type: "string", source: "fixed", required: true, selected: true },
    ],
    rows: [
      { id: "row-1", values: { email: "smoke1@example.com", user_id: "usr-1" } },
      { id: "row-2", values: { email: "smoke2@example.com", user_id: "usr-2" } },
    ],
  },
  {
    id: "tp-enterprise",
    name: "Enterprise accounts",
    description: "High-value accounts with custom fields.",
    updated_at: iso(19),
    fields: [
      { key: "email", label: "Email", type: "email", source: "fixed", required: true, selected: true },
      { key: "account_id", label: "Account ID", type: "string", source: "fixed", required: true, selected: true },
      { key: "session_id", label: "Session ID", type: "uuid", source: "generated_uuid", required: false, selected: true },
    ],
    rows: [
      { id: "row-1", values: { email: "ops@bigco.example.com", account_id: "acct-900" } },
    ],
  },
  {
    id: "tp-empty",
    name: "Empty shell",
    description: "Template with no users yet.",
    updated_at: iso(24),
    fields: [
      { key: "email", label: "Email", type: "email", source: "fixed", required: true, selected: true },
    ],
    rows: [],
  },
];

export function buildEvaluations(run: MockRun, list: MockScenario[], metricsForRun: MockMetric[]): MockEvaluations {
  const scoredIds = new Set(run.config.scenario_ids);
  const evScenarios: MockEvalScenario[] = list
    .filter((s) => scoredIds.has(s.scenario_id))
    .map((s, i) => {
      const scores = metricsForRun.map((m, j) => {
        const seed = (i * 7 + j * 13) % 10;
        const base = m.is_recommended ? 0.55 : 0.6;
        const score = Math.min(1, Math.max(0, base + seed / 12));
        return {
          metric_id: m.metric_id,
          score: Number(score.toFixed(2)),
          reason: score < 0.7 ? `Partial compliance for “${m.name}” at turn ${1 + (seed % 3)}.` : undefined,
        };
      });
      const overall = Number((scores.reduce((a, b) => a + (b.score ?? 0), 0) / scores.length).toFixed(2));
      return {
        scenario_id: s.scenario_id,
        execution_id: `${s.scenario_id}-exec-${run.run_number}`,
        title: s.title,
        persona: s.persona,
        turns: s.max_turns,
        status: "completed",
        overall,
        evaluated: scores.length,
        scores,
        highlights: ["Clear acknowledgement of the user's issue."],
        action_items: overall < 0.7 ? ["Tighten the refund policy wording.", "Ask for the order number earlier."] : [],
        reasoning: `Judged against ${scores.length} metrics.`,
      };
    });
  const overall = evScenarios.length
    ? Number((evScenarios.reduce((a, b) => a + (b.overall ?? 0), 0) / evScenarios.length).toFixed(2))
    : null;
  return { overall, scenarios: evScenarios };
}

export function buildConversation(scenario: MockScenario): MockConversation {
  return {
    end_reason: "goal_met",
    turns: [
      { role: "user", text: scenario.input },
      {
        role: "agent",
        text: `Thanks for reaching out — I'm sorry for the trouble. Let me take a look at “${scenario.title}” and get this sorted for you.`,
      },
      { role: "user", text: scenario.user_behavior[0] || "Okay, what do I do next?" },
      {
        role: "agent",
        text: "Here's what I can do right now. I'll walk you through it step by step, and you can stop me any time if something looks off.",
      },
      { role: "user", text: scenario.user_behavior[1] || "Got it, thanks." },
      {
        role: "agent",
        text: "You're all set. I've noted the details on your account — is there anything else I can help with today?",
      },
    ],
  };
}

export const datasetCases = Array.from({ length: 10 }, (_, i) => ({
  id: `case-${i + 1}`,
  input: `Dataset input ${i + 1}`,
  expected: `Expected output ${i + 1}`,
  generated: `Generated answer ${i + 1}`,
  selected: i < 8,
}));
