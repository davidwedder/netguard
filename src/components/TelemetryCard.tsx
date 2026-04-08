import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Thermometer, Droplets, Zap, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface TelemetryCardProps {
  title: string;
  value: number | null;
  unit: string;
  icon: 'temperature' | 'humidity' | 'current' | 'power';
  color: string;
}

const icons = {
  temperature: Thermometer,
  humidity: Droplets,
  current: Zap,
  power: Activity,
};

export function TelemetryCard({ title, value, unit, icon, color }: TelemetryCardProps) {
  const Icon = icons[icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border-border/50 hover:border-border transition-colors">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 rounded-full ${color}`}>
            <Icon className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-foreground">
            {value !== null ? value.toFixed(1) : '--'}
            <span className="text-lg font-normal text-muted-foreground ml-1">
              {unit}
            </span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
