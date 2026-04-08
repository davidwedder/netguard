import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const upgradeHeader = req.headers.get('upgrade') || '';
  
  // Handle WebSocket upgrade for ESP32
  if (upgradeHeader.toLowerCase() === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('ESP32 WebSocket connected');

    socket.onopen = () => {
      console.log('WebSocket connection opened');
      socket.send(JSON.stringify({ 
        type: 'connected',
        message: 'Connected to alarm monitoring system' 
      }));
    };

    socket.onmessage = async (event) => {
      try {
        console.log('Received message from ESP32:', event.data);
        const eventData = JSON.parse(event.data);

        // Validate event data
        const validTypes = ['motion', 'zone-trigger', 'tamper', 'power-fail', 'door', 'command'];
        if (!validTypes.includes(eventData.type)) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Invalid event type'
          }));
          return;
        }

        if (!eventData.description) {
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Description is required'
          }));
          return;
        }

        // Insert event into database
        const { data, error } = await supabase
          .from('events')
          .insert({
            type: eventData.type,
            description: eventData.description,
            zone: eventData.zone || null,
            central_id: eventData.central_id || null,
          })
          .select()
          .single();

        if (error) {
          console.error('Database error:', error);
          socket.send(JSON.stringify({
            type: 'error',
            message: 'Failed to store event',
            error: error.message
          }));
          return;
        }

        console.log('Event stored successfully:', data);
        socket.send(JSON.stringify({
          type: 'success',
          message: 'Event received and stored',
          eventId: data.id
        }));

      } catch (error) {
        console.error('Error processing message:', error);
        socket.send(JSON.stringify({
          type: 'error',
          message: 'Failed to process event',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    socket.onclose = () => {
      console.log('ESP32 WebSocket disconnected');
    };

    return response;
  }

  // Handle HTTP GET requests for ESP32 to check arm status
  if (req.method === 'GET') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const url = new URL(req.url);
      const centralId = url.searchParams.get('central_id');

      if (!centralId) {
        return new Response(
          JSON.stringify({ error: 'central_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('ESP32 checking arm status for central:', centralId);

      // Get the latest arm/disarm command for this central
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('central_id', centralId)
        .eq('type', 'command')
        .or('description.ilike.%armado%,description.ilike.%desarmado%,description.ilike.%armed%,description.ilike.%disarmed%')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch status', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Determine arm status from the latest command
      let armStatus = 'disarmed'; // default
      let armMode = 'none';
      
      if (data) {
        const desc = data.description.toLowerCase();
        if (desc.includes('armado total') || desc.includes('armed total')) {
          armStatus = 'armed';
          armMode = 'total';
        } else if (desc.includes('armado parcial') || desc.includes('armed partial')) {
          armStatus = 'armed';
          armMode = 'partial';
        } else if (desc.includes('desarmado') || desc.includes('disarmed')) {
          armStatus = 'disarmed';
          armMode = 'none';
        }
      }

      console.log('Returning arm status:', { armStatus, armMode });

      return new Response(
        JSON.stringify({ 
          status: armStatus,
          mode: armMode,
          relay: armStatus === 'armed' ? 1 : 0,
          timestamp: data?.timestamp || null,
          central_id: centralId
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error processing GET request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  // Handle HTTP POST requests as fallback
  if (req.method === 'POST') {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const eventData = await req.json();

      // Validate event data
      const validTypes = ['motion', 'zone-trigger', 'tamper', 'power-fail', 'door', 'command'];
      if (!validTypes.includes(eventData.type)) {
        return new Response(
          JSON.stringify({ error: 'Invalid event type' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!eventData.description) {
        return new Response(
          JSON.stringify({ error: 'Description is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Insert event into database
      const { data, error } = await supabase
        .from('events')
        .insert({
          type: eventData.type,
          description: eventData.description,
          zone: eventData.zone || null,
          central_id: eventData.central_id || null,
        })
        .select()
        .single();

      if (error) {
        console.error('Database error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to store event', details: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          event: data,
          message: 'Event stored successfully' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Error processing request:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  }

  return new Response('Method not allowed', { status: 405, headers: corsHeaders });
});
