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

export function ITRoutes() {
  return [
    <Route key="it" path="/it" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITDashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-inc" path="/it/incidents" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidents /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-inc-new" path="/it/incidents/new" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-inc-id" path="/it/incidents/:id" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidentDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-inc-edit" path="/it/incidents/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITIncidentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-chg" path="/it/changes" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITChanges /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-chg-new" path="/it/changes/new" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITChangeForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-chg-id" path="/it/changes/:id" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITChangeForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-cmdb" path="/it/cmdb" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-cmdb-new" path="/it/cmdb/new" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-cmdb-id" path="/it/cmdb/:id" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-assets" path="/it/assets" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-assets-new" path="/it/assets/new" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard></ProtectedLayout>} />,
    <Route key="it-assets-id" path="/it/assets/:id" element={<ProtectedLayout><ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard></ProtectedLayout>} />,
  ];
}
