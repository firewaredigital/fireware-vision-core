import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.93.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const LOVABLE_AI_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

interface AgentConfig {
  id: string;
  name: string;
  agent_type: string;
  system_prompt: string;
  model_config: {
    model: string;
    temperature: number;
    max_tokens: number;
  };
  max_turns: number;
  timeout_seconds: number;
}

interface ToolDef {
  id: string;
  name: string;
  description: string;
  tool_type: string;
  parameters_schema: Record<string, unknown>;
  action_config: Record<string, unknown>;
  requires_approval: boolean;
  risk_level: string;
  category: string | null;
}

interface PolicyDef {
  id: string;
  name: string;
  policy_type: string;
  rules: unknown[];
  actions_on_violation: string;
}

interface ToolExecutionResult {
  status: 'success' | 'error' | 'not_found' | 'pending_approval';
  data?: unknown;
  message: string;
  records_affected?: number;
  entity_type?: string;
  entity_id?: string;
}

// ──────────────────────────────────────────────
//  PII MASKING
// ──────────────────────────────────────────────

const PII_PATTERNS = [
  { name: 'cpf', regex: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, mask: '***.***.***-**' },
  { name: 'cnpj', regex: /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, mask: '**.***.***/****-**' },
  { name: 'email', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, mask: '***@***.***' },
  { name: 'phone_br', regex: /\b(?:\+55\s?)?(?:\(?\d{2}\)?\s?)?\d{4,5}-?\d{4}\b/g, mask: '(**) *****-****' },
  { name: 'credit_card', regex: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, mask: '**** **** **** ****' },
];

function maskPII(text: string): { masked: string; detected: boolean; fields: string[] } {
  let masked = text;
  const detectedFields: string[] = [];
  for (const pattern of PII_PATTERNS) {
    if (pattern.regex.test(masked)) {
      detectedFields.push(pattern.name);
      masked = masked.replace(pattern.regex, pattern.mask);
    }
    pattern.regex.lastIndex = 0;
  }
  return { masked, detected: detectedFields.length > 0, fields: detectedFields };
}

// ──────────────────────────────────────────────
//  POLICY VALIDATION
// ──────────────────────────────────────────────

function validatePolicies(
  policies: PolicyDef[],
  input: string,
  _context: Record<string, unknown>
): { allowed: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const policy of policies) {
    if (policy.policy_type === 'content_filter') {
      const rules = policy.rules as Array<{ blocked_words?: string[] }>;
      for (const rule of rules) {
        if (rule.blocked_words) {
          for (const word of rule.blocked_words) {
            if (input.toLowerCase().includes(word.toLowerCase())) {
              violations.push(`Política "${policy.name}": conteúdo bloqueado detectado`);
            }
          }
        }
      }
    }
    if (policy.policy_type === 'scope_restriction') {
      const rules = policy.rules as Array<{ allowed_topics?: string[]; blocked_topics?: string[] }>;
      for (const rule of rules) {
        if (rule.blocked_topics) {
          for (const topic of rule.blocked_topics) {
            if (input.toLowerCase().includes(topic.toLowerCase())) {
              violations.push(`Política "${policy.name}": tópico fora do escopo`);
            }
          }
        }
      }
    }
  }
  return { allowed: violations.length === 0, violations };
}

// ──────────────────────────────────────────────
//  REAL TOOL EXECUTORS
// ──────────────────────────────────────────────

async function executeToolReal(
  supabase: unknown,
  toolDef: ToolDef,
  toolName: string,
  args: Record<string, unknown>,
  orgId: string,
  userId: string,
): Promise<ToolExecutionResult> {
  console.log(`[ToolExecutor] Executing: ${toolName}, type: ${toolDef.tool_type}, args:`, JSON.stringify(args));

  try {
    // Dispatch based on canonical tool name first, then fall back to tool_type + action_config
    switch (toolName) {
      case 'search_knowledge_base':
        return await execSearchKnowledgeBase(supabase, args, orgId);
      case 'get_customer_info':
        return await execGetCustomerInfo(supabase, args, orgId);
      case 'search_contacts':
        return await execSearchContacts(supabase, args, orgId);
      case 'get_contact_info':
        return await execGetContactInfo(supabase, args, orgId);
      case 'get_account_info':
        return await execGetAccountInfo(supabase, args, orgId);
      case 'search_accounts':
        return await execSearchAccounts(supabase, args, orgId);
      case 'create_ticket':
        return await execCreateTicket(supabase, args, orgId, userId);
      case 'get_ticket_info':
        return await execGetTicketInfo(supabase, args, orgId);
      case 'search_tickets':
        return await execSearchTickets(supabase, args, orgId);
      case 'update_ticket':
        return await execUpdateTicket(supabase, args, orgId);
      case 'update_opportunity':
        return await execUpdateOpportunity(supabase, args, orgId);
      case 'get_opportunity_info':
        return await execGetOpportunityInfo(supabase, args, orgId);
      case 'list_opportunities':
        return await execListOpportunities(supabase, args, orgId);
      case 'create_activity':
        return await execCreateActivity(supabase, args, orgId, userId);
      case 'search_products':
        return await execSearchProducts(supabase, args, orgId);
      case 'get_product_info':
        return await execGetProductInfo(supabase, args, orgId);
      case 'get_order_info':
        return await execGetOrderInfo(supabase, args, orgId);
      case 'search_orders':
        return await execSearchOrders(supabase, args, orgId);
      case 'create_lead':
        return await execCreateLead(supabase, args, orgId, userId);
      case 'get_lead_info':
        return await execGetLeadInfo(supabase, args, orgId);
      case 'search_leads':
        return await execSearchLeads(supabase, args, orgId);
      case 'detect_duplicates':
        return await execDetectDuplicates(supabase, args, orgId);
      case 'get_contract_info':
        return await execGetContractInfo(supabase, args, orgId);
      case 'create_note':
        return await execCreateNote(supabase, args, orgId, userId);
      case 'get_dashboard_metrics':
        return await execGetDashboardMetrics(supabase, args, orgId);
      default:
        // Fall back to generic execution based on tool_type
        return await execGenericTool(supabase, toolDef, args, orgId);
    }
  } catch (err: unknown) {
    console.error(`[ToolExecutor] Error in ${toolName}:`, err);
    return {
      status: 'error',
      message: `Erro ao executar "${toolName}": ${err.message || 'Erro desconhecido'}`,
    };
  }
}

// ── search_knowledge_base ──
async function execSearchKnowledgeBase(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const query = String(args.query || args.search || args.term || '');
  const category = args.category as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  if (!query) {
    return { status: 'error', message: 'Parâmetro "query" é obrigatório para busca na base de conhecimento' };
  }

  let dbQuery = supabase
    .from('knowledge_articles')
    .select('id, title, content, category, subcategory, status, view_count, helpful_count, not_helpful_count, tags, created_at, updated_at')
    .eq('organization_id', orgId)
    .eq('status', 'published')
    .or(`title.ilike.%${query}%,content.ilike.%${query}%,tags.cs.{${query}}`)
    .order('view_count', { ascending: false })
    .limit(limit);

  if (category) {
    dbQuery = dbQuery.eq('category', category);
  }

  const { data, error } = await dbQuery;
  if (error) throw error;

  // Truncate content for response
  const results = (data || []).map((a: unknown) => ({
    id: a.id,
    title: a.title,
    category: a.category,
    subcategory: a.subcategory,
    snippet: a.content ? a.content.substring(0, 300) + (a.content.length > 300 ? '...' : '') : '',
    view_count: a.view_count,
    helpful_rate: a.helpful_count + a.not_helpful_count > 0
      ? Math.round((a.helpful_count / (a.helpful_count + a.not_helpful_count)) * 100)
      : null,
    tags: a.tags,
    updated_at: a.updated_at,
  }));

  return {
    status: 'success',
    data: { results, total: results.length, query },
    message: `Encontrados ${results.length} artigo(s) para "${query}"`,
    records_affected: results.length,
    entity_type: 'knowledge_article',
  };
}

