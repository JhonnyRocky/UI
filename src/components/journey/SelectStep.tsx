import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Loader2, Pencil, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Section } from "@/components/journey/Section";
import { metricShape, isSingleTurnProject } from "@/lib/metrics";
import { useStore } from "@/mock/store";
import type { MockProject, MockScenario } from "@/mock/data";

function toLines(v: unknown): string {
  return Array.isArray(v) ? v.join("\n") : "";
}
function fromLines(text: string): string[] {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function SelectStep({
  project,
  view,
  onContinue,
  onStarted,
}: {
  project: MockProject;
  view: "tests" | "metrics";
  onContinue: () => void;
  onStarted: (runId: string) => void;
}) {
  const { getScenarios, metrics, updateScenario, startRun } = useStore();
  const list = getScenarios(project.id);
  const singleTurn = isSingleTurnProject(project);

  const [selectedScenarios, setSelectedScenarios] = useState<string[]>(() => list.map((s) => s.scenario_id));
  const shapeMetrics = useMemo(() => metrics.filter((m) => metricShape(m) === (singleTurn ? "single_turn" : "multi_turn")), [metrics, singleTurn]);
  const recommended = shapeMetrics.filter((m) => m.is_recommended).map((m) => m.metric_id);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(recommended);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<MockScenario | null>(null);
  const [concurrency, setConcurrency] = useState(4);
  const [running, setRunning] = useState(false);

  const toggle = (lst: string[], id: string) => (lst.includes(id) ? lst.filter((x) => x !== id) : [...lst, id]);
  const generating = false;

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      const created = startRun(project.id, selectedScenarios, selectedMetrics, concurrency);
      setRunning(false);
      onStarted(created.id);
    }, 500);
  };

  const showTests = view === "tests";
  const showMetrics = view === "metrics";

  return (
    <div className="space-y-6">
      {generating && (
        <section className="flex flex-col items-center gap-4 rounded-xl border bg-card p-10 text-center">
          <Sparkles className="h-7 w-7 animate-pulse text-primary" />
          <p className="font-semibold">Test scenarios are generating…</p>
        </section>
      )}

      {showTests && list.length === 0 && (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">No test scenarios yet.</p>
      )}

      {showTests && list.length > 0 && (
        <Section title="Test scenarios" hint={singleTurn ? "Each one is a self-contained task sent as-is to your agent." : "Each one is a simulated user with a goal."}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium">{selectedScenarios.length} of {list.length} selected</p>
            <Button variant="ghost" size="sm" onClick={() => setSelectedScenarios(selectedScenarios.length === list.length ? [] : list.map((s) => s.scenario_id))}>
              {selectedScenarios.length === list.length ? "Clear" : "Select all"}
            </Button>
          </div>
          <div className="max-h-[60vh] divide-y overflow-y-auto rounded-lg border">
            {list.map((s) => {
              const isOpen = expandedId === s.scenario_id;
              return (
                <div key={s.scenario_id} className="space-y-1 p-3">
                  <div className="flex items-start gap-3">
                    <Checkbox className="mt-1" checked={selectedScenarios.includes(s.scenario_id)} onCheckedChange={() => setSelectedScenarios(toggle(selectedScenarios, s.scenario_id))} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{s.title}</p>
                      {s.description && <p className="mt-0.5 text-sm text-muted-foreground">{s.description}</p>}
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.persona}{s.category ? ` · ${s.category}` : ""}{singleTurn ? " · Single-turn" : s.max_turns != null ? ` · up to ${s.max_turns} turns` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" aria-label={isOpen ? "Collapse" : "Expand"} onClick={() => setExpandedId(isOpen ? null : s.scenario_id)}>
                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" aria-label={`Edit ${s.title}`} onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className="ml-7 space-y-4 rounded-md bg-muted/40 p-3.5 text-sm">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{singleTurn ? "Task Input" : "User Input"}</p>
                        <p className="mt-1 rounded bg-background/80 p-2.5 font-medium italic text-foreground">“{s.input || "(none)"}”</p>
                      </div>
                      {!singleTurn && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">User Behavior (Simulator Tactics)</p>
                          {s.user_behavior.length > 0 ? (
                            <ul className="mt-1 list-disc space-y-1 pl-5">{s.user_behavior.map((b, i) => <li key={i}>{b}</li>)}</ul>
                          ) : <p className="mt-1 text-xs text-muted-foreground">(none)</p>}
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Desired Output (Expected Behavior)</p>
                        <div className="mt-1 rounded bg-background/80 p-2.5">
                          <ul className="space-y-1.5 pl-1 text-xs">
                            {s.desired_output.split("\n").map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <span className="leading-relaxed">{item.replace(/^[-*•–—]\s+/, "")}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {showTests && list.length > 0 && (
        <div className="flex justify-end">
          <Button disabled={!selectedScenarios.length} onClick={onContinue}>{`Continue with ${selectedScenarios.length} test${selectedScenarios.length === 1 ? "" : "s"}`}</Button>
        </div>
      )}

      {showMetrics && (
        <Section title={`Scoring metrics (${selectedMetrics.length}/${shapeMetrics.length})`} hint={`${selectedScenarios.length} test${selectedScenarios.length === 1 ? "" : "s"} selected. What each ${singleTurn ? "task" : "conversation"} is judged on.`}>
          <div className="space-y-1">
            {shapeMetrics.map((m) => (
              <label key={m.metric_id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                <Checkbox className="mt-0.5" checked={selectedMetrics.includes(m.metric_id)} onCheckedChange={() => setSelectedMetrics(toggle(selectedMetrics, m.metric_id))} />
                <span>
                  <span className="block text-sm font-medium">{m.name}{m.threshold ? <span className="ml-2 text-xs font-normal text-muted-foreground">pass ≥ {Math.round(m.threshold * 100)}%</span> : null}</span>
                  <span className="text-xs text-muted-foreground">{m.description}</span>
                </span>
              </label>
            ))}
          </div>
        </Section>
      )}

      {showMetrics && (
        <div className="flex flex-wrap items-center justify-end gap-4 rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="conc">Run at once</Label>
            <Input id="conc" type="number" min={1} max={20} className="w-20" value={concurrency} onChange={(e) => setConcurrency(Math.max(1, Number(e.target.value)))} />
          </div>
          <ConfirmDialog
            title={`Run ${selectedScenarios.length} test${selectedScenarios.length === 1 ? "" : "s"}?`}
            description={
              <>
                This executes <strong>{selectedScenarios.length} scenario(s)</strong> against your target and scores each against <strong>{selectedMetrics.length} metric(s)</strong> — about <strong>{selectedScenarios.length * selectedMetrics.length} judge calls</strong> after the conversations finish.
              </>
            }
            confirmLabel={`Run ${selectedScenarios.length} test${selectedScenarios.length === 1 ? "" : "s"}`}
            pending={running}
            closeOnConfirm
            onConfirm={run}
            trigger={
              <Button disabled={!selectedScenarios.length || !selectedMetrics.length || running}>
                {running ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Play className="mr-1 h-4 w-4" />}
                Run {selectedScenarios.length} test{selectedScenarios.length === 1 ? "" : "s"}
              </Button>
            }
          />
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90vh] w-[95vw] max-w-3xl overflow-y-auto p-6 sm:max-w-4xl">
          <DialogHeader><DialogTitle>Edit test case</DialogTitle></DialogHeader>
          {editing && (
            <ScenarioForm
              key={editing.scenario_id}
              initial={editing}
              singleTurn={singleTurn}
              onSubmit={(body) => {
                updateScenario(project.id, editing.scenario_id, body);
                setEditing(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScenarioForm({
  initial,
  singleTurn,
  onSubmit,
}: {
  initial: MockScenario;
  singleTurn: boolean;
  onSubmit: (body: Partial<MockScenario>) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category || "Core Flow");
  const [persona, setPersona] = useState(initial.persona || "");
  const [maxTurns, setMaxTurns] = useState(String(initial.max_turns ?? 8));
  const [description, setDescription] = useState(initial.description || "");
  const [input, setInput] = useState(initial.input || "");
  const [userBehavior, setUserBehavior] = useState(toLines(initial.user_behavior));
  const [desiredOutput, setDesiredOutput] = useState(initial.desired_output || "");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title: title.trim(),
      category: category.trim() || "Core Flow",
      persona: persona.trim(),
      max_turns: singleTurn ? 1 : Math.min(30, Math.max(1, Number(maxTurns) || 8)),
      description: description.trim(),
      input: input.trim(),
      user_behavior: singleTurn ? [] : fromLines(userBehavior),
      desired_output: desiredOutput.trim(),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test title" autoFocus /></div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2"><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
        <div className="space-y-2"><Label>Persona</Label><Input value={persona} onChange={(e) => setPersona(e.target.value)} /></div>
        {!singleTurn && <div className="space-y-2"><Label>Max turns</Label><Input type="number" min={1} max={30} value={maxTurns} onChange={(e) => setMaxTurns(e.target.value)} /></div>}
      </div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-16" /></div>
      <div className="space-y-2"><Label>{singleTurn ? "Task Input" : "First user input"}</Label><Textarea value={input} onChange={(e) => setInput(e.target.value)} className="min-h-20" /></div>
      {!singleTurn && (
        <div className="space-y-2"><Label>User behavior / Simulator tactics (one per line)</Label><Textarea value={userBehavior} onChange={(e) => setUserBehavior(e.target.value)} className="min-h-28 font-mono text-xs" /></div>
      )}
      <div className="space-y-2"><Label>Desired output</Label><Textarea value={desiredOutput} onChange={(e) => setDesiredOutput(e.target.value)} className="min-h-28 text-sm" /></div>
      <DialogFooter><Button type="submit" disabled={!title.trim()}>Done</Button></DialogFooter>
    </form>
  );
}
