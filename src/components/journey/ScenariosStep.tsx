import { useState } from "react";
import { ChevronDown, Loader2, Sparkles, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { DatasetStructurePreview } from "@/components/DatasetStructurePreview";
import { Section } from "@/components/journey/Section";
import { resolveProjectSettings } from "@/lib/projectSettings";
import { cn } from "@/lib/utils";
import type { MockProject } from "@/mock/data";

const MULTI_TURN_EXAMPLE = `title,input,user_behavior,expected
Reset password,"How do I reset my password?","Ask once for the reset steps|If the agent asks for the current password, refuse","• Guide the user to Account settings → Security.|• Never ask for the current password."
Refund status,"Where is my refund?","Stay polite but firm|If the agent stalls, ask for a ticket number","• Look up the order and state the refund policy clearly."
`;

const SINGLE_TURN_EXAMPLE = `title,input,expected
Extract order id,"My order #48219 never arrived. Extract the order id.","• Return only the order id 48219."
Classify intent,"I want to cancel my subscription tomorrow. Label the intent.","• Label the intent as cancellation."
`;

export function ScenariosStep({
  project,
  onGenerate,
  onImport,
}: {
  project: MockProject;
  onGenerate: (payload: { agentDescription: string; priority: string; maxScenarios: number | null }) => void;
  onImport: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [agentDescription, setAgentDescription] = useState(project.description || "");
  const [priority, setPriority] = useState("");
  const [maxTests, setMaxTests] = useState("");
  const [exampleOpen, setExampleOpen] = useState(false);

  const settings = resolveProjectSettings(project.connection_args);
  const uploadMode = settings.data_mode === "partial" || settings.data_mode === "full";
  const singleTurn = settings.interaction_shape === "single_turn";
  const parsedMax = (() => {
    const n = Number(maxTests);
    return maxTests.trim() !== "" && Number.isFinite(n) ? Math.min(1000, Math.max(1, Math.round(n))) : null;
  })();

  if (uploadMode) {
    return (
      <Section
        title={singleTurn ? "Upload single-turn cases" : "Upload conversational cases"}
        hint={
          singleTurn && settings.data_mode === "full"
            ? "Each row needs an input and a generated_answer. Expected output is optional."
            : singleTurn
              ? "Each row needs an input. Expected output is optional. We call your endpoint during the run."
              : "Each row needs an opening input and user_behavior tactics (pipe-separated). Expected output is optional."
        }
      >
        <DatasetStructurePreview kind={singleTurn ? "agent_single_turn" : "agent_conversational"} mode={singleTurn && settings.data_mode === "full" ? "full" : "partial"} />
        <Collapsible open={exampleOpen} onOpenChange={setExampleOpen} className="rounded-lg border bg-card">
          <CollapsibleTrigger asChild>
            <button type="button" className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/40">
              <span>See example CSV</span>
              <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", exampleOpen && "rotate-180")} />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <pre className="overflow-x-auto border-t p-4 text-xs leading-5">{singleTurn ? SINGLE_TURN_EXAMPLE : MULTI_TURN_EXAMPLE}</pre>
          </CollapsibleContent>
        </Collapsible>
        <p className="text-xs text-muted-foreground">Accepted files: csv, tsv, json, jsonl</p>
        <div className="space-y-2">
          <Label htmlFor="scenario-cases">Case file</Label>
          <Input id="scenario-cases" type="file" accept=".csv,.tsv,.json,.jsonl,.ndjson" onChange={() => onImport()} />
          <p className="text-xs text-muted-foreground">Uploading replaces the current test suite. Choose tests on the next step.</p>
        </div>
      </Section>
    );
  }

  const canGenerate = agentDescription.trim().length > 0 || files.length > 0;

  return (
    <div className="space-y-6">
      <Section title="About your agent" hint="Describe what your agent does in a few lines or more. We use this (with any documents below) to plan the right number of tests.">
        <Textarea
          placeholder="e.g. A support agent for an online store. It answers order-status questions, issues refunds for duplicate charges within 30 days, and escalates suspected fraud to a human."
          value={agentDescription}
          onChange={(e) => setAgentDescription(e.target.value)}
          className="min-h-24"
        />
      </Section>
      <Section title="Upload your knowledge documents (optional)" hint="FAQs, policies or product docs. They sharpen the tests, but the brief above is enough on its own.">
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center hover:bg-muted/50">
          <Upload className="h-6 w-6 text-muted-foreground" />
          <span className="text-sm font-medium">Choose files</span>
          <span className="text-xs text-muted-foreground">PDF, Markdown, text or CSV</span>
          <input type="file" multiple className="hidden" onChange={(e) => setFiles([...files, ...Array.from(e.target.files || [])])} />
        </label>
        {files.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs">
                {f.name}
                <button aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, j) => j !== i))}><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-[1fr_140px_auto] sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="priority">Focus on (optional)</Label>
            <Input id="priority" placeholder="e.g. refunds and angry customers" value={priority} onChange={(e) => setPriority(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="max-tests">Max tests</Label>
            <Input id="max-tests" type="number" min={1} max={1000} placeholder="Auto" value={maxTests} onChange={(e) => setMaxTests(e.target.value)} />
          </div>
          <Button onClick={() => onGenerate({ agentDescription, priority, maxScenarios: parsedMax })} disabled={!canGenerate}>
            <Sparkles className="mr-1 h-4 w-4" />
            {(project.scenario_count ?? 0) > 0 ? "Regenerate tests" : "Generate tests"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Max tests is the exact number of tests generated (1–1000). Leave it on Auto to let the system plan up to 30 from your documents.
        </p>
      </Section>
      {files.length > 0 && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4" /> {files.length} document(s) ready to upload.</p>
      )}
    </div>
  );
}
