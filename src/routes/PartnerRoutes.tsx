import { Route } from "react-router-dom";
import PartnerLogin from "@/pages/partner/PartnerLogin";
import PartnerDashboard from "@/pages/partner/PartnerDashboard";
import PartnerDeals from "@/pages/partner/PartnerDeals";
import PartnerDealForm from "@/pages/partner/PartnerDealForm";
import PartnerCommissions from "@/pages/partner/PartnerCommissions";
import PartnerResources from "@/pages/partner/PartnerResources";

export function PartnerRoutes() {
  return [
    <Route key="partner-login" path="/partner/login" element={<PartnerLogin />} />,
    <Route key="partner-dashboard" path="/partner" element={<PartnerDashboard />} />,
    <Route key="partner-deals" path="/partner/deals" element={<PartnerDeals />} />,
    <Route key="partner-deals-new" path="/partner/deals/new" element={<PartnerDealForm />} />,
    <Route key="partner-deals-id" path="/partner/deals/:id" element={<PartnerDealForm />} />,
    <Route key="partner-commissions" path="/partner/commissions" element={<PartnerCommissions />} />,
    <Route key="partner-resources" path="/partner/resources" element={<PartnerResources />} />,
  ];
}