// ── get_customer_info ──
async function execGetCustomerInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const searchTerm = String(args.name || args.email || args.query || args.customer || '');
  if (!searchTerm) {
    return { status: 'error', message: 'Informe nome, email ou ID do cliente' };
  }

  // Try contacts first
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, title, department, account_id, status, lead_score, accounts(name)')
    .eq('organization_id', orgId)
    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .limit(5);

  // Also try accounts
  const { data: accounts } = await supabase
    .from('accounts')
    .select('id, name, email, phone, industry, website, annual_revenue, employee_count, address_city, address_state')
    .eq('organization_id', orgId)
    .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
    .limit(5);

  const totalFound = (contacts?.length || 0) + (accounts?.length || 0);

  return {
    status: totalFound > 0 ? 'success' : 'not_found',
    data: {
      contacts: (contacts || []).map((c: unknown) => ({
        id: c.id,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
        email: c.email,
        phone: c.phone,
        title: c.title,
        department: c.department,
        account: c.accounts?.name || null,
        status: c.status,
        lead_score: c.lead_score,
      })),
      accounts: (accounts || []).map((a: unknown) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        phone: a.phone,
        industry: a.industry,
        website: a.website,
        annual_revenue: a.annual_revenue,
        employee_count: a.employee_count,
        location: [a.address_city, a.address_state].filter(Boolean).join(', '),
      })),
    },
    message: totalFound > 0
      ? `Encontrados ${contacts?.length || 0} contato(s) e ${accounts?.length || 0} conta(s) para "${searchTerm}"`
      : `Nenhum cliente encontrado para "${searchTerm}"`,
    records_affected: totalFound,
    entity_type: 'customer',
  };
}

