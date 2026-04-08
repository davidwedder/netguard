import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { StatusHeader } from '@/components/StatusHeader';
import { ArmingControl } from '@/components/ArmingControl';
import { EventsFeed } from '@/components/EventsFeed';
import { ZonesGrid } from '@/components/ZonesGrid';
import { ZoneManagement } from '@/components/ZoneManagement';
import { RemoteCommands } from '@/components/RemoteCommands';
import { EventTestPanel } from '@/components/EventTestPanel';
import { CentralSelector } from '@/components/CentralSelector';
import { useCentrals } from '@/hooks/useCentrals';
import { useZones } from '@/hooks/useZones';
import { AlarmSystem, AlarmEvent, AlarmStatus } from '@/types/alarm';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { LogOut, History, BarChart3, Phone } from 'lucide-react';

const Index = () => {
  const [events, setEvents] = useState<AlarmEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [armStatus, setArmStatus] = useState<AlarmStatus>('disarmed');
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const {
    centrals,
    selectedCentral,
    selectedCentralId,
    setSelectedCentralId,
    loading: centralsLoading,
  } = useCentrals();

  const {
    zones,
    createZone,
    updateZone,
    deleteZone,
  } = useZones(selectedCentralId);

  // Build system state from selected central
  const system: AlarmSystem = {
    online: selectedCentral?.online ?? false,
    batteryOk: selectedCentral?.battery_ok ?? true,
    acPowerOk: selectedCentral?.ac_power_ok ?? true,
    lastCommunication: selectedCentral?.last_communication ?? new Date(),
    status: armStatus,
    lastUser: 'Admin',
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Subscribe to real-time events from database filtered by central
  useEffect(() => {
    if (!selectedCentralId) {
      setEvents([]);
      setArmStatus('disarmed');
      return;
    }

    const loadEvents = async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('central_id', selectedCentralId)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (data && !error) {
        setEvents(data.slice(0, 20).map(event => ({
          id: event.id,
          type: event.type as any,
          timestamp: new Date(event.timestamp),
          description: event.description,
          zone: event.zone,
        })));

        // Find latest arm/disarm command to set initial status
        const armEvent = data.find(e => 
          e.type === 'command' && 
          (e.description.includes('Armado Total') || 
           e.description.includes('Armado Parcial') || 
           e.description.includes('Desarmado'))
        );
        
        if (armEvent) {
          if (armEvent.description.includes('Armado Total')) {
            setArmStatus('armed-total');
          } else if (armEvent.description.includes('Armado Parcial')) {
            setArmStatus('armed-partial');
          } else {
            setArmStatus('disarmed');
          }
        } else {
          setArmStatus('disarmed');
        }
      }
    };

    loadEvents();

    const channel = supabase
      .channel(`events-${selectedCentralId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'events',
          filter: `central_id=eq.${selectedCentralId}`,
        },
        (payload) => {
          console.log('New event received:', payload);
          const newEvent: AlarmEvent = {
            id: payload.new.id,
            type: payload.new.type,
            timestamp: new Date(payload.new.timestamp),
            description: payload.new.description,
            zone: payload.new.zone,
          };
          setEvents(prev => [newEvent, ...prev].slice(0, 20));

          // Update arm status if it's an arm/disarm command
          const desc = payload.new.description;
          if (payload.new.type === 'command') {
            if (desc.includes('Armado Total')) {
              setArmStatus('armed-total');
            } else if (desc.includes('Armado Parcial')) {
              setArmStatus('armed-partial');
            } else if (desc.includes('Desarmado')) {
              setArmStatus('disarmed');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCentralId]);

  const handleArm = async (mode: 'total' | 'partial') => {
    if (!selectedCentralId) return;

    // Use description format that matches GET endpoint detection
    const description = mode === 'total' 
      ? 'Armado Total por Admin' 
      : 'Armado Parcial por Admin';
    
    await supabase.from('events').insert({
      type: 'command',
      description,
      central_id: selectedCentralId,
    });

    toast({
      title: 'Sistema Armado',
      description: `Modo: ${mode === 'total' ? 'Total' : 'Parcial'}`,
    });
  };

  const handleDisarm = async () => {
    if (!selectedCentralId) return;

    await supabase.from('events').insert({
      type: 'command',
      description: 'Desarmado por Admin',
      central_id: selectedCentralId,
    });

    toast({
      title: 'Sistema Desarmado',
      description: 'Central desarmada com sucesso',
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading || centralsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <CentralSelector
          centrals={centrals}
          selectedCentralId={selectedCentralId}
          onSelect={setSelectedCentralId}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/intercom')}
          className="gap-2"
        >
          <Phone className="w-4 h-4" />
          Portaria
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/telemetry')}
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Telemetria
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/history')}
          className="gap-2"
        >
          <History className="w-4 h-4" />
          Histórico
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </Button>
      </div>
      
      <div className="max-w-7xl mx-auto space-y-6 pt-16">
        {!selectedCentral ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Nenhuma central selecionada. Cadastre uma central para começar.
            </p>
            <Button onClick={() => navigate('/centrals')}>
              Gerenciar Centrais
            </Button>
          </div>
        ) : (
          <>
            <StatusHeader system={system} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <ArmingControl system={system} onArm={handleArm} onDisarm={handleDisarm} />
              </div>
              <div className="lg:col-span-1">
                <EventsFeed events={events} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ZonesGrid zones={zones} />
              <ZoneManagement
                zones={zones}
                onCreateZone={createZone}
                onUpdateZone={updateZone}
                onDeleteZone={deleteZone}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RemoteCommands centralId={selectedCentralId} />
              <EventTestPanel centralId={selectedCentralId} />
            </div>
          </>
        )}

        <footer className="text-center text-sm text-muted-foreground py-6 border-t border-border/50">
          <p>Sistema de Monitoramento de Central de Alarme © 2024</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
