import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
import { ProtectedLayout } from "@/components/guards/ProtectedLayout";
import Leads from "@/pages/Leads";
import LeadDetail from "@/pages/LeadDetail";
import LeadForm from "@/pages/LeadForm";
import Accounts from "@/pages/Accounts";
import AccountDetail from "@/pages/AccountDetail";
import AccountForm from "@/pages/AccountForm";
import Contacts from "@/pages/Contacts";
import ContactDetail from "@/pages/ContactDetail";
import ContactForm from "@/pages/ContactForm";
import Opportunities from "@/pages/Opportunities";
import OpportunityDetail from "@/pages/OpportunityDetail";
import OpportunityForm from "@/pages/OpportunityForm";
import Quotes from "@/pages/Quotes";
import QuoteDetail from "@/pages/QuoteDetail";
import QuoteForm from "@/pages/QuoteForm";
import Contracts from "@/pages/Contracts";
import ContractDetail from "@/pages/ContractDetail";
import ContractForm from "@/pages/ContractForm";
import CPQConfigurations from "@/pages/sales/CPQConfigurations";
import CPQConfigurationDetail from "@/pages/sales/CPQConfigurationDetail";
import Subscriptions from "@/pages/sales/Subscriptions";
import Billing from "@/pages/sales/Billing";
import BillingDetail from "@/pages/sales/BillingDetail";
import ConversationIntelligence from "@/pages/sales/ConversationIntelligence";
import RevenueOps from "@/pages/sales/RevenueOps";

export function SalesRoutes() {
  return [
    <Route key="leads" path="/leads" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Leads /></ModuleGuard></ProtectedLayout>} />,
    <Route key="leads-new" path="/leads/new" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><LeadForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="leads-id" path="/leads/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><LeadDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="leads-edit" path="/leads/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><LeadForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key="accounts" path="/accounts" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Accounts /></ModuleGuard></ProtectedLayout>} />,
    <Route key="accounts-new" path="/accounts/new" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><AccountForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="accounts-id" path="/accounts/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><AccountDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="accounts-edit" path="/accounts/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><AccountForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key="contacts" path="/contacts" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Contacts /></ModuleGuard></ProtectedLayout>} />,
    <Route key="contacts-new" path="/contacts/new" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContactForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="contacts-id" path="/contacts/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContactDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="contacts-edit" path="/contacts/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContactForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key="opps" path="/opportunities" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Opportunities /></ModuleGuard></ProtectedLayout>} />,
    <Route key="opps-new" path="/opportunities/new" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><OpportunityForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="opps-id" path="/opportunities/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><OpportunityDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="opps-edit" path="/opportunities/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><OpportunityForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key="quotes" path="/quotes" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Quotes /></ModuleGuard></ProtectedLayout>} />,
    <Route key="quotes-new" path="/quotes/new" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><QuoteForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="quotes-id" path="/quotes/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><QuoteDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="quotes-edit" path="/quotes/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><QuoteForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key="contracts" path="/contracts" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Contracts /></ModuleGuard></ProtectedLayout>} />,
    <Route key="contracts-new" path="/contracts/new" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContractForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key="contracts-id" path="/contracts/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContractDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key="contracts-edit" path="/contracts/:id/edit" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContractForm /></ModuleGuard></ProtectedLayout>} />,

    // CPQ
    <Route key="cpq" path="/sales/cpq" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><CPQConfigurations /></ModuleGuard></ProtectedLayout>} />,
    <Route key="cpq-id" path="/sales/cpq/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><CPQConfigurationDetail /></ModuleGuard></ProtectedLayout>} />,

    // Subscriptions & Billing
    <Route key="subscriptions" path="/sales/subscriptions" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Subscriptions /></ModuleGuard></ProtectedLayout>} />,
    <Route key="billing" path="/sales/billing" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Billing /></ModuleGuard></ProtectedLayout>} />,
    <Route key="billing-id" path="/sales/billing/:id" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><BillingDetail /></ModuleGuard></ProtectedLayout>} />,

    // Conversation Intelligence
    <Route key="conv-intel" path="/sales/conversation-intelligence" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ConversationIntelligence /></ModuleGuard></ProtectedLayout>} />,

    // Revenue Operations
    <Route key="revenue-ops" path="/sales/revenue-ops" element={<ProtectedLayout><ModuleGuard moduleKey="sales"><RevenueOps /></ModuleGuard></ProtectedLayout>} />,
  ];
}
