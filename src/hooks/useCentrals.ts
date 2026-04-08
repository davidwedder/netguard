import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Central } from '@/types/central';
import { toast } from '@/hooks/use-toast';

const HEARTBEAT_TIMEOUT_MS = 90000; // 90 seconds without heartbeat = offline

export const useCentrals = () => {
  const [centrals, setCentrals] = useState<Central[]>([]);
  const [selectedCentralId, setSelectedCentralId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const previousStatusRef = useRef<Map<string, boolean>>(new Map());

  // Check if a central is offline based on last_communication
  const checkOnlineStatus = useCallback((central: Central): boolean => {
    if (!central.last_communication) return false;
    const lastComm = new Date(central.last_communication).getTime();
    const now = Date.now();
    return (now - lastComm) < HEARTBEAT_TIMEOUT_MS;
  }, []);

  // Notify status changes
  const notifyStatusChanges = useCallback((updatedCentrals: Central[]) => {
    updatedCentrals.forEach(central => {
      const prevStatus = previousStatusRef.current.get(central.id);
      const currentStatus = central.online;
      
      // Only notify if we have a previous status (not first load) and status changed
      if (prevStatus !== undefined && prevStatus !== currentStatus) {
        if (currentStatus) {
          toast({
             style: {
          background: "rgba(10, 146, 10, 0.904)",
           color: "#fdfdfdf6"
          },
            title: "Central Online",
            description: `${central.name} está conectada`,
          });
        } else {
          toast({           
            title: "Central Offline",
            description: `${central.name} perdeu conexão`,
            variant: "destructive",
          });
        }
      }
      
      previousStatusRef.current.set(central.id, currentStatus);
    });
  }, []);

  // Update centrals with computed online status
  const updateOnlineStatus = useCallback((centralsData: Central[]) => {
    const updated = centralsData.map(c => {
      const isOnline = checkOnlineStatus(c);
      
      console.log('Central status check:', {
        name: c.name,
        last_communication: c.last_communication,
        isOnline,
        db_battery_ok: c.battery_ok,
        db_ac_power_ok: c.ac_power_ok,
      });
      
      return {
        ...c,
        online: isOnline,
        // When offline, show battery and AC as failed
        battery_ok: isOnline ? (c.battery_ok ?? true) : false,
        ac_power_ok: isOnline ? (c.ac_power_ok ?? true) : false,
      };
    });
    notifyStatusChanges(updated);
    return updated;
  }, [checkOnlineStatus, notifyStatusChanges]);

  const loadCentrals = useCallback(async () => {
    const { data, error } = await supabase
      .from('centrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      const mapped = data.map(c => ({
        ...c,
        last_communication: c.last_communication ? new Date(c.last_communication) : null,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
      }));
      
      // Update online status based on heartbeat timeout
      const withOnlineStatus = updateOnlineStatus(mapped);
      setCentrals(withOnlineStatus);
      
      // Auto-select first central if none selected
      if (!selectedCentralId && mapped.length > 0) {
        setSelectedCentralId(mapped[0].id);
      }
    }
    setLoading(false);
  }, [selectedCentralId, updateOnlineStatus]);

  useEffect(() => {
    loadCentrals();

    // Subscribe to real-time changes on centrals table
    const channel = supabase
      .channel('centrals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'centrals'
        },
        () => {
          loadCentrals();
        }
      )
      .subscribe();

    // Periodic check for offline status every 10 seconds
    const intervalId = setInterval(() => {
      setCentrals(prev => updateOnlineStatus(prev));
    }, 10000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [loadCentrals, updateOnlineStatus]);

  const selectedCentral = centrals.find(c => c.id === selectedCentralId) || null;

  return {
    centrals,
    selectedCentral,
    selectedCentralId,
    setSelectedCentralId,
    loading,
    refetch: loadCentrals,
  };
};
