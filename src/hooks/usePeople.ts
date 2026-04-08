import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type PersonType = 'resident' | 'visitor' | 'service_provider';
export type PersonStatus = 'allowed' | 'blocked';

export interface Person {
  id: string;
  central_id: string;
  type: PersonType;
  name: string;
  document_type: string | null;
  document_number: string | null;
  company_name: string | null;
  phone: string | null;
  notes: string | null;
  status: PersonStatus;
  created_at: string;
  updated_at: string;
}

export interface CreatePersonData {
  central_id: string;
  type: PersonType;
  name: string;
  document_type?: string;
  document_number?: string;
  company_name?: string;
  phone?: string;
  notes?: string;
  status?: PersonStatus;
}

export const usePeople = (centralId: string | null) => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPeople = async () => {
    if (!centralId) {
      setPeople([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('people')
        .select('*')
        .eq('central_id', centralId)
        .order('name', { ascending: true });

      if (error) throw error;
      setPeople((data || []) as Person[]);
    } catch (error) {
      console.error('Error fetching people:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar cadastros',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createPerson = async (data: CreatePersonData) => {
    try {
      const { error } = await supabase
        .from('people')
        .insert(data);

      if (error) throw error;

      toast({
         style: {
          background: "rgba(10, 146, 10, 0.904)",
           color: "#fdfdfdf6"
          },
        title: 'Sucesso',
        description: 'Cadastro criado com sucesso',
      });

      await fetchPeople();
      return true;
    } catch (error) {
      console.error('Error creating person:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar cadastro',
        variant: 'destructive',
      });
      return false;
    }
  };

  const updatePerson = async (id: string, data: Partial<CreatePersonData>) => {
    try {
      const { error } = await supabase
        .from('people')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
         style: {
          background: "rgba(10, 146, 10, 0.904)",
           color: "#fdfdfdf6"
          },
        title: 'Sucesso',
        description: 'Cadastro atualizado com sucesso',
      });

      await fetchPeople();
      return true;
    } catch (error) {
      console.error('Error updating person:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar cadastro',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deletePerson = async (id: string) => {
    try {
      const { error } = await supabase
        .from('people')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
         style: {
          background: "rgba(10, 146, 10, 0.904)",
           color: "#fdfdfdf6"
          },
        title: 'Sucesso',
        description: 'Cadastro removido com sucesso',
      });

      await fetchPeople();
      return true;
    } catch (error) {
      console.error('Error deleting person:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover cadastro',
        variant: 'destructive',
      });
      return false;
    }
  };

  const toggleStatus = async (id: string, currentStatus: PersonStatus) => {
    const newStatus: PersonStatus = currentStatus === 'allowed' ? 'blocked' : 'allowed';
    return updatePerson(id, { status: newStatus });
  };

  useEffect(() => {
    fetchPeople();
  }, [centralId]);

  useEffect(() => {
    if (!centralId) return;

    const channel = supabase
      .channel('people-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'people',
          filter: `central_id=eq.${centralId}`,
        },
        () => {
          fetchPeople();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [centralId]);

  return {
    people,
    loading,
    createPerson,
    updatePerson,
    deletePerson,
    toggleStatus,
    refetch: fetchPeople,
  };
};
