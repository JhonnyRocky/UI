import { useMemo, useState } from "react";
import { Clock3, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FieldSelect } from "@/components/FieldSelect";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useStore } from "@/mock/store";
import type { MockPersona } from "@/mock/data";

const STREAMS = [
  { value: "chat", label: "Chat" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "image", label: "Image" },
] as const;

function PersonaForm({ initial, onSubmit, submitLabel }: { initial?: Partial<MockPersona>; onSubmit: (body: any) => void; submitLabel: string }) {
  const [name, setName] = useState(initial?.persona_name || "");
  const [stream, setStream] = useState(initial?.stream || "chat");
  const [description, setDescription] = useState(initial?.description || "");
  const [prompt, setPrompt] = useState(initial?.prompt || "");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ persona_name: name.trim(), description, prompt, stream });
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2"><Label>Persona name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Frustrated Customer" autoFocus /></div>
      <div className="space-y-2"><Label>Stream</Label><FieldSelect value={stream} onChange={setStream} options={STREAMS.map((s) => ({ value: s.value, label: s.label }))} ariaLabel="Stream" /></div>
      <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Who is this persona?" /></div>
      <div className="space-y-2"><Label>Prompt</Label><Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="min-h-32" placeholder="How should the simulated user behave?" /></div>
      <DialogFooter><Button type="submit" disabled={!name.trim()}>{submitLabel}</Button></DialogFooter>
    </form>
  );
}

export function PersonasPage() {
  const { personas, createPersona, updatePersona, deletePersona } = useStore();
  const [query, setQuery] = useState("");
  const [stream, setStream] = useState<string>("chat");
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<MockPersona | null>(null);
  const [deleting, setDeleting] = useState<MockPersona | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return personas
      .filter((p) => (p.stream || "chat") === stream)
      .filter((p) => !q || `${p.persona_name} ${p.description || ""}`.toLowerCase().includes(q))
      .sort((a, b) => a.persona_name.localeCompare(b.persona_name));
  }, [personas, query, stream]);

  const streamLabel = STREAMS.find((s) => s.value === stream)?.label ?? stream;

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary">Test users</p>
          <h1 className="font-display text-3xl font-semibold">Personas</h1>
          <p className="mt-1 text-sm text-muted-foreground">{rows.length} reusable profiles · {streamLabel} stream</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild><Button><Plus />New persona</Button></DialogTrigger>
          <DialogContent className="max-h-[90svh] overflow-y-auto">
            <DialogHeader><DialogTitle>Create persona</DialogTitle></DialogHeader>
            <PersonaForm initial={{ stream }} submitLabel="Create persona" onSubmit={(body) => { createPersona(body); setCreateOpen(false); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STREAMS.map((s) => (
          <Button key={s.value} variant={stream === s.value ? "secondary" : "ghost"} size="sm" onClick={() => setStream(s.value)}>{s.label}</Button>
        ))}
      </div>

      {stream !== "chat" ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <span className="grid size-12 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-primary"><Clock3 className="size-5" /></span>
            <p className="mt-4 font-display text-xl font-semibold">{streamLabel} personas are coming soon</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">We’re preparing audience profiles for the {streamLabel.toLowerCase()} stream. Chat personas are available today.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="mb-4">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input aria-label="Search personas" placeholder="Search personas" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Library</CardTitle></CardHeader>
            <CardContent>
              {rows.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No personas in this stream yet. Create one to reuse across runs.</p>
              ) : (
                <Table>
                  <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell><span className="font-medium">{p.persona_name}</span> <Badge variant="outline" className="ml-1">{p.stream || "chat"}</Badge></TableCell>
                        <TableCell className="max-w-md truncate text-muted-foreground">{p.description || "—"}</TableCell>
                        <TableCell className="text-right">
                          <span className="inline-flex gap-1">
                            <Button variant="ghost" size="icon" aria-label={`Edit ${p.persona_name}`} onClick={() => setEditing(p)}><Pencil className="size-4" /></Button>
                            <Button variant="ghost" size="icon" aria-label={`Delete ${p.persona_name}`} onClick={() => setDeleting(p)}><Trash2 className="size-4" /></Button>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-h-[90svh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit persona</DialogTitle></DialogHeader>
          {editing && (
            <PersonaForm initial={editing} submitLabel="Save changes" onSubmit={(body) => { updatePersona(editing.id, body); setEditing(null); }} />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `Delete "${deleting.persona_name}"?` : "Delete persona?"}
        description="This removes the persona from the library. Scenarios already generated keep their persona assignment; future generations can no longer use it."
        confirmLabel="Delete persona"
        onConfirm={() => { if (deleting) { deletePersona(deleting.id); setDeleting(null); } }}
      />
    </AppShell>
  );
}
