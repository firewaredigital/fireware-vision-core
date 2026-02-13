import { Route } from 'react-router-dom';
import { ModuleGuard } from '@/components/guards/ModuleGuard';
import { ProtectedLayout } from '@/components/guards/ProtectedLayout';

// AI
import AIAgents from '@/pages/ai/AIAgents';
import AIAgentForm from '@/pages/ai/AIAgentForm';
import AIAgentDetail from '@/pages/ai/AIAgentDetail';
import AIAgentPlayground from '@/pages/ai/AIAgentPlayground';
import AITools from '@/pages/ai/AITools';
import AIPolicies from '@/pages/ai/AIPolicies';
import AIEvals from '@/pages/ai/AIEvals';
import AIRuns from '@/pages/ai/AIRuns';
import AIAnalytics from '@/pages/ai/AIAnalytics';

// Data
import Duplicates from '@/pages/Duplicates';
import MergeWizard from '@/pages/MergeWizard';
import FullFunnel from '@/pages/FullFunnel';
import AttributionDashboard from '@/pages/AttributionDashboard';
import Customer360 from '@/pages/Customer360';
import GoldenRecords from '@/pages/datahub/GoldenRecords';
import GoldenRecordDetail from '@/pages/datahub/GoldenRecordDetail';
import DataSources from '@/pages/datahub/DataSources';
import EventSchemas from '@/pages/datahub/EventSchemas';
import ActivationJobs from '@/pages/datahub/ActivationJobs';

// Governance
import Governance from '@/pages/Governance';
import LGPDRequestForm from '@/pages/LGPDRequestForm';

// Integrations
import IntegrationsCatalog from '@/pages/integrations/IntegrationsCatalog';
import IntegrationsInstances from '@/pages/integrations/IntegrationsInstances';
import IntegrationsMonitoring from '@/pages/integrations/IntegrationsMonitoring';
import IntegrationsDLQ from '@/pages/integrations/IntegrationsDLQ';
import IntegrationsWebhooks from '@/pages/integrations/IntegrationsWebhooks';

// Automations
import Automations from '@/pages/Automations';
import WorkflowBuilder from '@/pages/WorkflowBuilder';

// Management
import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import ProductForm from '@/pages/ProductForm';
import Territories from '@/pages/Territories';
import Cadences from '@/pages/Cadences';
import Forecast from '@/pages/Forecast';
import Dashboards from '@/pages/Dashboards';
import DashboardBuilder from '@/pages/DashboardBuilder';

// Admin
import PlatformModules from '@/pages/admin/PlatformModules';
import PlatformPermissions from '@/pages/admin/PlatformPermissions';
import PlatformObservability from '@/pages/admin/PlatformObservability';
import PlatformSecurity from '@/pages/admin/PlatformSecurity';
import PlatformIntegrations from '@/pages/admin/PlatformIntegrations';
import PlatformAI from '@/pages/admin/PlatformAI';
import CustomFieldsAdmin from '@/pages/admin/CustomFieldsAdmin';

// Utility
import Reports from '@/pages/Reports';
import AuditLogs from '@/pages/AuditLogs';
import Notifications from '@/pages/Notifications';
import Settings from '@/pages/Settings';
import CannedResponses from '@/pages/CannedResponses';

