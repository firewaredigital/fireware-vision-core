import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import Automations from "@/pages/Automations";
import WorkflowBuilder from "@/pages/WorkflowBuilder";

export function AutomationRoutes() {
  return [
    <Route key="auto" path="/automations" element={<ProtectedLayout><ModuleGuard moduleKey="automations"><Automations /></ModuleGuard></ProtectedLayout>} />,
    <Route key="auto-new" path="/automations/new" element={<ProtectedLayout><ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key="auto-id" path="/automations/:id" element={<ProtectedLayout><ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key="auto-edit" path="/automations/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard></ProtectedLayout>} />,
  ];
}
