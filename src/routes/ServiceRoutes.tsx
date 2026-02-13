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

export function ServiceRoutes(prefix = '') {
  const p = prefix;
  return [
    <Route key={`${p}-svc-dash`} path={`${p}/dashboard`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><ServiceDashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-tickets`} path={`${p}/tickets`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><Tickets /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-tickets-new`} path={`${p}/tickets/new`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><TicketForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-tickets-id`} path={`${p}/tickets/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><TicketDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-tickets-edit`} path={`${p}/tickets/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><TicketForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-knowledge`} path={`${p}/knowledge`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><Knowledge /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-knowledge-new`} path={`${p}/knowledge/new`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><ArticleForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-knowledge-id`} path={`${p}/knowledge/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><ArticleDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-knowledge-edit`} path={`${p}/knowledge/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><ArticleForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-svc-inbox`} path={`${p}/inbox`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><OmnichannelInbox /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-svc-queues`} path={`${p}/queues`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><ServiceQueues /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-svc-qa`} path={`${p}/qa`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><QADashboard /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-svc-social`} path={`${p}/social`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><SocialInbox /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-svc-analytics`} path={`${p}/analytics`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><ServiceAnalytics /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-svc-wa`} path={`${p}/whatsapp`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><WhatsAppAdmin /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-svc-chat`} path={`${p}/chat-widgets`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><ChatWidgetsAdmin /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-svc-voice`} path={`${p}/voice`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><VoiceAdmin /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-cs`} path={`${p}/customer-success`} element={<ProtectedLayout><ModuleGuard moduleKey="service"><CustomerSuccess /></ModuleGuard></ProtectedLayout>} />,
  ];
}
