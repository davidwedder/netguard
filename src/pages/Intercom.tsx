import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCentrals } from '@/hooks/useCentrals';
import { useIntercom, IntercomRequest } from '@/hooks/useIntercom';
import { IntercomPopup } from '@/components/IntercomPopup';
import { CentralSelector } from '@/components/CentralSelector';
import { PeopleManagement } from '@/components/PeopleManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Phone, PhoneOff, Video, Clock, Check, X, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Intercom = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  const {
    centrals,
    selectedCentral,
    selectedCentralId,
    setSelectedCentralId,
    loading: centralsLoading,
  } = useCentrals();

  const {
    pendingRequest,
    requests,
    respondToRequest,
  } = useIntercom(selectedCentralId);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      }
      setLoading(false);
    });
  }, [navigate]);

  const getStatusBadge = (status: IntercomRequest['status']) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" /> Aguardando</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30"><Check className="w-3 h-3 mr-1" /> Liberado</Badge>;
      case 'denied':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><X className="w-3 h-3 mr-1" /> Recusado</Badge>;
      case 'expired':
        return <Badge variant="outline" className="text-muted-foreground">Expirado</Badge>;
    }
  };

  if (loading || centralsLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      {/* Intercom Popup for pending requests */}
      <IntercomPopup
        request={pendingRequest}
        onApprove={(id) => respondToRequest(id, true)}
        onDeny={(id) => respondToRequest(id, false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Portaria Remota</h1>
            <p className="text-sm text-muted-foreground">
              Monitore e controle o acesso via interfone
            </p>
          </div>
        </div>
        <CentralSelector
          centrals={centrals}
          selectedCentralId={selectedCentralId}
          onSelect={setSelectedCentralId}
        />
      </div>

      {!selectedCentral ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            Selecione uma central para monitorar a portaria.
          </p>
          <Button onClick={() => navigate('/centrals')}>
            Gerenciar Centrais
          </Button>
        </div>
      ) : (
        <Tabs defaultValue="camera" className="max-w-6xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="camera" className="gap-2">
              <Video className="w-4 h-4" />
              Câmera e Chamadas
            </TabsTrigger>
            <TabsTrigger value="people" className="gap-2">
              <Users className="w-4 h-4" />
              Cadastro de Pessoas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="camera">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Camera Feed */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    Câmera da Portaria
                  </CardTitle>
                  <CardDescription>
                    Visualização em tempo real do ESP32-CAM
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    {selectedCentral?.ip_address ? (
                      <img
                        src={`http://${selectedCentral.ip_address}:81/stream`}
                        alt="Stream da câmera"
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`flex flex-col items-center gap-2 text-muted-foreground ${selectedCentral?.ip_address ? 'hidden' : ''}`}>
                      <Video className="w-12 h-12" />
                      <span className="text-sm">Configure o IP da central para ver o stream</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da Portaria</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Central</span>
                    <span className="font-medium">{selectedCentral?.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={selectedCentral?.online ? 'default' : 'secondary'}>
                      {selectedCentral?.online ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Chamadas Pendentes</span>
                    <Badge variant={pendingRequest ? 'destructive' : 'outline'}>
                      {pendingRequest ? '1' : '0'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total de Chamadas</span>
                    <span className="font-medium">{requests.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className="w-full gap-2 bg-green-600 hover:bg-green-700" 
                    disabled={!selectedCentralId}
                    onClick={async () => {
                      if (!selectedCentralId) return;
                      await supabase.from('events').insert({
                        central_id: selectedCentralId,
                        type: 'command',
                        description: 'Entrada liberada pela portaria',
                      });
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    Liberar Entrada Manual
                  </Button>
                  <Button variant="outline" className="w-full gap-2" disabled>
                    <Video className="w-4 h-4" />
                    Capturar Foto
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Calls History */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Histórico de Chamadas</CardTitle>
                  <CardDescription>
                    Últimas chamadas de interfone recebidas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    {requests.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Phone className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhuma chamada registrada</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {requests.map((request) => (
                          <div
                            key={request.id}
                            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                request.status === 'approved' 
                                  ? 'bg-green-500/10' 
                                  : request.status === 'denied'
                                  ? 'bg-destructive/10'
                                  : 'bg-muted'
                              }`}>
                                {request.status === 'approved' ? (
                                  <Phone className="w-4 h-4 text-green-500" />
                                ) : request.status === 'denied' ? (
                                  <PhoneOff className="w-4 h-4 text-destructive" />
                                ) : (
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  Chamada #{request.id.slice(0, 8)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(request.created_at), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {getStatusBadge(request.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="people">
            <PeopleManagement centralId={selectedCentralId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Intercom;
