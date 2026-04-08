import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, MapPin, Save } from 'lucide-react';
import { Zone, ZoneStatus } from '@/types/alarm';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

interface ZoneManagementProps {
  zones: Zone[];
  onCreateZone: (name: string, location: string) => Promise<boolean>;
  onUpdateZone: (id: string, name: string, location: string, status: ZoneStatus) => Promise<boolean>;
  onDeleteZone: (id: string) => Promise<boolean>;
}

const statusOptions: { value: ZoneStatus; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'open', label: 'Aberto' },
  { value: 'violated', label: 'Violado' },
  { value: 'bypass', label: 'Bypass' },
];

export const ZoneManagement = ({
  zones,
  onCreateZone,
  onUpdateZone,
  onDeleteZone,
}: ZoneManagementProps) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [deletingZone, setDeletingZone] = useState<Zone | null>(null);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ZoneStatus>('normal');

  const resetForm = () => {
    setName('');
    setLocation('');
    setStatus('normal');
  };

  const handleCreate = async () => {
    if (!name.trim() || !location.trim()) return;
    setSaving(true);
    const success = await onCreateZone(name.trim(), location.trim());
    setSaving(false);
    if (success) {
      setIsCreateOpen(false);
      resetForm();
    }
  };

  const handleUpdate = async () => {
    if (!editingZone || !name.trim() || !location.trim()) return;
    setSaving(true);
    const success = await onUpdateZone(editingZone.id, name.trim(), location.trim(), status);
    setSaving(false);
    if (success) {
      setEditingZone(null);
      resetForm();
    }
  };

  const handleDelete = async () => {
    if (!deletingZone) return;
    setSaving(true);
    await onDeleteZone(deletingZone.id);
    setSaving(false);
    setDeletingZone(null);
  };

  const openEdit = (zone: Zone) => {
    setName(zone.name);
    setLocation(zone.location);
    setStatus(zone.status);
    setEditingZone(zone);
  };

  return (
    <Card className="shadow-card border-border/50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Gerenciar Zonas</h2>
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nova Zona
          </Button>
        </div>

        {zones.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-8">
            Nenhuma zona cadastrada. Clique em "Nova Zona" para adicionar.
          </p>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {zones.map((zone) => (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/30"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">{zone.location}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        zone.status === 'violated'
                          ? 'bg-destructive text-destructive-foreground'
                          : zone.status === 'bypass'
                          ? 'bg-yellow-500/20 text-yellow-600'
                          : zone.status === 'open'
                          ? 'bg-orange-500/20 text-orange-600'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {statusOptions.find((s) => s.value === zone.status)?.label}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(zone)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingZone(zone)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Zona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Zona</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Entrada Principal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Térreo"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim() || !location.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingZone} onOpenChange={(open) => !open && setEditingZone(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Zona</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome da Zona</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Entrada Principal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-location">Localização</Label>
              <Input
                id="edit-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Ex: Térreo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as ZoneStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingZone(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={saving || !name.trim() || !location.trim()}>
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingZone} onOpenChange={(open) => !open && setDeletingZone(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Zona</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a zona "{deletingZone?.name}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
