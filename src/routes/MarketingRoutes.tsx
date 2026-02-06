import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Marketing from "@/pages/Marketing";
import CampaignForm from "@/pages/CampaignForm";
import SegmentForm from "@/pages/SegmentForm";
import JourneyBuilder from "@/pages/JourneyBuilder";

export function MarketingRoutes() {
  return [
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
  ];
}
