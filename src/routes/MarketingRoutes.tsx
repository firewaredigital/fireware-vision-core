import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Marketing from "@/pages/Marketing";
import CampaignForm from "@/pages/CampaignForm";
import SegmentForm from "@/pages/SegmentForm";
import JourneyBuilder from "@/pages/JourneyBuilder";
import MarketingProviders from "@/pages/marketing/MarketingProviders";
import MarketingPreferenceCenter from "@/pages/marketing/MarketingPreferenceCenter";
import MarketingPersonalization from "@/pages/marketing/MarketingPersonalization";
import MarketingIntelligence from "@/pages/marketing/MarketingIntelligence";

export function MarketingRoutes() {
  return [
    // Original marketing routes
    <Route key="mkt" path="/marketing" element={<ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard>} />,
    <Route key="mkt-campaigns" path="/marketing/campaigns" element={<ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard>} />,
    <Route key="mkt-campaigns-new" path="/marketing/campaigns/new" element={<ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard>} />,
    <Route key="mkt-campaigns-id" path="/marketing/campaigns/:id" element={<ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard>} />,
    <Route key="mkt-campaigns-edit" path="/marketing/campaigns/:id/edit" element={<ModuleGuard moduleKey="marketing"><CampaignForm /></ModuleGuard>} />,
    <Route key="mkt-segments" path="/marketing/segments" element={<ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard>} />,
    <Route key="mkt-segments-new" path="/marketing/segments/new" element={<ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard>} />,
    <Route key="mkt-segments-id" path="/marketing/segments/:id" element={<ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard>} />,
    <Route key="mkt-segments-edit" path="/marketing/segments/:id/edit" element={<ModuleGuard moduleKey="marketing"><SegmentForm /></ModuleGuard>} />,
    <Route key="mkt-journeys" path="/marketing/journeys" element={<ModuleGuard moduleKey="marketing"><Marketing /></ModuleGuard>} />,
    <Route key="mkt-journeys-new" path="/marketing/journeys/new" element={<ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard>} />,
    <Route key="mkt-journeys-id" path="/marketing/journeys/:id" element={<ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard>} />,
    <Route key="mkt-journeys-edit" path="/marketing/journeys/:id/edit" element={<ModuleGuard moduleKey="marketing"><JourneyBuilder /></ModuleGuard>} />,

    // Phase 7 marketing execution routes
    <Route key="mkt-providers" path="/marketing/providers" element={<ModuleGuard moduleKey="marketing"><MarketingProviders /></ModuleGuard>} />,
    <Route key="mkt-preference" path="/marketing/preference-center" element={<ModuleGuard moduleKey="marketing"><MarketingPreferenceCenter /></ModuleGuard>} />,
    <Route key="mkt-personalization" path="/marketing/personalization" element={<ModuleGuard moduleKey="marketing"><MarketingPersonalization /></ModuleGuard>} />,
    <Route key="mkt-intelligence" path="/marketing/intelligence" element={<ModuleGuard moduleKey="marketing"><MarketingIntelligence /></ModuleGuard>} />,
  ];
}
