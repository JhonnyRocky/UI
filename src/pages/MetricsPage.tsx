import { useMemo, useState, type FormEvent } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FieldSelect } from "@/components/FieldSelect";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/mock/store";
import type { MockMetric } from "@/mock/data";

const mid = (m: MockMetric) => m.metric_id || m.id;
const streamOf = (m: MockMetric) => {
  const value = m.stream === "text_based" ? "chat" : m.stream || "chat";
  return value === "dataset_agent" ? "single_turn" : value;
};

const TABS = ["agent", "llm", "rag"] as const;
type MetricsTab = (typeof TABS)[number];

const GROUPS: { tab: MetricsTab; stream: string; label: string; blurb: string }[] = [
  { tab: "agent", stream: "chat", label: "Conversational", blurb: "Multi-turn chats. The judge reads the whole conversation." },
  { tab: "agent", stream: "single_turn", label: "Single-turn", blurb: "One task in and one reply back, including complete dataset rows." },
  { tab: "llm", stream: "dataset_llm", label: "LLM", blurb: "One prompt and one completion." },
  { tab: "rag", stream: "dataset_rag", label: "RAG", blurb: "Retrieval and the answer, scored as separate checks." },
];

const DEFAULT_RUBRIC = `{
  "scale": "0.0-1.0",
  "higher_is_better": true,
  "anchors": {
    "1.0": "fully meets the requirement",
    "0.7": "mostly meets with minor gaps",
    "0.4": "partially meets",
    "0.0": "fails completely"
  },
  "pass_threshold": 0.75
}`;

function MetricForm({
  initial,
  streams,
  onSubmit,
  submitLabel,
}: {
  initial?: Partial<MockMetric>;
  streams: { value: string; label: string }[];
  onSubmit: (body: any) => void;
  submitLabel: string;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "custom");
  const [stream, setStream] = useState(initial?.stream || streams[0]?.value || "chat");
  const [description, setDescription] = useState(initial?.description || "");
  const [rubric, setRubric] = useState(
    initial?.rubric && Object.keys(initial.rubric).length > 0 ? JSON.stringify(initial.rubric, null, 2) : DEFAULT_RUBRIC,
  );
  const [error, setError] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    let parsed: any = {};
    try {
      parsed = rubric.trim() ? JSON.parse(rubric) : {};
    } catch {
      setError("Rubric must be valid JSON");
      return;
    }
    setError("");
    onSubmit({ name: name.trim(), category: category.trim() || "custom", description, rubric: parsed, stream });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>Metric name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Brand voice" autoFocus /></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label>Group</Label><FieldSelect value={stream} onChange={setStream} options={streams} ariaLabel="Metric group" /></div>
        <div className="space-y-2"><Label>Subgroup</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="custom" /></div>
      </div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this metric judge?" /></div>
      <div className="space-y-2">
        <Label>Rubric (JSON)</Label>
        <p className="text-xs text-muted-foreground">Used only for this custom metric. Standard metrics keep their own rubrics.</p>
        <Textarea value={rubric} onChange={(e) => setRubric(e.target.value)} className="min-h-32 font-mono text-xs" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <DialogFooter><Button type="submit" disabled={!name.trim()}>{submitLabel}</Button></DialogFooter>
    </form>
  );
}

function MetricTile({ metric, onEdit, onDelete }: { metric: MockMetric; onEdit?: () => void; onDelete?: () => void }) {
  const automatic = Array.isArray(metric.tags) && metric.tags.includes("programmatic");
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-base leading-snug">{metric.name}</CardTitle>
          {metric.is_custom && (
            <span className="inline-flex shrink-0 gap-1">
              <Button variant="ghost" size="icon" aria-label={`Edit ${metric.name}`} onClick={onEdit}><Pencil className="size-4" /></Button>
              <Button variant="ghost" size="icon" aria-label={`Delete ${metric.name}`} onClick={onDelete}><Trash2 className="size-4" /></Button>
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{metric.is_custom ? "Custom" : "Standard"}</Badge>
          <Badge variant={metric.is_recommended ? "default" : "outline"}>{metric.is_recommended ? "Recommended" : "Optional"}</Badge>
          {automatic && <Badge variant="outline">Automatic</Badge>}
        </div>
        <CardDescription className="text-sm leading-relaxed text-foreground/80">{metric.description || "No description yet."}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export function MetricsPage() {
  const { metrics, createMetric, updateMetric, deleteMetric } = useStore();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<MetricsTab>("agent");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MockMetric | null>(null);
  const [deleting, setDeleting] = useState<MockMetric | null>(null);

  const streamOptions = GROUPS.filter((group) => group.tab === tab).map((group) => ({ value: group.stream, label: group.label }));

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = new Set(GROUPS.filter((group) => group.tab === tab).map((group) => group.stream));
    return metrics
      .filter((m) => allowed.has(streamOf(m)))
      .filter((m) => !q || `${m.name} ${m.category} ${m.description || ""}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.is_recommended) - Number(a.is_recommended) || a.name.localeCompare(b.name));
  }, [metrics, query, tab]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary">Evaluation</p>
          <h1 className="font-display text-3xl font-semibold">Metrics</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Standard metrics are fixed. You can add your own, with a rubric, for agent, LLM, and RAG testing.</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus />New metric</Button></DialogTrigger>
          <DialogContent className="max-h-[90svh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create custom metric</DialogTitle></DialogHeader>
            <MetricForm
              key={tab}
              initial={{ stream: streamOptions[0]?.value }}
              streams={streamOptions}
              submitLabel="Create metric"
              onSubmit={(body) => { createMetric(body); setCreateOpen(false); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value === "llm" ? "llm" : value === "rag" ? "rag" : "agent")}>
        <TabsList className="mb-4">
          <TabsTrigger value="agent">Agent</TabsTrigger>
          <TabsTrigger value="llm">LLM</TabsTrigger>
          <TabsTrigger value="rag">RAG</TabsTrigger>
        </TabsList>

        <Card className="mb-4">
          <CardContent className="flex items-center gap-3 pt-6">
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search metrics" placeholder="Search metrics" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
            </div>
            <p className="text-sm text-muted-foreground">{visible.length} shown</p>
          </CardContent>
        </Card>

        {(TABS as readonly MetricsTab[]).map((tabId) => (
          <TabsContent key={tabId} value={tabId}>
            {GROUPS.filter((group) => group.tab === tabId).map((group) => {
              const items = visible.filter((m) => streamOf(m) === group.stream);
              return (
                <section key={group.stream} className="mb-8">
                  <h2 className="font-display text-lg font-semibold">{group.label}</h2>
                  <p className="mb-3 text-sm text-muted-foreground">{group.blurb}</p>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No metrics in this group match your search.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((m) => (
                        <MetricTile key={mid(m)} metric={m} onEdit={() => setEditing(m)} onDelete={() => setDeleting(m)} />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit custom metric</DialogTitle></DialogHeader>
          {editing && (
            <MetricForm
              key={mid(editing)}
              initial={{ ...editing, stream: streamOf(editing) }}
              streams={GROUPS.map((group) => ({ value: group.stream, label: group.label }))}
              submitLabel="Save changes"
              onSubmit={(body) => { updateMetric(mid(editing), { ...body, is_custom: true }); setEditing(null); }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `Delete "${deleting.name}"?` : "Delete metric?"}
        description="This removes the custom metric from the catalog. Scenarios already scored keep their past scores; future selections can no longer include it."
        confirmLabel="Delete metric"
        onConfirm={() => { if (deleting) { deleteMetric(mid(deleting)); setDeleting(null); } }}
      />
    </AppShell>
  );
}
