import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-widget-key, x-session-token',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

interface StartSessionRequest {
  widget_key: string;
  visitor_id: string;
  visitor_info?: {
    name?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
  source_url?: string;
  device_info?: {
    device_type?: string;
    browser?: string;
    browser_version?: string;
    os?: string;
    os_version?: string;
    screen_resolution?: string;
    timezone?: string;
    language?: string;
  };
}

interface SendMessageRequest {
  session_token: string;
  content: string;
  content_type?: string;
  attachments?: Array<{
    file_name: string;
    file_url: string;
    file_type: string;
    file_size: number;
  }>;
}

interface EventRequest {
  session_token: string;
  event_type: string;
  event_data?: Record<string, unknown>;
  page_url?: string;
  page_title?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const url = new URL(req.url);
  const path = url.pathname.replace('/chat-widget', '');

  try {
    // GET /config/:widget_key - Get widget configuration
    if (req.method === 'GET' && path.startsWith('/config/')) {
      const widgetKey = path.replace('/config/', '');
      
      const { data: widget, error } = await supabase
        .from('chat_widgets')
        .select(`
          id,
          name,
          widget_key,
          primary_color,
          secondary_color,
          text_color,
          background_color,
          position,
          button_size,
          button_icon,
          custom_icon_url,
          greeting_message,
          offline_message,
          placeholder_text,
          window_title,
          pre_chat_form_enabled,
          pre_chat_fields,
          auto_open,
          auto_open_delay_seconds,
          show_agent_avatar,
          show_agent_name,
          play_sound_on_message,
          show_powered_by,
          bot_enabled,
          bot_greeting,
          bot_options,
          business_hours_enabled,
          is_active
        `)
        .eq('widget_key', widgetKey)
        .eq('is_active', true)
        .single();

      if (error || !widget) {
        return new Response(JSON.stringify({ error: 'Widget not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Check business hours if enabled
      let isOnline = true;
      if (widget.business_hours_enabled) {
        // For now, we'll return true. Full implementation would check business_hours table
        isOnline = true;
      }

      return new Response(JSON.stringify({
        ...widget,
        is_online: isOnline
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /session/start - Start a new chat session
    if (req.method === 'POST' && path === '/session/start') {
      const body: StartSessionRequest = await req.json();

      if (!body.widget_key || !body.visitor_id) {
        return new Response(JSON.stringify({ error: 'widget_key and visitor_id are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get IP from headers
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                 req.headers.get('x-real-ip') || 
                 'unknown';

      // Get widget to check domain restrictions
      const { data: widget } = await supabase
        .from('chat_widgets')
        .select('allowed_domains')
        .eq('widget_key', body.widget_key)
        .eq('is_active', true)
        .single();

      if (widget && widget.allowed_domains && widget.allowed_domains.length > 0) {
        const origin = req.headers.get('origin') || '';
        const allowedDomain = widget.allowed_domains.some((domain: string) => 
          origin.includes(domain) || domain === '*'
        );
        
        if (!allowedDomain) {
          return new Response(JSON.stringify({ error: 'Domain not allowed' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Create session using RPC
      const { data: session, error } = await supabase.rpc('create_chat_session', {
        p_widget_key: body.widget_key,
        p_visitor_id: body.visitor_id,
        p_visitor_info: body.visitor_info || {},
        p_source_url: body.source_url || null,
        p_device_info: body.device_info || {}
      });

      if (error) {
        console.error('Error creating session:', error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update IP address
      if (session && session.length > 0) {
        await supabase
          .from('chat_sessions')
          .update({ ip_address: ip })
          .eq('id', session[0].session_id);
      }

      return new Response(JSON.stringify({
        session_id: session[0].session_id,
        session_token: session[0].session_token,
        conversation_id: session[0].conversation_id
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /session/resume - Resume existing session
    if (req.method === 'POST' && path === '/session/resume') {
      const sessionToken = req.headers.get('x-session-token');
      
      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Session token required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const { data: session, error } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          conversation_id,
          visitor_name,
          visitor_email,
          status,
          agent_id,
          started_at,
          last_activity_at
        `)
        .eq('session_token', sessionToken)
        .single();

      if (error || !session) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update last activity
      await supabase
        .from('chat_sessions')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', session.id);

      // Get recent messages
      const { data: messages } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', session.conversation_id)
        .order('created_at', { ascending: true })
        .limit(50);

      return new Response(JSON.stringify({
        session,
        messages: messages || []
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /message/send - Send a message
    if (req.method === 'POST' && path === '/message/send') {
      const body: SendMessageRequest = await req.json();
      
      if (!body.session_token || !body.content) {
        return new Response(JSON.stringify({ error: 'session_token and content are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate session
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .select('id, organization_id, conversation_id, widget_id, status')
        .eq('session_token', body.session_token)
        .single();

      if (sessionError || !session) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (session.status === 'ended') {
        return new Response(JSON.stringify({ error: 'Session has ended' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create message
      const { data: message, error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          organization_id: session.organization_id,
          conversation_id: session.conversation_id,
          sender_type: 'customer',
          content: body.content,
          content_type: body.content_type || 'text',
          attachments: body.attachments || null
        })
        .select('*')
        .single();

      if (messageError) {
        console.error('Error creating message:', messageError);
        return new Response(JSON.stringify({ error: 'Failed to send message' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update session activity and message count
      await supabase
        .from('chat_sessions')
        .update({ 
          last_activity_at: new Date().toISOString(),
          messages_sent: supabase.rpc('increment', { x: 1 })
        })
        .eq('id', session.id);

      // Log event
      await supabase
        .from('chat_widget_events')
        .insert({
          organization_id: session.organization_id,
          widget_id: session.widget_id,
          session_id: session.id,
          event_type: 'message_sent',
          event_data: { message_id: message.id, content_type: body.content_type || 'text' }
        });

      return new Response(JSON.stringify({
        success: true,
        message
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /event - Log widget event
    if (req.method === 'POST' && path === '/event') {
      const body: EventRequest = await req.json();
      
      if (!body.session_token || !body.event_type) {
        return new Response(JSON.stringify({ error: 'session_token and event_type are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate session
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('id, organization_id, widget_id')
        .eq('session_token', body.session_token)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Log event
      await supabase
        .from('chat_widget_events')
        .insert({
          organization_id: session.organization_id,
          widget_id: session.widget_id,
          session_id: session.id,
          event_type: body.event_type,
          event_data: body.event_data || {},
          page_url: body.page_url,
          page_title: body.page_title
        });

      // Handle special events
      if (body.event_type === 'session_ended') {
        await supabase
          .from('chat_sessions')
          .update({ status: 'ended', ended_at: new Date().toISOString() })
          .eq('id', session.id);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // POST /session/rate - Submit satisfaction rating
    if (req.method === 'POST' && path === '/session/rate') {
      const sessionToken = req.headers.get('x-session-token');
      const body = await req.json();
      
      if (!sessionToken || !body.rating) {
        return new Response(JSON.stringify({ error: 'session_token and rating are required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate rating is 1-5
      const rating = parseInt(body.rating);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return new Response(JSON.stringify({ error: 'Rating must be between 1 and 5' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Update session
      const { data: session, error } = await supabase
        .from('chat_sessions')
        .update({ 
          satisfaction_rating: rating,
          satisfaction_comment: body.comment || null
        })
        .eq('session_token', sessionToken)
        .select('id, organization_id, widget_id')
        .single();

      if (error || !session) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Log event
      await supabase
        .from('chat_widget_events')
        .insert({
          organization_id: session.organization_id,
          widget_id: session.widget_id,
          session_id: session.id,
          event_type: 'rating_submitted',
          event_data: { rating, comment: body.comment }
        });

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET /messages - Get conversation messages (for polling if realtime not available)
    if (req.method === 'GET' && path === '/messages') {
      const sessionToken = req.headers.get('x-session-token');
      const afterId = url.searchParams.get('after');
      
      if (!sessionToken) {
        return new Response(JSON.stringify({ error: 'Session token required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Validate session
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('conversation_id')
        .eq('session_token', sessionToken)
        .single();

      if (!session) {
        return new Response(JSON.stringify({ error: 'Invalid session' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Build query
      let query = supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', session.conversation_id)
        .order('created_at', { ascending: true });

      if (afterId) {
        const { data: afterMessage } = await supabase
          .from('conversation_messages')
          .select('created_at')
          .eq('id', afterId)
          .single();

        if (afterMessage) {
          query = query.gt('created_at', afterMessage.created_at);
        }
      }

      const { data: messages } = await query.limit(50);

      return new Response(JSON.stringify({ messages: messages || [] }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Chat widget error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});