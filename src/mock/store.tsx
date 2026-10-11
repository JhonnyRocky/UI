import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import {
  buildConversation,
  buildEvaluations,
  buildRun,
  customMetrics,
  datasetCases,
  metrics as standardMetrics,
  personas as seedPersonas,
  projects as seedProjects,
  runs as seedRuns,
  scenarios as seedScenarios,
  testProfiles as seedProfiles,
  type MockConversation,
  type MockEvaluations,
  type MockMetric,
  type MockPersona,
  type MockProject,
  type MockRun,
  type MockScenario,
  type MockTestProfile,
} from "@/mock/data";

let counter = 1000;
const nextId = (prefix: string) => `${prefix}-${++counter}`;

type StoreValue = {
  projects: MockProject[];
  metrics: MockMetric[];
  personas: MockPersona[];
  testProfiles: MockTestProfile[];
  datasetCases: typeof datasetCases;
  getProject: (id: string) => MockProject | undefined;
  getScenarios: (projectId: string) => MockScenario[];
  getRuns: (projectId: string) => MockRun[];
  getEvaluations: (projectId: string, runId: string) => MockEvaluations;
  getConversation: (scenarioId: string) => MockConversation;
  createProject: (input: Partial<MockProject>) => MockProject;
  updateProject: (id: string, patch: Partial<MockProject>) => void;
  deleteProject: (id: string) => void;
  duplicateProject: (id: string) => MockProject | undefined;
  createMetric: (body: Partial<MockMetric>) => void;
  updateMetric: (id: string, body: Partial<MockMetric>) => void;
  deleteMetric: (id: string) => void;
  createPersona: (body: Partial<MockPersona>) => void;
  updatePersona: (id: string, body: Partial<MockPersona>) => void;
  deletePersona: (id: string) => void;
  createTestProfile: (body: Partial<MockTestProfile>) => MockTestProfile;
  updateTestProfile: (id: string, body: Partial<MockTestProfile>) => void;
  deleteTestProfile: (id: string) => void;
  duplicateTestProfile: (id: string) => void;
  updateScenario: (projectId: string, scenarioId: string, patch: Partial<MockScenario>) => void;
  generateScenarios: (projectId: string, count?: number) => void;
  importScenarios: (projectId: string, count?: number) => void;
  startRun: (projectId: string, scenarioIds: string[], metricIds: string[], concurrency: number) => MockRun;
};

const StoreContext = createContext<StoreValue | null>(null);

const generatedTitles = [
  "Complaint about late delivery",
  "Discount code not working",
  "Change shipping address",
  "Loyalty points missing",
  "Return label request",
  "Gift wrapping question",
  "Bulk order enquiry",
  "Warranty claim",
  "Account email change",
  "Subscription pause",
];

