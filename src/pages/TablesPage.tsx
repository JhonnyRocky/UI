import { TableProperties } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ComingSoonPage } from "@/components/ComingSoonPage";

export function TablesPage() {
  return (
    <AppShell>
      <ComingSoonPage
        title="Test tables"
        description="Inspect scenarios, runs, and evaluation results in a flexible structured workspace."
        icon={TableProperties}
      />
    </AppShell>
  );
}
