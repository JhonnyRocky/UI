export function formatLatency(ms: number | null | undefined): string | null {
  if (ms == null || !Number.isFinite(ms)) return null;
  return `${Math.round(ms)} ms`;
}

export function formatPersona(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const words = String(slug)
    .split(/[_\s]+/)
    .filter((w) => w && w.toLowerCase() !== "user")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  return words.length ? words.join(" ") : String(slug);
}

export function formatRunLabel(runNumber?: number | null, attempt?: number | null): string {
  return `Run ${runNumber ?? 1}.${attempt ?? 0}`;
}