export function MockStoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<MockProject[]>(seedProjects);
  const [metrics, setMetrics] = useState<MockMetric[]>([...standardMetrics, ...customMetrics]);
  const [personas, setPersonas] = useState<MockPersona[]>(seedPersonas);
  const [testProfiles, setTestProfiles] = useState<MockTestProfile[]>(seedProfiles);
  const [scenarioMap, setScenarioMap] = useState<Record<string, MockScenario[]>>(seedScenarios);
  const [runMap, setRunMap] = useState<Record<string, MockRun[]>>(seedRuns);
  const [conversationMap, setConversationMap] = useState<Record<string, MockConversation>>({});

  const getProject = useCallback((id: string) => projects.find((p) => p.id === id), [projects]);
  const getScenarios = useCallback((projectId: string) => scenarioMap[projectId] ?? [], [scenarioMap]);
  const getRuns = useCallback((projectId: string) => runMap[projectId] ?? [], [runMap]);

  const getEvaluations = useCallback(
    (projectId: string, runId: string): MockEvaluations => {
      const run = (runMap[projectId] ?? []).find((r) => r.id === runId);
      if (!run) return { overall: null, scenarios: [] };
      const list = scenarioMap[projectId] ?? [];
      const runMetrics = metrics.filter((m) => run.config.metric_ids.includes(m.metric_id));
      return buildEvaluations(run, list, runMetrics);
    },
    [runMap, scenarioMap, metrics],
  );

  const getConversation = useCallback(
    (scenarioId: string): MockConversation => {
      const existing = conversationMap[scenarioId];
      if (existing) return existing;
      const all = Object.values(scenarioMap).flat();
      const scenario = all.find((s) => s.scenario_id === scenarioId);
      return scenario ? buildConversation(scenario) : { end_reason: "goal_met", turns: [] };
    },
    [conversationMap, scenarioMap],
  );

  const createProject: StoreValue["createProject"] = useCallback((input) => {
    const created: MockProject = {
      id: nextId("p"),
      name: input.name || "Untitled project",
      description: input.description || "",
      created_at: new Date().toISOString(),
      connection_args: input.connection_args || { project_type: "agent" },
      score: null,
      scenario_count: 0,
      run_count: 0,
    };
    setProjects((cur) => [created, ...cur]);
    setScenarioMap((cur) => ({ ...cur, [created.id]: [] }));
    setRunMap((cur) => ({ ...cur, [created.id]: [] }));
    return created;
  }, []);

  const updateProject: StoreValue["updateProject"] = useCallback((id, patch) => {
    setProjects((cur) => cur.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }, []);

  const deleteProject: StoreValue["deleteProject"] = useCallback((id) => {
    setProjects((cur) => cur.filter((p) => p.id !== id));
  }, []);

  const duplicateProject: StoreValue["duplicateProject"] = useCallback(
    (id) => {
      const source = projects.find((p) => p.id === id);
      if (!source) return undefined;
      const created = createProject({
        name: `${source.name} (copy)`,
        description: source.description,
        connection_args: source.connection_args,
      });
      return created;
    },
    [projects, createProject],
  );

  const createMetric: StoreValue["createMetric"] = useCallback((body) => {
    const id = nextId("m");
    setMetrics((cur) => [
      ...cur,
      {
        id,
        metric_id: id,
        name: body.name || "Custom metric",
        category: body.category || "custom",
        stream: body.stream || "chat",
        description: body.description || "",
        is_custom: true,
        is_recommended: false,
        tags: [],
        threshold: body.rubric?.pass_threshold ?? null,
        rubric: body.rubric,
      },
    ]);
  }, []);

  const updateMetric: StoreValue["updateMetric"] = useCallback((id, body) => {
    setMetrics((cur) => cur.map((m) => (m.metric_id === id ? { ...m, ...body, threshold: body.rubric?.pass_threshold ?? m.threshold } : m)));
  }, []);

  const deleteMetric: StoreValue["deleteMetric"] = useCallback((id) => {
    setMetrics((cur) => cur.filter((m) => m.metric_id !== id));
  }, []);

  const createPersona: StoreValue["createPersona"] = useCallback((body) => {
    setPersonas((cur) => [...cur, { id: nextId("pe"), persona_name: body.persona_name || "New persona", stream: body.stream || "chat", description: body.description || "", prompt: body.prompt || "" }]);
  }, []);

  const updatePersona: StoreValue["updatePersona"] = useCallback((id, body) => {
    setPersonas((cur) => cur.map((p) => (p.id === id ? { ...p, ...body } : p)));
  }, []);

  const deletePersona: StoreValue["deletePersona"] = useCallback((id) => {
    setPersonas((cur) => cur.filter((p) => p.id !== id));
  }, []);

  const createTestProfile: StoreValue["createTestProfile"] = useCallback((body) => {
    const created: MockTestProfile = {
      id: nextId("tp"),
      name: body.name || "New profile",
      description: body.description || "",
      updated_at: new Date().toISOString(),
      fields: (body.fields as any) || [],
      rows: (body.rows as any) || [],
    };
    setTestProfiles((cur) => [created, ...cur]);
    return created;
  }, []);

  const updateTestProfile: StoreValue["updateTestProfile"] = useCallback((id, body) => {
    setTestProfiles((cur) => cur.map((p) => (p.id === id ? { ...p, ...body, updated_at: new Date().toISOString() } : p)));
  }, []);

  const deleteTestProfile: StoreValue["deleteTestProfile"] = useCallback((id) => {
    setTestProfiles((cur) => cur.filter((p) => p.id !== id));
  }, []);

  const duplicateTestProfile: StoreValue["duplicateTestProfile"] = useCallback((id) => {
    setTestProfiles((cur) => {
      const source = cur.find((p) => p.id === id);
      if (!source) return cur;
      return [{ ...source, id: nextId("tp"), name: `${source.name} (copy)`, updated_at: new Date().toISOString() }, ...cur];
    });
  }, []);

  const updateScenario: StoreValue["updateScenario"] = useCallback((projectId, scenarioId, patch) => {
    setScenarioMap((cur) => ({
      ...cur,
      [projectId]: (cur[projectId] ?? []).map((s) => (s.scenario_id === scenarioId ? { ...s, ...patch } : s)),
    }));
  }, []);

  const generateScenarios: StoreValue["generateScenarios"] = useCallback(
    (projectId, count = 6) => {
      const existing = scenarioMap[projectId] ?? [];
      const personasList = seedPersonas.map((p) => p.persona_name);
      const added: MockScenario[] = Array.from({ length: count }, (_, i) => {
        const id = nextId("s");
        return {
          id,
          scenario_id: id,
          title: generatedTitles[(existing.length + i) % generatedTitles.length]!,
          description: "Generated from your product brief.",
          persona: personasList[(existing.length + i) % personasList.length]!,
          category: "Core Flow",
          max_turns: 8,
          input: "Hi, I need help with my recent order.",
          user_behavior: ["Describe the issue clearly.", "If the agent stalls, ask for a ticket number."],
          desired_output: "• Resolve the issue with a concrete next step.\n• Stay on brand.",
          status: "pending",
        };
      });
      setScenarioMap((cur) => ({ ...cur, [projectId]: [...(cur[projectId] ?? []), ...added] }));
      setProjects((cur) => cur.map((p) => (p.id === projectId ? { ...p, scenario_count: (p.scenario_count ?? 0) + count } : p)));
    },
    [scenarioMap],
  );

  const importScenarios: StoreValue["importScenarios"] = useCallback(
    (projectId, count = 4) => {
      const existing = scenarioMap[projectId] ?? [];
      const added: MockScenario[] = Array.from({ length: count }, (_, i) => {
        const id = nextId("s");
        return {
          id,
          scenario_id: id,
          title: `Imported case ${existing.length + i + 1}`,
          description: "Imported from a case file.",
          persona: "",
          category: "Dataset",
          max_turns: 1,
          input: `Imported input ${existing.length + i + 1}`,
          user_behavior: [],
          desired_output: "• Expected output from the file.",
          status: "pending",
        };
      });
      setScenarioMap((cur) => ({ ...cur, [projectId]: [...(cur[projectId] ?? []), ...added] }));
      setProjects((cur) => cur.map((p) => (p.id === projectId ? { ...p, scenario_count: (p.scenario_count ?? 0) + count } : p)));
    },
    [scenarioMap],
  );

  const startRun: StoreValue["startRun"] = useCallback(
    (projectId, scenarioIds, metricIds, concurrency) => {
      const list = scenarioMap[projectId] ?? [];
      const runsForProject = runMap[projectId] ?? [];
      const runNumber = runsForProject.length + 1;
      const selected = list.map((s) => (scenarioIds.includes(s.scenario_id) ? { ...s, status: "completed" } : s));
      const created = buildRun(projectId, runNumber, selected, metricIds);
      created.config.concurrency = concurrency;
      created.config.scenario_ids = scenarioIds;
      created.scenarios = created.scenarios.map((rs) => ({
        ...rs,
        status: scenarioIds.includes(rs.scenario_id) ? "completed" : "queued",
        conversation_path: scenarioIds.includes(rs.scenario_id) ? `conversations/${rs.scenario_id}.json` : null,
      }));
      setRunMap((cur) => ({ ...cur, [projectId]: [created, ...(cur[projectId] ?? [])] }));
      setProjects((cur) => cur.map((p) => (p.id === projectId ? { ...p, run_count: (p.run_count ?? 0) + 1 } : p)));
      return created;
    },
    [scenarioMap, runMap],
  );

  const value = useMemo<StoreValue>(
    () => ({
      projects,
      metrics,
      personas,
      testProfiles,
      datasetCases,
      getProject,
      getScenarios,
      getRuns,
      getEvaluations,
      getConversation,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      createMetric,
      updateMetric,
      deleteMetric,
      createPersona,
      updatePersona,
      deletePersona,
      createTestProfile,
      updateTestProfile,
      deleteTestProfile,
      duplicateTestProfile,
      updateScenario,
      generateScenarios,
      importScenarios,
      startRun,
    }),
    [
      projects,
      metrics,
      personas,
      testProfiles,
      getProject,
      getScenarios,
      getRuns,
      getEvaluations,
      getConversation,
      createProject,
      updateProject,
      deleteProject,
      duplicateProject,
      createMetric,
      updateMetric,
      deleteMetric,
      createPersona,
      updatePersona,
      deletePersona,
      createTestProfile,
      updateTestProfile,
      deleteTestProfile,
      duplicateTestProfile,
      updateScenario,
      generateScenarios,
      importScenarios,
      startRun,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside MockStoreProvider");
  return ctx;
}
