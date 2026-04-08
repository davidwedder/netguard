import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TelemetryData {
  id: string;
  central_id: string;
  temperature: number | null;
  humidity: number | null;
  current: number | null;
  power: number | null;
  timestamp: string;
}

export function useTelemetry(centralId: string | null) {
  const [latestData, setLatestData] = useState<TelemetryData | null>(null);
  const [historicalData, setHistoricalData] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!centralId) {
      setLatestData(null);
      setHistoricalData([]);
      setLoading(false);
      return;
    }

    const fetchTelemetry = async () => {
      setLoading(true);
      
      // Fetch last 24 hours of data
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data, error } = await supabase
        .from('telemetry')
        .select('*')
        .eq('central_id', centralId)
        .gte('timestamp', twentyFourHoursAgo.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        console.error('Error fetching telemetry:', error);
      } else if (data) {
        const mapped = data.map(d => ({
          id: d.id,
          central_id: d.central_id,
          temperature: d.temperature,
          humidity: d.humidity,
          current: d.current,
          power: d.power,
          timestamp: d.timestamp,
        }));
        setHistoricalData(mapped);
        if (mapped.length > 0) {
          setLatestData(mapped[mapped.length - 1]);
        }
      }
      setLoading(false);
    };

    fetchTelemetry();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`telemetry-${centralId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'telemetry',
          filter: `central_id=eq.${centralId}`,
        },
        (payload) => {
          const newData = payload.new as TelemetryData;
          setLatestData(newData);
          setHistoricalData(prev => [...prev.slice(-99), newData]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [centralId]);

  return { latestData, historicalData, loading };
}
