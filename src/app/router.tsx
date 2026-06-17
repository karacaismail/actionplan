import { AppShell } from "@/components/app-shell/AppShell";
import { BoardView } from "@/views/BoardView";
import { DashboardView } from "@/views/DashboardView";
import { GraphView } from "@/views/GraphView";
import { TaskDetailView } from "@/views/TaskDetailView";
import { WbsView } from "@/views/WbsView";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});

const dashboardRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: DashboardView });
const wbsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/wbs", component: WbsView });
const taskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/task/$taskId",
  component: TaskDetailView,
});
const boardRoute = createRoute({ getParentRoute: () => rootRoute, path: "/board", component: BoardView });
const graphRoute = createRoute({ getParentRoute: () => rootRoute, path: "/graph", component: GraphView });

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  wbsRoute,
  taskRoute,
  boardRoute,
  graphRoute,
]);

export const router = createRouter({
  routeTree,
  basepath: import.meta.env.BASE_URL,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
