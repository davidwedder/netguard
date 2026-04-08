import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventPayload {
  type: 'motion' | 'zone-trigger' | 'tamper' | 'power-fail' | 'door' | 'command';
  description: string;
  zone?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, description, zone }: EventPayload = await req.json();

    if (!type || !description) {
      return new Response(
        JSON.stringify({ error: 'Type and description are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const event = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      description,
      zone: zone || undefined,
    };

    console.log('Event created:', event);

    return new Response(
      JSON.stringify({ 
        success: true, 
        event,
        message: 'Event created successfully' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in test-events function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
