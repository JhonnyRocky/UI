export function ResponseBody({ body }: { body: unknown }) {
  if (body == null || body === "") return null;
  const text = typeof body === "string" ? body : JSON.stringify(body, null, 2);
  return (
    <div className="rounded-md border bg-muted/40 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Response JSON</p>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-xs">{text}</pre>
    </div>
  );
}
