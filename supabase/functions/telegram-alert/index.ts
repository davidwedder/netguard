import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AlertPayload {
  test?: boolean;
  central_id: string;
  central_name: string;
  metric: string;
  metric_label: string;
  value: number;
  threshold_type: 'min' | 'max' | 'test';
  threshold_value: number;
  unit: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN');
    const TELEGRAM_CHAT_ID = Deno.env.get('TELEGRAM_CHAT_ID');

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('Missing Telegram credentials');
      return new Response(
        JSON.stringify({ error: 'Telegram credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload: AlertPayload = await req.json();
    console.log('Received alert payload:', payload);

    let message: string;

    if (payload.test) {
      message = `🔔 *TESTE DE ALERTA*\n\n` +
        `📍 Central: ${payload.central_name}\n` +
        `📊 Métrica: ${payload.metric_label}\n\n` +
        `✅ Configuração de alertas funcionando!`;
    } else {
      const emoji = payload.threshold_type === 'min' ? '❄️' : '🔥';
      const alertType = payload.threshold_type === 'min' ? 'ABAIXO DO MÍNIMO' : 'ACIMA DO MÁXIMO';
      
      message = `⚠️ *ALERTA DE TELEMETRIA*\n\n` +
        `📍 Central: ${payload.central_name}\n` +
        `📊 Métrica: ${payload.metric_label}\n\n` +
        `${emoji} Valor atual: *${payload.value}${payload.unit}*\n` +
        `🎯 Limite ${payload.threshold_type === 'min' ? 'mínimo' : 'máximo'}: ${payload.threshold_value}${payload.unit}\n\n` +
        `🚨 Status: *${alertType}*\n` +
        `🕐 Horário: ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    }

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const telegramResult = await telegramResponse.json();
    console.log('Telegram response:', telegramResult);

    if (!telegramResponse.ok) {
      throw new Error(`Telegram API error: ${JSON.stringify(telegramResult)}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Alert sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending Telegram alert:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
