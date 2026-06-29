import { AppShell } from "@/components/app-shell/AppShell";
import { DashboardView } from "@/views/DashboardView";
import { TaskDetailView } from "@/views/TaskDetailView";
import { WbsView } from "@/views/WbsView";
import { Outlet, createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

// Ağır görünümler (ECharts/React Flow/ELK/TanStack Table) tembel yüklenir →
// başlangıç paketi küçülür.
const BoardView = lazy(() => import("@/views/BoardView").then((m) => ({ default: m.BoardView })));
const GraphView = lazy(() => import("@/views/GraphView").then((m) => ({ default: m.GraphView })));
const ExecutionView = lazy(() =>
  import("@/views/ExecutionView").then((m) => ({ default: m.ExecutionView })),
);
const AuditView = lazy(() => import("@/views/AuditView").then((m) => ({ default: m.AuditView })));
const TableView = lazy(() => import("@/views/TableView").then((m) => ({ default: m.TableView })));
const GanttView = lazy(() => import("@/views/GanttView").then((m) => ({ default: m.GanttView })));
const WorkloadView = lazy(() =>
  import("@/views/WorkloadView").then((m) => ({ default: m.WorkloadView })),
);
const ReportsView = lazy(() =>
  import("@/views/ReportsView").then((m) => ({ default: m.ReportsView })),
);
const StandardsView = lazy(() =>
  import("@/views/StandardsView").then((m) => ({ default: m.StandardsView })),
);

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

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: DashboardView,
});
const wbsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/wbs", component: WbsView });
const taskRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/task/$taskId",
  component: TaskDetailView,
});
const boardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/board",
  component: BoardView,
});
const graphRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/graph",
  component: GraphView,
});
const executionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/execution",
  component: ExecutionView,
});
const auditRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/audit",
  component: AuditView,
});
const tableRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/table",
  component: TableView,
});
const ganttRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/gantt",
  component: GanttView,
});
const workloadRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/workload",
  component: WorkloadView,
});
const reportsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reports",
  component: ReportsView,
});
const standardsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/standards",
  component: StandardsView,
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  wbsRoute,
  taskRoute,
  boardRoute,
  graphRoute,
  executionRoute,
  auditRoute,
  tableRoute,
  ganttRoute,
  workloadRoute,
  reportsRoute,
  standardsRoute,
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
