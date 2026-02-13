import { Route, Navigate } from 'react-router-dom';

/**
 * Legacy URL redirects for backwards compatibility.
 * Maps old flat routes to the new /app/{slug}/ prefixed structure.
 */
export function RedirectRoutes() {
  return [
    // CRM
    <Route key="r-dashboard" path="/dashboard" element={<Navigate to="/app/crm/dashboard" replace />} />,
    <Route key="r-leads" path="/leads/*" element={<NavigateWithSuffix base="/leads" target="/app/crm/leads" />} />,
    <Route key="r-accounts" path="/accounts/*" element={<NavigateWithSuffix base="/accounts" target="/app/crm/accounts" />} />,
    <Route key="r-contacts" path="/contacts/*" element={<NavigateWithSuffix base="/contacts" target="/app/crm/contacts" />} />,
    <Route key="r-opportunities" path="/opportunities/*" element={<NavigateWithSuffix base="/opportunities" target="/app/crm/opportunities" />} />,
    <Route key="r-quotes" path="/quotes/*" element={<NavigateWithSuffix base="/quotes" target="/app/crm/quotes" />} />,
    <Route key="r-contracts" path="/contracts/*" element={<NavigateWithSuffix base="/contracts" target="/app/crm/contracts" />} />,
    <Route key="r-sales" path="/sales/*" element={<NavigateWithSuffix base="/sales" target="/app/crm/sales" />} />,

    // Service
    <Route key="r-service" path="/service/*" element={<NavigateWithSuffix base="/service" target="/app/service" />} />,
    <Route key="r-tickets" path="/tickets/*" element={<NavigateWithSuffix base="/tickets" target="/app/service/tickets" />} />,
    <Route key="r-knowledge" path="/knowledge/*" element={<NavigateWithSuffix base="/knowledge" target="/app/service/knowledge" />} />,
    <Route key="r-cs" path="/customer-success" element={<Navigate to="/app/service/customer-success" replace />} />,

    // Marketing
    <Route key="r-marketing" path="/marketing/*" element={<NavigateWithSuffix base="/marketing" target="/app/marketing" />} />,

    // Commerce
    <Route key="r-orders" path="/orders/*" element={<NavigateWithSuffix base="/orders" target="/app/commerce/orders" />} />,
    <Route key="r-returns" path="/returns" element={<Navigate to="/app/commerce/returns" replace />} />,
    <Route key="r-promotions" path="/promotions/*" element={<NavigateWithSuffix base="/promotions" target="/app/commerce/promotions" />} />,

    // ITSM
    <Route key="r-it" path="/it/*" element={<NavigateWithSuffix base="/it" target="/app/itsm" />} />,

    // AI
    <Route key="r-ai" path="/ai/*" element={<NavigateWithSuffix base="/ai" target="/app/crm/ai" />} />,

    // Data
    <Route key="r-duplicates" path="/duplicates" element={<Navigate to="/app/crm/duplicates" replace />} />,
    <Route key="r-merge" path="/merge-wizard/*" element={<NavigateWithSuffix base="/merge-wizard" target="/app/crm/merge-wizard" />} />,
    <Route key="r-funnel" path="/full-funnel" element={<Navigate to="/app/crm/full-funnel" replace />} />,
    <Route key="r-attribution" path="/attribution" element={<Navigate to="/app/crm/attribution" replace />} />,
    <Route key="r-c360" path="/customer-360/*" element={<NavigateWithSuffix base="/customer-360" target="/app/crm/customer-360" />} />,
    <Route key="r-datahub" path="/data-hub/*" element={<NavigateWithSuffix base="/data-hub" target="/app/crm/data-hub" />} />,

    // Governance
    <Route key="r-gov" path="/governance/*" element={<NavigateWithSuffix base="/governance" target="/app/crm/governance" />} />,

    // Integrations
    <Route key="r-int" path="/integrations/*" element={<NavigateWithSuffix base="/integrations" target="/app/crm/integrations" />} />,

    // Automations
    <Route key="r-auto" path="/automations/*" element={<NavigateWithSuffix base="/automations" target="/app/crm/automations" />} />,

    // Management
    <Route key="r-products" path="/products/*" element={<NavigateWithSuffix base="/products" target="/app/crm/products" />} />,
    <Route key="r-territories" path="/territories" element={<Navigate to="/app/crm/territories" replace />} />,
    <Route key="r-cadences" path="/cadences" element={<Navigate to="/app/crm/cadences" replace />} />,
    <Route key="r-forecast" path="/forecast" element={<Navigate to="/app/crm/forecast" replace />} />,
    <Route key="r-dashboards" path="/dashboards/*" element={<NavigateWithSuffix base="/dashboards" target="/app/crm/dashboards" />} />,

    // Admin
    <Route key="r-admin" path="/admin/*" element={<NavigateWithSuffix base="/admin" target="/app/crm/admin" />} />,

    // Utility
    <Route key="r-reports" path="/reports" element={<Navigate to="/app/crm/reports" replace />} />,
    <Route key="r-audit" path="/audit-logs" element={<Navigate to="/app/crm/audit-logs" replace />} />,
    <Route key="r-notifications" path="/notifications" element={<Navigate to="/app/crm/notifications" replace />} />,
    <Route key="r-settings" path="/settings/*" element={<NavigateWithSuffix base="/settings" target="/app/crm/settings" />} />,
  ];
}

/**
 * Helper component that preserves path suffix during redirect.
 * E.g. /leads/123 → /app/crm/leads/123
 */
function NavigateWithSuffix({ base, target }: { base: string; target: string }) {
  const suffix = window.location.pathname.slice(base.length);
  return <Navigate to={`${target}${suffix}`} replace />;
}
