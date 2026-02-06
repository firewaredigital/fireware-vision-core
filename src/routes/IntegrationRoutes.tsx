import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import IntegrationsCatalog from "@/pages/integrations/IntegrationsCatalog";
import IntegrationsInstances from "@/pages/integrations/IntegrationsInstances";
import IntegrationsMonitoring from "@/pages/integrations/IntegrationsMonitoring";
import IntegrationsDLQ from "@/pages/integrations/IntegrationsDLQ";
import IntegrationsWebhooks from "@/pages/integrations/IntegrationsWebhooks";

export function IntegrationRoutes() {
  return [
    <Route key="int-catalog" path="/integrations/catalog" element={
      <ProtectedLayout><ModuleGuard moduleKey="integrations" redirectTo="/dashboard"><IntegrationsCatalog /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="int-instances" path="/integrations/instances" element={
      <ProtectedLayout><ModuleGuard moduleKey="integrations" redirectTo="/dashboard"><IntegrationsInstances /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="int-monitoring" path="/integrations/monitoring" element={
      <ProtectedLayout><ModuleGuard moduleKey="integrations" redirectTo="/dashboard"><IntegrationsMonitoring /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="int-dlq" path="/integrations/dlq" element={
      <ProtectedLayout><ModuleGuard moduleKey="integrations" redirectTo="/dashboard"><IntegrationsDLQ /></ModuleGuard></ProtectedLayout>
    } />,
    <Route key="int-webhooks" path="/integrations/webhooks" element={
      <ProtectedLayout><ModuleGuard moduleKey="integrations" redirectTo="/dashboard"><IntegrationsWebhooks /></ModuleGuard></ProtectedLayout>
    } />,
  ];
}
