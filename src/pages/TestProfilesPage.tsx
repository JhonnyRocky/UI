import { useMemo, useState } from "react";
import { Copy, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "@/lib/nav";
import { useStore } from "@/mock/store";
import type { MockTestProfile } from "@/mock/data";

export function TestProfilesPage() {
  const { go } = useNavigate();
  const { testProfiles, deleteTestProfile, duplicateTestProfile } = useStore();
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState<MockTestProfile | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...testProfiles]
      .filter((p) => !q || `${p.name} ${p.description || ""}`.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [testProfiles, query]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-primary">Test data</p>
          <h1 className="font-display text-3xl font-semibold">Test Profiles</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reusable test users and data for agent API calls.</p>
        </div>
        <Button onClick={() => go({ name: "test-profile", profileId: "new" })}><Plus className="size-4" />Create profile</Button>
      </div>

      <Card className="mb-4">
        <CardContent className="flex items-center gap-3 pt-6">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search test profiles" placeholder="Search test profiles" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Library</CardTitle></CardHeader>
        <CardContent>
          {rows.length === 0 ? (
            <div className="py-12 text-center">
              <p className="font-display text-xl font-semibold">No test profiles yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">Stage reusable identities — emails, customer IDs, session IDs — and reuse them across agent API calls.</p>
              <Button className="mt-4" onClick={() => go({ name: "test-profile", profileId: "new" })}><Plus className="size-4" />Create your first profile</Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Name</TableHead><TableHead>Description</TableHead><TableHead>Fields</TableHead><TableHead>Rows</TableHead><TableHead>Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell><button className="font-medium hover:underline" onClick={() => go({ name: "test-profile", profileId: p.id })}>{p.name}</button></TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">{p.description || "—"}</TableCell>
                    <TableCell>{p.fields.length}</TableCell>
                    <TableCell>{p.rows.length}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(p.updated_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex gap-1">
                        <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => go({ name: "test-profile", profileId: p.id })}><Pencil className="size-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label={`Duplicate ${p.name}`} onClick={() => duplicateTestProfile(p.id)}><Copy className="size-4" /></Button>
                        <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} onClick={() => setDeleting(p)}><Trash2 className="size-4" /></Button>
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting ? `Delete "${deleting.name}"?` : "Delete test profile?"}
        description="This removes the dataset. Scenarios are not affected yet because project attachment is not wired up."
        confirmLabel="Delete profile"
        onConfirm={() => { if (deleting) { deleteTestProfile(deleting.id); setDeleting(null); } }}
      />
    </AppShell>
  );
}
