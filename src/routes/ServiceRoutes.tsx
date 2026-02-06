import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import Tickets from "@/pages/Tickets";
import TicketDetail from "@/pages/TicketDetail";
import TicketForm from "@/pages/TicketForm";
import Knowledge from "@/pages/Knowledge";
import ArticleDetail from "@/pages/ArticleDetail";
import ArticleForm from "@/pages/ArticleForm";
import ServiceDashboard from "@/pages/ServiceDashboard";
import CustomerSuccess from "@/pages/CustomerSuccess";
import OmnichannelInbox from "@/pages/OmnichannelInbox";
import WhatsAppAdmin from "@/pages/service/WhatsAppAdmin";
import ChatWidgetsAdmin from "@/pages/service/ChatWidgetsAdmin";
import VoiceAdmin from "@/pages/service/VoiceAdmin";
import QADashboard from "@/pages/service/QADashboard";
import ServiceQueues from "@/pages/service/ServiceQueues";
import SocialInbox from "@/pages/service/SocialInbox";
import ServiceAnalytics from "@/pages/service/ServiceAnalytics";

export function ServiceRoutes() {
  return [
    <Route key="tickets" path="/tickets" element={<ModuleGuard moduleKey="service"><Tickets /></ModuleGuard>} />,
    <Route key="tickets-new" path="/tickets/new" element={<ModuleGuard moduleKey="service"><TicketForm /></ModuleGuard>} />,
    <Route key="tickets-id" path="/tickets/:id" element={<ModuleGuard moduleKey="service"><TicketDetail /></ModuleGuard>} />,
    <Route key="tickets-edit" path="/tickets/:id/edit" element={<ModuleGuard moduleKey="service"><TicketForm /></ModuleGuard>} />,

    <Route key="knowledge" path="/knowledge" element={<ModuleGuard moduleKey="service"><Knowledge /></ModuleGuard>} />,
    <Route key="knowledge-new" path="/knowledge/new" element={<ModuleGuard moduleKey="service"><ArticleForm /></ModuleGuard>} />,
    <Route key="knowledge-id" path="/knowledge/:id" element={<ModuleGuard moduleKey="service"><ArticleDetail /></ModuleGuard>} />,
    <Route key="knowledge-edit" path="/knowledge/:id/edit" element={<ModuleGuard moduleKey="service"><ArticleForm /></ModuleGuard>} />,

    <Route key="service" path="/service" element={<ModuleGuard moduleKey="service"><ServiceDashboard /></ModuleGuard>} />,
    <Route key="service-inbox" path="/service/inbox" element={<ModuleGuard moduleKey="service"><OmnichannelInbox /></ModuleGuard>} />,
    <Route key="service-queues" path="/service/queues" element={<ModuleGuard moduleKey="service"><ServiceQueues /></ModuleGuard>} />,
    <Route key="service-qa" path="/service/qa" element={<ModuleGuard moduleKey="service"><QADashboard /></ModuleGuard>} />,
    <Route key="service-social" path="/service/social" element={<ModuleGuard moduleKey="service"><SocialInbox /></ModuleGuard>} />,
    <Route key="service-analytics" path="/service/analytics" element={<ModuleGuard moduleKey="service"><ServiceAnalytics /></ModuleGuard>} />,
    <Route key="service-wa" path="/service/whatsapp" element={<ModuleGuard moduleKey="service"><WhatsAppAdmin /></ModuleGuard>} />,
    <Route key="service-chat" path="/service/chat-widgets" element={<ModuleGuard moduleKey="service"><ChatWidgetsAdmin /></ModuleGuard>} />,
    <Route key="service-voice" path="/service/voice" element={<ModuleGuard moduleKey="service"><VoiceAdmin /></ModuleGuard>} />,

    <Route key="cs" path="/customer-success" element={<ModuleGuard moduleKey="service"><CustomerSuccess /></ModuleGuard>} />,
  ];
}
