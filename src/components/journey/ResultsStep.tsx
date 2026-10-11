import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  MessageSquare,
  Pencil,
  Play,
  RefreshCw,
  Square,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge, StatusBadge } from "@/components/badges";
import { FieldSelect } from "@/components/FieldSelect";
import { Section } from "@/components/journey/Section";
import { RunSelect } from "@/components/journey/RunSelect";
import { TestSpecSummary } from "@/components/journey/TestSpecSummary";
import { band, raw, failureNote } from "@/lib/scores";
import { formatRunLabel, formatPersona } from "@/lib/format";
import { isBusyExecutionStatus } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useStore } from "@/mock/store";
import type { MockProject } from "@/mock/data";

export function ResultsStep({
  project,
  runId,
  onRunChange,
  onEditAgain,
}: {
  project: MockProject;
  runId: string | null;
  onRunChange: (id: string) => void;
  onEditAgain: () => void;
}) {
  const { getRuns, getEvaluations, getScenarios, metrics } = useStore();
  const runs = getRuns(project.id);
  const [localRunId, setLocalRunId] = useState<string | null>(null);
  const effectiveRunId = runId ?? localRunId;
  const current = effectiveRunId ?? runs[0]?.id ?? null;
  const selectRun = (id: string) => {
    setLocalRunId(id);
    onRunChange(id);
  };
  const currentRun = runs.find((r) => r.id === current);
  const latestRunNumber = Math.max(0, ...runs.map((r) => r.run_number ?? 0));
  const isLatestRun = (currentRun?.run_number ?? 0) === latestRunNumber && latestRunNumber > 0;

  const evals = current ? getEvaluations(project.id, current) : { overall: null, scenarios: [] };
  const evalById = new Map(evals.scenarios.map((s) => [s.scenario_id, s]));
  const catalog = getScenarios(project.id);
  const catalogById = new Map(catalog.map((s) => [s.scenario_id, s]));

  const metricCols = (currentRun?.config.metric_ids ?? []).map((id) => ({
    metric_id: id,
    name: metrics.find((m) => m.metric_id === id)?.name ?? id,
  }));

  const tableRows = useMemo(() => {
    if (!currentRun) return [];
    return currentRun.scenarios
      .filter((rs) => rs.conversation_path)
      .map((rs) => {
        const ev = evalById.get(rs.scenario_id);
        const cat = catalogById.get(rs.scenario_id);
        const scores = ev?.scores ?? [];
        const scoreDict: Record<string, number | null> = {};
        for (const sc of scores) scoreDict[sc.metric_id] = sc.score ?? null;
        return {
          scenario_id: rs.scenario_id,
          execution_id: rs.execution_id,
          run_number: rs.run_number,
          attempt: rs.attempt,
          title: ev?.title ?? cat?.title ?? rs.scenario_id,
          persona: ev?.persona ?? cat?.persona,
          turns: cat?.max_turns,
          status: rs.status,
          end_reason: "goal_met",
          conversation_status: rs.status,
          overall: ev?.overall ?? null,
          evaluated: ev?.evaluated ?? 0,
          scores,
          scoreDict,
          highlights: ev?.highlights ?? [],
          action_items: ev?.action_items ?? [],
          reasoning: ev?.reasoning ?? null,
        };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRun, evals, catalog]);

  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  if (!runs.length) {
    return <p className="rounded-xl border-dashed p-8 text-center text-sm text-muted-foreground">No runs yet.</p>;
  }

  const selectedRow = tableRows.find((r) => r.scenario_id === selectedScenarioId) ?? null;
  if (selectedRow) {
    return <ScenarioDetailView project={project} row={selectedRow} metricCols={metricCols} onBack={() => setSelectedScenarioId(null)} />;
  }

  const pageCount = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = tableRows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const metricAggs = metricCols.map((m) => {
    const vals = tableRows.map((r) => r.scoreDict[m.metric_id]).filter((v): v is number => typeof v === "number");
    return { ...m, mean: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null, scored: vals.length, total: tableRows.length };
  });
  const passedRows = tableRows.filter((r) => band(r.overall) === "green").length;
  const failedRows = tableRows.filter((r) => band(r.overall) === "red").length;

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-0 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5 lg:border-b-0 lg:border-r lg:py-3 lg:pl-4 lg:pr-5">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Run</span>
            {current && <RunSelect id="overall-run" runs={runs} value={current} onChange={selectRun} className="h-8 w-[7.5rem] shrink-0 text-xs" />}
            {!isLatestRun && <Badge variant="secondary" className="text-[10px] font-normal">Older</Badge>}
            {currentRun?.status && <StatusBadge status={currentRun.status} />}
            <span className="hidden text-xs text-muted-foreground sm:inline">{currentRun?.config.scenario_ids.length} tests</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 lg:gap-2 lg:pr-4">
            <Button variant="outline" size="sm" className="h-8" disabled={!isLatestRun} title={!isLatestRun ? "Open the latest run to edit setup." : undefined} onClick={onEditAgain}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit setup
            </Button>
            <Button variant="outline" size="sm" className="h-8" disabled={!isLatestRun} title={!isLatestRun ? "Open the latest run to re-evaluate." : undefined}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Re-evaluate
            </Button>
            <Button size="sm" className="h-8" disabled={!isLatestRun} title={!isLatestRun ? "Open the latest run to run again." : undefined}>
              <Play className="mr-1.5 h-3.5 w-3.5" /> Run again
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("rounded-xl border p-4 shadow-sm", { green: "border-success/30 bg-success/5", amber: "border-warning/40 bg-warning/10", red: "border-destructive/30 bg-destructive/5", pending: "bg-card" }[band(evals.overall)])}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex shrink-0 items-center gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Average score</p>
              <p className="text-3xl font-bold tabular-nums tracking-tight">{raw(evals.overall)}</p>
              <p className="text-[11px] tabular-nums text-muted-foreground">{tableRows.length > 0 ? `${tableRows.filter((r) => r.evaluated > 0).length}/${tableRows.length} scored` : "—"}</p>
            </div>
            {tableRows.length > 0 && (
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-2">
                <Badge variant="secondary" className="w-fit tabular-nums text-[11px]">{passedRows} passed</Badge>
                <Badge variant={failedRows > 0 ? "destructive" : "outline"} className="w-fit tabular-nums text-[11px]">{failedRows} failed</Badge>
              </div>
            )}
          </div>
          <div className="h-px bg-border lg:h-10 lg:w-px" aria-hidden />
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-0.5">
            {metricAggs.map((m) => (
              <div key={m.metric_id} className="min-w-[8.5rem] shrink-0 rounded-lg border bg-card px-2.5 py-2">
                <p className="flex items-center justify-between gap-2 text-xs font-medium"><span className="truncate">{m.name}</span><ScoreBadge score={m.mean} /></p>
                <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">{m.scored}/{m.total}</p>
              </div>
            ))}
            {!metricAggs.length && <p className="text-sm text-muted-foreground">Nothing scored yet.</p>}
          </div>
        </div>
      </div>

      <Section title="Tests" hint={isLatestRun ? "Select a row for conversation and scoring details." : "Switch to the latest run to run or re-score tests."}>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="sticky left-0 z-[1] bg-muted/95 py-2.5 pl-3 pr-3 font-medium backdrop-blur-sm">Test</th>
                <th className="py-2.5 pr-3 font-medium">Attempt</th>
                <th className="py-2.5 pr-3 font-medium">Status</th>
                {metricCols.map((m) => <th key={m.metric_id} className="py-2.5 pr-3 font-medium">{m.name}</th>)}
                <th className="py-2.5 pr-3 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((s) => {
                const note = failureNote(s);
                return (
                  <tr key={s.scenario_id} className="group cursor-pointer border-b last:border-0 hover:bg-muted/40" onClick={() => setSelectedScenarioId(s.scenario_id)}>
                    <td className="sticky left-0 z-[1] max-w-64 bg-card py-3 pl-3 pr-3 group-hover:bg-muted/40">
                      <div className="flex min-w-0 items-center gap-2 font-medium"><MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{s.title}</span></div>
                      {note && <p className="mt-1 text-xs text-destructive">{note}</p>}
                      <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                        {s.persona && <span className="truncate">{formatPersona(s.persona)}</span>}
                        {s.turns != null && <span>{s.turns} turns</span>}
                        <span>{s.evaluated} metric(s) scored</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-3 text-xs text-muted-foreground">{formatRunLabel(s.run_number, s.attempt)}</td>
                    <td className="py-3 pr-3"><StatusBadge status={s.status} /></td>
                    {metricCols.map((m) => (
                      <td key={m.metric_id} className="py-3 pr-3 tabular-nums">{raw(s.scoreDict[m.metric_id])}</td>
                    ))}
                    <td className="py-3 pr-3"><ScoreBadge score={s.overall} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">{tableRows.length} scenario{tableRows.length === 1 ? "" : "s"} · Page {safePage + 1} of {pageCount}</span>
          <span className="flex items-center gap-2">
            <FieldSelect value={String(pageSize)} onChange={(v) => { setPageSize(Number(v)); setPage(0); }} ariaLabel="Rows per page" options={[{ value: "10", label: "10 / page" }, { value: "20", label: "20 / page" }, { value: "50", label: "50 / page" }]} />
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Previous page" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Next page" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </span>
        </div>
      </Section>
    </div>
  );
}

function ScenarioDetailView({
  project,
  row,
  metricCols,
  onBack,
}: {
  project: MockProject;
  row: any;
  metricCols: { metric_id: string; name: string }[];
  onBack: () => void;
}) {
  const { getConversation, getScenarios } = useStore();
  const conversation = getConversation(row.scenario_id);
  const catalogRow = getScenarios(project.id).find((s) => s.scenario_id === row.scenario_id);
  const singleTurn = row.turns === 1;
  const [metricFilter, setMetricFilter] = useState<"all" | "failed" | "passed">("all");

  const chips = (row.scores ?? []).map((sc: any) => ({
    metric_id: sc.metric_id,
    name: metricCols.find((m) => m.metric_id === sc.metric_id)?.name ?? sc.metric_id,
    score: sc.score ?? null,
    reason: sc.reason ?? null,
  }));
  const failedChips = chips.filter((ch: any) => band(ch.score) === "red");
  const passedChips = chips.filter((ch: any) => band(ch.score) !== "red");
  const visibleChips = metricFilter === "failed" ? failedChips : metricFilter === "passed" ? passedChips : chips;

  const exportTrace = () => {
    const payload = { project: project.name, scenario: row, conversation, scores: row.scores, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-${row.scenario_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-card/95 px-3 py-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /><span className="hidden sm:inline">Results</span></Button>
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <span className={cn("size-2 shrink-0 rounded-full", band(row.overall) === "red" ? "bg-destructive" : band(row.overall) === "green" ? "bg-success" : "bg-warning")} />
            <span className="truncate">{row.title}</span>
          </span>
          <ScoreBadge score={row.overall} />
          <StatusBadge status={row.status} />
          <div className="ml-auto flex shrink-0 items-center gap-1">
            <Button variant="outline" size="sm" className="hidden h-8 sm:inline-flex" disabled><RefreshCw className="mr-1 h-3.5 w-3.5" />Score again</Button>
            <Button size="sm" className="h-8" disabled={!true}><Play className="mr-1 h-3.5 w-3.5" />Run again</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={exportTrace} title="Download JSON"><Download className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {row.persona && <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5"><User className="h-3 w-3" />{formatPersona(row.persona)}</span>}
          {catalogRow?.category && <span className="rounded bg-muted px-1.5 py-0.5">{catalogRow.category}</span>}
          <span className="rounded bg-muted px-1.5 py-0.5">{formatRunLabel(row.run_number, row.attempt)}</span>
        </div>
      </div>

      <TestSpecSummary
        isSingleTurn={singleTurn}
        input={catalogRow?.input}
        desiredOutput={catalogRow?.desired_output}
        userBehavior={catalogRow?.user_behavior}
        description={catalogRow?.description}
        persona={catalogRow?.persona}
        category={catalogRow?.category}
        collapsible
        defaultOpen
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Section title="Conversation" hint={`${conversation.turns.length} turns · ended: ${conversation.end_reason.replace(/_/g, " ")}`}>
          <div className="space-y-3">
            {conversation.turns.map((t, i) => (
              <div key={i} className={cn("flex", t.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm", t.role === "user" ? "bg-bubble-user text-bubble-user-foreground" : "border bg-card")}>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{t.role === "user" ? "Simulated user" : "Agent"}</p>
                  <p className="leading-relaxed">{t.text}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title={`Scores (${chips.length})`}
          action={
            <span className="flex items-center gap-1">
              {(["all", "failed", "passed"] as const).map((f) => (
                <Button key={f} type="button" variant={metricFilter === f ? "secondary" : "ghost"} size="sm" className="h-7 px-2 text-[11px] capitalize" onClick={() => setMetricFilter(f)}>{f === "all" ? "All" : f === "failed" ? `Failed (${failedChips.length})` : "Passed"}</Button>
              ))}
            </span>
          }
        >
          <div className="space-y-2">
            {visibleChips.map((ch: any) => (
              <div key={ch.metric_id} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{ch.name}</p>
                  <ScoreBadge score={ch.score} />
                </div>
                {ch.reason && <p className="mt-1.5 text-xs text-muted-foreground">{ch.reason}</p>}
              </div>
            ))}
            {visibleChips.length === 0 && <p className="text-sm text-muted-foreground">No metrics in this filter.</p>}
          </div>
          {(row.highlights?.length > 0 || row.action_items?.length > 0) && (
            <div className="mt-4 space-y-3 border-t pt-3 text-xs">
              {row.highlights?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">What went well</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">{row.highlights.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
                </div>
              )}
              {row.action_items?.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Action items</p>
                  <ul className="mt-1 list-disc space-y-1 pl-5 text-destructive">{row.action_items.map((h: string, i: number) => <li key={i}>{h}</li>)}</ul>
                </div>
              )}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
