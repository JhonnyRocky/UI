import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  resolveStructureKind,
  structureFields,
  type StructureKind,
  type StructureMode,
} from "@/lib/datasetStructure";
import { cn } from "@/lib/utils";

type Props = {
  kind?: StructureKind;
  projectType?: "agent" | "llm" | "rag" | string;
  interactionShape?: "multi_turn" | "single_turn" | string;
  datasetKind?: "llm" | "rag" | "agent" | string | null;
  mode?: StructureMode;
  className?: string;
  defaultOpen?: boolean;
};

export function DatasetStructurePreview({
  kind,
  projectType,
  interactionShape,
  datasetKind,
  mode = "partial",
  className,
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const resolved =
    kind ??
    resolveStructureKind({
      ...(projectType != null ? { projectType } : {}),
      ...(interactionShape != null ? { interactionShape } : {}),
      ...(datasetKind !== undefined ? { datasetKind } : {}),
    });
  const fields = structureFields(resolved, mode);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("rounded-lg border bg-card", className)}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/40"
        >
          <span>See structure</span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-2 border-t px-3 py-3">
          <p className="text-xs text-muted-foreground">
            Each row in your file looks like this. Required fields must be present.
          </p>
          <div className="overflow-hidden rounded-md border bg-muted/30 font-mono text-xs">
            <div className="border-b bg-muted/50 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Sample row
            </div>
            <ul className="divide-y">
              {fields.map((field) => (
                <li key={field.key} className="grid gap-1 px-3 py-2.5 sm:grid-cols-[minmax(7rem,9rem)_1fr] sm:items-start sm:gap-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-foreground">{field.key}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        field.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {field.required ? "Required" : "Optional"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-muted-foreground">“{field.placeholder}”</p>
                    {field.note && <p className="mt-0.5 text-[11px] text-muted-foreground/80">{field.note}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
