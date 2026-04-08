import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TelemetryData {
  central_id: string;
  temperature: number | null;
  humidity: number | null;
  current: number | null;
  power: number | null;
}

interface Threshold {
  id: string;
  central_id: string;
  metric: string;
  min_value: number | null;
  max_value: number | null;
  enabled: boolean;
}

interface Central {
  id: string;
  name: string;
}

const METRIC_LABELS: Record<string, { label: string; unit: string }> = {
  temperature: { label: 'Temperatura', unit: '°C' },
  humidity: { label: 'Umidade', unit: '%' },
  current: { label: 'Corrente', unit: 'A' },
  power: { label: 'Potência', unit: 'W' },
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload: TelemetryData = await req.json();
    console.log('Checking thresholds for telemetry:', payload);

    // Get central info
    const { data: central, error: centralError } = await supabase
      .from('centrals')
      .select('id, name')
      .eq('id', payload.central_id)
      .single();

    if (centralError || !central) {
      console.error('Central not found:', centralError);
      return new Response(
        JSON.stringify({ error: 'Central not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get enabled thresholds for this central
    const { data: thresholds, error: thresholdError } = await supabase
      .from('telemetry_thresholds')
      .select('*')
      .eq('central_id', payload.central_id)
      .eq('enabled', true);

    if (thresholdError) {
      console.error('Error fetching thresholds:', thresholdError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch thresholds' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!thresholds || thresholds.length === 0) {
      console.log('No enabled thresholds found');
      return new Response(
        JSON.stringify({ message: 'No thresholds to check' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const alerts: Array<{
      metric: string;
      value: number;
      threshold_type: 'min' | 'max';
      threshold_value: number;
    }> = [];

    // Check each threshold
    for (const threshold of thresholds) {
      const metric = threshold.metric as keyof TelemetryData;
      const value = payload[metric];

      if (value === null || value === undefined) continue;

      if (threshold.min_value !== null && value < threshold.min_value) {
        alerts.push({
          metric: threshold.metric,
          value: value as number,
          threshold_type: 'min',
          threshold_value: threshold.min_value,
        });
      }

      if (threshold.max_value !== null && value > threshold.max_value) {
        alerts.push({
          metric: threshold.metric,
          value: value as number,
          threshold_type: 'max',
          threshold_value: threshold.max_value,
        });
      }
    }

    console.log(`Found ${alerts.length} threshold violations`);

    // Send alerts to Telegram
    for (const alert of alerts) {
      const metricInfo = METRIC_LABELS[alert.metric] || { label: alert.metric, unit: '' };

      const alertPayload = {
        central_id: payload.central_id,
        central_name: central.name,
        metric: alert.metric,
        metric_label: metricInfo.label,
        value: alert.value,
        threshold_type: alert.threshold_type,
        threshold_value: alert.threshold_value,
        unit: metricInfo.unit,
      };

      // Call telegram-alert function
      const { error: alertError } = await supabase.functions.invoke('telegram-alert', {
        body: alertPayload,
      });

      if (alertError) {
        console.error('Error sending alert:', alertError);
      } else {
        console.log('Alert sent for:', alert.metric);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        alerts_sent: alerts.length,
        violations: alerts 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error checking thresholds:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
