import { Route } from "react-router-dom";
import { ModuleGuard } from "@/components/guards/ModuleGuard";
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

export function SalesRoutes() {
  return [
    <Route key="leads" path="/leads" element={<ModuleGuard moduleKey="sales"><Leads /></ModuleGuard>} />,
    <Route key="leads-new" path="/leads/new" element={<ModuleGuard moduleKey="sales"><LeadForm /></ModuleGuard>} />,
    <Route key="leads-id" path="/leads/:id" element={<ModuleGuard moduleKey="sales"><LeadDetail /></ModuleGuard>} />,
    <Route key="leads-edit" path="/leads/:id/edit" element={<ModuleGuard moduleKey="sales"><LeadForm /></ModuleGuard>} />,

    <Route key="accounts" path="/accounts" element={<ModuleGuard moduleKey="sales"><Accounts /></ModuleGuard>} />,
    <Route key="accounts-new" path="/accounts/new" element={<ModuleGuard moduleKey="sales"><AccountForm /></ModuleGuard>} />,
    <Route key="accounts-id" path="/accounts/:id" element={<ModuleGuard moduleKey="sales"><AccountDetail /></ModuleGuard>} />,
    <Route key="accounts-edit" path="/accounts/:id/edit" element={<ModuleGuard moduleKey="sales"><AccountForm /></ModuleGuard>} />,

    <Route key="contacts" path="/contacts" element={<ModuleGuard moduleKey="sales"><Contacts /></ModuleGuard>} />,
    <Route key="contacts-new" path="/contacts/new" element={<ModuleGuard moduleKey="sales"><ContactForm /></ModuleGuard>} />,
    <Route key="contacts-id" path="/contacts/:id" element={<ModuleGuard moduleKey="sales"><ContactDetail /></ModuleGuard>} />,
    <Route key="contacts-edit" path="/contacts/:id/edit" element={<ModuleGuard moduleKey="sales"><ContactForm /></ModuleGuard>} />,

    <Route key="opps" path="/opportunities" element={<ModuleGuard moduleKey="sales"><Opportunities /></ModuleGuard>} />,
    <Route key="opps-new" path="/opportunities/new" element={<ModuleGuard moduleKey="sales"><OpportunityForm /></ModuleGuard>} />,
    <Route key="opps-id" path="/opportunities/:id" element={<ModuleGuard moduleKey="sales"><OpportunityDetail /></ModuleGuard>} />,
    <Route key="opps-edit" path="/opportunities/:id/edit" element={<ModuleGuard moduleKey="sales"><OpportunityForm /></ModuleGuard>} />,

    <Route key="quotes" path="/quotes" element={<ModuleGuard moduleKey="sales"><Quotes /></ModuleGuard>} />,
    <Route key="quotes-new" path="/quotes/new" element={<ModuleGuard moduleKey="sales"><QuoteForm /></ModuleGuard>} />,
    <Route key="quotes-id" path="/quotes/:id" element={<ModuleGuard moduleKey="sales"><QuoteDetail /></ModuleGuard>} />,
    <Route key="quotes-edit" path="/quotes/:id/edit" element={<ModuleGuard moduleKey="sales"><QuoteForm /></ModuleGuard>} />,

    <Route key="contracts" path="/contracts" element={<ModuleGuard moduleKey="sales"><Contracts /></ModuleGuard>} />,
    <Route key="contracts-new" path="/contracts/new" element={<ModuleGuard moduleKey="sales"><ContractForm /></ModuleGuard>} />,
    <Route key="contracts-id" path="/contracts/:id" element={<ModuleGuard moduleKey="sales"><ContractDetail /></ModuleGuard>} />,
    <Route key="contracts-edit" path="/contracts/:id/edit" element={<ModuleGuard moduleKey="sales"><ContractForm /></ModuleGuard>} />,

    // CPQ
    <Route key="cpq" path="/sales/cpq" element={<ModuleGuard moduleKey="sales"><CPQConfigurations /></ModuleGuard>} />,
    <Route key="cpq-id" path="/sales/cpq/:id" element={<ModuleGuard moduleKey="sales"><CPQConfigurationDetail /></ModuleGuard>} />,

    // Subscriptions & Billing
    <Route key="subscriptions" path="/sales/subscriptions" element={<ModuleGuard moduleKey="sales"><Subscriptions /></ModuleGuard>} />,
    <Route key="billing" path="/sales/billing" element={<ModuleGuard moduleKey="sales"><Billing /></ModuleGuard>} />,
    <Route key="billing-id" path="/sales/billing/:id" element={<ModuleGuard moduleKey="sales"><BillingDetail /></ModuleGuard>} />,

    // Conversation Intelligence
    <Route key="conv-intel" path="/sales/conversation-intelligence" element={<ModuleGuard moduleKey="sales"><ConversationIntelligence /></ModuleGuard>} />,
  ];
}