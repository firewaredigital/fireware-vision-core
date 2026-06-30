import fs from 'fs';

const files = [
  'src/components/ActivitiesWidget.tsx',
  'src/components/ApprovalRequestDialog.tsx',
  'src/components/AttachmentsWidget.tsx',
  'src/components/LeadRoutingRules.tsx',
  'src/components/NotesWidget.tsx',
  'src/components/StaleDealAlerts.tsx',
  'src/pages/AccountDetail.tsx',
  'src/pages/AccountForm.tsx',
  'src/pages/Accounts.tsx',
  'src/pages/AuditLogs.tsx',
  'src/pages/Automations.tsx',
  'src/pages/CampaignForm.tsx',
  'src/pages/ContactDetail.tsx',
  'src/pages/ContactForm.tsx',
  'src/pages/Contacts.tsx',
  'src/pages/ContractDetail.tsx',
  'src/pages/ContractForm.tsx',
  'src/pages/Contracts.tsx',
  'src/pages/DashboardBuilder.tsx',
  'src/pages/Dashboards.tsx',
  'src/pages/JourneyBuilder.tsx',
  'src/pages/LeadDetail.tsx',
  'src/pages/LeadForm.tsx',
  'src/pages/Leads.tsx',
  'src/pages/Marketing.tsx',
  'src/pages/ProductDetail.tsx',
  'src/pages/ProductForm.tsx',
  'src/pages/Products.tsx',
  'src/pages/QuoteDetail.tsx',
  'src/pages/QuoteForm.tsx',
  'src/pages/Quotes.tsx',
  'src/pages/Reports.tsx',
  'src/pages/SegmentForm.tsx',
  'src/pages/WorkflowBuilder.tsx',
  'src/pages/marketing/CampaignABTest.tsx',
  'src/pages/marketing/EmailTemplateBuilder.tsx',
  'src/pages/marketing/EmailTemplates.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf-8');
  
  // Find all useEffect blocks
  const useEffectMatches = [...content.matchAll(/useEffect\(\(\)\s*=>\s*\{([\s\S]*?)\},\s*\[(.*?)\]\);/g)];
  
  for (const match of useEffectMatches) {
    const deps = match[2].split(',').map(d => d.trim());
    for (const dep of deps) {
      if (!dep) continue;
      // Check if dep is defined as const AFTER this useEffect
      const depDefRegex = new RegExp(`const\\s+${dep}\\s*=`);
      const depMatch = content.match(depDefRegex);
      if (depMatch && depMatch.index > match.index) {
        console.log(`TDZ Issue in ${file}: '${dep}' is used in useEffect at index ${match.index} but defined at ${depMatch.index}`);
      }
    }
  }
}
