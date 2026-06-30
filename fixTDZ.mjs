import fs from 'fs';

function findClosingBracket(text, openPos, openChar, closeChar) {
    let count = 1;
    let i = openPos + 1;
    while (i < text.length && count > 0) {
        if (text[i] === openChar) count++;
        else if (text[i] === closeChar) count--;
        i++;
    }
    return i;
}

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
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;
  
  let attempts = 0;
  while(attempts < 10) {
    attempts++;
    let moved = false;
    const useEffectMatches = [...content.matchAll(/useEffect\s*\(\s*\(\s*\)\s*=>\s*\{/g)];
    
    for (let i = useEffectMatches.length - 1; i >= 0; i--) {
      const match = useEffectMatches[i];
      const startIdx = match.index;
      const openBrace = startIdx + match[0].length - 1;
      const closeBrace = findClosingBracket(content, openBrace, '{', '}');
      
      // find the closing parenthesis for useEffect
      const closeParen = content.indexOf(';', closeBrace);
      if (closeParen === -1) continue;
      
      const useEffectBlock = content.substring(startIdx, closeParen + 1);
      
      // Look for dependencies
      const depsMatch = useEffectBlock.match(/,\s*\[(.*?)\]/);
      if (!depsMatch) continue;
      
      const deps = depsMatch[1].split(',').map(d => d.trim());
      
      let maxDefIdx = -1;
      let maxDefEnd = -1;
      
      for (const dep of deps) {
        if (!dep || dep.includes('?')) continue; // skip profile?.id etc
        const defRegex = new RegExp(`const\\s+${dep}\\s*=\\s*useCallback\\s*\\(`);
        const defMatch = content.match(defRegex);
        if (defMatch && defMatch.index > startIdx) {
          const defStart = defMatch.index;
          const defOpenParen = defStart + defMatch[0].length - 1;
          const defCloseParen = findClosingBracket(content, defOpenParen, '(', ')');
          const defEnd = content.indexOf(';', defCloseParen) !== -1 ? content.indexOf(';', defCloseParen) + 1 : defCloseParen;
          
          if (defEnd > maxDefEnd) {
            maxDefEnd = defEnd;
          }
        }
      }
      
      if (maxDefEnd !== -1) {
        // Move the useEffect block to just after maxDefEnd
        const beforeEffect = content.substring(0, startIdx);
        const afterEffectToDef = content.substring(closeParen + 1, maxDefEnd);
        const afterDef = content.substring(maxDefEnd);
        
        content = beforeEffect + afterEffectToDef + '\n\n  ' + useEffectBlock + afterDef;
        moved = true;
        break; // Start over as indices have changed
      }
    }
    
    if (!moved) break;
  }
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Fixed TDZ in ${file}`);
  }
}
