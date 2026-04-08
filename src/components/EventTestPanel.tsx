import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Send } from 'lucide-react';

interface EventTestPanelProps {
  centralId: string | null;
}

export const EventTestPanel = ({ centralId }: EventTestPanelProps) => {
  const [type, setType] = useState<string>('motion');
  const [description, setDescription] = useState('');
  const [zone, setZone] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description) {
      toast({
        title: 'Erro',
        description: 'Descrição é obrigatória',
        variant: 'destructive',
      });
      return;
    }

    if (!centralId) {
      toast({
        title: 'Erro',
        description: 'Nenhuma central selecionada',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('events')
        .insert({
          type,
          description,
          zone: zone || null,
          central_id: centralId,
        });

      if (error) throw error;

      toast({
        title: 'Evento Enviado',
        description: 'Evento de teste criado com sucesso',
      });

      setDescription('');
      setZone('');
    } catch (error) {
      console.error('Error sending test event:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar evento de teste',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 border-border/50 bg-card">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Send className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Teste de Eventos</h2>
          <p className="text-sm text-muted-foreground">Enviar eventos simulados para teste</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="event-type">Tipo de Evento</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger id="event-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="motion">Movimento</SelectItem>
              <SelectItem value="zone-trigger">Acionamento de Zona</SelectItem>
              <SelectItem value="tamper">Violação</SelectItem>
              <SelectItem value="power-fail">Falha de Energia</SelectItem>
              <SelectItem value="door">Porta</SelectItem>
              <SelectItem value="command">Comando</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Input
            id="description"
            placeholder="Ex: Movimento detectado no corredor"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="zone">Zona (Opcional)</Label>
          <Input
            id="zone"
            placeholder="Ex: Corredor Norte"
            value={zone}
            onChange={(e) => setZone(e.target.value)}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Enviando...' : 'Enviar Evento de Teste'}
        </Button>
      </form>
    </Card>
  );
};
