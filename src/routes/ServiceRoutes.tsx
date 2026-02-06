import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
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
    <Route key="tickets" path="/tickets" element={<ProtectedLayout><ModuleGuard moduleKey="service"><Tickets /></ModuleGuard></ProtectedLayout>} />,
    <Route key="tickets-new" path="/tickets/new" element={<ProtectedLayout><ModuleGuard moduleKey="service"><TicketForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="tickets-id" path="/tickets/:id" element={<ProtectedLayout><ModuleGuard moduleKey="service"><TicketDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="tickets-edit" path="/tickets/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="service"><TicketForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key="knowledge" path="/knowledge" element={<ProtectedLayout><ModuleGuard moduleKey="service"><Knowledge /></ModuleGuard></ProtectedLayout>} />,
    <Route key="knowledge-new" path="/knowledge/new" element={<ProtectedLayout><ModuleGuard moduleKey="service"><ArticleForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="knowledge-id" path="/knowledge/:id" element={<ProtectedLayout><ModuleGuard moduleKey="service"><ArticleDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="knowledge-edit" path="/knowledge/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="service"><ArticleForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key="service" path="/service" element={<ProtectedLayout><ModuleGuard moduleKey="service"><ServiceDashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-inbox" path="/service/inbox" element={<ProtectedLayout><ModuleGuard moduleKey="service"><OmnichannelInbox /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-queues" path="/service/queues" element={<ProtectedLayout><ModuleGuard moduleKey="service"><ServiceQueues /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-qa" path="/service/qa" element={<ProtectedLayout><ModuleGuard moduleKey="service"><QADashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-social" path="/service/social" element={<ProtectedLayout><ModuleGuard moduleKey="service"><SocialInbox /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-analytics" path="/service/analytics" element={<ProtectedLayout><ModuleGuard moduleKey="service"><ServiceAnalytics /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-wa" path="/service/whatsapp" element={<ProtectedLayout><ModuleGuard moduleKey="service"><WhatsAppAdmin /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-chat" path="/service/chat-widgets" element={<ProtectedLayout><ModuleGuard moduleKey="service"><ChatWidgetsAdmin /></ModuleGuard></ProtectedLayout>} />,
    <Route key="service-voice" path="/service/voice" element={<ProtectedLayout><ModuleGuard moduleKey="service"><VoiceAdmin /></ModuleGuard></ProtectedLayout>} />,

    <Route key="cs" path="/customer-success" element={<ProtectedLayout><ModuleGuard moduleKey="service"><CustomerSuccess /></ModuleGuard></ProtectedLayout>} />,
  ];
}
