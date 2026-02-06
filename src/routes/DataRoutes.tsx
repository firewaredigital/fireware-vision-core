import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
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
    <Route key="dupes" path="/duplicates" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><Duplicates /></ModuleGuard></ProtectedLayout>} />,
    <Route key="merge" path="/merge-wizard" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard></ProtectedLayout>} />,
    <Route key="merge-id" path="/merge-wizard/:id" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard></ProtectedLayout>} />,
    <Route key="funnel" path="/full-funnel" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><FullFunnel /></ModuleGuard></ProtectedLayout>} />,
    <Route key="attr" path="/attribution" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><AttributionDashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key="c360" path="/customer-360" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard></ProtectedLayout>} />,
    <Route key="c360-detail" path="/customer-360/:type/:id" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard></ProtectedLayout>} />,

    // Data Hub routes
    <Route key="golden-records" path="/data-hub/golden-records" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><GoldenRecords /></ModuleGuard></ProtectedLayout>} />,
    <Route key="golden-record-id" path="/data-hub/golden-records/:id" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><GoldenRecordDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="data-sources" path="/data-hub/sources" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><DataSources /></ModuleGuard></ProtectedLayout>} />,
    <Route key="event-schemas" path="/data-hub/schemas" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><EventSchemas /></ModuleGuard></ProtectedLayout>} />,
    <Route key="activation" path="/data-hub/activation" element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><ActivationJobs /></ModuleGuard></ProtectedLayout>} />,
  ];
}
