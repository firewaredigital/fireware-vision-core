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
import Territories from "./pages/Territories";
import Cadences from "./pages/Cadences";
import Forecast from "./pages/Forecast";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";
import Reports from "./pages/Reports";

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