// ── search_contacts ──
async function execSearchContacts(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const query = String(args.query || args.name || args.email || '');
  const status = args.status as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  let dbQuery = supabase
    .from('contacts')
    .select('id, first_name, last_name, email, phone, title, department, status, lead_score, created_at, accounts(name)')
    .eq('organization_id', orgId)
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`);
  }
  if (status) {
    dbQuery = dbQuery.eq('status', status);
  }

  const { data, error } = await dbQuery;
  if (error) throw error;

  const results = (data || []).map((c: unknown) => ({
    id: c.id,
    name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
    email: c.email,
    phone: c.phone,
    title: c.title,
    department: c.department,
    account: c.accounts?.name || null,
    status: c.status,
    lead_score: c.lead_score,
  }));

  return {
    status: 'success',
    data: results,
    message: `Encontrados ${results.length} contato(s)`,
    records_affected: results.length,
    entity_type: 'contact',
  };
}

// ── get_contact_info ──
async function execGetContactInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const contactId = String(args.id || args.contact_id || '');
  if (!contactId) {
    return { status: 'error', message: 'Parâmetro "id" é obrigatório' };
  }

  const { data, error } = await supabase
    .from('contacts')
    .select('*, accounts(id, name, industry)')
    .eq('id', contactId)
    .eq('organization_id', orgId)
    .single();

  if (error || !data) {
    return { status: 'not_found', message: `Contato ${contactId} não encontrado` };
  }

  return {
    status: 'success',
    data: {
      id: data.id,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      email: data.email,
      phone: data.phone,
      mobile: data.mobile,
      title: data.title,
      department: data.department,
      status: data.status,
      lead_score: data.lead_score,
      account: data.accounts ? { id: data.accounts.id, name: data.accounts.name, industry: data.accounts.industry } : null,
      address: [data.address_street, data.address_city, data.address_state, data.address_country].filter(Boolean).join(', '),
      source: data.source,
      tags: data.tags,
      do_not_email: data.do_not_email,
      do_not_call: data.do_not_call,
      created_at: data.created_at,
    },
    message: `Contato encontrado: ${data.first_name} ${data.last_name}`,
    entity_type: 'contact',
    entity_id: data.id,
  };
}

// ── get_account_info ──
async function execGetAccountInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const accountId = String(args.id || args.account_id || '');
  if (!accountId) {
    return { status: 'error', message: 'Parâmetro "id" é obrigatório' };
  }

  const { data, error } = await supabase
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .eq('organization_id', orgId)
    .single();

  if (error || !data) {
    return { status: 'not_found', message: `Conta ${accountId} não encontrada` };
  }

  // Also get contacts count and opportunities count
  const [{ count: contactsCount }, { count: oppsCount }] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('account_id', accountId).eq('organization_id', orgId),
    supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('account_id', accountId).eq('organization_id', orgId),
  ]);

  return {
    status: 'success',
    data: {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      website: data.website,
      industry: data.industry,
      annual_revenue: data.annual_revenue,
      employee_count: data.employee_count,
      address: [data.address_street, data.address_city, data.address_state, data.address_country].filter(Boolean).join(', '),
      source: data.source,
      tags: data.tags,
      contacts_count: contactsCount || 0,
      opportunities_count: oppsCount || 0,
      created_at: data.created_at,
    },
    message: `Conta encontrada: ${data.name}`,
    entity_type: 'account',
    entity_id: data.id,
  };
}

// ── search_accounts ──
async function execSearchAccounts(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const query = String(args.query || args.name || '');
  const industry = args.industry as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  let dbQuery = supabase
    .from('accounts')
    .select('id, name, email, phone, industry, website, annual_revenue, employee_count, address_city, address_state')
    .eq('organization_id', orgId)
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
  }
  if (industry) {
    dbQuery = dbQuery.eq('industry', industry);
  }

  const { data, error } = await dbQuery;
  if (error) throw error;

  return {
    status: 'success',
    data: data || [],
    message: `Encontradas ${(data || []).length} conta(s)`,
    records_affected: (data || []).length,
    entity_type: 'account',
  };
}

// ── create_ticket ──
async function execCreateTicket(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string,
  userId: string
): Promise<ToolExecutionResult> {
  const subject = String(args.subject || args.title || '');
  if (!subject) {
    return { status: 'error', message: 'Parâmetro "subject" é obrigatório para criar ticket' };
  }

  // Generate ticket number via RPC
  let ticketNumber: string;
  try {
    const { data: numData } = await supabase.rpc('generate_ticket_number', { org_id: orgId });
    ticketNumber = numData || `TKT-${Date.now()}`;
  } catch {
    ticketNumber = `TKT-${Date.now()}`;
  }

  const insertData: Record<string, unknown> = {
    organization_id: orgId,
    ticket_number: ticketNumber,
    subject,
    description: args.description || null,
    status: args.status || 'new',
    priority: args.priority || 'medium',
    channel: args.channel || 'api',
    contact_id: args.contact_id || null,
    account_id: args.account_id || null,
    assigned_to: args.assigned_to || null,
    category: args.category || null,
    subcategory: args.subcategory || null,
    tags: args.tags || null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from('tickets')
    .insert(insertData)
    .select('id, ticket_number, subject, status, priority')
    .single();

  if (error) throw error;

  return {
    status: 'success',
    data: {
      id: data.id,
      ticket_number: data.ticket_number,
      subject: data.subject,
      status: data.status,
      priority: data.priority,
    },
    message: `Ticket ${data.ticket_number} criado com sucesso: "${subject}"`,
    records_affected: 1,
    entity_type: 'ticket',
    entity_id: data.id,
  };
}

// ── get_ticket_info ──
async function execGetTicketInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const ticketId = String(args.id || args.ticket_id || '');
  const ticketNumber = String(args.ticket_number || '');

  let dbQuery = supabase
    .from('tickets')
    .select('*, contacts(first_name, last_name, email), accounts(name), profiles!tickets_assigned_to_fkey(first_name, last_name, email)')
    .eq('organization_id', orgId);

  if (ticketId) {
    dbQuery = dbQuery.eq('id', ticketId);
  } else if (ticketNumber) {
    dbQuery = dbQuery.eq('ticket_number', ticketNumber);
  } else {
    return { status: 'error', message: 'Informe "id" ou "ticket_number"' };
  }

  const { data, error } = await dbQuery.single();
  if (error || !data) {
    return { status: 'not_found', message: 'Ticket não encontrado' };
  }

  return {
    status: 'success',
    data: {
      id: data.id,
      ticket_number: data.ticket_number,
      subject: data.subject,
      description: data.description ? data.description.substring(0, 500) : null,
      status: data.status,
      priority: data.priority,
      channel: data.channel,
      category: data.category,
      subcategory: data.subcategory,
      contact: data.contacts ? `${data.contacts.first_name} ${data.contacts.last_name}` : null,
      contact_email: data.contacts?.email || null,
      account: data.accounts?.name || null,
      assigned_to: data.profiles ? `${data.profiles.first_name} ${data.profiles.last_name}` : null,
      satisfaction_rating: data.satisfaction_rating,
      first_response_at: data.first_response_at,
      resolved_at: data.resolved_at,
      tags: data.tags,
      created_at: data.created_at,
    },
    message: `Ticket ${data.ticket_number}: ${data.subject} (${data.status})`,
    entity_type: 'ticket',
    entity_id: data.id,
  };
}

// ── search_tickets ──
async function execSearchTickets(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const query = String(args.query || args.subject || '');
  const status = args.status as string | undefined;
  const priority = args.priority as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  let dbQuery = supabase
    .from('tickets')
    .select('id, ticket_number, subject, status, priority, channel, category, created_at, contacts(first_name, last_name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`subject.ilike.%${query}%,ticket_number.ilike.%${query}%,description.ilike.%${query}%`);
  }
  if (status) dbQuery = dbQuery.eq('status', status);
  if (priority) dbQuery = dbQuery.eq('priority', priority);

  const { data, error } = await dbQuery;
  if (error) throw error;

  const results = (data || []).map((t: unknown) => ({
    id: t.id,
    ticket_number: t.ticket_number,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    channel: t.channel,
    category: t.category,
    contact: t.contacts ? `${t.contacts.first_name} ${t.contacts.last_name}` : null,
    created_at: t.created_at,
  }));

  return {
    status: 'success',
    data: results,
    message: `Encontrados ${results.length} ticket(s)`,
    records_affected: results.length,
    entity_type: 'ticket',
  };
}

// ── update_ticket ──
async function execUpdateTicket(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const ticketId = String(args.id || args.ticket_id || '');
  if (!ticketId) {
    return { status: 'error', message: 'Parâmetro "id" é obrigatório' };
  }

  const updateData: Record<string, unknown> = {};
  if (args.status) updateData.status = args.status;
  if (args.priority) updateData.priority = args.priority;
  if (args.assigned_to) updateData.assigned_to = args.assigned_to;
  if (args.category) updateData.category = args.category;
  if (args.subcategory) updateData.subcategory = args.subcategory;
  if (args.internal_notes) updateData.internal_notes = args.internal_notes;
  if (args.tags) updateData.tags = args.tags;

  if (Object.keys(updateData).length === 0) {
    return { status: 'error', message: 'Nenhum campo para atualizar' };
  }

  const { data, error } = await supabase
    .from('tickets')
    .update(updateData)
    .eq('id', ticketId)
    .eq('organization_id', orgId)
    .select('id, ticket_number, subject, status, priority')
    .single();

  if (error) throw error;
  if (!data) return { status: 'not_found', message: 'Ticket não encontrado' };

  return {
    status: 'success',
    data,
    message: `Ticket ${data.ticket_number} atualizado: ${Object.keys(updateData).join(', ')}`,
    records_affected: 1,
    entity_type: 'ticket',
    entity_id: data.id,
  };
}

// ── update_opportunity ──
async function execUpdateOpportunity(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const oppId = String(args.id || args.opportunity_id || '');
  if (!oppId) {
    return { status: 'error', message: 'Parâmetro "id" é obrigatório' };
  }

  const updateData: Record<string, unknown> = {};
  if (args.stage) updateData.stage = args.stage;
  if (args.probability !== undefined) updateData.probability = args.probability;
  if (args.amount !== undefined) updateData.amount = args.amount;
  if (args.close_date) updateData.close_date = args.close_date;
  if (args.next_step) updateData.next_step = args.next_step;
  if (args.status) updateData.status = args.status;

  if (Object.keys(updateData).length === 0) {
    return { status: 'error', message: 'Nenhum campo para atualizar' };
  }

  const { data, error } = await supabase
    .from('opportunities')
    .update(updateData)
    .eq('id', oppId)
    .eq('organization_id', orgId)
    .select('id, name, stage, probability, amount, status')
    .single();

  if (error) throw error;
  if (!data) return { status: 'not_found', message: 'Oportunidade não encontrada' };

  return {
    status: 'success',
    data,
    message: `Oportunidade "${data.name}" atualizada: ${Object.keys(updateData).join(', ')}`,
    records_affected: 1,
    entity_type: 'opportunity',
    entity_id: data.id,
  };
}

// ── get_opportunity_info ──
async function execGetOpportunityInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const oppId = String(args.id || args.opportunity_id || '');
  if (!oppId) return { status: 'error', message: 'Parâmetro "id" é obrigatório' };

  const { data, error } = await supabase
    .from('opportunities')
    .select('*, accounts(name), contacts(first_name, last_name, email), profiles!opportunities_owner_id_fkey(first_name, last_name)')
    .eq('id', oppId)
    .eq('organization_id', orgId)
    .single();

  if (error || !data) return { status: 'not_found', message: 'Oportunidade não encontrada' };

  return {
    status: 'success',
    data: {
      id: data.id,
      name: data.name,
      amount: data.amount,
      stage: data.stage,
      probability: data.probability,
      status: data.status,
      close_date: data.close_date,
      next_step: data.next_step,
      forecast_category: data.forecast_category,
      account: data.accounts?.name || null,
      contact: data.contacts ? `${data.contacts.first_name} ${data.contacts.last_name}` : null,
      owner: data.profiles ? `${data.profiles.first_name} ${data.profiles.last_name}` : null,
      source: data.source,
      loss_reason: data.loss_reason,
      competitor: data.competitor,
      tags: data.tags,
      created_at: data.created_at,
    },
    message: `Oportunidade "${data.name}": ${data.stage} - R$ ${data.amount?.toLocaleString('pt-BR') || '0'}`,
    entity_type: 'opportunity',
    entity_id: data.id,
  };
}

// ── list_opportunities ──
async function execListOpportunities(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const stage = args.stage as string | undefined;
  const status = (args.status as string) || 'open';
  const ownerId = args.owner_id as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  let dbQuery = supabase
    .from('opportunities')
    .select('id, name, amount, stage, probability, status, close_date, accounts(name), profiles!opportunities_owner_id_fkey(first_name, last_name)')
    .eq('organization_id', orgId)
    .order('amount', { ascending: false })
    .limit(limit);

  if (stage) dbQuery = dbQuery.eq('stage', stage);
  if (status) dbQuery = dbQuery.eq('status', status);
  if (ownerId) dbQuery = dbQuery.eq('owner_id', ownerId);

  const { data, error } = await dbQuery;
  if (error) throw error;

  const results = (data || []).map((o: unknown) => ({
    id: o.id,
    name: o.name,
    amount: o.amount,
    stage: o.stage,
    probability: o.probability,
    status: o.status,
    close_date: o.close_date,
    account: o.accounts?.name || null,
    owner: o.profiles ? `${o.profiles.first_name} ${o.profiles.last_name}` : null,
  }));

  const totalAmount = results.reduce((sum: number, o: unknown) => sum + (o.amount || 0), 0);

  return {
    status: 'success',
    data: { opportunities: results, total_amount: totalAmount },
    message: `Encontradas ${results.length} oportunidade(s), total: R$ ${totalAmount.toLocaleString('pt-BR')}`,
    records_affected: results.length,
    entity_type: 'opportunity',
  };
}

// ── create_activity ──
async function execCreateActivity(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string,
  userId: string
): Promise<ToolExecutionResult> {
  const subject = String(args.subject || args.title || '');
  const type = String(args.type || 'task');
  if (!subject) {
    return { status: 'error', message: 'Parâmetro "subject" é obrigatório' };
  }

  const insertData: Record<string, unknown> = {
    organization_id: orgId,
    owner_id: args.owner_id || userId,
    subject,
    type: type as unknown,
    description: args.description || null,
    status: args.status || 'pending',
    priority: args.priority || 'medium',
    due_date: args.due_date || null,
    contact_id: args.contact_id || null,
    account_id: args.account_id || null,
    opportunity_id: args.opportunity_id || null,
    lead_id: args.lead_id || null,
  };

  const { data, error } = await supabase
    .from('activities')
    .insert(insertData)
    .select('id, subject, type, status, priority, due_date')
    .single();

  if (error) throw error;

  return {
    status: 'success',
    data,
    message: `Atividade criada: "${subject}" (${type})`,
    records_affected: 1,
    entity_type: 'activity',
    entity_id: data.id,
  };
}

// ── search_products ──
async function execSearchProducts(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const query = String(args.query || args.name || '');
  const category = args.category as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  let dbQuery = supabase
    .from('products')
    .select('id, name, sku, category, unit_price, currency, is_active, stock_quantity, description')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,sku.ilike.%${query}%,description.ilike.%${query}%`);
  }
  if (category) dbQuery = dbQuery.eq('category', category);

  const { data, error } = await dbQuery;
  if (error) throw error;

  return {
    status: 'success',
    data: data || [],
    message: `Encontrados ${(data || []).length} produto(s)`,
    records_affected: (data || []).length,
    entity_type: 'product',
  };
}

