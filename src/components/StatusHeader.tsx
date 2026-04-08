import { motion } from 'framer-motion';
import { Wifi, WifiOff, Battery, BatteryWarning, Zap, ZapOff, Clock } from 'lucide-react';
import { AlarmSystem } from '@/types/alarm';
import { Card } from '@/components/ui/card';

interface StatusHeaderProps {
  system: AlarmSystem;
}

export const StatusHeader = ({ system }: StatusHeaderProps) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <Card className="shadow-card border-border/50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Central de Alarme</h1>
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="flex items-center gap-2"
          >
            <div className={`h-2 w-2 rounded-full ${system.online ? 'bg-status-online' : 'bg-status-offline'}`} />
            <span className="text-sm font-medium text-muted-foreground">
              {system.online ? 'Online' : 'Offline'}
            </span>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            {system.online ? (
              <Wifi className="h-5 w-5 text-status-online" />
            ) : (
              <WifiOff className="h-5 w-5 text-status-offline" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Conexão</p>
              <p className="text-sm font-semibold">{system.online ? 'Ativa' : 'Inativa'}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            {system.batteryOk ? (
              <Battery className="h-5 w-5 text-status-online" />
            ) : (
              <BatteryWarning className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Bateria</p>
              <p className="text-sm font-semibold">{system.batteryOk ? 'OK' : 'Baixa'}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            {system.acPowerOk ? (
              <Zap className="h-5 w-5 text-status-online" />
            ) : (
              <ZapOff className="h-5 w-5 text-destructive" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Alimentação AC</p>
              <p className="text-sm font-semibold">{system.acPowerOk ? 'OK' : 'Falha'}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
          >
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Última Comunicação</p>
              <p className="text-sm font-semibold">{formatTime(system.lastCommunication)}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </Card>
  );
};