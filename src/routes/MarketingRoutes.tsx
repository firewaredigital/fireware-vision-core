import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import Marketing from "@/pages/Marketing";
import CampaignForm from "@/pages/CampaignForm";
import SegmentForm from "@/pages/SegmentForm";
import JourneyBuilder from "@/pages/JourneyBuilder";
import MarketingProviders from "@/pages/marketing/MarketingProviders";
import MarketingPreferenceCenter from "@/pages/marketing/MarketingPreferenceCenter";
import MarketingPersonalization from "@/pages/marketing/MarketingPersonalization";
import MarketingIntelligence from "@/pages/marketing/MarketingIntelligence";
import EmailTemplates from "@/pages/marketing/EmailTemplates";
import EmailTemplateBuilder from "@/pages/marketing/EmailTemplateBuilder";
import CampaignABTest from "@/pages/marketing/CampaignABTest";

export function MarketingRoutes(prefix = '') {
  const p = prefix;
  return [
    <Route key={`${p}-mkt-dash`} path={`${p}/dashboard`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-campaigns`} path={`${p}/campaigns`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-campaigns-new`} path={`${p}/campaigns/new`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-campaigns-id`} path={`${p}/campaigns/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-campaigns-edit`} path={`${p}/campaigns/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-segments`} path={`${p}/segments`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-segments-new`} path={`${p}/segments/new`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-segments-id`} path={`${p}/segments/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-segments-edit`} path={`${p}/segments/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-journeys`} path={`${p}/journeys`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-journeys-new`} path={`${p}/journeys/new`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-journeys-id`} path={`${p}/journeys/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-journeys-edit`} path={`${p}/journeys/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-mkt-providers`} path={`${p}/providers`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingProviders /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-preference`} path={`${p}/preference-center`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingPreferenceCenter /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-personalization`} path={`${p}/personalization`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingPersonalization /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-intelligence`} path={`${p}/intelligence`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingIntelligence /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-mkt-email-templates`} path={`${p}/email-templates`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><EmailTemplates /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-email-templates-new`} path={`${p}/email-templates/new`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><EmailTemplateBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-email-templates-edit`} path={`${p}/email-templates/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><EmailTemplateBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-mkt-ab-test`} path={`${p}/campaigns/:id/ab-test`} element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignABTest /></ModuleGuard></ProtectedLayout>} />,
  ];
}
