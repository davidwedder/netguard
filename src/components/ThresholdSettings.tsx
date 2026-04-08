import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Bell, BellOff, Save, Thermometer, Droplets, Zap, Plug, AlertTriangle, Send } from 'lucide-react';
import { useThresholds, METRIC_CONFIG, ThresholdMetric } from '@/hooks/useThresholds';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ThresholdSettingsProps {
  centralId: string | null;
  centralName?: string;
}

const METRIC_ICONS: Record<ThresholdMetric, React.ReactNode> = {
  temperature: <Thermometer className="h-5 w-5" />,
  humidity: <Droplets className="h-5 w-5" />,
  current: <Zap className="h-5 w-5" />,
  power: <Plug className="h-5 w-5" />,
};

const METRIC_RANGES: Record<ThresholdMetric, { min: number; max: number; step: number }> = {
  temperature: { min: -20, max: 80, step: 1 },
  humidity: { min: 0, max: 100, step: 1 },
  current: { min: 0, max: 100, step: 0.1 },
  power: { min: 0, max: 10000, step: 10 },
};

interface MetricThresholdCardProps {
  metric: ThresholdMetric;
  centralId: string;
  centralName?: string;
  initialMinValue: number | null;
  initialMaxValue: number | null;
  initialEnabled: boolean;
  onSave: (metric: ThresholdMetric, min: number | null, max: number | null, enabled: boolean) => Promise<boolean>;
}

function MetricThresholdCard({
  metric,
  centralId,
  centralName,
  initialMinValue,
  initialMaxValue,
  initialEnabled,
  onSave,
}: MetricThresholdCardProps) {
  const [minValue, setMinValue] = useState<string>(initialMinValue?.toString() ?? '');
  const [maxValue, setMaxValue] = useState<string>(initialMaxValue?.toString() ?? '');
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  const config = METRIC_CONFIG[metric];
  const range = METRIC_RANGES[metric];

  useEffect(() => {
    setMinValue(initialMinValue?.toString() ?? '');
    setMaxValue(initialMaxValue?.toString() ?? '');
    setEnabled(initialEnabled);
  }, [initialMinValue, initialMaxValue, initialEnabled]);

  const handleSave = async () => {
    setSaving(true);
    const min = minValue ? parseFloat(minValue) : null;
    const max = maxValue ? parseFloat(maxValue) : null;
    await onSave(metric, min, max, enabled);
    setSaving(false);
  };

  const handleTestAlert = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('telegram-alert', {
        body: {
          test: true,
          central_id: centralId,
          central_name: centralName || 'Central',
          metric,
          metric_label: config.label,
          value: 0,
          threshold_type: 'test',
          threshold_value: 0,
          unit: config.unit,
        },
      });

      if (error) throw error;

      toast({
        title: 'Teste enviado',
        description: 'Mensagem de teste enviada para o Telegram.',
      });
    } catch (err) {
      console.error('Error testing alert:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem de teste.',
        variant: 'destructive',
      });
    }
    setTesting(false);
  };

  return (
    <Card className={enabled ? 'border-primary/50' : 'opacity-70'}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {METRIC_ICONS[metric]}
            </div>
            <div>
              <CardTitle className="text-base">{config.label}</CardTitle>
              <CardDescription>Unidade: {config.unit}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {enabled ? <Bell className="h-4 w-4 text-primary" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${metric}-min`} className="text-sm flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-blue-500" />
              Mínimo
            </Label>
            <Input
              id={`${metric}-min`}
              type="number"
              placeholder={`Min (${range.min})`}
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              step={range.step}
              disabled={!enabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${metric}-max`} className="text-sm flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-red-500" />
              Máximo
            </Label>
            <Input
              id={`${metric}-max`}
              type="number"
              placeholder={`Max (${range.max})`}
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              step={range.step}
              disabled={!enabled}
            />
          </div>
        </div>

        {enabled && (minValue || maxValue) && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Alerta quando{' '}
            {minValue && <span className="text-blue-500">abaixo de {minValue}{config.unit}</span>}
            {minValue && maxValue && ' ou '}
            {maxValue && <span className="text-red-500">acima de {maxValue}{config.unit}</span>}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving || !enabled} className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button variant="outline" onClick={handleTestAlert} disabled={testing}>
            <Send className="h-4 w-4 mr-2" />
            {testing ? 'Enviando...' : 'Testar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ThresholdSettings({ centralId, centralName }: ThresholdSettingsProps) {
  const { thresholds, loading, upsertThreshold, getThresholdForMetric } = useThresholds(centralId);

  if (!centralId) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Selecione uma central para configurar os limites de alerta.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-muted-foreground py-8">
        Carregando configurações...
      </div>
    );
  }

  const metrics: ThresholdMetric[] = ['temperature', 'humidity', 'current', 'power'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map((metric) => {
          const threshold = getThresholdForMetric(metric);
          return (
            <MetricThresholdCard
              key={metric}
              metric={metric}
              centralId={centralId}
              centralName={centralName}
              initialMinValue={threshold?.min_value ?? null}
              initialMaxValue={threshold?.max_value ?? null}
              initialEnabled={threshold?.enabled ?? false}
              onSave={upsertThreshold}
            />
          );
        })}
      </div>
    </div>
  );
}
