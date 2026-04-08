import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Zone, ZoneStatus } from '@/types/alarm';
import { toast } from '@/hooks/use-toast';

export interface ZoneDB {
  id: string;
  central_id: string;
  name: string;
  location: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useZones = (centralId: string | null) => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchZones = async () => {
    if (!centralId) {
      setZones([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('zones')
      .select('*')
      .eq('central_id', centralId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching zones:', error);
      toast({
        title: 'Erro ao carregar zonas',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      setZones(
        (data || []).map((z: ZoneDB) => ({
          id: z.id,
          name: z.name,
          location: z.location,
          status: z.status as ZoneStatus,
        }))
      );
    }
    setLoading(false);
  };

  const createZone = async (name: string, location: string) => {
    if (!centralId) return false;

    const { error } = await supabase.from('zones').insert({
      central_id: centralId,
      name,
      location,
      status: 'normal',
    });

    if (error) {
      toast({
        title: 'Erro ao criar zona',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({
      
       title: 'Zona criada com sucesso' 
      
      });
    await fetchZones();
    return true;
  };

  const updateZone = async (id: string, name: string, location: string, status: ZoneStatus) => {
    const { error } = await supabase
      .from('zones')
      .update({ name, location, status })
      .eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao atualizar zona',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Zona atualizada com sucesso' });
    await fetchZones();
    return true;
  };

  const deleteZone = async (id: string) => {
    const { error } = await supabase.from('zones').delete().eq('id', id);

    if (error) {
      toast({
        title: 'Erro ao excluir zona',
        description: error.message,
        variant: 'destructive',
      });
      return false;
    }

    toast({ title: 'Zona excluída com sucesso' });
    await fetchZones();
    return true;
  };

  useEffect(() => {
    fetchZones();
  }, [centralId]);

  useEffect(() => {
    if (!centralId) return;

    const channel = supabase
      .channel(`zones-${centralId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zones',
          filter: `central_id=eq.${centralId}`,
        },
        () => {
          fetchZones();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [centralId]);

  return {
    zones,
    loading,
    createZone,
    updateZone,
    deleteZone,
    refetch: fetchZones,
  };
};
