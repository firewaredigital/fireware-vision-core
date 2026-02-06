import { Route } from "react-router-dom";
import PortalLogin from "@/pages/portal/PortalLogin";
import PortalTickets from "@/pages/portal/PortalTickets";
import PortalTicketDetail from "@/pages/portal/PortalTicketDetail";
import PortalNewTicket from "@/pages/portal/PortalNewTicket";
import PortalKnowledge from "@/pages/portal/PortalKnowledge";
import PortalOrders from "@/pages/portal/PortalOrders";
import PortalInvoices from "@/pages/portal/PortalInvoices";
import PortalReturns from "@/pages/portal/PortalReturns";
import PortalPreferences from "@/pages/portal/PortalPreferences";

export function PortalRoutes() {
  return [
    <Route key="portal-login" path="/portal/login" element={<PortalLogin />} />,
    <Route key="portal-tickets" path="/portal/tickets" element={<PortalTickets />} />,
    <Route key="portal-tickets-new" path="/portal/tickets/new" element={<PortalNewTicket />} />,
    <Route key="portal-tickets-id" path="/portal/tickets/:id" element={<PortalTicketDetail />} />,
    <Route key="portal-kb" path="/portal/knowledge" element={<PortalKnowledge />} />,

    // Phase 8 expanded customer portal
    <Route key="portal-orders" path="/portal/orders" element={<PortalOrders />} />,
    <Route key="portal-invoices" path="/portal/invoices" element={<PortalInvoices />} />,
    <Route key="portal-returns" path="/portal/returns" element={<PortalReturns />} />,
    <Route key="portal-preferences" path="/portal/preferences" element={<PortalPreferences />} />,

    <Route key="portal-home" path="/portal" element={<PortalTickets />} />,
  ];
}
