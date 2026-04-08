import { useNavigate } from 'react-router-dom';
import { Central } from '@/types/central';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Settings, Plus, Radio } from 'lucide-react';

interface CentralSelectorProps {
  centrals: Central[];
  selectedCentralId: string | null;
  onSelect: (id: string) => void;
}

export const CentralSelector = ({
  centrals,
  selectedCentralId,
  onSelect,
}: CentralSelectorProps) => {
  const navigate = useNavigate();

  if (centrals.length === 0) {
    return (
      <Button
        variant="outline"
        onClick={() => navigate('/centrals')}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Cadastrar Central
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Radio className="w-4 h-4 text-muted-foreground" />
      <Select value={selectedCentralId || ''} onValueChange={onSelect}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Selecione uma central" />
        </SelectTrigger>
        <SelectContent>
          {centrals.map((central) => (
            <SelectItem key={central.id} value={central.id}>
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    central.online ? 'bg-foreground' : 'bg-muted-foreground'
                  }`}
                />
                {central.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => navigate('/centrals')}
        title="Gerenciar Centrais"
      >
        <Settings className="w-4 h-4" />
      </Button>
    </div>
  );
};
