import { AppShell } from "@/components/app-shell/AppShell";
import { DashboardView } from "@/views/DashboardView";
import { TaskDetailView } from "@/views/TaskDetailView";
import { WbsView } from "@/views/WbsView";
import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Ağır görünümler (ECharts/React Flow/ELK/TanStack Table) tembel yüklenir →
// başlangıç paketi küçülür.
const BoardView = lazy(() => import("@/views/BoardView").then((m) => ({ default: m.BoardView })));
const GraphView = lazy(() => import("@/views/GraphView").then((m) => ({ default: m.GraphView })));
const ExecutionView = lazy(() => import("@/views/ExecutionView").then((m) => ({ default: m.ExecutionView })));
const AuditView = lazy(() => import("@/views/AuditView").then((m) => ({ default: m.AuditView })));
const TableView = lazy(() => import("@/views/TableView").then((m) => ({ default: m.TableView })));

function Loading() {
  return <div className="p-6 text-base text-muted-foreground">Yükleniyor…</div>;
}

const rootRoute = createRootRoute({
  component: () => (
    <AppShell>
      <Suspense fallback={<Loading />}>
        <Outlet />
      </Suspense>
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
const executionRoute = createRoute({ getParentRoute: () => rootRoute, path: "/execution", component: ExecutionView });
const auditRoute = createRoute({ getParentRoute: () => rootRoute, path: "/audit", component: AuditView });
const tableRoute = createRoute({ getParentRoute: () => rootRoute, path: "/table", component: TableView });

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  wbsRoute,
  taskRoute,
  boardRoute,
  graphRoute,
  executionRoute,
  auditRoute,
  tableRoute,
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
