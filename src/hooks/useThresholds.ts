import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Threshold {
  id: string;
  central_id: string;
  metric: string;
  min_value: number | null;
  max_value: number | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type ThresholdMetric = 'temperature' | 'humidity' | 'current' | 'power';

export const METRIC_CONFIG: Record<ThresholdMetric, { label: string; unit: string; icon: string }> = {
  temperature: { label: 'Temperatura', unit: '°C', icon: '🌡️' },
  humidity: { label: 'Umidade', unit: '%', icon: '💧' },
  current: { label: 'Corrente', unit: 'A', icon: '⚡' },
  power: { label: 'Potência', unit: 'W', icon: '🔌' },
};

export function useThresholds(centralId: string | null) {
  const [thresholds, setThresholds] = useState<Threshold[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!centralId) {
      setThresholds([]);
      setLoading(false);
      return;
    }

    const fetchThresholds = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('telemetry_thresholds')
        .select('*')
        .eq('central_id', centralId);

      if (error) {
        console.error('Error fetching thresholds:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os limites.',
          variant: 'destructive',
        });
      } else {
        setThresholds(data || []);
      }
      setLoading(false);
    };

    fetchThresholds();

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`thresholds-${centralId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'telemetry_thresholds',
          filter: `central_id=eq.${centralId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setThresholds(prev => [...prev, payload.new as Threshold]);
          } else if (payload.eventType === 'UPDATE') {
            setThresholds(prev =>
              prev.map(t => (t.id === (payload.new as Threshold).id ? (payload.new as Threshold) : t))
            );
          } else if (payload.eventType === 'DELETE') {
            setThresholds(prev => prev.filter(t => t.id !== (payload.old as Threshold).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [centralId, toast]);

  const upsertThreshold = async (
    metric: ThresholdMetric,
    minValue: number | null,
    maxValue: number | null,
    enabled: boolean
  ) => {
    if (!centralId) return;

    const existing = thresholds.find(t => t.metric === metric);

    if (existing) {
      const { error } = await supabase
        .from('telemetry_thresholds')
        .update({
          min_value: minValue,
          max_value: maxValue,
          enabled,
        })
        .eq('id', existing.id);

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível atualizar o limite.',
          variant: 'destructive',
        });
        return false;
      }
    } else {
      const { error } = await supabase.from('telemetry_thresholds').insert({
        central_id: centralId,
        metric,
        min_value: minValue,
        max_value: maxValue,
        enabled,
      });

      if (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível criar o limite.',
          variant: 'destructive',
        });
        return false;
      }
    }

    toast({
      title: 'Sucesso',
      description: 'Limite salvo com sucesso.',
    });
    return true;
  };

  const deleteThreshold = async (id: string) => {
    const { error } = await supabase.from('telemetry_thresholds').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o limite.',
        variant: 'destructive',
      });
      return false;
    }

    toast({
      title: 'Sucesso',
      description: 'Limite excluído com sucesso.',
    });
    return true;
  };

  const getThresholdForMetric = (metric: ThresholdMetric): Threshold | undefined => {
    return thresholds.find(t => t.metric === metric);
  };

  return {
    thresholds,
    loading,
    upsertThreshold,
    deleteThreshold,
    getThresholdForMetric,
  };
}