// ── get_product_info ──
async function execGetProductInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const productId = String(args.id || args.product_id || '');
  if (!productId) return { status: 'error', message: 'Parâmetro "id" é obrigatório' };

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .eq('organization_id', orgId)
    .single();

  if (error || !data) return { status: 'not_found', message: 'Produto não encontrado' };

  return {
    status: 'success',
    data: {
      id: data.id,
      name: data.name,
      sku: data.sku,
      category: data.category,
      description: data.description,
      unit_price: data.unit_price,
      cost_price: data.cost_price,
      currency: data.currency,
      is_active: data.is_active,
      stock_quantity: data.stock_quantity,
      min_stock: data.min_stock,
      weight: data.weight,
      dimensions: data.dimensions,
      tags: data.tags,
    },
    message: `Produto: ${data.name} (${data.sku}) - R$ ${data.unit_price?.toLocaleString('pt-BR')}`,
    entity_type: 'product',
    entity_id: data.id,
  };
}

// ── get_order_info ──
async function execGetOrderInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const orderId = String(args.id || args.order_id || '');
  const orderNumber = String(args.order_number || '');

  let dbQuery = supabase
    .from('orders')
    .select('*, accounts(name), contacts(first_name, last_name)')
    .eq('organization_id', orgId);

  if (orderId) dbQuery = dbQuery.eq('id', orderId);
  else if (orderNumber) dbQuery = dbQuery.eq('order_number', orderNumber);
  else return { status: 'error', message: 'Informe "id" ou "order_number"' };

  const { data, error } = await dbQuery.single();
  if (error || !data) return { status: 'not_found', message: 'Pedido não encontrado' };

  // Get order items
  const { data: items } = await supabase
    .from('order_items')
    .select('*, products(name, sku)')
    .eq('order_id', data.id);

  return {
    status: 'success',
    data: {
      id: data.id,
      order_number: data.order_number,
      status: data.status,
      total_amount: data.total_amount,
      currency: data.currency,
      account: data.accounts?.name || null,
      contact: data.contacts ? `${data.contacts.first_name} ${data.contacts.last_name}` : null,
      items: (items || []).map((i: unknown) => ({
        product: i.products?.name || 'N/A',
        sku: i.products?.sku || 'N/A',
        quantity: i.quantity,
        unit_price: i.unit_price,
        total: i.total_price,
      })),
      items_count: (items || []).length,
      shipping_address: data.shipping_address,
      payment_method: data.payment_method,
      created_at: data.created_at,
    },
    message: `Pedido ${data.order_number}: ${data.status} - R$ ${data.total_amount?.toLocaleString('pt-BR')}`,
    entity_type: 'order',
    entity_id: data.id,
  };
}

