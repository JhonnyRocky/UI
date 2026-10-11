import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ScoreBadge } from "@/components/badges";
import { ConnectStep } from "@/components/journey/ConnectStep";
import { ScenariosStep } from "@/components/journey/ScenariosStep";
import { SelectStep } from "@/components/journey/SelectStep";
import { ResultsStep } from "@/components/journey/ResultsStep";
import { DatasetJourney } from "@/components/journey/DatasetJourney";
import { useNavigate } from "@/lib/nav";
import { resolveProjectSettings } from "@/lib/projectSettings";
import { cn } from "@/lib/utils";
import { useStore } from "@/mock/store";

const STEPS = [
  { key: "connect", label: "Connect assistant" },
  { key: "scenarios", label: "Create tests" },
  { key: "select", label: "Choose tests" },
  { key: "metrics", label: "Choose metrics" },
  { key: "results", label: "Results" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];
type SetupStep = Exclude<StepKey, "results">;
const SETUP_STEPS = STEPS.filter((s): s is (typeof STEPS)[number] & { key: SetupStep } => s.key !== "results");

function isSetupStep(step: string): step is SetupStep {
  return step === "connect" || step === "scenarios" || step === "select" || step === "metrics";
}

export function ProjectDetailPage({ projectId }: { projectId: string }) {
  const { go } = useNavigate();
  const { getProject, getRuns, generateScenarios, importScenarios } = useStore();
  const project = getProject(projectId);
  const runs = getRuns(projectId);

  const hasTarget = !!project?.connection_args?.request_template || !!project?.connection_args?.target_profile;
  const hasScenarios = (project?.scenario_count ?? 0) > 0;
  const hasRuns = runs.length > 0;

  const initialStep: StepKey = hasRuns ? "results" : hasScenarios ? "select" : "connect";
  const [step, setStep] = useState<StepKey>(initialStep);
  const [editMode, setEditMode] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  if (!project) {
    return (
      <AppShell>
        <p className="text-sm text-muted-foreground">Project not found.</p>
        <button className="mt-4 text-sm font-medium text-primary hover:underline" onClick={() => go({ name: "projects" })}>Back to projects</button>
      </AppShell>
    );
  }

  const doneMap: Record<StepKey, boolean> = {
    connect: hasTarget,
    scenarios: hasScenarios,
    select: hasScenarios,
    metrics: hasRuns,
    results: hasRuns,
  };
  const enabled: Record<StepKey, boolean> = {
    connect: true,
    scenarios: hasTarget,
    select: hasTarget,
    metrics: hasTarget && hasScenarios,
    results: hasRuns || step === "results",
  };

  const showSetup = step !== "results" || editMode;
  const stepperSteps = editMode ? SETUP_STEPS : STEPS;
  const settings = resolveProjectSettings(project.connection_args);

  return (
    <AppShell>
      <button onClick={() => go({ name: "projects" })} className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All projects
      </button>

      <div className="mb-8 border-b pb-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <h1 className="truncate font-display text-3xl font-semibold">{project.name}</h1>
          <ScoreBadge score={project.score} />
        </div>
        {project.description && <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>}
      </div>

      {settings.uses_dataset_journey ? (
        <DatasetJourney project={project} />
      ) : (
        <>
          {showSetup && (
            <ol className={cn("mb-7 grid grid-cols-2 gap-2", editMode ? "lg:grid-cols-4" : "sm:grid-cols-3 lg:grid-cols-5")}>
              {stepperSteps.map((s, i) => (
                <li key={s.key}>
                  <button
                    disabled={!enabled[s.key]}
                    onClick={() => setStep(s.key)}
                    className={cn("flex min-h-14 w-full items-center gap-3 rounded-lg border p-3 text-left text-sm shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-50", step === s.key ? "border-primary bg-primary/8" : "bg-card hover:bg-muted/50")}
                  >
                    <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold", doneMap[s.key] ? "bg-success text-success-foreground" : step === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {doneMap[s.key] ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className="font-medium">{s.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}

          {step === "connect" && <ConnectStep project={project} onDone={() => setStep("scenarios")} startAtCurl={editMode} />}

          {step === "scenarios" && (
            <ScenariosStep
              project={project}
              onGenerate={(payload) => {
                generateScenarios(project.id, payload.maxScenarios ?? 6);
                setStep("select");
              }}
              onImport={() => {
                importScenarios(project.id, 4);
                setStep("select");
              }}
            />
          )}

          {(step === "select" || step === "metrics") && (
            <SelectStep
              project={project}
              view={step === "metrics" ? "metrics" : "tests"}
              onContinue={() => setStep("metrics")}
              onStarted={(runId) => {
                setEditMode(false);
                setSelectedRunId(runId);
                setStep("results");
              }}
            />
          )}

          {step === "results" && (
            <ResultsStep
              project={project}
              runId={selectedRunId}
              onRunChange={setSelectedRunId}
              onEditAgain={() => {
                if (!hasRuns) return;
                setEditMode(true);
                setStep("connect");
              }}
            />
          )}
        </>
      )}
    </AppShell>
  );
}
