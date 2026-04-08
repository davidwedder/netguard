import { motion } from 'framer-motion';
import { MapPin, AlertCircle, ShieldOff, CheckCircle } from 'lucide-react';
import { Zone, ZoneStatus } from '@/types/alarm';
import { Card } from '@/components/ui/card';

interface ZonesGridProps {
  zones: Zone[];
}

const getZoneConfig = (status: ZoneStatus) => {
  switch (status) {
    case 'violated':
      return {
        label: 'Violado',
        icon: AlertCircle,
        bgColor: 'bg-zone-violated',
        textColor: 'text-primary-foreground',
      };
    case 'open':
      return {
        label: 'Aberto',
        icon: AlertCircle,
        bgColor: 'bg-muted',
        textColor: 'text-foreground',
      };
    case 'bypass':
      return {
        label: 'Bypass',
        icon: ShieldOff,
        bgColor: 'bg-zone-bypass',
        textColor: 'text-foreground',
      };
    default:
      return {
        label: 'Normal',
        icon: CheckCircle,
        bgColor: 'bg-zone-normal',
        textColor: 'text-foreground',
      };
  }
};

export const ZonesGrid = ({ zones }: ZonesGridProps) => {
  return (
    <Card className="shadow-card border-border/50">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Mapa de Zonas</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {zones.map((zone, index) => {
            const config = getZoneConfig(zone.status);
            const Icon = config.icon;

            return (
              <motion.div
                key={zone.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.03 }}
                className={`${config.bgColor} rounded-lg p-4 transition-all border border-border/30`}
              >
                <div className="flex items-start justify-between mb-2">
                  <Icon className={`h-5 w-5 ${config.textColor}`} />
                  <motion.div
                    animate={
                      zone.status === 'violated'
                        ? { opacity: [1, 0.3, 1] }
                        : {}
                    }
                    transition={{ duration: 1, repeat: zone.status === 'violated' ? Infinity : 0 }}
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      zone.status === 'violated' ? 'bg-destructive text-destructive-foreground' : 'bg-background/50'
                    }`}
                  >
                    {config.label}
                  </motion.div>
                </div>

                <h3 className={`font-semibold text-sm mb-1 ${config.textColor}`}>{zone.name}</h3>
                <div className="flex items-center gap-1 text-xs opacity-70">
                  <MapPin className="h-3 w-3" />
                  <span className={config.textColor}>{zone.location}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
};