// ── search_orders ──
async function execSearchOrders(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const query = String(args.query || args.order_number || '');
  const status = args.status as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  let dbQuery = supabase
    .from('orders')
    .select('id, order_number, status, total_amount, currency, created_at, accounts(name)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query) dbQuery = dbQuery.or(`order_number.ilike.%${query}%`);
  if (status) dbQuery = dbQuery.eq('status', status);

  const { data, error } = await dbQuery;
  if (error) throw error;

  return {
    status: 'success',
    data: (data || []).map((o: unknown) => ({
      ...o,
      account: o.accounts?.name || null,
    })),
    message: `Encontrados ${(data || []).length} pedido(s)`,
    records_affected: (data || []).length,
    entity_type: 'order',
  };
}

// ── create_lead ──
async function execCreateLead(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string,
  userId: string
): Promise<ToolExecutionResult> {
  const firstName = String(args.first_name || args.name || '');
  if (!firstName) {
    return { status: 'error', message: 'Parâmetro "first_name" é obrigatório' };
  }

  const insertData: Record<string, unknown> = {
    organization_id: orgId,
    first_name: firstName,
    last_name: args.last_name || null,
    email: args.email || null,
    phone: args.phone || null,
    company: args.company || null,
    title: args.title || null,
    source: args.source || 'ai_agent',
    status: args.status || 'new',
    owner_id: args.owner_id || userId,
  };

  const { data, error } = await supabase
    .from('leads')
    .insert(insertData)
    .select('id, first_name, last_name, email, company, status')
    .single();

  if (error) throw error;

  return {
    status: 'success',
    data,
    message: `Lead criado: ${data.first_name} ${data.last_name || ''} (${data.company || 'sem empresa'})`,
    records_affected: 1,
    entity_type: 'lead',
    entity_id: data.id,
  };
}

// ── get_lead_info ──
async function execGetLeadInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const leadId = String(args.id || args.lead_id || '');
  if (!leadId) return { status: 'error', message: 'Parâmetro "id" é obrigatório' };

  const { data, error } = await supabase
    .from('leads')
    .select('*, profiles!leads_owner_id_fkey(first_name, last_name)')
    .eq('id', leadId)
    .eq('organization_id', orgId)
    .single();

  if (error || !data) return { status: 'not_found', message: 'Lead não encontrado' };

  return {
    status: 'success',
    data: {
      id: data.id,
      name: `${data.first_name} ${data.last_name || ''}`.trim(),
      email: data.email,
      phone: data.phone,
      company: data.company,
      title: data.title,
      source: data.source,
      status: data.status,
      score: data.score,
      owner: data.profiles ? `${data.profiles.first_name} ${data.profiles.last_name}` : null,
      notes: data.notes,
      tags: data.tags,
      created_at: data.created_at,
    },
    message: `Lead: ${data.first_name} ${data.last_name || ''} - ${data.status}`,
    entity_type: 'lead',
    entity_id: data.id,
  };
}

// ── search_leads ──
async function execSearchLeads(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const query = String(args.query || args.name || args.email || '');
  const status = args.status as string | undefined;
  const limit = Math.min(Number(args.limit) || 10, 25);

  let dbQuery = supabase
    .from('leads')
    .select('id, first_name, last_name, email, company, status, source, score, created_at')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query) {
    dbQuery = dbQuery.or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,company.ilike.%${query}%`);
  }
  if (status) dbQuery = dbQuery.eq('status', status);

  const { data, error } = await dbQuery;
  if (error) throw error;

  return {
    status: 'success',
    data: (data || []).map((l: unknown) => ({
      ...l,
      name: `${l.first_name} ${l.last_name || ''}`.trim(),
    })),
    message: `Encontrados ${(data || []).length} lead(s)`,
    records_affected: (data || []).length,
    entity_type: 'lead',
  };
}

// ── detect_duplicates ──
async function execDetectDuplicates(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const entityType = String(args.entity_type || 'contact');
  const name = String(args.name || '');
  const email = String(args.email || '');

  if (!name && !email) {
    return { status: 'error', message: 'Informe "name" ou "email" para detectar duplicatas' };
  }

  let duplicates: unknown[] = [];

  if (entityType === 'contact' || entityType === 'contacts') {
    let query = supabase
      .from('contacts')
      .select('id, first_name, last_name, email, phone, account_id, accounts(name)')
      .eq('organization_id', orgId)
      .limit(10);

    if (email) {
      query = query.eq('email', email);
    } else if (name) {
      const parts = name.split(' ');
      if (parts.length > 1) {
        query = query.or(`first_name.ilike.%${parts[0]}%,last_name.ilike.%${parts[parts.length - 1]}%`);
      } else {
        query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%`);
      }
    }

    const { data } = await query;
    duplicates = (data || []).map((c: unknown) => ({
      id: c.id,
      type: 'contact',
      name: `${c.first_name} ${c.last_name}`,
      email: c.email,
      phone: c.phone,
      account: c.accounts?.name || null,
    }));
  } else if (entityType === 'account' || entityType === 'accounts') {
    const searchName = name || email;
    const { data } = await supabase
      .from('accounts')
      .select('id, name, email, phone, industry')
      .eq('organization_id', orgId)
      .or(`name.ilike.%${searchName}%,email.ilike.%${searchName}%`)
      .limit(10);

    duplicates = (data || []).map((a: unknown) => ({
      id: a.id,
      type: 'account',
      name: a.name,
      email: a.email,
      phone: a.phone,
      industry: a.industry,
    }));
  } else if (entityType === 'lead' || entityType === 'leads') {
    let query = supabase
      .from('leads')
      .select('id, first_name, last_name, email, company')
      .eq('organization_id', orgId)
      .limit(10);

    if (email) {
      query = query.eq('email', email);
    } else {
      query = query.or(`first_name.ilike.%${name}%,last_name.ilike.%${name}%,company.ilike.%${name}%`);
    }

    const { data } = await query;
    duplicates = (data || []).map((l: unknown) => ({
      id: l.id,
      type: 'lead',
      name: `${l.first_name} ${l.last_name || ''}`.trim(),
      email: l.email,
      company: l.company,
    }));
  }

  return {
    status: 'success',
    data: { duplicates, entity_type: entityType, search_criteria: { name, email } },
    message: duplicates.length > 0
      ? `Encontradas ${duplicates.length} possível(is) duplicata(s) de ${entityType}`
      : `Nenhuma duplicata encontrada para ${entityType}`,
    records_affected: duplicates.length,
    entity_type: entityType,
  };
}

// ── get_contract_info ──
async function execGetContractInfo(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const contractId = String(args.id || args.contract_id || '');
  if (!contractId) return { status: 'error', message: 'Parâmetro "id" é obrigatório' };

  const { data, error } = await supabase
    .from('contracts')
    .select('*, accounts(name)')
    .eq('id', contractId)
    .eq('organization_id', orgId)
    .single();

  if (error || !data) return { status: 'not_found', message: 'Contrato não encontrado' };

  return {
    status: 'success',
    data: {
      id: data.id,
      contract_number: data.contract_number,
      title: data.title,
      status: data.status,
      type: data.type,
      start_date: data.start_date,
      end_date: data.end_date,
      total_value: data.total_value,
      monthly_value: data.monthly_value,
      account: data.accounts?.name || null,
      auto_renewal: data.auto_renewal,
      payment_terms: data.payment_terms,
      created_at: data.created_at,
    },
    message: `Contrato ${data.contract_number}: ${data.title} (${data.status})`,
    entity_type: 'contract',
    entity_id: data.id,
  };
}

// ── create_note ──
async function execCreateNote(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string,
  userId: string
): Promise<ToolExecutionResult> {
  const content = String(args.content || args.note || args.text || '');
  if (!content) return { status: 'error', message: 'Parâmetro "content" é obrigatório' };

  const entityType = String(args.entity_type || 'general');
  const entityId = String(args.entity_id || '');

  const insertData: Record<string, unknown> = {
    organization_id: orgId,
    content,
    created_by: userId,
    entity_type: entityType,
    entity_id: entityId || null,
    is_pinned: args.is_pinned || false,
  };

  const { data, error } = await supabase
    .from('notes')
    .insert(insertData)
    .select('id, content, entity_type, created_at')
    .single();

  if (error) throw error;

  return {
    status: 'success',
    data,
    message: `Nota criada para ${entityType}${entityId ? ` (${entityId})` : ''}`,
    records_affected: 1,
    entity_type: 'note',
    entity_id: data.id,
  };
}