export function SharedRoutes(prefix: string) {
  const P = <ProtectedLayout>{null}</ProtectedLayout>;
  return [
    // ─── AI ───
    <Route key={`${prefix}-ai-agents`} path={`${prefix}/ai/agents`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIAgents /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-agents-new`} path={`${prefix}/ai/agents/new`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIAgentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-agents-id`} path={`${prefix}/ai/agents/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIAgentDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-agents-test`} path={`${prefix}/ai/agents/:id/test`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIAgentPlayground /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-tools`} path={`${prefix}/ai/tools`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AITools /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-policies`} path={`${prefix}/ai/policies`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIPolicies /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-evals`} path={`${prefix}/ai/evals`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIEvals /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-runs`} path={`${prefix}/ai/runs`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIRuns /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-ai-analytics`} path={`${prefix}/ai/analytics`} element={<ProtectedLayout><ModuleGuard moduleKey="ai_agents"><AIAnalytics /></ModuleGuard></ProtectedLayout>} />,

    // ─── Data ───
    <Route key={`${prefix}-dupes`} path={`${prefix}/duplicates`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><Duplicates /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-merge`} path={`${prefix}/merge-wizard`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-merge-id`} path={`${prefix}/merge-wizard/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><MergeWizard /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-funnel`} path={`${prefix}/full-funnel`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><FullFunnel /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-attr`} path={`${prefix}/attribution`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><AttributionDashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-c360`} path={`${prefix}/customer-360`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-c360-detail`} path={`${prefix}/customer-360/:type/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><Customer360 /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-golden-records`} path={`${prefix}/data-hub/golden-records`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><GoldenRecords /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-golden-record-id`} path={`${prefix}/data-hub/golden-records/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><GoldenRecordDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-data-sources`} path={`${prefix}/data-hub/sources`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><DataSources /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-event-schemas`} path={`${prefix}/data-hub/schemas`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><EventSchemas /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-activation`} path={`${prefix}/data-hub/activation`} element={<ProtectedLayout><ModuleGuard moduleKey="data_hub"><ActivationJobs /></ModuleGuard></ProtectedLayout>} />,

    // ─── Governance ───
    <Route key={`${prefix}-gov`} path={`${prefix}/governance`} element={<ProtectedLayout><ModuleGuard moduleKey="governance"><Governance /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-gov-lgpd-new`} path={`${prefix}/governance/lgpd/new`} element={<ProtectedLayout><ModuleGuard moduleKey="governance"><LGPDRequestForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-gov-lgpd-id`} path={`${prefix}/governance/lgpd/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="governance"><LGPDRequestForm /></ModuleGuard></ProtectedLayout>} />,

    // ─── Integrations ───
    <Route key={`${prefix}-int-catalog`} path={`${prefix}/integrations/catalog`} element={<ProtectedLayout><ModuleGuard moduleKey="integrations"><IntegrationsCatalog /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-int-instances`} path={`${prefix}/integrations/instances`} element={<ProtectedLayout><ModuleGuard moduleKey="integrations"><IntegrationsInstances /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-int-monitoring`} path={`${prefix}/integrations/monitoring`} element={<ProtectedLayout><ModuleGuard moduleKey="integrations"><IntegrationsMonitoring /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-int-dlq`} path={`${prefix}/integrations/dlq`} element={<ProtectedLayout><ModuleGuard moduleKey="integrations"><IntegrationsDLQ /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-int-webhooks`} path={`${prefix}/integrations/webhooks`} element={<ProtectedLayout><ModuleGuard moduleKey="integrations"><IntegrationsWebhooks /></ModuleGuard></ProtectedLayout>} />,

    // ─── Automations ───
    <Route key={`${prefix}-auto`} path={`${prefix}/automations`} element={<ProtectedLayout><ModuleGuard moduleKey="automations"><Automations /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-auto-new`} path={`${prefix}/automations/new`} element={<ProtectedLayout><ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${prefix}-auto-id`} path={`${prefix}/automations/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="automations"><WorkflowBuilder /></ModuleGuard></ProtectedLayout>} />,

    // ─── Management ───
    <Route key={`${prefix}-products`} path={`${prefix}/products`} element={<ProtectedLayout><Products /></ProtectedLayout>} />,
    <Route key={`${prefix}-products-new`} path={`${prefix}/products/new`} element={<ProtectedLayout><ProductForm /></ProtectedLayout>} />,
    <Route key={`${prefix}-products-id`} path={`${prefix}/products/:id`} element={<ProtectedLayout><ProductDetail /></ProtectedLayout>} />,
    <Route key={`${prefix}-products-edit`} path={`${prefix}/products/:id/edit`} element={<ProtectedLayout><ProductForm /></ProtectedLayout>} />,
    <Route key={`${prefix}-territories`} path={`${prefix}/territories`} element={<ProtectedLayout><Territories /></ProtectedLayout>} />,
    <Route key={`${prefix}-cadences`} path={`${prefix}/cadences`} element={<ProtectedLayout><Cadences /></ProtectedLayout>} />,
    <Route key={`${prefix}-forecast`} path={`${prefix}/forecast`} element={<ProtectedLayout><Forecast /></ProtectedLayout>} />,
    <Route key={`${prefix}-dashboards`} path={`${prefix}/dashboards`} element={<ProtectedLayout><Dashboards /></ProtectedLayout>} />,
    <Route key={`${prefix}-dashboards-new`} path={`${prefix}/dashboards/new`} element={<ProtectedLayout><DashboardBuilder /></ProtectedLayout>} />,
    <Route key={`${prefix}-dashboards-edit`} path={`${prefix}/dashboards/:id`} element={<ProtectedLayout><DashboardBuilder /></ProtectedLayout>} />,

    // ─── Admin ───
    <Route key={`${prefix}-admin-modules`} path={`${prefix}/admin/platform/modules`} element={<ProtectedLayout><PlatformModules /></ProtectedLayout>} />,
    <Route key={`${prefix}-admin-perms`} path={`${prefix}/admin/platform/permissions`} element={<ProtectedLayout><PlatformPermissions /></ProtectedLayout>} />,
    <Route key={`${prefix}-admin-obs`} path={`${prefix}/admin/platform/observability`} element={<ProtectedLayout><PlatformObservability /></ProtectedLayout>} />,
    <Route key={`${prefix}-admin-security`} path={`${prefix}/admin/platform/security`} element={<ProtectedLayout><PlatformSecurity /></ProtectedLayout>} />,
    <Route key={`${prefix}-admin-integrations`} path={`${prefix}/admin/platform/integrations`} element={<ProtectedLayout><PlatformIntegrations /></ProtectedLayout>} />,
    <Route key={`${prefix}-admin-ai`} path={`${prefix}/admin/platform/ai`} element={<ProtectedLayout><PlatformAI /></ProtectedLayout>} />,
    <Route key={`${prefix}-admin-custom-fields`} path={`${prefix}/admin/platform/custom-fields`} element={<ProtectedLayout><CustomFieldsAdmin /></ProtectedLayout>} />,

    // ─── Utility ───
    <Route key={`${prefix}-reports`} path={`${prefix}/reports`} element={<ProtectedLayout><Reports /></ProtectedLayout>} />,
    <Route key={`${prefix}-audit-logs`} path={`${prefix}/audit-logs`} element={<ProtectedLayout><AuditLogs /></ProtectedLayout>} />,
    <Route key={`${prefix}-notifications`} path={`${prefix}/notifications`} element={<ProtectedLayout><Notifications /></ProtectedLayout>} />,
    <Route key={`${prefix}-settings`} path={`${prefix}/settings`} element={<ProtectedLayout><Settings /></ProtectedLayout>} />,
    <Route key={`${prefix}-canned`} path={`${prefix}/settings/canned-responses`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><CannedResponses /></ModuleGuard></ProtectedLayout>} />,
  ];
}
