import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IntercomRequest {
  id: string;
  central_id: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  camera_url: string | null;
  image_snapshot: string | null;
  created_at: string;
  responded_at: string | null;
}

export const useIntercom = (centralId: string | null) => {
  const [pendingRequest, setPendingRequest] = useState<IntercomRequest | null>(null);
  const [requests, setRequests] = useState<IntercomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Load existing requests
  const loadRequests = useCallback(async () => {
    if (!centralId) {
      setRequests([]);
      setPendingRequest(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('intercom_requests')
      .select('*')
      .eq('central_id', centralId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data && !error) {
      const typedData = data as unknown as IntercomRequest[];
      setRequests(typedData);
      
      // Find pending request
      const pending = typedData.find(r => r.status === 'pending');
      setPendingRequest(pending || null);
    }
    
    setLoading(false);
  }, [centralId]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!centralId) return;

    loadRequests();

    const channel = supabase
      .channel(`intercom-${centralId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'intercom_requests',
          filter: `central_id=eq.${centralId}`,
        },
        (payload) => {
          console.log('New intercom request:', payload);
          const newRequest = payload.new as unknown as IntercomRequest;
          setRequests(prev => [newRequest, ...prev].slice(0, 50));
          
          if (newRequest.status === 'pending') {
            setPendingRequest(newRequest);
            
            // Play notification sound
            try {
              const audio = new Audio('/notification.mp3');
              audio.play().catch(() => {});
            } catch (e) {
              console.log('Could not play notification sound');
            }

            toast({
               style: {
                    background: "rgba(10, 146, 10, 0.904)",
                    color: "#fdfdfdf6"
                      },
                    title: '🔔 Chamada de Interfone',
                    description: 'Alguém está tocando na portaria!',
                    duration: 10000,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'intercom_requests',
          filter: `central_id=eq.${centralId}`,
        },
        (payload) => {
          console.log('Intercom request updated:', payload);
          const updatedRequest = payload.new as unknown as IntercomRequest;
          
          setRequests(prev => 
            prev.map(r => r.id === updatedRequest.id ? updatedRequest : r)
          );
          
          if (pendingRequest?.id === updatedRequest.id) {
            if (updatedRequest.status !== 'pending') {
              setPendingRequest(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [centralId, loadRequests, toast, pendingRequest?.id]);

  // Respond to intercom request
  const respondToRequest = async (requestId: string, approve: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('intercom_requests')
      .update({
        status: approve ? 'approved' : 'denied',
        responded_at: new Date().toISOString(),
        responded_by: user?.id,
      })
      .eq('id', requestId);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao responder a chamada',
        variant: 'destructive',
      });
      return false;
    }

    // Create event for the action
    if (centralId) {
      await supabase.from('events').insert({
        central_id: centralId,
        type: 'command',
        description: approve 
          ? 'Entrada liberada pela portaria' 
          : 'Entrada recusada pela portaria',
      });
    }

    toast({
       style: {
          background: "rgba(10, 146, 10, 0.904)",
           color: "#fdfdfdf6"
          },
      title: approve ? 'Entrada Liberada' : 'Entrada Recusada',
      description: approve 
        ? 'O portão será acionado'
        : 'A entrada foi negada',
    });

    setPendingRequest(null);
    return true;
  };

  return {
    pendingRequest,
    requests,
    loading,
    respondToRequest,
    loadRequests,
  };
};