// ── get_dashboard_metrics ──
async function execGetDashboardMetrics(
  supabase: unknown,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const module = String(args.module || 'sales');

  const metrics: Record<string, unknown> = {};

  if (module === 'sales' || module === 'all') {
    const [
      { count: totalOpps },
      { count: openOpps },
      { count: wonOpps },
      { data: pipelineData },
    ] = await Promise.all([
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open'),
      supabase.from('opportunities').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'won'),
      supabase.from('opportunities').select('amount, stage, status').eq('organization_id', orgId).eq('status', 'open'),
    ]);

    const pipelineValue = (pipelineData || []).reduce((sum: number, o: unknown) => sum + (o.amount || 0), 0);
    const stageDistribution: Record<string, number> = {};
    for (const o of (pipelineData || [])) {
      stageDistribution[o.stage] = (stageDistribution[o.stage] || 0) + 1;
    }

    metrics.sales = {
      total_opportunities: totalOpps || 0,
      open_opportunities: openOpps || 0,
      won_opportunities: wonOpps || 0,
      pipeline_value: pipelineValue,
      win_rate: totalOpps && totalOpps > 0 ? Math.round(((wonOpps || 0) / totalOpps) * 100) : 0,
      stage_distribution: stageDistribution,
    };
  }

  if (module === 'service' || module === 'all') {
    const [
      { count: totalTickets },
      { count: openTickets },
      { count: resolvedTickets },
    ] = await Promise.all([
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['new', 'open', 'in_progress']),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'resolved'),
    ]);

    metrics.service = {
      total_tickets: totalTickets || 0,
      open_tickets: openTickets || 0,
      resolved_tickets: resolvedTickets || 0,
      resolution_rate: totalTickets && totalTickets > 0 ? Math.round(((resolvedTickets || 0) / totalTickets) * 100) : 0,
    };
  }

  if (module === 'leads' || module === 'all') {
    const [
      { count: totalLeads },
      { count: newLeads },
      { count: qualifiedLeads },
    ] = await Promise.all([
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'new'),
      supabase.from('leads').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'qualified'),
    ]);

    metrics.leads = {
      total_leads: totalLeads || 0,
      new_leads: newLeads || 0,
      qualified_leads: qualifiedLeads || 0,
    };
  }

  return {
    status: 'success',
    data: metrics,
    message: `Métricas do módulo "${module}" obtidas com sucesso`,
    entity_type: 'dashboard',
  };
}

// ── Generic tool executor (database_query, rpc_call, etc.) ──
async function execGenericTool(
  supabase: unknown,
  toolDef: ToolDef,
  args: Record<string, unknown>,
  orgId: string
): Promise<ToolExecutionResult> {
  const config = toolDef.action_config || {};

  if (toolDef.tool_type === 'database_query') {
    const table = config.table as string;
    const operation = (config.operation as string) || 'select';
    
    if (!table) {
      return { status: 'error', message: `Ferramenta "${toolDef.name}": tabela não configurada no action_config` };
    }

    if (operation === 'select') {
      const columns = (config.columns as string) || '*';
      const limit = Math.min(Number(config.limit || args.limit) || 10, 50);
      
      let query = supabase.from(table).select(columns).eq('organization_id', orgId).limit(limit);
      
      // Apply filters from args
      const filterFields = config.filter_fields as string[] || [];
      for (const field of filterFields) {
        if (args[field] !== undefined) {
          query = query.eq(field, args[field]);
        }
      }

      // Apply search
      const searchFields = config.search_fields as string[] || [];
      const searchTerm = args.query || args.search || args.term;
      if (searchTerm && searchFields.length > 0) {
        const searchConditions = searchFields.map(f => `${f}.ilike.%${searchTerm}%`).join(',');
        query = query.or(searchConditions);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        status: 'success',
        data: data || [],
        message: `Consulta em "${table}": ${(data || []).length} registro(s)`,
        records_affected: (data || []).length,
        entity_type: table,
      };
    }

    if (operation === 'insert') {
      const requiredFields = config.required_fields as string[] || [];
      for (const field of requiredFields) {
        if (!args[field]) {
          return { status: 'error', message: `Campo obrigatório: ${field}` };
        }
      }

      const insertFields = config.allowed_fields as string[] || Object.keys(args);
      const insertData: Record<string, unknown> = { organization_id: orgId };
      for (const field of insertFields) {
        if (args[field] !== undefined) {
          insertData[field] = args[field];
        }
      }

      const { data, error } = await supabase.from(table).insert(insertData).select().single();
      if (error) throw error;

      return {
        status: 'success',
        data,
        message: `Registro inserido em "${table}"`,
        records_affected: 1,
        entity_type: table,
        entity_id: data?.id,
      };
    }
  }

  if (toolDef.tool_type === 'rpc_call') {
    const rpcName = config.rpc_name as string;
    if (!rpcName) {
      return { status: 'error', message: `RPC não configurada no action_config` };
    }

    const rpcArgs: Record<string, unknown> = { ...args };
    if (config.inject_org_id) {
      rpcArgs._org_id = orgId;
    }

    const { data, error } = await supabase.rpc(rpcName, rpcArgs);
    if (error) throw error;

    return {
      status: 'success',
      data,
      message: `RPC "${rpcName}" executada com sucesso`,
      entity_type: 'rpc',
    };
  }

  // Fallback for unrecognized tool types
  return {
    status: 'success',
    data: { tool_name: toolDef.name, tool_type: toolDef.tool_type, args },
    message: `Ferramenta "${toolDef.name}" (${toolDef.tool_type}) executada — tipo sem executor específico`,
  };
}

