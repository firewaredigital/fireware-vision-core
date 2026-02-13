import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import ITDashboard from "@/pages/ITDashboard";
import ITIncidents from "@/pages/ITIncidents";
import ITIncidentForm from "@/pages/ITIncidentForm";
import ITIncidentDetail from "@/pages/ITIncidentDetail";
import ITChanges from "@/pages/ITChanges";
import ITChangeForm from "@/pages/ITChangeForm";
import CMDB from "@/pages/CMDB";
import ITAssets from "@/pages/ITAssets";

export function ITRoutes(prefix = '') {
  const p = prefix;
  return [
    <Route key={`${p}-it-dash`} path={`${p}/dashboard`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITDashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-inc`} path={`${p}/incidents`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidents /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-inc-new`} path={`${p}/incidents/new`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-inc-id`} path={`${p}/incidents/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidentDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-inc-edit`} path={`${p}/incidents/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-chg`} path={`${p}/changes`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITChanges /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-chg-new`} path={`${p}/changes/new`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITChangeForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-chg-id`} path={`${p}/changes/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITChangeForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-cmdb`} path={`${p}/cmdb`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-cmdb-new`} path={`${p}/cmdb/new`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-cmdb-id`} path={`${p}/cmdb/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-assets`} path={`${p}/assets`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-assets-new`} path={`${p}/assets/new`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-it-assets-id`} path={`${p}/assets/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard></ProtectedLayout>} />,
  ];
}
