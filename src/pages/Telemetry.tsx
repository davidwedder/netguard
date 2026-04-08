import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCentrals } from '@/hooks/useCentrals';
import { useTelemetry } from '@/hooks/useTelemetry';
import { CentralSelector } from '@/components/CentralSelector';
import { TelemetryCard } from '@/components/TelemetryCard';
import { TelemetryChart } from '@/components/TelemetryChart';
import { ThresholdSettings } from '@/components/ThresholdSettings';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, RefreshCw, Bell, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Telemetry() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const {
    centrals,
    selectedCentralId,
    setSelectedCentralId,
    loading: centralsLoading,
  } = useCentrals();

  const { latestData, historicalData, loading: telemetryLoading } = useTelemetry(selectedCentralId);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
      } else {
        setIsAuthenticated(true);
      }
      setAuthLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">
              Dashboard de Telemetria
            </h1>
          </div>
        </div>

        {/* Central Selector */}
        <div className="mb-6">
          <CentralSelector
            centrals={centrals}
            selectedCentralId={selectedCentralId}
            onSelect={setSelectedCentralId}
          />
        </div>

        {!selectedCentralId ? (
          <div className="text-center py-12 text-muted-foreground">
            Selecione uma central para visualizar os dados de telemetria
          </div>
        ) : (
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="thresholds" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Alertas Telegram
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              {telemetryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  {/* Current Values Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <TelemetryCard
                      title="Temperatura"
                      value={latestData?.temperature ?? null}
                      unit="°C"
                      icon="temperature"
                      color="bg-red-500"
                    />
                    <TelemetryCard
                      title="Umidade"
                      value={latestData?.humidity ?? null}
                      unit="%"
                      icon="humidity"
                      color="bg-blue-500"
                    />
                    <TelemetryCard
                      title="Corrente"
                      value={latestData?.current ?? null}
                      unit="A"
                      icon="current"
                      color="bg-yellow-500"
                    />
                    <TelemetryCard
                      title="Potência"
                      value={latestData?.power ?? null}
                      unit="W"
                      icon="power"
                      color="bg-green-500"
                    />
                  </div>

                  {/* Historical Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <TelemetryChart
                      data={historicalData}
                      dataKey="temperature"
                      title="Temperatura"
                      unit="°C"
                      color="#ef4444"
                    />
                    <TelemetryChart
                      data={historicalData}
                      dataKey="humidity"
                      title="Umidade"
                      unit="%"
                      color="#3b82f6"
                    />
                    <TelemetryChart
                      data={historicalData}
                      dataKey="current"
                      title="Corrente"
                      unit="A"
                      color="#eab308"
                    />
                    <TelemetryChart
                      data={historicalData}
                      dataKey="power"
                      title="Potência"
                      unit="W"
                      color="#22c55e"
                    />
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="thresholds">
              <ThresholdSettings
                centralId={selectedCentralId}
                centralName={centrals.find(c => c.id === selectedCentralId)?.name}
              />
            </TabsContent>
          </Tabs>
        )}
      </motion.div>
    </div>
  );
}
