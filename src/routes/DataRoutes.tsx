import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Duplicates from "@/pages/Duplicates";
import MergeWizard from "@/pages/MergeWizard";
import FullFunnel from "@/pages/FullFunnel";
import AttributionDashboard from "@/pages/AttributionDashboard";
import Customer360 from "@/pages/Customer360";

export function DataRoutes() {
  return [
    <Route key="dupes" path="/duplicates" element={<ModuleGuard moduleKey="data_hub"><Duplicates /></ModuleGuard>} />,
    <Route key="merge" path="/merge-wizard" element={<ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard>} />,
    <Route key="merge-id" path="/merge-wizard/:id" element={<ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard>} />,
    <Route key="funnel" path="/full-funnel" element={<ModuleGuard moduleKey="data_hub"><FullFunnel /></ModuleGuard>} />,
    <Route key="attr" path="/attribution" element={<ModuleGuard moduleKey="data_hub"><AttributionDashboard /></ModuleGuard>} />,
    <Route key="c360" path="/customer-360" element={<ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard>} />,
    <Route key="c360-detail" path="/customer-360/:type/:id" element={<ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard>} />,
  ];
}
