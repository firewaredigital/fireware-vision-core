import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
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
    <Route key="it" path="/it" element={<ModuleGuard moduleKey="itsm"><ITDashboard /></ModuleGuard>} />,
    <Route key="it-inc" path="/it/incidents" element={<ModuleGuard moduleKey="itsm"><ITIncidents /></ModuleGuard>} />,
    <Route key="it-inc-new" path="/it/incidents/new" element={<ModuleGuard moduleKey="itsm"><ITIncidentForm /></ModuleGuard>} />,
    <Route key="it-inc-id" path="/it/incidents/:id" element={<ModuleGuard moduleKey="itsm"><ITIncidentDetail /></ModuleGuard>} />,
    <Route key="it-inc-edit" path="/it/incidents/:id/edit" element={<ModuleGuard moduleKey="itsm"><ITIncidentForm /></ModuleGuard>} />,
    <Route key="it-chg" path="/it/changes" element={<ModuleGuard moduleKey="itsm"><ITChanges /></ModuleGuard>} />,
    <Route key="it-chg-new" path="/it/changes/new" element={<ModuleGuard moduleKey="itsm"><ITChangeForm /></ModuleGuard>} />,
    <Route key="it-chg-id" path="/it/changes/:id" element={<ModuleGuard moduleKey="itsm"><ITChangeForm /></ModuleGuard>} />,
    <Route key="it-cmdb" path="/it/cmdb" element={<ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard>} />,
    <Route key="it-cmdb-new" path="/it/cmdb/new" element={<ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard>} />,
    <Route key="it-cmdb-id" path="/it/cmdb/:id" element={<ModuleGuard moduleKey="itsm"><CMDB /></ModuleGuard>} />,
    <Route key="it-assets" path="/it/assets" element={<ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard>} />,
    <Route key="it-assets-new" path="/it/assets/new" element={<ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard>} />,
    <Route key="it-assets-id" path="/it/assets/:id" element={<ModuleGuard moduleKey="itsm"><ITAssets /></ModuleGuard>} />,
  ];
}
