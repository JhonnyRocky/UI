import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldSelect } from "@/components/FieldSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@/lib/nav";
import { useStore } from "@/mock/store";
import type { MockField, MockProfileRow, MockTestProfile } from "@/mock/data";

const TYPES = [
  { value: "string", label: "String" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "uuid", label: "UUID" },
  { value: "json", label: "JSON" },
];

const SOURCES = [
  { value: "fixed", label: "Fixed value" },
  { value: "generated_uuid", label: "Generate UUID at runtime" },
];

const SUGGESTED_FIELDS: MockField[] = [
  { key: "email", label: "Email", type: "email", source: "fixed", required: false, selected: true },
  { key: "phone", label: "Phone", type: "phone", source: "fixed", required: false, selected: true },
  { key: "user_id", label: "User ID", type: "string", source: "fixed", required: false, selected: true },
  { key: "customer_id", label: "Customer ID", type: "string", source: "fixed", required: false, selected: true },
  { key: "username", label: "Username", type: "string", source: "fixed", required: false, selected: true },
  { key: "session_id", label: "Session ID", type: "uuid", source: "generated_uuid", required: false, selected: true },
];

const slug = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");

export function TestProfileEditorPage({ profileId }: { profileId: string }) {
  const { go } = useNavigate();
  const { testProfiles, createTestProfile, updateTestProfile } = useStore();
  const isNew = profileId === "new";
  const initial = isNew ? undefined : testProfiles.find((p) => p.id === profileId);

  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [fields, setFields] = useState<MockField[]>(initial ? initial.fields : SUGGESTED_FIELDS.map((f) => ({ ...f })));
  const [rows, setRows] = useState<MockProfileRow[]>(initial ? initial.rows : []);
  const [keyTouched, setKeyTouched] = useState<Record<number, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [csv, setCsv] = useState("");

  const selectedFields = useMemo(() => fields.filter((f) => f.selected !== false), [fields]);
  const selectedFixedFields = useMemo(() => selectedFields.filter((f) => f.source === "fixed"), [selectedFields]);

  const setField = (i: number, patch: Partial<MockField>) => setFields((fs) => fs.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  const migrateKey = (oldKey: string, newKey: string) => {
    if (!oldKey || oldKey === newKey) return;
    setRows((rs) => rs.map((r) => {
      if (!(oldKey in r.values)) return r;
      const values = { ...r.values };
      values[newKey] = values[oldKey] ?? null;
      delete values[oldKey];
      return { ...r, values };
    }));
  };
  const addField = () => setFields((fs) => [...fs, { key: "", label: "", type: "string", source: "fixed", required: false, selected: true }]);
  const addSessionId = () => setFields((fs) => [...fs, { key: "session_id", label: "Session ID", type: "uuid", source: "generated_uuid", required: false, selected: true }]);
  const removeField = (i: number) => {
    const key = fields[i]?.key;
    setFields((fs) => fs.filter((_, idx) => idx !== i));
    if (key) setRows((rs) => rs.map((r) => ({ ...r, values: Object.fromEntries(Object.entries(r.values).filter(([k]) => k !== key)) })));
  };
  const addRow = () => setRows((rs) => [...rs, { id: `row-${Date.now()}`, values: Object.fromEntries(selectedFixedFields.map((f) => [f.key, f.type === "number" ? null : ""])) }]);
  const setCell = (rowId: string, key: string, value: string) => setRows((rs) => rs.map((r) => (r.id === rowId ? { ...r, values: { ...r.values, [key]: value === "" ? null : value } } : r)));
  const removeRow = (rowId: string) => setRows((rs) => rs.filter((r) => r.id !== rowId));

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Name is required.");
    if (fields.length === 0) errs.push("At least one field is required.");
    const keys = fields.map((f) => f.key);
    if (new Set(keys).size !== keys.length) errs.push("Field keys must be unique.");
    fields.forEach((f, i) => {
      if (!/^[a-z][a-z0-9_]*$/.test(f.key)) errs.push(`Field ${i + 1}: key must match ^[a-z][a-z0-9_]*$.`);
      if (!f.label.trim()) errs.push(`Field ${i + 1}: label is required.`);
    });
    return errs;
  };

  const save = () => {
    const errs = validate();
    setErrors(errs);
    if (errs.length) return;
    const body: Partial<MockTestProfile> = {
      name: name.trim(),
      description,
      fields,
      rows: rows.map((r) => ({ id: r.id, values: Object.fromEntries(Object.entries(r.values).filter(([k]) => selectedFixedFields.some((f) => f.key === k))) })),
    };
    if (initial) updateTestProfile(initial.id, body);
    else createTestProfile(body);
    go({ name: "test-profiles" });
  };

  return (
    <AppShell>
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-3 -ml-2" onClick={() => go({ name: "test-profiles" })}>
          <ArrowLeft className="size-4" /> Back to Test Profiles
        </Button>
        <h1 className="font-display text-3xl font-semibold">{initial ? "Edit profile" : "Create test profile"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Reusable test users and data for agent API calls.</p>
      </div>

      {errors.length > 0 && (
        <Card className="mb-4 border-destructive/40">
          <CardContent className="pt-6">
            <ul className="list-disc space-y-1 pl-5 text-sm text-destructive">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
          </CardContent>
        </Card>
      )}

      {initial && rows.length === 0 && (
        <Card className="mb-4 border-amber-500/40 bg-amber-500/5">
          <CardContent className="pt-4 pb-4 text-sm text-amber-600 dark:text-amber-400">This test profile has no users yet. Add at least one user row below before attaching it to test projects.</CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Staging chat users" autoFocus /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this dataset for?" /></div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Fields</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Suggested fields for chat agents — remove what you do not need. Fixed fields need values in each row. UUID-generated fields are filled later when tests run.</p>
          <Table>
            <TableHeader>
              <TableRow><TableHead>Include</TableHead><TableHead>Label</TableHead><TableHead>Key</TableHead><TableHead>Type</TableHead><TableHead>Source</TableHead><TableHead>Required</TableHead><TableHead /></TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((f, i) => (
                <TableRow key={i}>
                  <TableCell><input type="checkbox" aria-label={`Field ${i + 1} selected`} checked={f.selected !== false} onChange={(e) => setField(i, { selected: e.target.checked })} /></TableCell>
                  <TableCell>
                    <Input
                      value={f.label}
                      aria-label={`Field ${i + 1} label`}
                      onChange={(e) => {
                        const label = e.target.value;
                        const shouldSync = !initial && !keyTouched[i];
                        if (shouldSync) migrateKey(f.key, slug(label));
                        setFields((fs) => fs.map((x, idx) => (idx === i ? { ...x, label, ...(shouldSync ? { key: slug(label) } : {}) } : x)));
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={f.key}
                      aria-label={`Field ${i + 1} key`}
                      onChange={(e) => { setKeyTouched((t) => ({ ...t, [i]: true })); migrateKey(f.key, e.target.value); setField(i, { key: e.target.value }); }}
                      placeholder="snake_case"
                    />
                  </TableCell>
                  <TableCell><FieldSelect value={f.type} onChange={(v) => setField(i, { type: v })} options={TYPES} ariaLabel={`Field ${i + 1} type`} /></TableCell>
                  <TableCell><FieldSelect value={f.source} onChange={(v) => setField(i, { source: v })} options={SOURCES} ariaLabel={`Field ${i + 1} source`} /></TableCell>
                  <TableCell><input type="checkbox" aria-label={`Field ${i + 1} required`} checked={f.required} onChange={(e) => setField(i, { required: e.target.checked })} /></TableCell>
                  <TableCell><Button variant="ghost" size="icon" aria-label={`Delete field ${i + 1}`} onClick={() => removeField(i)}><Trash2 className="size-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addField}><Plus className="size-4" />Add field</Button>
            <Button type="button" variant="outline" size="sm" onClick={addSessionId}>Add Session ID (UUID)</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader><CardTitle>Rows</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {selectedFields.length === 0 ? (
            <p className="text-sm text-muted-foreground">No fields selected. Tick "Selected" in the Fields table above to choose which columns appear here.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {selectedFields.map((f) => <TableHead key={f.key}>{f.label}{f.required ? " *" : ""}</TableHead>)}
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    {selectedFields.map((f) => (
                      <TableCell key={f.key}>
                        {f.source === "generated_uuid" ? (
                          <span className="inline-flex h-10 items-center rounded-md border border-dashed border-input px-3 text-xs text-muted-foreground">Runtime UUID</span>
                        ) : (
                          <Input type={f.type === "number" ? "number" : "text"} value={r.values[f.key] == null ? "" : String(r.values[f.key])} aria-label={`${f.label} value`} onChange={(e) => setCell(r.id, f.key, e.target.value)} />
                        )}
                      </TableCell>
                    ))}
                    <TableCell><Button variant="ghost" size="icon" aria-label="Delete row" onClick={() => removeRow(r.id)}><Trash2 className="size-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={selectedFixedFields.length === 0}><Plus className="size-4" />Add row</Button>
          </div>
          {initial && (
            <div className="space-y-2">
              <Label>Import CSV</Label>
              <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={"email,customer_id\na@b.com,cust-1"} className="font-mono text-xs" />
              <Button type="button" variant="outline" size="sm" disabled={!csv.trim()} onClick={() => {
                const lines = csv.trim().split("\n");
                const header = lines[0]?.split(",") ?? [];
                const imported: MockProfileRow[] = lines.slice(1).map((line, idx) => {
                  const cells = line.split(",");
                  return { id: `csv-${Date.now()}-${idx}`, values: Object.fromEntries(header.map((h, j) => [h.trim(), cells[j] ?? ""])) };
                });
                setRows((rs) => [...rs, ...imported]);
                setCsv("");
              }}>Import rows</Button>
              <p className="text-xs text-muted-foreground">First line is the header. Unknown columns are added as fixed string fields; rows are appended.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save}>{initial ? "Save changes" : "Create profile"}</Button>
        <Button variant="ghost" onClick={() => go({ name: "test-profiles" })}>Cancel</Button>
      </div>
    </AppShell>
  );
}