// ──────────────────────────────────────────────
//  MAIN HANDLER
// ──────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI gateway não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── Auth ──
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, organization_id, email, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(
        JSON.stringify({ error: 'Perfil ou organização não encontrado' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const orgId = profile.organization_id;

    // ── Parse body ──
    const body = await req.json();
    const { agent_id, message, conversation_id, context: userContext = {} } = body;

    if (!agent_id || !message) {
      return new Response(
        JSON.stringify({ error: 'agent_id e message são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[AI Execute] Agent: ${agent_id}, User: ${user.id}, Org: ${orgId}`);

    // ── 1. Load agent ──
    const { data: agent, error: agentError } = await supabase
      .from('ai_agents')
      .select('*')
      .eq('id', agent_id)
      .eq('organization_id', orgId)
      .single();

    if (agentError || !agent) {
      return new Response(
        JSON.stringify({ error: 'Agente não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (agent.status !== 'active' && agent.status !== 'testing') {
      return new Response(
        JSON.stringify({ error: `Agente não está ativo (status: ${agent.status})` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 2. Load tools ──
    const { data: agentTools } = await supabase
      .from('ai_agent_tools')
      .select('*, ai_tools(*)')
      .eq('agent_id', agent_id)
      .eq('is_enabled', true);

    const tools: ToolDef[] = (agentTools || [])
      .filter((at: unknown) => at.ai_tools)
      .map((at: unknown) => ({
        id: at.ai_tools.id,
        name: at.ai_tools.name,
        description: at.ai_tools.description,
        tool_type: at.ai_tools.tool_type,
        parameters_schema: at.ai_tools.parameters_schema,
        action_config: at.ai_tools.action_config,
        requires_approval: at.ai_tools.requires_approval,
        risk_level: at.ai_tools.risk_level,
        category: at.ai_tools.category,
      }));

    // ── 3. Load policies ──
    const { data: agentPolicies } = await supabase
      .from('ai_agent_policies')
      .select('*, ai_policies(*)')
      .eq('agent_id', agent_id)
      .eq('is_active', true);

    const policies: PolicyDef[] = (agentPolicies || [])
      .filter((ap: unknown) => ap.ai_policies?.is_active)
      .map((ap: unknown) => ap.ai_policies);

    // ── 4. PII Masking ──
    const piiResult = maskPII(message);
    const processedMessage = piiResult.detected ? piiResult.masked : message;

    // ── 5. Policy check ──
    const policyCheck = validatePolicies(policies, message, userContext);
    if (!policyCheck.allowed) {
      console.warn('[AI Execute] Policy violation:', policyCheck.violations);
      return new Response(
        JSON.stringify({ error: 'Execução bloqueada por política de segurança', violations: policyCheck.violations }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── 6. Create AI Run ──
    const { data: runData, error: runError } = await supabase
      .from('ai_runs')
      .insert({
        organization_id: orgId,
        agent_id,
        triggered_by: user.id,
        trigger_type: 'user_request',
        input_context: {
          message: processedMessage,
          original_has_pii: piiResult.detected,
          pii_fields_masked: piiResult.fields,
          user_context: userContext,
        },
        status: 'running',
        started_at: new Date().toISOString(),
        model_used: (agent.model_config as unknown)?.model || 'google/gemini-3-flash-preview',
        correlation_id: conversation_id || null,
      })
      .select()
      .single();

    if (runError) {
      console.error('Failed to create run:', runError);
      return new Response(
        JSON.stringify({ error: 'Falha ao criar registro de execução' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const runId = runData.id;
    console.log(`[AI Execute] Run created: ${runId}`);

    // ── 7. Conversation history ──
    let conversationMessages: Array<{ role: string; content: string }> = [];
    if (conversation_id) {
      const { data: conv } = await supabase
        .from('ai_conversations')
        .select('messages')
        .eq('id', conversation_id)
        .eq('user_id', user.id)
        .single();

      if (conv?.messages && Array.isArray(conv.messages)) {
        conversationMessages = conv.messages.slice(-20);
      }
    }

    // ── 8. System prompt ──
    const toolDescriptions = tools.length > 0
      ? tools.map(t => `- **${t.name}**: ${t.description || 'Sem descrição'} (risco: ${t.risk_level}${t.requires_approval ? ', requer aprovação' : ''})`).join('\n')
      : '';

    const systemPrompt = [
      agent.system_prompt || `Você é o ${agent.name}, um assistente especializado.`,
      `\nData/hora atual: ${new Date().toISOString()}`,
      `Usuário: ${profile.first_name || ''} ${profile.last_name || ''} (${profile.email})`,
      agent.scope ? `\nEscopo de atuação: ${agent.scope}` : '',
      tools.length > 0 ? `\nVocê tem acesso a ${tools.length} ferramenta(s) que executam ações REAIS no sistema:\n${toolDescriptions}\n\nUse as ferramentas sempre que a pergunta do usuário exigir dados do CRM. Apresente os resultados de forma clara e organizada.` : '',
      policies.length > 0 ? '\nTodas as ações são auditadas e registradas. Ações de alto risco requerem aprovação humana.' : '',
      '\nResponda sempre em português do Brasil de forma profissional e direta.',
      '\nQuando usar ferramentas, interprete e resuma os resultados para o usuário de maneira útil, não apenas repita os dados brutos.',
    ].filter(Boolean).join('\n');

    // ── 9. OpenAI tools format ──
    const openAITools = tools.length > 0 ? tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name.replace(/[^a-zA-Z0-9_-]/g, '_'),
        description: tool.description || tool.name,
        parameters: tool.parameters_schema || { type: 'object', properties: {} },
      },
    })) : undefined;

    // ── 10. Messages array ──
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationMessages,
      { role: 'user', content: processedMessage },
    ];

    const modelConfig = (agent.model_config || {}) as unknown;
    const model = modelConfig.model || 'google/gemini-3-flash-preview';
    const temperature = modelConfig.temperature ?? 0.7;
    const maxTokens = modelConfig.max_tokens ?? 4096;

    console.log(`[AI Execute] Calling AI: model=${model}, tools=${tools.length}`);

    // ── 11. Call Lovable AI ──
    const startTime = Date.now();

    const aiRequestBody: Record<string, unknown> = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    };

    if (openAITools && openAITools.length > 0) {
      aiRequestBody.tools = openAITools;
      aiRequestBody.tool_choice = 'auto';
    }

    const aiResponse = await fetch(LOVABLE_AI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestBody),
    });

    const durationMs = Date.now() - startTime;

    if (!aiResponse.ok) {
      const errorBody = await aiResponse.text();
      console.error(`[AI Execute] AI Gateway error: ${aiResponse.status}`, errorBody);

      await supabase.from('ai_runs').update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: `AI Gateway error: ${aiResponse.status} - ${errorBody.substring(0, 500)}`,
      }).eq('id', runId);

      const statusCode = aiResponse.status === 429 ? 429 : aiResponse.status === 402 ? 402 : 502;
      const errorMsg = aiResponse.status === 429
        ? 'Taxa de requisições excedida. Tente novamente em alguns segundos.'
        : aiResponse.status === 402
          ? 'Créditos insuficientes. Adicione créditos ao workspace.'
          : 'Falha na comunicação com o gateway de IA';

      return new Response(
        JSON.stringify({ error: errorMsg, run_id: runId }),
        { status: statusCode, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiResult = await aiResponse.json();
    const choice = aiResult.choices?.[0];
    const responseMessage = choice?.message;
    let assistantContent = responseMessage?.content || '';

    const usage = aiResult.usage || {};
    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;

    console.log(`[AI Execute] Response: tokens=${totalTokens}, duration=${durationMs}ms, tool_calls=${responseMessage?.tool_calls?.length || 0}`);

    // ── 12. Record reasoning step ──
    await supabase.from('ai_run_steps').insert({
      run_id: runId,
      organization_id: orgId,
      step_order: 1,
      step_type: 'reasoning',
      input_data: { message: processedMessage },
      output_data: { content: assistantContent, tool_calls: responseMessage?.tool_calls || null },
      status: 'completed',
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      duration_ms: durationMs,
      tokens_used: totalTokens,
    });

    // ── 13. Process tool calls with REAL execution ──
    const toolResults: Array<{ tool_name: string; result: ToolExecutionResult }> = [];
    let requiresApproval = false;

    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      let stepOrder = 2;

      for (const toolCall of responseMessage.tool_calls) {
        const toolName = toolCall.function?.name;
        let toolArgs: Record<string, unknown> = {};
        try {
          toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
        } catch {
          toolArgs = {};
        }

        const matchedTool = tools.find(
          t => t.name.replace(/[^a-zA-Z0-9_-]/g, '_') === toolName
        );

        console.log(`[AI Execute] Tool call: ${toolName}, matched: ${!!matchedTool}, risk: ${matchedTool?.risk_level}`);

        // ── High risk → approval flow ──
        if (matchedTool?.requires_approval || matchedTool?.risk_level === 'critical' || matchedTool?.risk_level === 'high') {
          requiresApproval = true;

          await supabase.from('ai_run_audit_receipts').insert({
            run_id: runId,
            organization_id: orgId,
            action_type: 'tool_execution',
            action_description: `Execução da ferramenta "${toolName}" requer aprovação humana`,
            tool_used: toolName,
            risk_level: matchedTool?.risk_level || 'medium',
            requires_approval: true,
            approval_status: 'pending',
            data_accessed: toolArgs,
            pii_detected: piiResult.detected,
            pii_fields_masked: piiResult.fields.length > 0 ? piiResult.fields : null,
            execution_context: {
              agent_name: agent.name,
              agent_type: agent.agent_type,
              user_email: profile.email,
            },
          });

          await supabase.from('approval_requests').insert({
            organization_id: orgId,
            approval_type: 'ai_action',
            entity_type: 'ai_run',
            entity_id: runId,
            title: `Ação IA: ${toolName}`,
            description: `O agente "${agent.name}" solicita aprovação para executar "${toolName}" com parâmetros: ${JSON.stringify(toolArgs).substring(0, 500)}`,
            requested_by: user.id,
            metadata: { run_id: runId, tool_name: toolName, tool_args: toolArgs, risk_level: matchedTool?.risk_level },
            status: 'pending',
          });

          await supabase.from('ai_run_steps').insert({
            run_id: runId,
            organization_id: orgId,
            step_order: stepOrder++,
            step_type: 'approval_wait',
            tool_name: toolName,
            tool_id: matchedTool?.id || null,
            input_data: toolArgs,
            status: 'pending',
            started_at: new Date().toISOString(),
          });

          toolResults.push({
            tool_name: toolName,
            result: { status: 'pending_approval', message: 'Ação requer aprovação humana antes de ser executada' },
          });
        } else {
          // ── REAL execution ──
          const toolStartTime = Date.now();

          const executionResult = matchedTool
            ? await executeToolReal(supabase, matchedTool, toolName, toolArgs, orgId, user.id)
            : { status: 'error' as const, message: `Ferramenta "${toolName}" não encontrada no catálogo` };

          const toolDurationMs = Date.now() - toolStartTime;

          // Record step
          await supabase.from('ai_run_steps').insert({
            run_id: runId,
            organization_id: orgId,
            step_order: stepOrder++,
            step_type: 'tool_call',
            tool_id: matchedTool?.id || null,
            tool_name: toolName,
            input_data: toolArgs,
            output_data: executionResult,
            status: executionResult.status === 'error' ? 'failed' : 'completed',
            started_at: new Date(toolStartTime).toISOString(),
            completed_at: new Date().toISOString(),
            duration_ms: toolDurationMs,
          });

          // Create audit receipt with real data
          await supabase.from('ai_run_audit_receipts').insert({
            run_id: runId,
            organization_id: orgId,
            action_type: 'tool_execution',
            action_description: executionResult.message,
            tool_used: toolName,
            risk_level: matchedTool?.risk_level || 'low',
            requires_approval: false,
            data_accessed: toolArgs,
            data_modified: executionResult.entity_id ? {
              entity_type: executionResult.entity_type,
              entity_id: executionResult.entity_id,
              records_affected: executionResult.records_affected,
            } : null,
            affected_entity_type: executionResult.entity_type || null,
            affected_entity_id: executionResult.entity_id || null,
            pii_detected: piiResult.detected,
            pii_fields_masked: piiResult.fields.length > 0 ? piiResult.fields : null,
            execution_context: {
              agent_name: agent.name,
              agent_type: agent.agent_type,
              user_email: profile.email,
              duration_ms: toolDurationMs,
              result_status: executionResult.status,
            },
          });

          toolResults.push({ tool_name: toolName, result: executionResult });
        }
      }

      // ── 13b. If tools were executed, do a follow-up AI call with tool results ──
      if (toolResults.length > 0 && !requiresApproval) {
        const toolResponseMessages = toolResults.map(tr => ({
          role: 'tool' as const,
          content: JSON.stringify(tr.result),
          tool_call_id: responseMessage.tool_calls.find(
            (tc: unknown) => tc.function?.name === tr.tool_name
          )?.id || tr.tool_name,
        }));

        const followUpMessages = [
          ...messages,
          responseMessage, // Include the assistant's message with tool_calls
          ...toolResponseMessages,
        ];

        console.log(`[AI Execute] Follow-up call with ${toolResults.length} tool result(s)`);

        const followUpResponse = await fetch(LOVABLE_AI_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: followUpMessages,
            temperature,
            max_tokens: maxTokens,
          }),
        });

        if (followUpResponse.ok) {
          const followUpResult = await followUpResponse.json();
          const followUpContent = followUpResult.choices?.[0]?.message?.content;
          if (followUpContent) {
            assistantContent = followUpContent;

            // Add follow-up tokens
            const followUpUsage = followUpResult.usage || {};
            const followUpTokens = followUpUsage.total_tokens || 0;

            await supabase.from('ai_run_steps').insert({
              run_id: runId,
              organization_id: orgId,
              step_order: stepOrder++,
              step_type: 'reasoning',
              input_data: { tool_results: toolResults.map(tr => ({ tool: tr.tool_name, status: tr.result.status })) },
              output_data: { content: assistantContent },
              status: 'completed',
              started_at: new Date().toISOString(),
              completed_at: new Date().toISOString(),
              tokens_used: followUpTokens,
            });
          }
        } else {
          const errText = await followUpResponse.text();
          console.error('[AI Execute] Follow-up call failed:', followUpResponse.status, errText);
        }
      }
    }

    // ── 14. Update run status ──
    const finalStatus = requiresApproval ? 'waiting_approval' : 'completed';

    await supabase.from('ai_runs').update({
      status: finalStatus,
      completed_at: requiresApproval ? null : new Date().toISOString(),
      output_result: {
        content: assistantContent,
        tool_calls: toolResults.length > 0 ? toolResults : null,
        requires_approval: requiresApproval,
      },
      total_tokens_used: totalTokens,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens,
      total_steps: 1 + toolResults.length,
    }).eq('id', runId);

    // ── 15. Update conversation ──
    const newMessages = [
      ...conversationMessages,
      { role: 'user', content: message },
      { role: 'assistant', content: assistantContent },
    ];

    if (conversation_id) {
      await supabase.from('ai_conversations').update({
        messages: newMessages,
        message_count: newMessages.length,
        total_tokens_used: totalTokens,
        last_run_id: runId,
        updated_at: new Date().toISOString(),
      }).eq('id', conversation_id);
    } else {
      const title = message.substring(0, 100) + (message.length > 100 ? '...' : '');
      const { data: newConv } = await supabase.from('ai_conversations').insert({
        organization_id: orgId,
        agent_id,
        user_id: user.id,
        title,
        messages: newMessages,
        message_count: newMessages.length,
        total_tokens_used: totalTokens,
        last_run_id: runId,
        status: 'active',
      }).select('id').single();

      if (newConv) {
        return new Response(
          JSON.stringify({
            success: true,
            run_id: runId,
            conversation_id: newConv.id,
            content: assistantContent,
            tool_calls: toolResults.length > 0 ? toolResults : undefined,
            requires_approval: requiresApproval,
            tokens_used: totalTokens,
            duration_ms: durationMs,
            pii_detected: piiResult.detected,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ── 16. Update module usage ──
    try {
      await supabase.rpc('update_module_usage', {
        _org_id: orgId,
        _module_key: 'ai_agents',
        _usage_key: 'total_runs',
      });
    } catch (e) {
      console.warn('[AI Execute] Module usage update failed:', e);
    }

    console.log(`[AI Execute] Run ${runId} completed: status=${finalStatus}, tokens=${totalTokens}, tools=${toolResults.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        run_id: runId,
        conversation_id: conversation_id || null,
        content: assistantContent,
        tool_calls: toolResults.length > 0 ? toolResults : undefined,
        requires_approval: requiresApproval,
        tokens_used: totalTokens,
        duration_ms: durationMs,
        pii_detected: piiResult.detected,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[AI Execute] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
