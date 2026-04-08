import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);

    // POST - ESP32 sends intercom request when doorbell is pressed
    if (req.method === 'POST') {
      const body = await req.json();
      const { central_id, camera_url, image_snapshot } = body;

      if (!central_id) {
        return new Response(
          JSON.stringify({ error: 'central_id is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Intercom request from central: ${central_id}`);
      console.log(`Camera URL: ${camera_url}`);

      // Create intercom request
      const { data: request, error } = await supabase
        .from('intercom_requests')
        .insert({
          central_id,
          camera_url,
          image_snapshot,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating intercom request:', error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Intercom request created: ${request.id}`);

      // Also create an event for the feed
      await supabase.from('events').insert({
        central_id,
        type: 'intercom',
        description: 'Chamada de interfone recebida',
      });

      return new Response(
        JSON.stringify({
          success: true,
          request_id: request.id,
          message: 'Intercom request created, waiting for response'
        }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET - ESP32 polls for response status
    if (req.method === 'GET') {
      const requestId = url.searchParams.get('request_id');
      const centralId = url.searchParams.get('central_id');

      // If request_id is provided, check specific request status
      if (requestId) {
        const { data: request, error } = await supabase
          .from('intercom_requests')
          .select('id, status, responded_at')
          .eq('id', requestId)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: 'Request not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log(`Intercom request ${requestId} status: ${request.status}`);

        // Return pin state based on approval
        const pin = request.status === 'approved' ? 1 : 0;

        return new Response(
          JSON.stringify({
            request_id: request.id,
            status: request.status,
            pin,
            responded_at: request.responded_at
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // If central_id is provided, get latest pending request
      if (centralId) {
        const { data: requests, error } = await supabase
          .from('intercom_requests')
          .select('id, status, responded_at, created_at')
          .eq('central_id', centralId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error || !requests || requests.length === 0) {
          return new Response(
            JSON.stringify({ 
              has_pending: false,
              latest_request: null 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const latest = requests[0];
        const pin = latest.status === 'approved' ? 1 : 0;

        return new Response(
          JSON.stringify({
            has_pending: latest.status === 'pending',
            latest_request: {
              id: latest.id,
              status: latest.status,
              pin,
              responded_at: latest.responded_at,
              created_at: latest.created_at
            }
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'request_id or central_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
