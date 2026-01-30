import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import LeadDetail from "./pages/LeadDetail";
import LeadForm from "./pages/LeadForm";
import Accounts from "./pages/Accounts";
import AccountDetail from "./pages/AccountDetail";
import AccountForm from "./pages/AccountForm";
import Contacts from "./pages/Contacts";
import ContactDetail from "./pages/ContactDetail";
import ContactForm from "./pages/ContactForm";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import OpportunityForm from "./pages/OpportunityForm";
import Quotes from "./pages/Quotes";
import QuoteDetail from "./pages/QuoteDetail";
import QuoteForm from "./pages/QuoteForm";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import ProductForm from "./pages/ProductForm";
import Contracts from "./pages/Contracts";
import ContractDetail from "./pages/ContractDetail";
import ContractForm from "./pages/ContractForm";
import Territories from "./pages/Territories";
import Cadences from "./pages/Cadences";
import Forecast from "./pages/Forecast";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import Reports from "./pages/Reports";
// Service Module
import Tickets from "./pages/Tickets";
import TicketDetail from "./pages/TicketDetail";
import TicketForm from "./pages/TicketForm";
import Knowledge from "./pages/Knowledge";
import ArticleDetail from "./pages/ArticleDetail";
import ArticleForm from "./pages/ArticleForm";
import ServiceDashboard from "./pages/ServiceDashboard";
import Governance from "./pages/Governance";
import LGPDRequestForm from "./pages/LGPDRequestForm";
import CustomerSuccess from "./pages/CustomerSuccess";
// Automations Module
import Automations from "./pages/Automations";
import WorkflowBuilder from "./pages/WorkflowBuilder";
// Marketing Module
import Marketing from "./pages/Marketing";
import CampaignForm from "./pages/CampaignForm";
import SegmentForm from "./pages/SegmentForm";
import JourneyBuilder from "./pages/JourneyBuilder";
// Commerce Module
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import OrderForm from "./pages/OrderForm";
import Returns from "./pages/Returns";
import Promotions from "./pages/Promotions";
import PromotionForm from "./pages/PromotionForm";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Leads */}
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/new" element={<LeadForm />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/leads/:id/edit" element={<LeadForm />} />
            
            {/* Accounts */}
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/new" element={<AccountForm />} />
            <Route path="/accounts/:id" element={<AccountDetail />} />
            <Route path="/accounts/:id/edit" element={<AccountForm />} />
            
            {/* Contacts */}
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/contacts/new" element={<ContactForm />} />
            <Route path="/contacts/:id" element={<ContactDetail />} />
            <Route path="/contacts/:id/edit" element={<ContactForm />} />
            
            {/* Opportunities */}
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/opportunities/new" element={<OpportunityForm />} />
            <Route path="/opportunities/:id" element={<OpportunityDetail />} />
            <Route path="/opportunities/:id/edit" element={<OpportunityForm />} />
            
            {/* Quotes */}
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/new" element={<QuoteForm />} />
            <Route path="/quotes/:id" element={<QuoteDetail />} />
            <Route path="/quotes/:id/edit" element={<QuoteForm />} />
            
            {/* Products */}
            <Route path="/products" element={<Products />} />
            <Route path="/products/new" element={<ProductForm />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/products/:id/edit" element={<ProductForm />} />
            
            {/* Contracts */}
            <Route path="/contracts" element={<Contracts />} />
            <Route path="/contracts/new" element={<ContractForm />} />
            <Route path="/contracts/:id" element={<ContractDetail />} />
            <Route path="/contracts/:id/edit" element={<ContractForm />} />
            
            {/* Tickets (Service Module) */}
            <Route path="/tickets" element={<Tickets />} />
            <Route path="/tickets/new" element={<TicketForm />} />
            <Route path="/tickets/:id" element={<TicketDetail />} />
            <Route path="/tickets/:id/edit" element={<TicketForm />} />
            
            {/* Knowledge Base */}
            <Route path="/knowledge" element={<Knowledge />} />
            <Route path="/knowledge/new" element={<ArticleForm />} />
            <Route path="/knowledge/:id" element={<ArticleDetail />} />
            <Route path="/knowledge/:id/edit" element={<ArticleForm />} />
            
            {/* Service Dashboard */}
            <Route path="/service" element={<ServiceDashboard />} />
            
            {/* Governance */}
            <Route path="/governance" element={<Governance />} />
            <Route path="/governance/lgpd/new" element={<LGPDRequestForm />} />
            <Route path="/governance/lgpd/:id" element={<LGPDRequestForm />} />
            
            {/* Customer Success */}
            <Route path="/customer-success" element={<CustomerSuccess />} />
            
            {/* Automations */}
            <Route path="/automations" element={<Automations />} />
            <Route path="/automations/new" element={<WorkflowBuilder />} />
            <Route path="/automations/:id" element={<WorkflowBuilder />} />
            <Route path="/automations/:id/edit" element={<WorkflowBuilder />} />
            
            {/* Marketing */}
            <Route path="/marketing" element={<Marketing />} />
            <Route path="/marketing/campaigns" element={<Marketing />} />
            <Route path="/marketing/campaigns/new" element={<CampaignForm />} />
            <Route path="/marketing/campaigns/:id" element={<CampaignForm />} />
            <Route path="/marketing/campaigns/:id/edit" element={<CampaignForm />} />
            <Route path="/marketing/segments" element={<Marketing />} />
            <Route path="/marketing/segments/new" element={<SegmentForm />} />
            <Route path="/marketing/segments/:id" element={<SegmentForm />} />
            <Route path="/marketing/segments/:id/edit" element={<SegmentForm />} />
            <Route path="/marketing/journeys" element={<Marketing />} />
            <Route path="/marketing/journeys/new" element={<JourneyBuilder />} />
            <Route path="/marketing/journeys/:id" element={<JourneyBuilder />} />
            <Route path="/marketing/journeys/:id/edit" element={<JourneyBuilder />} />
            
            {/* Commerce */}
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/new" element={<OrderForm />} />
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/returns" element={<Returns />} />
            <Route path="/promotions" element={<Promotions />} />
            <Route path="/promotions/new" element={<PromotionForm />} />
            <Route path="/promotions/:id" element={<PromotionForm />} />
            
            {/* Management */}
            <Route path="/territories" element={<Territories />} />
            <Route path="/cadences" element={<Cadences />} />
            <Route path="/forecast" element={<Forecast />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
