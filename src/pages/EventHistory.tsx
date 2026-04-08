import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Download, 
  Filter, 
  Calendar,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  AlertTriangle,
  DoorOpen,
  Radio,
  Zap,
  Terminal,
  Users,
  Thermometer,
  Droplets,
  Gauge,
  BatteryCharging
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useCentrals } from '@/hooks/useCentrals';

interface Event {
  id: string;
  type: string;
  description: string;
  zone: string | null;
  timestamp: string;
  central_id: string | null;
}

interface TelemetryRecord {
  id: string;
  central_id: string;
  temperature: number | null;
  humidity: number | null;
  current: number | null;
  power: number | null;
  timestamp: string;
}

const ITEMS_PER_PAGE = 20;

const eventTypes = [
  { value: 'all', label: 'Todos os Tipos' },
  { value: 'motion', label: 'Movimento' },
  { value: 'zone-trigger', label: 'Disparo de Zona' },
  { value: 'tamper', label: 'Tamper' },
  { value: 'power-fail', label: 'Falha de Energia' },
  { value: 'door', label: 'Porta' },
  { value: 'command', label: 'Comando' },
];

const getEventIcon = (type: string) => {
  switch (type) {
    case 'motion': return Activity;
    case 'zone-trigger': return AlertTriangle;
    case 'tamper': return AlertTriangle;
    case 'power-fail': return Zap;
    case 'door': return DoorOpen;
    case 'command': return Terminal;
    default: return Radio;
  }
};

const getEventColor = (type: string) => {
  switch (type) {
    case 'motion': return 'text-blue-500 bg-blue-500/10';
    case 'zone-trigger': return 'text-red-500 bg-red-500/10';
    case 'tamper': return 'text-orange-500 bg-orange-500/10';
    case 'power-fail': return 'text-yellow-500 bg-yellow-500/10';
    case 'door': return 'text-emerald-500 bg-emerald-500/10';
    case 'command': return 'text-purple-500 bg-purple-500/10';
    default: return 'text-muted-foreground bg-muted';
  }
};

