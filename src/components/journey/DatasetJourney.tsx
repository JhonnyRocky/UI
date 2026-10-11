import { useMemo, useState } from "react";
import { Check, Play, Sparkles, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/badges";
import { Section } from "@/components/journey/Section";
import { ConnectStep } from "@/components/journey/ConnectStep";
import { DatasetStructurePreview } from "@/components/DatasetStructurePreview";
import { cn } from "@/lib/utils";
import { metricShape } from "@/lib/metrics";
import { raw } from "@/lib/scores";
import { useStore } from "@/mock/store";
import type { MockProject } from "@/mock/data";

const STEPS = [
  { key: "connect", label: "Connect" },
  { key: "file", label: "Upload data" },
  { key: "cases", label: "Select cases" },
  { key: "metrics", label: "Choose metrics" },
  { key: "results", label: "Results" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

export function DatasetJourney({ project }: { project: MockProject }) {
  const { datasetCases, metrics } = useStore();
  const kind = project.connection_args?.dataset?.target_kind ?? project.connection_args?.project_type ?? "llm";
  const [step, setStep] = useState<StepKey>("connect");
  const [selected, setSelected] = useState<string[]>(datasetCases.filter((c) => c.selected).map((c) => c.id));

  const stream = `dataset_${kind}`;
  const shapeMetrics = useMemo(() => metrics.filter((m) => metricShape(m) === stream), [metrics, stream]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(shapeMetrics.filter((m) => m.is_recommended).map((m) => m.metric_id));

  const done: Record<StepKey, boolean> = {
    connect: step !== "connect",
    file: step === "cases" || step === "metrics" || step === "results",
    cases: selected.length > 0 && step !== "cases",
    metrics: step === "results",
    results: false,
  };
  const enabled: Record<StepKey, boolean> = {
    connect: true,
    file: true,
    cases: true,
    metrics: selected.length > 0,
    results: selected.length > 0 && selectedMetrics.length > 0,
  };

  const toggle = (lst: string[], id: string) => (lst.includes(id) ? lst.filter((x) => x !== id) : [...lst, id]);

  return (
    <div className="space-y-6">
      <ol className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              disabled={!enabled[s.key]}
              onClick={() => setStep(s.key)}
              className={cn("flex min-h-14 w-full items-center gap-3 rounded-lg border p-3 text-left text-sm shadow-soft transition-colors disabled:cursor-not-allowed disabled:opacity-50", step === s.key ? "border-primary bg-primary/8" : "bg-card hover:bg-muted/50")}
            >
              <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold", done[s.key] ? "bg-success text-success-foreground" : step === s.key ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                {done[s.key] ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="font-medium">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>

      {step === "connect" && <ConnectStep project={project} onDone={() => setStep("file")} startAtCurl />}

      {step === "file" && (
        <Section title="Upload your dataset" hint="CSV, TSV, JSON or JSONL. Each row becomes one case.">
          <DatasetStructurePreview kind={kind as any} mode="partial" defaultOpen />
          <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-muted/50">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <span className="text-sm font-medium">Choose file</span>
            <span className="text-xs text-muted-foreground">csv, tsv, json, jsonl</span>
            <input type="file" className="hidden" onChange={() => setStep("cases")} />
          </label>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setStep("cases")}>Use sample dataset</Button>
          </div>
        </Section>
      )}

      {step === "cases" && (
        <Section title="Select cases" hint={`${selected.length} of ${datasetCases.length} selected.`}>
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{selected.length} of {datasetCases.length} selected</p>
            <Button variant="ghost" size="sm" onClick={() => setSelected(selected.length === datasetCases.length ? [] : datasetCases.map((c) => c.id))}>
              {selected.length === datasetCases.length ? "Clear all" : "Select all"}
            </Button>
          </div>
          <div className="max-h-[55vh] divide-y overflow-y-auto rounded-lg border">
            {datasetCases.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/40">
                <Checkbox className="mt-0.5" checked={selected.includes(c.id)} onCheckedChange={() => setSelected(toggle(selected, c.id))} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{c.input}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Expected: {c.expected}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={!selected.length} onClick={() => setStep("metrics")}>Continue with {selected.length} case{selected.length === 1 ? "" : "s"}</Button>
          </div>
        </Section>
      )}

      {step === "metrics" && (
        <Section title={`Scoring metrics (${selectedMetrics.length}/${shapeMetrics.length})`} hint={`${selected.length} case${selected.length === 1 ? "" : "s"} selected.`}>
          <div className="space-y-1">
            {shapeMetrics.map((m) => (
              <label key={m.metric_id} className="flex cursor-pointer items-start gap-3 rounded-md p-2 hover:bg-muted/50">
                <Checkbox className="mt-0.5" checked={selectedMetrics.includes(m.metric_id)} onCheckedChange={() => setSelectedMetrics(toggle(selectedMetrics, m.metric_id))} />
                <span>
                  <span className="block text-sm font-medium">{m.name}</span>
                  <span className="text-xs text-muted-foreground">{m.description}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex justify-end">
            <Button disabled={!selectedMetrics.length} onClick={() => setStep("results")}><Sparkles className="mr-1 h-4 w-4" />Run evaluation</Button>
          </div>
        </Section>
      )}

      {step === "results" && (
        <Section title="Dataset results" hint={`${selected.length} cases scored against ${selectedMetrics.length} metrics.`}>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="py-2.5 pl-3 pr-3 font-medium">Input</th>
                  {shapeMetrics.map((m) => <th key={m.metric_id} className="py-2.5 pr-3 font-medium">{m.name}</th>)}
                  <th className="py-2.5 pr-3 font-medium">Overall</th>
                </tr>
              </thead>
              <tbody>
                {datasetCases.filter((c) => selected.includes(c.id)).map((c, i) => {
                  const scores = shapeMetrics.map((_, j) => Number((0.55 + ((i * 3 + j * 5) % 9) / 20).toFixed(2)));
                  const overall = Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2));
                  return (
                    <tr key={c.id} className="border-b last:border-0">
                      <td className="py-3 pl-3 pr-3"><span className="font-medium">{c.input}</span><p className="text-xs text-muted-foreground">{c.expected}</p></td>
                      {scores.map((s, j) => <td key={j} className="py-3 pr-3 tabular-nums">{raw(s)}</td>)}
                      <td className="py-3 pr-3"><ScoreBadge score={overall} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary">{selected.length} cases</Badge>
            <Badge variant="outline">{selectedMetrics.length} metrics</Badge>
            <Button variant="outline" size="sm" className="ml-auto"><Play className="mr-1 h-3.5 w-3.5" />Re-run</Button>
          </div>
        </Section>
      )}
    </div>
  );
}
