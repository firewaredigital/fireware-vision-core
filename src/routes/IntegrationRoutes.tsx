import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import IntegrationsCatalog from "@/pages/integrations/IntegrationsCatalog";
import IntegrationsInstances from "@/pages/integrations/IntegrationsInstances";
import IntegrationsMonitoring from "@/pages/integrations/IntegrationsMonitoring";
import IntegrationsDLQ from "@/pages/integrations/IntegrationsDLQ";
import IntegrationsWebhooks from "@/pages/integrations/IntegrationsWebhooks";

export function IntegrationRoutes() {
  return [
    <Route
      key="int-catalog"
      path="/integrations/catalog"
      element={
        <ModuleGuard moduleKey="integrations" redirectTo="/dashboard">
          <IntegrationsCatalog />
        </ModuleGuard>
      }
    />,
    <Route
      key="int-instances"
      path="/integrations/instances"
      element={
        <ModuleGuard moduleKey="integrations" redirectTo="/dashboard">
          <IntegrationsInstances />
        </ModuleGuard>
      }
    />,
    <Route
      key="int-monitoring"
      path="/integrations/monitoring"
      element={
        <ModuleGuard moduleKey="integrations" redirectTo="/dashboard">
          <IntegrationsMonitoring />
        </ModuleGuard>
      }
    />,
    <Route
      key="int-dlq"
      path="/integrations/dlq"
      element={
        <ModuleGuard moduleKey="integrations" redirectTo="/dashboard">
          <IntegrationsDLQ />
        </ModuleGuard>
      }
    />,
    <Route
      key="int-webhooks"
      path="/integrations/webhooks"
      element={
        <ModuleGuard moduleKey="integrations" redirectTo="/dashboard">
          <IntegrationsWebhooks />
        </ModuleGuard>
      }
    />,
  ];
}
