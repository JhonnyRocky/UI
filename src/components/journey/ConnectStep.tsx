import { useState } from "react";
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Section, StickyBar } from "@/components/journey/Section";
import { ResponseBody } from "@/components/journey/ResponseBody";
import { FieldSelect } from "@/components/FieldSelect";
import { useStore } from "@/mock/store";
import type { MockProject } from "@/mock/data";

const SAMPLE = `curl -X POST http://localhost:8002/chat \\
  -H 'Content-Type: application/json' \\
  -d '{"message": "Hello", "session_id": "s1", "user_id": "u1"}'`;

const FAKE_RESPONSE = {
  reply: "Hi! I'm the support assistant. How can I help you today?",
  session_id: "s1",
  usage: { tokens: 42 },
};

export function ConnectStep({
  project,
  onDone,
  startAtCurl = false,
}: {
  project: MockProject;
  onDone: () => void;
  startAtCurl?: boolean;
}) {
  const { updateProject, testProfiles } = useStore();
  const saved = project.connection_args || {};
  const transport = saved.target_profile?.response_transport === "websocket" ? "websocket" : "http";

  const [curl, setCurl] = useState(SAMPLE);
  const [wsUrl, setWsUrl] = useState("wss://api.example.com/chat");
  const [wsHeaders, setWsHeaders] = useState("Authorization: Bearer <redacted>");
  const [wsBody, setWsBody] = useState('{\n  "message": "Hello"\n}');
  const [timeoutS, setTimeoutS] = useState(10);
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [subStep, setSubStep] = useState<1 | 2 | 3>(startAtCurl ? 1 : 1);
  const [promptKey, setPromptKey] = useState("message");
  const [responsePath, setResponsePath] = useState("reply");
  const [testDataMode, setTestDataMode] = useState<"synthetic" | "profile">(project.test_data_mode ?? "synthetic");
  const [testProfileId, setTestProfileId] = useState(project.default_test_profile_id ?? "");

  const test = () => {
    setTesting(true);
    setConnected(false);
    window.setTimeout(() => {
      setTesting(false);
      setConnected(true);
      if (subStep === 1) setSubStep(2);
    }, 700);
  };

  const confirm = () => {
    updateProject(project.id, {
      test_data_mode: testDataMode,
      default_test_profile_id: testDataMode === "profile" ? testProfileId : null,
      connection_args: { ...saved, request_template: { method: "POST", url: "https://api.example.com/chat", body: { message: "{{input}}" } } },
    });
    onDone();
  };

  return (
    <div className="space-y-4">
      {subStep === 1 && (
        <Section
          title="1. Connect your agent"
          hint={
            transport === "websocket"
              ? "Enter the socket URL, any auth headers, and the JSON message sent on each turn."
              : "Paste a cURL that sends one message. A JSON body or an event stream is read from the response."
          }
        >
          {transport === "websocket" ? (
            <div className="space-y-3">
              <div className="space-y-1"><Label htmlFor="ws-url">WebSocket URL</Label><Input id="ws-url" className="font-mono text-xs" value={wsUrl} onChange={(e) => setWsUrl(e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="ws-headers">Headers <span className="text-muted-foreground">(optional)</span></Label><Textarea id="ws-headers" rows={3} className="font-mono text-xs" value={wsHeaders} onChange={(e) => setWsHeaders(e.target.value)} /></div>
              <div className="space-y-1"><Label htmlFor="ws-body">Message body</Label><Textarea id="ws-body" rows={5} className="font-mono text-xs" value={wsBody} onChange={(e) => setWsBody(e.target.value)} /></div>
            </div>
          ) : (
            <Textarea rows={5} className="font-mono text-xs" placeholder={SAMPLE} value={curl} onChange={(e) => setCurl(e.target.value)} />
          )}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Label htmlFor="timeout">Timeout (s)</Label>
              <Input id="timeout" type="number" min={1} max={30} className="w-20" value={timeoutS} onChange={(e) => setTimeoutS(Number(e.target.value))} />
            </div>
            {transport === "http" && <Button variant="ghost" size="sm" onClick={() => setCurl(SAMPLE)}>Use example</Button>}
          </div>
          {connected && (
            <p className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Connected · HTTP 200
            </p>
          )}
          {connected && <ResponseBody body={FAKE_RESPONSE} />}
          <StickyBar>
            <Button onClick={test} disabled={testing}>
              {testing && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              {connected ? "Re-test" : "Test connection"}
            </Button>
            {connected && <Button variant="secondary" onClick={() => setSubStep(2)}>Continue</Button>}
          </StickyBar>
        </Section>
      )}

      {subStep === 2 && (
        <Section
          title="2. Map fields"
          hint="Confirm where your user message goes and where the agent's reply is in the response."
          action={
            <Button variant="ghost" size="sm" aria-label="Re-test" onClick={test} disabled={testing}>
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border bg-muted px-3 py-1 font-mono text-xs">POST https://api.example.com/chat</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label htmlFor="prompt-key">User message field</Label><Input id="prompt-key" className="font-mono text-xs" value={promptKey} onChange={(e) => setPromptKey(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="response-path">Agent reply path</Label><Input id="response-path" className="font-mono text-xs" value={responsePath} onChange={(e) => setResponsePath(e.target.value)} /></div>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Agent reply preview</p>
            <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap text-xs">Hi! I'm the support assistant. How can I help you today?</pre>
          </div>
          <ResponseBody body={FAKE_RESPONSE} />
          <details className="rounded-md border p-3 text-sm">
            <summary className="cursor-pointer text-muted-foreground">View request</summary>
            <pre className="mt-2 max-h-40 overflow-auto font-mono text-xs">{curl}</pre>
          </details>
          <StickyBar>
            <Button variant="ghost" onClick={() => setSubStep(1)}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
            <Button onClick={() => setSubStep(3)}>Looks good – Continue</Button>
          </StickyBar>
        </Section>
      )}

      {subStep === 3 && (
        <Section title="3. Test data" hint="Use real test users from a Test Profile, or synthetic ids for anonymous/staging agents.">
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={testDataMode === "synthetic"} onChange={() => setTestDataMode("synthetic")} /> Synthetic
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={testDataMode === "profile"} onChange={() => setTestDataMode("profile")} /> Use Test Profile
            </label>
          </div>
          {testDataMode === "profile" && testProfiles.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="profile-select">Test Profile</Label>
              <FieldSelect
                id="profile-select"
                ariaLabel="Test Profile"
                value={testProfileId}
                onChange={setTestProfileId}
                options={testProfiles.map((p) => ({ value: p.id, label: `${p.name} (${p.rows.length} rows)` }))}
              />
            </div>
          )}
          <StickyBar>
            <Button variant="ghost" onClick={() => setSubStep(2)}><ArrowLeft className="mr-1 h-4 w-4" />Back</Button>
            <Button onClick={confirm}>Save &amp; Continue</Button>
          </StickyBar>
        </Section>
      )}
    </div>
  );
}
