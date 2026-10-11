import { useState } from "react";
import { NavProvider, type Route } from "@/lib/nav";
import { MockStoreProvider } from "@/mock/store";
import { ProjectsPage } from "@/pages/ProjectsPage";
import { ProjectDetailPage } from "@/pages/ProjectDetailPage";
import { MetricsPage } from "@/pages/MetricsPage";
import { PersonasPage } from "@/pages/PersonasPage";
import { TestProfilesPage } from "@/pages/TestProfilesPage";
import { TestProfileEditorPage } from "@/pages/TestProfileEditorPage";
import { TablesPage } from "@/pages/TablesPage";

export function App() {
  const [route, setRoute] = useState<Route>({ name: "projects" });

  return (
    <MockStoreProvider>
      <NavProvider route={route} go={setRoute}>
        {renderRoute(route)}
      </NavProvider>
    </MockStoreProvider>
  );
}

function renderRoute(route: Route) {
  switch (route.name) {
    case "projects":
      return <ProjectsPage />;
    case "project":
      return <ProjectDetailPage projectId={route.projectId} key={route.projectId} />;
    case "metrics":
      return <MetricsPage />;
    case "personas":
      return <PersonasPage />;
    case "test-profiles":
      return <TestProfilesPage />;
    case "test-profile":
      return <TestProfileEditorPage profileId={route.profileId} key={route.profileId} />;
    case "tables":
      return <TablesPage />;
    default:
      return <ProjectsPage />;
  }
}
