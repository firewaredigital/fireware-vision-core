import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Duplicates from "@/pages/Duplicates";
import MergeWizard from "@/pages/MergeWizard";
import FullFunnel from "@/pages/FullFunnel";
import AttributionDashboard from "@/pages/AttributionDashboard";
import Customer360 from "@/pages/Customer360";
import GoldenRecords from "@/pages/datahub/GoldenRecords";
import GoldenRecordDetail from "@/pages/datahub/GoldenRecordDetail";
import DataSources from "@/pages/datahub/DataSources";
import EventSchemas from "@/pages/datahub/EventSchemas";
import ActivationJobs from "@/pages/datahub/ActivationJobs";

export function DataRoutes() {
  return [
    // Original data routes
    <Route key="dupes" path="/duplicates" element={<ModuleGuard moduleKey="data_hub"><Duplicates /></ModuleGuard>} />,
    <Route key="merge" path="/merge-wizard" element={<ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard>} />,
    <Route key="merge-id" path="/merge-wizard/:id" element={<ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard>} />,
    <Route key="funnel" path="/full-funnel" element={<ModuleGuard moduleKey="data_hub"><FullFunnel /></ModuleGuard>} />,
    <Route key="attr" path="/attribution" element={<ModuleGuard moduleKey="data_hub"><AttributionDashboard /></ModuleGuard>} />,
    <Route key="c360" path="/customer-360" element={<ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard>} />,
    <Route key="c360-detail" path="/customer-360/:type/:id" element={<ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard>} />,

    // Data Hub routes (Phase 6)
    <Route key="golden-records" path="/data-hub/golden-records" element={<ModuleGuard moduleKey="data_hub"><GoldenRecords /></ModuleGuard>} />,
    <Route key="golden-record-id" path="/data-hub/golden-records/:id" element={<ModuleGuard moduleKey="data_hub"><GoldenRecordDetail /></ModuleGuard>} />,
    <Route key="data-sources" path="/data-hub/sources" element={<ModuleGuard moduleKey="data_hub"><DataSources /></ModuleGuard>} />,
    <Route key="event-schemas" path="/data-hub/schemas" element={<ModuleGuard moduleKey="data_hub"><EventSchemas /></ModuleGuard>} />,
    <Route key="activation" path="/data-hub/activation" element={<ModuleGuard moduleKey="data_hub"><ActivationJobs /></ModuleGuard>} />,
  ];
}
