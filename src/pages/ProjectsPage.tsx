import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Clock3,
  Copy,
  FolderKanban,
  Grid2X2,
  List,
  MessageSquareText,
  Mic2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ScoreBadge } from "@/components/badges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DatasetStructurePreview } from "@/components/DatasetStructurePreview";
import { FieldSelect } from "@/components/FieldSelect";
import { useNavigate } from "@/lib/nav";
import { buildConnectionArgs, projectKindLabel, type DataMode, type InteractionShape, type ProjectType } from "@/lib/projectSettings";
import { useStore } from "@/mock/store";
import type { MockProject } from "@/mock/data";

export function ProjectsPage() {
  const { projects, updateProject, deleteProject, duplicateProject } = useStore();
  const [editing, setEditing] = useState<MockProject | null>(null);
  const [deleting, setDeleting] = useState<MockProject | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"recent" | "name" | "score">("recent");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const rows = [...projects].filter((project) =>
      `${project.name} ${project.description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
    );
    return rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "score") return (b.score ?? -1) - (a.score ?? -1);
      return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
    });
  }, [projects, query, sort]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Projects</h1>
            <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {projects.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            AI assistants and agents configured for automated evaluation
          </p>
        </div>
        <NewProjectDialog />
      </div>

      <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-card p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block min-w-0 flex-1 sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search projects"
            placeholder="Search projects by name or description..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="h-9 bg-background pl-9 text-xs shadow-none sm:text-sm"
          />
        </label>
        <div className="flex items-center gap-2">
          <label className="min-w-0 flex-1 sm:flex-none">
            <span className="sr-only">Sort projects</span>
            <FieldSelect
              value={sort}
              onChange={(v) => setSort(v as typeof sort)}
              ariaLabel="Sort projects"
              className="h-9 text-xs sm:w-auto sm:min-w-44"
              options={[
                { value: "recent", label: "Recently created" },
                { value: "name", label: "Project name" },
                { value: "score", label: "Highest score" },
              ]}
            />
          </label>
          <div className="flex shrink-0 items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <Button
              variant={view === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="size-7 rounded-md shadow-none"
              aria-label="Grid view"
              onClick={() => setView("grid")}
            >
              <Grid2X2 className="size-3.5" />
            </Button>
            <Button
              variant={view === "list" ? "secondary" : "ghost"}
              size="icon"
              className="size-7 rounded-md shadow-none"
              aria-label="List view"
              onClick={() => setView("list")}
            >
              <List className="size-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {projects.length === 0 && (
        <div className="rounded-lg border border-dashed bg-card p-12 text-center">
          <FolderKanban className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No projects yet</p>
          <p className="text-sm text-muted-foreground">Create one to start testing.</p>
        </div>
      )}
      {projects.length > 0 && filtered.length === 0 && (
        <div className="border-y py-12 text-center">
          <Search className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 font-medium">No matching projects</p>
          <p className="text-sm text-muted-foreground">Try a different project name.</p>
        </div>
      )}
      <ProjectGrid
        projects={filtered}
        view={view}
        onEdit={(p) => {
          setEditing(p);
          setEditName(p.name);
          setEditDescription(p.description || "");
        }}
        onDuplicate={(p) => duplicateProject(p.id)}
        onDelete={setDeleting}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit project</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><label className="text-sm font-medium">Project name</label><Input value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
            <div className="space-y-2"><label className="text-sm font-medium">Description</label><Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button
              disabled={!editName.trim()}
              onClick={() => {
                if (!editing) return;
                updateProject(editing.id, { name: editName.trim(), description: editDescription });
                setEditing(null);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `Delete "${deleting.name}"?` : "Delete project?"}
        description="This permanently removes the project, its documents, scenarios, runs and scores. This cannot be undone."
        confirmLabel="Delete project"
        onConfirm={() => {
          if (!deleting) return;
          deleteProject(deleting.id);
          setDeleting(null);
        }}
      />
    </AppShell>
  );
}

function ProjectGrid({
  projects,
  view,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  projects: MockProject[];
  view: "grid" | "list";
  onEdit: (p: MockProject) => void;
  onDuplicate: (p: MockProject) => void;
  onDelete: (p: MockProject) => void;
}) {
  const { go } = useNavigate();

  if (view === "list") {
    return (
      <div className="space-y-2">
        {projects.map((p) => (
          <article
            key={p.id}
            className="group relative flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-3.5 transition-all duration-150 hover:border-primary/40 hover:shadow-xs sm:flex-row sm:items-center sm:gap-4"
          >
            <button
              type="button"
              onClick={() => go({ name: "project", projectId: p.id })}
              className="absolute inset-0 z-0"
              aria-label={p.name}
            />
            <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-semibold text-primary">
                {p.name.slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-display text-sm font-semibold text-foreground">{p.name}</h2>
                  <span className="inline-flex shrink-0 items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {projectKindLabel(p)}
                  </span>
                </div>
                {p.description && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.description}</p>
                )}
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-4 border-t border-border/50 pt-2 sm:border-0 sm:pt-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md bg-muted/60 px-2 py-0.5 font-medium tabular-nums">
                  {p.scenario_count ?? 0} tests
                </span>
                <span className="rounded-md bg-muted/60 px-2 py-0.5 font-medium tabular-nums">
                  {p.run_count ?? 0} runs
                </span>
              </div>

              <div className="flex items-center gap-2">
                <ScoreBadge score={p.score} />
                <div className="flex items-center gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    aria-label={`Edit ${p.name}`}
                    onClick={(e) => { e.stopPropagation(); onEdit(p); }}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-foreground"
                    aria-label={`Duplicate ${p.name}`}
                    onClick={(e) => { e.stopPropagation(); onDuplicate(p); }}
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${p.name}`}
                    onClick={(e) => { e.stopPropagation(); onDelete(p); }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projects.map((p) => (
        <article
          key={p.id}
          className="group relative flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xs"
        >
          <button
            type="button"
            onClick={() => go({ name: "project", projectId: p.id })}
            className="absolute inset-0 z-0"
            aria-label={p.name}
          />
          <div>
            <div className="flex items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 font-display text-sm font-semibold text-primary">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate font-display text-sm font-semibold text-foreground">{p.name}</h2>
                  <span className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {projectKindLabel(p)}
                  </span>
                </div>
              </div>
              <div className="relative z-10 shrink-0">
                <ScoreBadge score={p.score} />
              </div>
            </div>

            <p className="mt-3 line-clamp-2 min-h-8 text-xs leading-relaxed text-muted-foreground">
              {p.description || "No description provided."}
            </p>
          </div>

          <div className="relative z-10 mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-medium tabular-nums text-foreground">{p.scenario_count ?? 0}</span> tests
              <span className="text-border">•</span>
              <span className="font-medium tabular-nums text-foreground">{p.run_count ?? 0}</span> runs
            </div>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label={`Edit ${p.name}`}
                onClick={(e) => { e.stopPropagation(); onEdit(p); }}
              >
                <Pencil className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-foreground"
                aria-label={`Duplicate ${p.name}`}
                onClick={(e) => { e.stopPropagation(); onDuplicate(p); }}
              >
                <Copy className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${p.name}`}
                onClick={(e) => { e.stopPropagation(); onDelete(p); }}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

const PROJECT_TYPES = [
  { id: "agent" as const, name: "Agent testing", description: "Conversational or single-turn agents. Generate tests from PRDs or upload cases.", icon: MessageSquareText, available: true },
  { id: "llm" as const, name: "LLM testing", description: "Prompt-completion evaluation with a full dataset, partial inputs, or PRD-generated cases.", icon: Sparkles, available: true },
  { id: "rag" as const, name: "RAG testing", description: "Retrieve-and-answer systems. Context comes from the endpoint; metrics adapt to what’s available.", icon: BookOpen, available: true },
  { id: "voice" as const, name: "Voice Agent", description: "Spoken conversations and audio behavior.", icon: Mic2, available: false },
  { id: "video" as const, name: "Video Agent", description: "Multimodal video-based interactions.", icon: Video, available: false },
] as const;

const DATA_MODE_OPTIONS: { id: DataMode; label: string; hint: string }[] = [
  { id: "generate", label: "Generate from PRDs", hint: "Upload product docs / a brief. We create the test cases for you." },
  { id: "partial", label: "I have inputs (partial dataset)", hint: "Upload inputs and optional expected outputs. For conversational agents, include user_behavior tactics." },
  { id: "full", label: "I have a full dataset", hint: "Upload a complete case file including generated answers. No endpoint needed — the file is scored as-is." },
];

const TRANSPORT_OPTIONS = [
  { value: "http", label: "HTTP" },
  { value: "websocket", label: "WebSocket" },
];

function NewProjectDialog() {
  const { go } = useNavigate();
  const { createProject } = useStore();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"select" | "form" | "soon">("select");
  const [projectType, setProjectType] = useState<ProjectType>("agent");
  const [selectedShape, setSelectedShape] = useState<InteractionShape>("multi_turn");
  const [selectedTransport, setSelectedTransport] = useState<"http" | "websocket">("http");
  const [dataMode, setDataMode] = useState<DataMode>("generate");
  const [comingSoonName, setComingSoonName] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const typeMeta = PROJECT_TYPES.find((item) => item.id === projectType);
  const isAgent = projectType === "agent";
  const isConversational = isAgent && selectedShape === "multi_turn";
  const isFullFile = dataMode === "full" && !isConversational;
  const dataModeOptions = isConversational ? DATA_MODE_OPTIONS.filter((item) => item.id !== "full") : DATA_MODE_OPTIONS;

  const reset = () => {
    setStep("select");
    setProjectType("agent");
    setSelectedShape("multi_turn");
    setSelectedTransport("http");
    setDataMode("generate");
    setComingSoonName("");
    setName("");
    setDescription("");
  };
  const handleOpen = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };
  const onPickType = (item: (typeof PROJECT_TYPES)[number]) => {
    if (!item.available) {
      setComingSoonName(item.name);
      setStep("soon");
      return;
    }
    setProjectType(item.id);
    setSelectedShape(item.id === "agent" ? "multi_turn" : "single_turn");
    setSelectedTransport("http");
    setDataMode("generate");
    setStep("form");
  };
  const onDataModeChange = (value: string) => {
    setDataMode(value === "full" || value === "partial" ? value : "generate");
  };
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const created = createProject({
      name: name.trim(),
      description: description.trim(),
      connection_args: buildConnectionArgs({
        project_type: projectType,
        data_mode: dataMode,
        interaction_shape: isAgent ? selectedShape : "single_turn",
        transport: isFullFile ? "http" : selectedTransport,
      }),
    });
    setOpen(false);
    reset();
    go({ name: "project", projectId: created.id });
  };

  const namePlaceholder =
    projectType === "llm" ? "Prompt assistant" : projectType === "rag" ? "Support RAG" : selectedShape === "single_turn" ? "Task extraction agent" : "Support assistant";

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button className="shrink-0"><Plus />New project</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90svh] max-w-4xl overflow-y-auto p-0">
        {step === "select" && <ProjectTypePicker onSelect={onPickType} />}
        {step === "form" && (
          <form onSubmit={submit} className="space-y-6 p-6 sm:p-8">
            <DialogHeader>
              <Button type="button" variant="ghost" size="sm" className="mb-2 w-fit px-0 hover:bg-transparent" onClick={() => setStep("select")}><ArrowLeft />Project types</Button>
              <DialogTitle className="font-display text-2xl">New {typeMeta?.name ?? "project"}</DialogTitle>
              <DialogDescription>
                {isFullFile
                  ? "Upload a complete case file with generated answers. No endpoint needed — the file is scored as-is."
                  : "Choose how test data arrives and how the endpoint is called. Forms and metrics adapt to these settings."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">Project name</label>
              <Input id="project-name" placeholder={namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            {isAgent && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="agent-shape" className="text-sm font-medium">Agent type</label>
                  <FieldSelect
                    id="agent-shape"
                    ariaLabel="Agent type"
                    value={selectedShape}
                    onChange={(v) => setSelectedShape(v === "single_turn" ? "single_turn" : "multi_turn")}
                    options={[
                      { value: "multi_turn", label: "Conversational" },
                      { value: "single_turn", label: "Single-turn" },
                    ]}
                  />
                </div>
                {!isFullFile && (
                  <div className="space-y-2">
                    <label htmlFor="agent-transport" className="text-sm font-medium">Connection</label>
                    <FieldSelect
                      id="agent-transport"
                      ariaLabel="Connection"
                      value={selectedTransport}
                      onChange={(v) => setSelectedTransport(v === "websocket" ? "websocket" : "http")}
                      options={TRANSPORT_OPTIONS}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="data-mode" className="text-sm font-medium">Test data</label>
                <FieldSelect
                  id="data-mode"
                  ariaLabel="Test data"
                  value={dataMode}
                  onChange={onDataModeChange}
                  options={dataModeOptions.map((item) => ({ value: item.id, label: item.label }))}
                />
                <p className="text-xs text-muted-foreground">{dataModeOptions.find((item) => item.id === dataMode)?.hint}</p>
              </div>
            </div>
            {(dataMode === "partial" || dataMode === "full") && (
              <DatasetStructurePreview
                projectType={projectType}
                interactionShape={isAgent ? selectedShape : "single_turn"}
                mode={dataMode === "full" ? "full" : "partial"}
              />
            )}
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium">Description <span className="text-muted-foreground">(optional)</span></label>
              <Textarea id="project-description" placeholder="What does this assistant help people do?" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-28" />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!name.trim()}>Create project <ArrowRight /></Button>
            </DialogFooter>
          </form>
        )}
        {step === "soon" && (
          <div className="p-6 sm:p-8">
            <DialogHeader>
              <div className="mb-5 grid size-12 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Clock3 className="size-5" /></div>
              <DialogTitle className="font-display text-2xl">{comingSoonName} is coming soon</DialogTitle>
              <DialogDescription>Agent, LLM, and RAG testing are available now over HTTP and WebSocket.</DialogDescription>
            </DialogHeader>
            <div className="mt-8 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setStep("select")}><ArrowLeft />All project types</Button>
              <Button onClick={() => onPickType(PROJECT_TYPES[0])}>Use agent testing instead <ArrowRight /></Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProjectTypePicker({ onSelect }: { onSelect: (item: (typeof PROJECT_TYPES)[number]) => void }) {
  return (
    <div className="p-6 sm:p-8">
      <DialogHeader className="pr-8">
        <DialogTitle className="font-display text-2xl">What do you want to test?</DialogTitle>
        <DialogDescription>
          Pick the system under test. Next you’ll choose whether you bring a dataset or generate cases from PRDs.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECT_TYPES.map((item) => (
          <Button
            key={item.name}
            type="button"
            variant="outline"
            onClick={() => onSelect(item)}
            className="group h-auto min-h-40 items-stretch justify-start whitespace-normal border-border bg-card p-5 text-left shadow-none transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
          >
            <span className="flex w-full flex-col items-start">
              <span className="mb-5 flex w-full items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </span>
                {item.available ? (
                  <span className="rounded-md bg-success/12 px-2 py-1 text-[10px] font-semibold uppercase text-success">Available</span>
                ) : (
                  <span className="rounded-md bg-muted px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">Coming soon</span>
                )}
              </span>
              <span className="font-display text-base font-semibold text-foreground">{item.name}</span>
              <span className="mt-1 text-sm font-normal leading-5 text-muted-foreground">{item.description}</span>
            </span>
          </Button>
        ))}
      </div>
    </div>
  );
}
