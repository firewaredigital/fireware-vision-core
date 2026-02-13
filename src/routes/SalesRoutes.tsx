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
import Dashboard from "@/pages/Dashboard";

export function SalesRoutes(prefix = '') {
  const p = prefix;
  return [
    <Route key={`${p}-crm-dash`} path={`${p}/dashboard`} element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />,
    <Route key={`${p}-leads`} path={`${p}/leads`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Leads /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-leads-new`} path={`${p}/leads/new`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><LeadForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-leads-id`} path={`${p}/leads/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><LeadDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-leads-edit`} path={`${p}/leads/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><LeadForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-accounts`} path={`${p}/accounts`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Accounts /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-accounts-new`} path={`${p}/accounts/new`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><AccountForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-accounts-id`} path={`${p}/accounts/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><AccountDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-accounts-edit`} path={`${p}/accounts/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><AccountForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-contacts`} path={`${p}/contacts`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Contacts /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-contacts-new`} path={`${p}/contacts/new`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContactForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-contacts-id`} path={`${p}/contacts/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContactDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-contacts-edit`} path={`${p}/contacts/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContactForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-opps`} path={`${p}/opportunities`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Opportunities /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-opps-new`} path={`${p}/opportunities/new`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><OpportunityForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-opps-id`} path={`${p}/opportunities/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><OpportunityDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-opps-edit`} path={`${p}/opportunities/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><OpportunityForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-quotes`} path={`${p}/quotes`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Quotes /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-quotes-new`} path={`${p}/quotes/new`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><QuoteForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-quotes-id`} path={`${p}/quotes/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><QuoteDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-quotes-edit`} path={`${p}/quotes/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><QuoteForm /></ModuleGuard></ProtectedLayout>} />,

    <Route key={`${p}-contracts`} path={`${p}/contracts`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Contracts /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-contracts-new`} path={`${p}/contracts/new`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContractForm /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-contracts-id`} path={`${p}/contracts/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContractDetail /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-contracts-edit`} path={`${p}/contracts/:id/edit`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ContractForm /></ModuleGuard></ProtectedLayout>} />,

    // CPQ
    <Route key={`${p}-cpq`} path={`${p}/sales/cpq`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><CPQConfigurations /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-cpq-id`} path={`${p}/sales/cpq/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><CPQConfigurationDetail /></ModuleGuard></ProtectedLayout>} />,

    // Subscriptions & Billing
    <Route key={`${p}-subscriptions`} path={`${p}/sales/subscriptions`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Subscriptions /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-billing`} path={`${p}/sales/billing`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><Billing /></ModuleGuard></ProtectedLayout>} />,
    <Route key={`${p}-billing-id`} path={`${p}/sales/billing/:id`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><BillingDetail /></ModuleGuard></ProtectedLayout>} />,

    // Conversation Intelligence
    <Route key={`${p}-conv-intel`} path={`${p}/sales/conversation-intelligence`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><ConversationIntelligence /></ModuleGuard></ProtectedLayout>} />,

    // Revenue Operations
    <Route key={`${p}-revenue-ops`} path={`${p}/sales/revenue-ops`} element={<ProtectedLayout><ModuleGuard moduleKey="sales"><RevenueOps /></ModuleGuard></ProtectedLayout>} />,
  ];
}
