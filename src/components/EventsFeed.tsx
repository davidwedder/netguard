import { motion, AnimatePresence } from 'framer-motion';
import { Activity, DoorOpen, AlertTriangle, Power, Command } from 'lucide-react';
import { AlarmEvent, EventType } from '@/types/alarm';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface EventsFeedProps {
  events: AlarmEvent[];
}

const getEventIcon = (type: EventType) => {
  switch (type) {
    case 'motion':
      return Activity;
    case 'door':
      return DoorOpen;
    case 'tamper':
    case 'zone-trigger':
      return AlertTriangle;
    case 'power-fail':
      return Power;
    case 'command':
      return Command;
    default:
      return Activity;
  }
};

const getEventColor = (type: EventType) => {
  switch (type) {
    case 'tamper':
    case 'zone-trigger':
      return 'text-destructive';
    case 'power-fail':
      return 'text-destructive';
    case 'command':
      return 'text-status-armed';
    default:
      return 'text-muted-foreground';
  }
};

export const EventsFeed = ({ events }: EventsFeedProps) => {
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <Card className="shadow-card border-border/50 h-full">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Eventos em Tempo Real</h2>
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-status-online"
          />
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <AnimatePresence>
            {events.map((event, index) => {
              const Icon = getEventIcon(event.type);
              const color = getEventColor(event.type);

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-start gap-3 p-3 mb-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className={`mt-1 ${color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{event.description}</p>
                    {event.zone && (
                      <p className="text-xs text-muted-foreground mt-0.5">Zona: {event.zone}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatTime(event.timestamp)}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </ScrollArea>
      </div>
    </Card>
  );
};