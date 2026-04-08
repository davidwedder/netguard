import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Central } from '@/types/central';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Pencil, Trash2, Radio, Wifi, WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CentralForm {
  name: string;
  location: string;
  model: string;
  serial_number: string;
  ip_address: string;
}

const emptyForm: CentralForm = {
  name: '',
  location: '',
  model: '',
  serial_number: '',
  ip_address: '',
};

const Centrals = () => {
  const [centrals, setCentrals] = useState<Central[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCentral, setEditingCentral] = useState<Central | null>(null);
  const [deletingCentral, setDeletingCentral] = useState<Central | null>(null);
  const [form, setForm] = useState<CentralForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
    loadCentrals();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const loadCentrals = async () => {
    const { data, error } = await supabase
      .from('centrals')
      .select('*')
      .order('created_at', { ascending: false });

    if (data && !error) {
      setCentrals(data.map(c => ({
        ...c,
        last_communication: c.last_communication ? new Date(c.last_communication) : null,
        created_at: new Date(c.created_at),
        updated_at: new Date(c.updated_at),
      })));
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast({
        title: 'Erro',
        description: 'Nome da central é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      if (editingCentral) {
        const { error } = await supabase
          .from('centrals')
          .update({
            name: form.name,
            location: form.location || null,
            model: form.model || null,
            serial_number: form.serial_number || null,
            ip_address: form.ip_address || null,
          })
          .eq('id', editingCentral.id);

        if (error) throw error;

        toast({
           style: {
          background: "rgba(10, 146, 10, 0.904)",
           color: "#fdfdfdf6"
          },
          title: 'Central Atualizada',
          description: 'Dados salvos com sucesso',
        });
      } else {
        const { error } = await supabase
          .from('centrals')
          .insert({
            user_id: user.id,
            name: form.name,
            location: form.location || null,
            model: form.model || null,
            serial_number: form.serial_number || null,
            ip_address: form.ip_address || null,
          });

        if (error) throw error;

        toast({
           style: {
          background: "rgba(10, 146, 10, 0.904)",
           color: "#fdfdfdf6"
          },
          title: 'Central Cadastrada',
          description: 'Nova central adicionada com sucesso',
        });
      }

      setDialogOpen(false);
      setForm(emptyForm);
      setEditingCentral(null);
      loadCentrals();
    } catch (error) {
      console.error('Error saving central:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar central',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (central: Central) => {
    setEditingCentral(central);
    setForm({
      name: central.name,
      location: central.location || '',
      model: central.model || '',
      serial_number: central.serial_number || '',
      ip_address: central.ip_address || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingCentral) return;

    try {
      const { error } = await supabase
        .from('centrals')
        .delete()
        .eq('id', deletingCentral.id);

      if (error) throw error;

      toast({
        title: 'Central Excluída',
        description: 'Central removida com sucesso',
      });

      setDeleteDialogOpen(false);
      setDeletingCentral(null);
      loadCentrals();
    } catch (error) {
      console.error('Error deleting central:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir central',
        variant: 'destructive',
      });
    }
  };

  const openNewDialog = () => {
    setEditingCentral(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gestão de Centrais</h1>
              <p className="text-muted-foreground text-sm">
                Cadastre e gerencie suas centrais de alarme
              </p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openNewDialog} className="gap-2">
                <Plus className="w-4 h-4" />
                Nova Central
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCentral ? 'Editar Central' : 'Nova Central'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ex: Central Principal"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Localização</Label>
                  <Input
                    id="location"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Ex: Edifício A - Térreo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Modelo</Label>
                    <Input
                      id="model"
                      value={form.model}
                      onChange={(e) => setForm({ ...form, model: e.target.value })}
                      placeholder="Ex: ESP32-ALARM"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serial_number">Número de Série</Label>
                    <Input
                      id="serial_number"
                      value={form.serial_number}
                      onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                      placeholder="Ex: SN-001234"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ip_address">Endereço IP</Label>
                  <Input
                    id="ip_address"
                    value={form.ip_address}
                    onChange={(e) => setForm({ ...form, ip_address: e.target.value })}
                    placeholder="Ex: 192.168.1.100"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'Salvando...' : editingCentral ? 'Salvar' : 'Cadastrar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {centrals.length === 0 ? (
          <Card className="p-12 text-center">
            <Radio className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma central cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Cadastre sua primeira central de alarme para começar
            </p>
            <Button onClick={openNewDialog} className="gap-2">
              <Plus className="w-4 h-4" />
              Cadastrar Central
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {centrals.map((central, index) => (
                <motion.div
                  key={central.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${central.online ? 'bg-primary' : 'bg-muted'}`}>
                          {central.online ? (
                            <Wifi className="w-5 h-5 text-primary-foreground" />
                          ) : (
                            <WifiOff className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold">{central.name}</h3>
                          {central.location && (
                            <p className="text-sm text-muted-foreground">{central.location}</p>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                            {central.model && (
                              <span className="bg-muted px-2 py-1 rounded">
                                {central.model}
                              </span>
                            )}
                            {central.serial_number && (
                              <span className="bg-muted px-2 py-1 rounded">
                                SN: {central.serial_number}
                              </span>
                            )}
                            {central.ip_address && (
                              <span className="bg-muted px-2 py-1 rounded">
                                IP: {central.ip_address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(central)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setDeletingCentral(central);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a central "{deletingCentral?.name}"?
                Todos os eventos associados também serão removidos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default Centrals;
