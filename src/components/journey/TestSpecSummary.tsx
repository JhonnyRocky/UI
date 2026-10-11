import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

function parseDesiredLines(text: string): string[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^[-*•–—]\s+/, ""));
}

export type TestSpecSummaryProps = {
  input?: string | undefined;
  desiredOutput?: string | undefined;
  acceptanceCriteria?: string[] | undefined;
  userBehavior?: string[] | undefined;
  goal?: string | undefined;
  description?: string | undefined;
  identityEntries?: [string, string][] | undefined;
  identityLabel?: string | undefined;
  persona?: string | undefined;
  category?: string | undefined;
  isSingleTurn?: boolean;
  className?: string;
  /** When true, starts collapsed with a one-line preview. */
  collapsible?: boolean;
  defaultOpen?: boolean;
};

function SpecColumn({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col rounded-md border bg-background/80 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      <div className="mt-1.5 min-w-0 flex-1 text-xs leading-relaxed text-foreground sm:text-sm">
        {children}
      </div>
    </div>
  );
}

export function TestSpecSummary({
  input,
  desiredOutput,
  acceptanceCriteria,
  userBehavior,
  goal,
  description,
  identityEntries,
  identityLabel,
  persona,
  category,
  isSingleTurn,
  className,
  collapsible = true,
  defaultOpen = true,
}: TestSpecSummaryProps) {
  const [open, setOpen] = useState(defaultOpen);
  const expected =
    desiredOutput?.trim() ||
    (acceptanceCriteria?.length ? acceptanceCriteria.join("\n") : "");
  const expectedLines = expected ? parseDesiredLines(expected) : [];
  const behaviors =
    userBehavior?.filter((b) => b?.trim()) ??
    (goal?.trim() ? [goal.trim()] : []);
  const inputLabel = isSingleTurn ? "Task input" : "Opening input";
  const hasIdentity = (identityEntries?.length ?? 0) > 0;
  const hasMeta = !!(description?.trim() || persona?.trim() || category?.trim() || identityLabel?.trim());
  const hasContent =
    input?.trim() ||
    expectedLines.length > 0 ||
    behaviors.length > 0 ||
    hasIdentity ||
    hasMeta;

  if (!hasContent) {
    return (
      <p className={cn("rounded-lg border bg-muted/20 px-3 py-2 text-xs text-muted-foreground", className)}>
        No test definition saved for this scenario.
      </p>
    );
  }

  const previewParts = [
    input?.trim() ? `Input: ${input.trim().slice(0, 48)}${input.length > 48 ? "…" : ""}` : "",
    expectedLines.length ? `${expectedLines.length} expected criteria` : "",
    behaviors.length ? `${behaviors.length} behavior note${behaviors.length === 1 ? "" : "s"}` : "",
  ].filter(Boolean);

  const body = (
    <div className="space-y-3">
      <div className="grid gap-2 lg:grid-cols-3">
        <SpecColumn title={inputLabel}>
          {input?.trim() ? (
            <p className="whitespace-pre-wrap">{input}</p>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </SpecColumn>
        <SpecColumn title="Expected outcome">
          {expectedLines.length > 0 ? (
            <ul className="space-y-1.5 text-muted-foreground">
              {expectedLines.map((line, idx) => (
                <li key={idx} className="flex gap-1.5">
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </SpecColumn>
        <SpecColumn title={isSingleTurn ? "Task notes" : "User behavior"}>
          {behaviors.length > 0 ? (
            <ul className="list-disc space-y-1 pl-4 text-muted-foreground">
              {behaviors.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          ) : isSingleTurn ? (
            <span className="text-muted-foreground">Single-turn — no extra simulator tactics.</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </SpecColumn>
      </div>

      {(hasIdentity || hasMeta) && (
        <div className="flex flex-col gap-2 border-t pt-3 text-xs sm:text-sm">
          {hasMeta && (
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              {persona?.trim() && (
                <span className="rounded-md bg-muted px-2 py-0.5">
                  Persona: <span className="text-foreground">{persona}</span>
                </span>
              )}
              {category?.trim() && (
                <span className="rounded-md bg-muted px-2 py-0.5">{category}</span>
              )}
              {identityLabel?.trim() && (
                <span className="rounded-md bg-muted px-2 py-0.5">
                  Test user: <span className="text-foreground">{identityLabel}</span>
                </span>
              )}
            </div>
          )}
          {description?.trim() && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Situation</p>
              <p className="mt-1 text-muted-foreground">{description}</p>
            </div>
          )}
          {hasIdentity && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Test user fields</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {identityEntries!.map(([k, v]) => (
                  <span
                    key={k}
                    className="rounded-md border bg-background px-2 py-1 font-mono text-[11px] text-muted-foreground"
                  >
                    {k}: <span className="text-foreground">{String(v)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (!collapsible) {
    return (
      <div className={cn("rounded-lg border bg-muted/25 p-3", className)}>
        <p className="mb-2 text-xs font-semibold text-foreground">Test scenario</p>
        {body}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("shrink-0 rounded-lg border bg-muted/25", className)}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted/40"
        >
          <ChevronDown
            className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          />
          <span className="text-xs font-semibold text-foreground sm:text-sm">Test scenario</span>
          {!open && previewParts.length > 0 && (
            <span className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">{previewParts.join(" · ")}</span>
          )}
          {open && (
            <span className="ml-auto text-[10px] text-muted-foreground">Collapse</span>
          )}
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-3 pb-3 pt-2">{body}</CollapsibleContent>
    </Collapsible>
  );
}
