export function Section({
  title,
  hint,
  children,
  action,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold">{title}</h3>
          {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StickyBar({ children }: { children: React.ReactNode }) {
  return <div className="sticky bottom-0 z-10 mt-4 flex items-center justify-end gap-2 border-t bg-card pt-4">{children}</div>;
}
