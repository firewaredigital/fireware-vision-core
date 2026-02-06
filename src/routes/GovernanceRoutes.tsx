import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import Governance from "@/pages/Governance";
import LGPDRequestForm from "@/pages/LGPDRequestForm";

export function GovernanceRoutes() {
  return [
    <Route key="gov" path="/governance" element={<ProtectedLayout><ModuleGuard moduleKey="governance"><Governance /></ModuleGuard></ProtectedLayout>} />,
    <Route key="gov-lgpd-new" path="/governance/lgpd/new" element={<ProtectedLayout><ModuleGuard moduleKey="governance"><LGPDRequestForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="gov-lgpd-id" path="/governance/lgpd/:id" element={<ProtectedLayout><ModuleGuard moduleKey="governance"><LGPDRequestForm /></ModuleGuard></ProtectedLayout>} />,
  ];
}
