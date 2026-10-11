import { createContext, useContext, type ReactNode } from "react";

export type Route =
  | { name: "projects" }
  | { name: "project"; projectId: string }
  | { name: "metrics" }
  | { name: "personas" }
  | { name: "test-profiles" }
  | { name: "test-profile"; profileId: string }
  | { name: "tables" };

export type Navigate = (route: Route) => void;

const NavContext = createContext<{ route: Route; go: Navigate } | null>(null);

export function NavProvider({
  route,
  go,
  children,
}: {
  route: Route;
  go: Navigate;
  children: ReactNode;
}) {
  return <NavContext.Provider value={{ route, go }}>{children}</NavContext.Provider>;
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used inside NavProvider");
  return ctx;
}

/** Convenience hook returning `{ go }` for pages that only navigate. */
export function useNavigate() {
  const { go } = useNav();
  return { go };
}
