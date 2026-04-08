import { motion } from 'framer-motion';
import { Shield, ShieldAlert, ShieldCheck, User } from 'lucide-react';
import { AlarmSystem, AlarmStatus } from '@/types/alarm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ArmingControlProps {
  system: AlarmSystem;
  onArm: (mode: 'total' | 'partial') => void;
  onDisarm: () => void;
}

export const ArmingControl = ({ system, onArm, onDisarm }: ArmingControlProps) => {
  const getStatusConfig = (status: AlarmStatus) => {
    switch (status) {
      case 'armed-total':
        return {
          label: 'Armado Total',
          icon: ShieldCheck,
          color: 'text-status-armed',
          bgColor: 'bg-status-armed/10',
        };
      case 'armed-partial':
        return {
          label: 'Armado Parcial',
          icon: Shield,
          color: 'text-status-armed',
          bgColor: 'bg-status-armed/10',
        };
      case 'triggered':
        return {
          label: 'Disparado',
          icon: ShieldAlert,
          color: 'text-destructive',
          bgColor: 'bg-destructive/10',
        };
      default:
        return {
          label: 'Desarmado',
          icon: Shield,
          color: 'text-muted-foreground',
          bgColor: 'bg-muted',
        };
    }
  };

  const statusConfig = getStatusConfig(system.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="shadow-card border-border/50">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Controle de Armamento</h2>

        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`${statusConfig.bgColor} rounded-xl p-6 mb-6`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={system.status === 'triggered' ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5, repeat: system.status === 'triggered' ? Infinity : 0 }}
              >
                <StatusIcon className={`h-8 w-8 ${statusConfig.color}`} />
              </motion.div>
              <div>
                <p className="text-2xl font-bold">{statusConfig.label}</p>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>Último comando: {system.lastUser}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => onArm('total')}
              disabled={system.status === 'armed-total'}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              size="lg"
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Armar Total
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => onArm('partial')}
              disabled={system.status === 'armed-partial'}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              <Shield className="mr-2 h-4 w-4" />
              Armar Parcial
            </Button>
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={onDisarm}
              disabled={system.status === 'disarmed'}
              variant="outline"
              className="w-full border-border hover:bg-muted"
              size="lg"
            >
              <Shield className="mr-2 h-4 w-4" />
              Desarmar
            </Button>
          </motion.div>
        </div>
      </div>
    </Card>
  );
};
