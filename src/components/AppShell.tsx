import { useEffect, useState, type ReactNode } from "react";
import {
  ChartNoAxesCombined,
  CircleUserRound,
  FolderKanban,
  Moon,
  PanelLeft,
  Sun,
  Table2,
  UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNav, type Navigate, type Route } from "@/lib/nav";

const NAV: { label: string; route: Route; match: (r: Route) => boolean; icon: typeof FolderKanban }[] = [
  { label: "Projects", route: { name: "projects" }, match: (r) => r.name === "projects" || r.name === "project", icon: FolderKanban },
  { label: "Metrics", route: { name: "metrics" }, match: (r) => r.name === "metrics", icon: ChartNoAxesCombined },
  { label: "Personas", route: { name: "personas" }, match: (r) => r.name === "personas", icon: UsersRound },
  { label: "Test Profiles", route: { name: "test-profiles" }, match: (r) => r.name === "test-profiles" || r.name === "test-profile", icon: Table2 },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { route, go } = useNav();
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof localStorage === "undefined") return "light";
    return (localStorage.getItem("cogniai.ui.theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem("cogniai.ui.theme", theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  return (
    <div className="flex min-h-svh w-full bg-background">
      <WorkspaceSidebar
        route={route}
        go={go}
        collapsed={collapsed}
        theme={theme}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b bg-card/90 px-4 backdrop-blur-md sm:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((c) => !c)}
          >
            <PanelLeft />
          </Button>
          <div className="min-w-0 text-sm text-muted-foreground">
            <span className="truncate">CogniAI Test Lab</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun /> : <Moon />}
            </Button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[90rem] flex-1 px-4 py-7 sm:px-6 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}

function WorkspaceSidebar({
  route,
  go,
  collapsed,
  theme,
  onToggle,
}: {
  route: Route;
  go: Navigate;
  collapsed: boolean;
  theme: "light" | "dark";
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 md:flex",
        collapsed ? "w-[4.25rem]" : "w-64",
      )}
    >
      <div className="flex h-14 items-center border-b border-sidebar-border px-3">
        <button type="button" onClick={() => go({ name: "projects" })} className="flex w-full min-w-0 items-center">
          {collapsed ? (
            <img src="/favicon.png" alt="CogniAI" className="size-8 shrink-0 rounded-md object-contain" />
          ) : (
            <img
              src={theme === "dark" ? "/logo-lockup-dark-transparent.png" : "/logo-lockup-light.png"}
              alt="CogniAI — Agent Testing Platform"
              className="h-auto w-full max-w-none shrink-0 object-contain"
            />
          )}
        </button>
      </div>
      <nav className="flex-1 px-2 py-4">
        {!collapsed && (
          <p className="px-3 pb-2 text-xs font-semibold uppercase text-muted-foreground">Workspace</p>
        )}
        <ul className="space-y-1">
          {NAV.map((item) => {
            const active = item.match(route);
            return (
              <li key={item.label}>
                <button
                  type="button"
                  onClick={() => go(item.route)}
                  title={item.label}
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-3">
        <div className={cn("flex min-w-0 items-center gap-3 rounded-md bg-muted/70 p-2", collapsed && "justify-center")}>
          <span className="grid size-8 shrink-0 place-items-center rounded-full border bg-card text-muted-foreground">
            <CircleUserRound className="size-4" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">Profile</p>
              <p className="truncate text-xs text-muted-foreground">Workspace access</p>
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label="Toggle sidebar"
        className="absolute -right-3 top-20 hidden size-6 place-items-center rounded-full border bg-card text-muted-foreground shadow-soft hover:text-foreground md:grid"
      >
        <PanelLeft className="size-3" />
      </button>
    </aside>
  );
}