export default function EventHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { centrals, selectedCentralId, setSelectedCentralId } = useCentrals();
  
  const [activeTab, setActiveTab] = useState('events');
  
  // Events state
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsTotalCount, setEventsTotalCount] = useState(0);
  const [eventsCurrentPage, setEventsCurrentPage] = useState(1);
  
  // Events filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('');
  const [eventsStartDate, setEventsStartDate] = useState('');
  const [eventsEndDate, setEventsEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Zone statistics
  const [zoneStats, setZoneStats] = useState<Record<string, number>>({});

  // Telemetry state
  const [telemetry, setTelemetry] = useState<TelemetryRecord[]>([]);
  const [telemetryLoading, setTelemetryLoading] = useState(true);
  const [telemetryTotalCount, setTelemetryTotalCount] = useState(0);
  const [telemetryCurrentPage, setTelemetryCurrentPage] = useState(1);
  
  // Telemetry filters
  const [telemetryStartDate, setTelemetryStartDate] = useState('');
  const [telemetryEndDate, setTelemetryEndDate] = useState('');

  const fetchEvents = async () => {
    if (!selectedCentralId) {
      setEvents([]);
      setEventsTotalCount(0);
      return;
    }

    setEventsLoading(true);

    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .eq('central_id', selectedCentralId)
      .order('timestamp', { ascending: false });

    if (typeFilter !== 'all') {
      query = query.eq('type', typeFilter);
    }

    if (zoneFilter) {
      query = query.ilike('zone', `%${zoneFilter}%`);
    }

    if (eventsStartDate) {
      query = query.gte('timestamp', `${eventsStartDate}T00:00:00`);
    }

    if (eventsEndDate) {
      query = query.lte('timestamp', `${eventsEndDate}T23:59:59`);
    }

    if (searchTerm) {
      query = query.ilike('description', `%${searchTerm}%`);
    }

    const from = (eventsCurrentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar eventos',
        variant: 'destructive',
      });
    } else {
      setEvents(data || []);
      setEventsTotalCount(count || 0);
    }

    setEventsLoading(false);
  };

  const fetchZoneStats = async () => {
    if (!selectedCentralId) return;

    const { data, error } = await supabase
      .from('events')
      .select('zone')
      .eq('central_id', selectedCentralId)
      .not('zone', 'is', null);

    if (data && !error) {
      const stats: Record<string, number> = {};
      data.forEach(event => {
        if (event.zone) {
          stats[event.zone] = (stats[event.zone] || 0) + 1;
        }
      });
      setZoneStats(stats);
    }
  };

  const fetchTelemetry = async () => {
    if (!selectedCentralId) {
      setTelemetry([]);
      setTelemetryTotalCount(0);
      return;
    }

    setTelemetryLoading(true);

    let query = supabase
      .from('telemetry')
      .select('*', { count: 'exact' })
      .eq('central_id', selectedCentralId)
      .order('timestamp', { ascending: false });

    if (telemetryStartDate) {
      query = query.gte('timestamp', `${telemetryStartDate}T00:00:00`);
    }

    if (telemetryEndDate) {
      query = query.lte('timestamp', `${telemetryEndDate}T23:59:59`);
    }

    const from = (telemetryCurrentPage - 1) * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching telemetry:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar telemetria',
        variant: 'destructive',
      });
    } else {
      setTelemetry(data || []);
      setTelemetryTotalCount(count || 0);
    }

    setTelemetryLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'events') {
      fetchEvents();
      fetchZoneStats();
    }
  }, [selectedCentralId, typeFilter, zoneFilter, eventsStartDate, eventsEndDate, searchTerm, eventsCurrentPage, activeTab]);

  useEffect(() => {
    if (activeTab === 'telemetry') {
      fetchTelemetry();
    }
  }, [selectedCentralId, telemetryStartDate, telemetryEndDate, telemetryCurrentPage, activeTab]);

  const exportEventsCSV = () => {
    if (events.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum evento para exportar',
      });
      return;
    }

    const headers = ['Data/Hora', 'Tipo', 'Descrição', 'Zona'];
    const rows = events.map(event => [
      format(new Date(event.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      event.type,
      event.description,
      event.zone || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `eventos_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();

    toast({
      title: 'Sucesso',
      description: 'CSV exportado com sucesso',
    });
  };

  const exportTelemetryCSV = () => {
    if (telemetry.length === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum dado de telemetria para exportar',
      });
      return;
    }

    const headers = ['Data/Hora', 'Temperatura (°C)', 'Umidade (%)', 'Corrente (A)', 'Potência (W)'];
    const rows = telemetry.map(record => [
      format(new Date(record.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      record.temperature?.toFixed(1) ?? '-',
      record.humidity?.toFixed(1) ?? '-',
      record.current?.toFixed(3) ?? '-',
      record.power?.toFixed(2) ?? '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `telemetria_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`;
    link.click();

    toast({
      title: 'Sucesso',
      description: 'CSV exportado com sucesso',
    });
  };

  const eventsTotalPages = Math.ceil(eventsTotalCount / ITEMS_PER_PAGE);
  const telemetryTotalPages = Math.ceil(telemetryTotalCount / ITEMS_PER_PAGE);
  const topZones = Object.entries(zoneStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-semibold">Histórico</h1>
            </div>
            <Button 
              onClick={activeTab === 'events' ? exportEventsCSV : exportTelemetryCSV} 
              variant="outline" 
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Central Selector */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Central:</label>
            <Select value={selectedCentralId || ''} onValueChange={setSelectedCentralId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Selecione uma central" />
              </SelectTrigger>
              <SelectContent>
                {centrals.map(central => (
                  <SelectItem key={central.id} value={central.id}>
                    {central.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events" className="gap-2">
              <Activity className="h-4 w-4" />
              Eventos
            </TabsTrigger>
            <TabsTrigger value="telemetry" className="gap-2">
              <Thermometer className="h-4 w-4" />
              Telemetria
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6 mt-6">
            {/* Zone Flow Dashboard */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Fluxo por Zona</h2>
              </div>
              
              {topZones.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {topZones.map(([zone, count], index) => (
                    <motion.div
                      key={zone}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-muted/50 rounded-lg p-4 text-center"
                    >
                      <div className="text-2xl font-bold text-primary">{count}</div>
                      <div className="text-sm text-muted-foreground truncate">{zone}</div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma estatística de zona disponível
                </p>
              )}
            </Card>

            {/* Events Filters */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filtros</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar descrição..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setEventsCurrentPage(1); }}
                    className="pl-9"
                  />
                </div>

                <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setEventsCurrentPage(1); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {eventTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Filtrar por zona..."
                  value={zoneFilter}
                  onChange={(e) => { setZoneFilter(e.target.value); setEventsCurrentPage(1); }}
                />

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={eventsStartDate}
                    onChange={(e) => { setEventsStartDate(e.target.value); setEventsCurrentPage(1); }}
                    className="pl-9"
                    placeholder="Data inicial"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={eventsEndDate}
                    onChange={(e) => { setEventsEndDate(e.target.value); setEventsCurrentPage(1); }}
                    className="pl-9"
                    placeholder="Data final"
                  />
                </div>
              </div>
            </Card>

            {/* Events Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {eventsTotalCount} evento(s) encontrado(s)
                  </span>
                </div>
              </div>

              {eventsLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando eventos...
                </div>
              ) : events.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum evento encontrado
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {events.map((event, index) => {
                    const Icon = getEventIcon(event.type);
                    const colorClass = getEventColor(event.type);
                    
                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="p-4 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${colorClass}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(event.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                              </span>
                              {event.zone && (
                                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                                  {event.zone}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-0.5 rounded ${colorClass}`}>
                                {event.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Events Pagination */}
              {eventsTotalPages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Página {eventsCurrentPage} de {eventsTotalPages}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsCurrentPage(p => Math.max(1, p - 1))}
                      disabled={eventsCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEventsCurrentPage(p => Math.min(eventsTotalPages, p + 1))}
                      disabled={eventsCurrentPage === eventsTotalPages}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Telemetry Tab */}
          <TabsContent value="telemetry" className="space-y-6 mt-6">
            {/* Telemetry Filters */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filtros</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-md">
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={telemetryStartDate}
                    onChange={(e) => { setTelemetryStartDate(e.target.value); setTelemetryCurrentPage(1); }}
                    className="pl-9"
                    placeholder="Data inicial"
                  />
                </div>

                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    value={telemetryEndDate}
                    onChange={(e) => { setTelemetryEndDate(e.target.value); setTelemetryCurrentPage(1); }}
                    className="pl-9"
                    placeholder="Data final"
                  />
                </div>
              </div>
            </Card>

            {/* Telemetry Table */}
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {telemetryTotalCount} registro(s) encontrado(s)
                  </span>
                </div>
              </div>

              {telemetryLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Carregando telemetria...
                </div>
              ) : telemetry.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  Nenhum registro de telemetria encontrado
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Data/Hora</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Thermometer className="h-4 w-4" />
                            Temperatura
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Droplets className="h-4 w-4" />
                            Umidade
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Gauge className="h-4 w-4" />
                            Corrente
                          </div>
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <BatteryCharging className="h-4 w-4" />
                            Potência
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {telemetry.map((record, index) => (
                        <motion.tr
                          key={record.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.02 }}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm">
                            {format(new Date(record.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.temperature != null ? (
                              <span className="text-orange-500 font-medium">{record.temperature.toFixed(1)}°C</span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.humidity != null ? (
                              <span className="text-blue-500 font-medium">{record.humidity.toFixed(1)}%</span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.current != null ? (
                              <span className="text-yellow-500 font-medium">{record.current.toFixed(3)}A</span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {record.power != null ? (
                              <span className="text-green-500 font-medium">{record.power.toFixed(2)}W</span>
                            ) : '-'}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Telemetry Pagination */}
              {telemetryTotalPages > 1 && (
                <div className="p-4 border-t border-border flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Página {telemetryCurrentPage} de {telemetryTotalPages}
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTelemetryCurrentPage(p => Math.max(1, p - 1))}
                      disabled={telemetryCurrentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTelemetryCurrentPage(p => Math.min(telemetryTotalPages, p + 1))}
                      disabled={telemetryCurrentPage === telemetryTotalPages}
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
