import type { LucideIcon } from "lucide-react";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNav } from "@/lib/nav";

export function ComingSoonPage({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  const { go } = useNav();
  return (
    <section className="mx-auto flex min-h-[calc(100svh-10rem)] max-w-3xl items-center py-10">
      <div className="w-full border-y border-border py-12 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
          <div className="grid size-14 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/8 text-primary shadow-soft">
            <Icon className="size-6" />
          </div>
          <div className="min-w-0">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase text-primary">
              <Clock3 className="size-3.5" />
              Coming soon
            </div>
            <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">{description}</p>
            <Button variant="outline" className="mt-7" onClick={() => go({ name: "projects" })}>
              <ArrowLeft className="size-4" /> Back to projects
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
