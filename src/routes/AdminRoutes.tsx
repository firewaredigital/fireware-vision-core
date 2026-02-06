import { Route } from "react-router-dom";
import PlatformModules from "@/pages/admin/PlatformModules";
import PlatformPermissions from "@/pages/admin/PlatformPermissions";
import PlatformObservability from "@/pages/admin/PlatformObservability";
import PlatformSecurity from "@/pages/admin/PlatformSecurity";
import PlatformIntegrations from "@/pages/admin/PlatformIntegrations";
import PlatformAI from "@/pages/admin/PlatformAI";

export function AdminRoutes() {
  return [
    <Route key="admin-modules" path="/admin/platform/modules" element={<PlatformModules />} />,
    <Route key="admin-perms" path="/admin/platform/permissions" element={<PlatformPermissions />} />,
    <Route key="admin-obs" path="/admin/platform/observability" element={<PlatformObservability />} />,
    <Route key="admin-security" path="/admin/platform/security" element={<PlatformSecurity />} />,
    <Route key="admin-integrations" path="/admin/platform/integrations" element={<PlatformIntegrations />} />,
    <Route key="admin-ai" path="/admin/platform/ai" element={<PlatformAI />} />,
  ];
}
