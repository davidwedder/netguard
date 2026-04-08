import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Building2, 
  Truck, 
  Home,
  Search,
  Edit2,
  Trash2,
  Ban,
  Check,
  X,
  Phone,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { usePeople, Person, PersonType, PersonStatus, CreatePersonData } from '@/hooks/usePeople';

interface PeopleManagementProps {
  centralId: string | null;
}

const typeLabels: Record<PersonType, string> = {
  resident: 'Morador',
  visitor: 'Visitante',
  service_provider: 'Prestador',
};

const typeIcons: Record<PersonType, React.ReactNode> = {
  resident: <Home className="w-4 h-4" />,
  visitor: <Users className="w-4 h-4" />,
  service_provider: <Truck className="w-4 h-4" />,
};

const documentTypes = ['CPF', 'RG', 'CNPJ', 'CNH', 'Passaporte'];

export const PeopleManagement = ({ centralId }: PeopleManagementProps) => {
  const { people, loading, createPerson, updatePerson, deletePerson, toggleStatus } = usePeople(centralId);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [personToDelete, setPersonToDelete] = useState<Person | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | PersonType>('all');
  const [formData, setFormData] = useState<Partial<CreatePersonData>>({
    type: 'resident',
    name: '',
    document_type: '',
    document_number: '',
    company_name: '',
    phone: '',
    notes: '',
    status: 'allowed',
  });

  const resetForm = () => {
    setFormData({
      type: 'resident',
      name: '',
      document_type: '',
      document_number: '',
      company_name: '',
      phone: '',
      notes: '',
      status: 'allowed',
    });
    setEditingPerson(null);
  };

  const handleOpenDialog = (person?: Person) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        type: person.type,
        name: person.name,
        document_type: person.document_type || '',
        document_number: person.document_number || '',
        company_name: person.company_name || '',
        phone: person.phone || '',
        notes: person.notes || '',
        status: person.status,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async () => {
    if (!centralId || !formData.name || !formData.type) return;

    const data: CreatePersonData = {
      central_id: centralId,
      type: formData.type as PersonType,
      name: formData.name,
      document_type: formData.document_type || undefined,
      document_number: formData.document_number || undefined,
      company_name: formData.company_name || undefined,
      phone: formData.phone || undefined,
      notes: formData.notes || undefined,
      status: formData.status as PersonStatus,
    };

    let success: boolean;
    if (editingPerson) {
      success = await updatePerson(editingPerson.id, data);
    } else {
      success = await createPerson(data);
    }

    if (success) {
      handleCloseDialog();
    }
  };

  const handleDelete = async () => {
    if (!personToDelete) return;
    await deletePerson(personToDelete.id);
    setIsDeleteDialogOpen(false);
    setPersonToDelete(null);
  };

  const filteredPeople = people.filter(person => {
    const matchesSearch = 
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.document_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.company_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTab = activeTab === 'all' || person.type === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const getCounts = () => ({
    all: people.length,
    resident: people.filter(p => p.type === 'resident').length,
    visitor: people.filter(p => p.type === 'visitor').length,
    service_provider: people.filter(p => p.type === 'service_provider').length,
  });

  const counts = getCounts();

  if (!centralId) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-8 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Selecione uma central para gerenciar cadastros</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5" />
            Cadastro de Pessoas
          </CardTitle>
          <Button onClick={() => handleOpenDialog()} size="sm" className="gap-2">
            <UserPlus className="w-4 h-4" />
            Novo Cadastro
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, documento ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="gap-2">
                <Users className="w-4 h-4" />
                Todos ({counts.all})
              </TabsTrigger>
              <TabsTrigger value="resident" className="gap-2">
                <Home className="w-4 h-4" />
                Moradores ({counts.resident})
              </TabsTrigger>
              <TabsTrigger value="visitor" className="gap-2">
                <Users className="w-4 h-4" />
                Visitantes ({counts.visitor})
              </TabsTrigger>
              <TabsTrigger value="service_provider" className="gap-2">
                <Truck className="w-4 h-4" />
                Prestadores ({counts.service_provider})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : filteredPeople.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum cadastro encontrado
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence>
                    {filteredPeople.map((person, index) => (
                      <motion.div
                        key={person.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-background">
                            {typeIcons[person.type]}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{person.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {typeLabels[person.type]}
                              </Badge>
                              <Badge
                                variant={person.status === 'allowed' ? 'default' : 'destructive'}
                                className="text-xs"
                              >
                                {person.status === 'allowed' ? 'Liberado' : 'Bloqueado'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              {person.document_type && person.document_number && (
                                <span className="flex items-center gap-1">
                                  <FileText className="w-3 h-3" />
                                  {person.document_type}: {person.document_number}
                                </span>
                              )}
                              {person.company_name && (
                                <span className="flex items-center gap-1">
                                  <Building2 className="w-3 h-3" />
                                  {person.company_name}
                                </span>
                              )}
                              {person.phone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3" />
                                  {person.phone}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(person.id, person.status)}
                            title={person.status === 'allowed' ? 'Bloquear' : 'Liberar'}
                          >
                            {person.status === 'allowed' ? (
                              <Ban className="w-4 h-4 text-destructive" />
                            ) : (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(person)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setPersonToDelete(person);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPerson ? 'Editar Cadastro' : 'Novo Cadastro'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(v) => setFormData({ ...formData, type: v as PersonType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Morador
                    </div>
                  </SelectItem>
                  <SelectItem value="visitor">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Visitante
                    </div>
                  </SelectItem>
                  <SelectItem value="service_provider">
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      Prestador de Serviço
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome completo"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Documento</Label>
                <Select
                  value={formData.document_type}
                  onValueChange={(v) => setFormData({ ...formData, document_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número do Documento</Label>
                <Input
                  value={formData.document_number}
                  onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            {formData.type === 'service_provider' && (
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="Nome da empresa"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v as PersonStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allowed">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-500" />
                      Liberado
                    </div>
                  </SelectItem>
                  <SelectItem value="blocked">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-destructive" />
                      Bloqueado
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleCloseDialog}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.name}>
              <Check className="w-4 h-4 mr-2" />
              {editingPerson ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o cadastro de "{personToDelete?.name}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
