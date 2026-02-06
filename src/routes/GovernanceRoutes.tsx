import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Governance from "@/pages/Governance";
import LGPDRequestForm from "@/pages/LGPDRequestForm";

export function GovernanceRoutes() {
  return [
    <Route key="gov" path="/governance" element={<ModuleGuard moduleKey="governance"><Governance /></ModuleGuard>} />,
    <Route key="gov-lgpd-new" path="/governance/lgpd/new" element={<ModuleGuard moduleKey="governance"><LGPDRequestForm /></ModuleGuard>} />,
    <Route key="gov-lgpd-id" path="/governance/lgpd/:id" element={<ModuleGuard moduleKey="governance"><LGPDRequestForm /></ModuleGuard>} />,
  ];
}
