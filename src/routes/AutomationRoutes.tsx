import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Automations from "@/pages/Automations";
import WorkflowBuilder from "@/pages/WorkflowBuilder";

export function AutomationRoutes() {
  return [
    <Route key="auto" path="/automations" element={<ModuleGuard moduleKey="automations"><Automations /></ModuleGuard>} />,
    <Route key="auto-new" path="/automations/new" element={<ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard>} />,
    <Route key="auto-id" path="/automations/:id" element={<ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard>} />,
    <Route key="auto-edit" path="/automations/:id/edit" element={<ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard>} />,
  ];
}
