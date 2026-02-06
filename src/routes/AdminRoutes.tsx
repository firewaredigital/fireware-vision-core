import { Route } from "react-router-dom";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import PlatformModules from "@/pages/admin/PlatformModules";
import PlatformPermissions from "@/pages/admin/PlatformPermissions";
import PlatformObservability from "@/pages/admin/PlatformObservability";
import PlatformSecurity from "@/pages/admin/PlatformSecurity";
import PlatformIntegrations from "@/pages/admin/PlatformIntegrations";
import PlatformAI from "@/pages/admin/PlatformAI";
import CustomFieldsAdmin from "@/pages/admin/CustomFieldsAdmin";

export function AdminRoutes() {
  return [
    <Route key="admin-modules" path="/admin/platform/modules" element={<ProtectedLayout><PlatformModules /></ProtectedLayout>} />,
    <Route key="admin-perms" path="/admin/platform/permissions" element={<ProtectedLayout><PlatformPermissions /></ProtectedLayout>} />,
    <Route key="admin-obs" path="/admin/platform/observability" element={<ProtectedLayout><PlatformObservability /></ProtectedLayout>} />,
    <Route key="admin-security" path="/admin/platform/security" element={<ProtectedLayout><PlatformSecurity /></ProtectedLayout>} />,
    <Route key="admin-integrations" path="/admin/platform/integrations" element={<ProtectedLayout><PlatformIntegrations /></ProtectedLayout>} />,
    <Route key="admin-ai" path="/admin/platform/ai" element={<ProtectedLayout><PlatformAI /></ProtectedLayout>} />,
    <Route key="admin-custom-fields" path="/admin/platform/custom-fields" element={<ProtectedLayout><CustomFieldsAdmin /></ProtectedLayout>} />,
  ];
}
