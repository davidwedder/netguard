import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Power, Bell, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RemoteCommandsProps {
  centralId: string | null;
}

interface ControlStatus {
  relay: boolean;
  siren: boolean;
  lighting: boolean;
}

export const RemoteCommands = ({ centralId }: RemoteCommandsProps) => {
  const { toast } = useToast();
  const [loadingCommand, setLoadingCommand] = useState<string | null>(null);
  const [status, setStatus] = useState<ControlStatus>({
    relay: false,
    siren: false,
    lighting: false,
  });

  // ===============================
  // 1 — Buscar status inicial
  // ===============================
  useEffect(() => {
    if (!centralId) return;

    const fetchStatus = async () => {
      const { data, error } = await supabase
        .from('status')
        .select('*')
        .eq('central_id', centralId)
        .single();

      if (error) return;

      if (data) {
        setStatus({
          relay: data.relay?.status === 'on',
          siren: data.siren?.status === 'on',
          lighting: data.lighting?.status === 'on',
        });
      }
    };

    fetchStatus();

    // ===============================
    // 2 — Realtime (LISTEN status)
    // ===============================
    const channel = supabase
      .channel(`status-${centralId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'status',
          filter: `central_id=eq.${centralId}`,
        },
        (payload) => {
          const data = payload.new;

          setStatus({
            relay: data.relay?.status === 'on',
            siren: data.siren?.status === 'on',
            lighting: data.lighting?.status === 'on',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [centralId]);

  // ===============================
  // 3 — Enviar comandos
  // ===============================
  const handleCommand = async (device: string, newState: 'on' | 'off') => {
    if (!centralId) {
      toast({
        title: 'Erro',
        description: 'Nenhuma central selecionada',
        variant: 'destructive',
      });
      return;
    }

    setLoadingCommand(`${device}-${newState}`);

    try {
      // Inserir evento para histórico (opcional)
      await supabase.from('events').insert({
        type: 'command',
        description: `${device} ${newState}`,
        zone: null,
        central_id: centralId,
      });

      // Enviar comando para o ESP32 (via tabela commands ou sua API)
      await supabase.from('commands').insert({
        central_id: centralId,
        command: device,
        value: newState,
      });

      toast({
        title: 'Comando enviado',
        description: `${device} ${newState}`,
      });
    } catch (error) {
      console.error('Erro:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar comando',
        variant: 'destructive',
      });
    } finally {
      setLoadingCommand(null);
    }
  };

  // ===============================
  // 4 — Grupos de controle
  // ===============================

  const controlGroups = [
    {
      name: 'Relé',
      dev: 'relay',
      icon: Power,
      isOn: status.relay,
    },
    {
      name: 'Sirene',
      dev: 'siren',
      icon: Bell,
      isOn: status.siren,
    },
    {
      name: 'Iluminação',
      dev: 'lighting',
      icon: Lightbulb,
      isOn: status.lighting,
    },
  ];

  return (
    <Card className="shadow-card border-border/50">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Comandos Remotos</h2>

        <div className="space-y-4">
          {controlGroups.map((group, index) => {
            const Icon = group.icon;

            return (
              <motion.div
                key={group.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg transition-colors duration-300 ${
                        group.isOn
                          ? 'bg-emerald-500/20 text-emerald-500'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{group.name}</span>
                  </div>

                  {/* Indicador de estado */}
                  <div className="flex items-center gap-2">
                    <motion.div
                      animate={{
                        scale: group.isOn ? [1, 1.2, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                        group.isOn
                          ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                          : 'bg-muted-foreground/30'
                      }`}
                    ></motion.div>
                    <span
                      className={`text-sm font-medium transition-colors duration-300 ${
                        group.isOn
                          ? 'text-emerald-600'
                          : 'text-muted-foreground/50 '
                      }`}
                    >
                      {group.isOn ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleCommand(group.dev, 'on')}
                    variant={group.isOn ? 'default' : 'outline'}
                    size="sm"
                    disabled={
                      loadingCommand === `${group.dev}-on` || !centralId
                    }
                    className={`flex-1 ${
                      group.isOn
                        ? 'bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/50'
                        : 'hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/50'
                    }`}
                  >
                    {loadingCommand === `${group.dev}-on`
                      ? 'Enviando...'
                      : 'Ligar'}
                  </Button>

                  <Button
                    onClick={() => handleCommand(group.dev, 'off')}
                    variant={!group.isOn ? 'default' : 'outline'}
                    size="sm"
                    disabled={
                      loadingCommand === `${group.dev}-off` || !centralId
                    }
                    className={`flex-1 ${
                      !group.isOn
                        ? 'bg-destructive hover:bg-destructive/80 text-white'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {loadingCommand === `${group.dev}-off`
                      ? 'Enviando...'
                      : 'Desligar'}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
