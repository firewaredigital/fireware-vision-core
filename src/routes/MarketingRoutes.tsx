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

export function MarketingRoutes() {
  return [
    <Route key="mkt" path="/marketing" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-campaigns" path="/marketing/campaigns" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-campaigns-new" path="/marketing/campaigns/new" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-campaigns-id" path="/marketing/campaigns/:id" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-campaigns-edit" path="/marketing/campaigns/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-segments" path="/marketing/segments" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-segments-new" path="/marketing/segments/new" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-segments-id" path="/marketing/segments/:id" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-segments-edit" path="/marketing/segments/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-journeys" path="/marketing/journeys" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-journeys-new" path="/marketing/journeys/new" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-journeys-id" path="/marketing/journeys/:id" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-journeys-edit" path="/marketing/journeys/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard></ProtectedLayout>} />,

    // Phase 7 marketing execution routes
    <Route key="mkt-providers" path="/marketing/providers" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingProviders /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-preference" path="/marketing/preference-center" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingPreferenceCenter /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-personalization" path="/marketing/personalization" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingPersonalization /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-intelligence" path="/marketing/intelligence" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><MarketingIntelligence /></ModuleGuard></ProtectedLayout>} />,

    // Email Template Builder & A/B Testing
    <Route key="mkt-email-templates" path="/marketing/email-templates" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><EmailTemplates /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-email-templates-new" path="/marketing/email-templates/new" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><EmailTemplateBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-email-templates-edit" path="/marketing/email-templates/:id" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><EmailTemplateBuilder /></ModuleGuard></ProtectedLayout>} />,
    <Route key="mkt-ab-test" path="/marketing/campaigns/:id/ab-test" element={<ProtectedLayout><ModuleGuard moduleKey="marketing"><CampaignABTest /></ModuleGuard></ProtectedLayout>} />,
  ];
}
