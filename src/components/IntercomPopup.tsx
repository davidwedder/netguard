import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Phone, PhoneOff, Video, VideoOff, Loader2 } from 'lucide-react';
import { IntercomRequest } from '@/hooks/useIntercom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface IntercomPopupProps {
  request: IntercomRequest | null;
  onApprove: (requestId: string) => Promise<boolean>;
  onDeny: (requestId: string) => Promise<boolean>;
}

export const IntercomPopup = ({ request, onApprove, onDeny }: IntercomPopupProps) => {
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<'approve' | 'deny' | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for elapsed time
  useEffect(() => {
    if (!request) {
      setElapsedTime(0);
      return;
    }

    const startTime = new Date(request.created_at).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [request]);

  const formatElapsedTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApprove = async () => {
    if (!request) return;
    setLoading(true);
    setAction('approve');
    await onApprove(request.id);
    setLoading(false);
    setAction(null);
  };

  const handleDeny = async () => {
    if (!request) return;
    setLoading(true);
    setAction('deny');
    await onDeny(request.id);
    setLoading(false);
    setAction(null);
  };

  return (
    <Dialog open={!!request} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border-border">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="w-3 h-3 bg-destructive rounded-full"
              />
              <span>Chamada de Interfone</span>
            </div>
            <span className="text-sm font-mono text-muted-foreground">
              {formatElapsedTime(elapsedTime)}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Camera Stream */}
          <Card className="relative aspect-video bg-muted overflow-hidden">
            {request?.camera_url && !streamError ? (
              <img
                src={request.camera_url}
                alt="Camera Stream"
                className="w-full h-full object-cover"
                onError={() => setStreamError(true)}
              />
            ) : request?.image_snapshot ? (
              <img
                src={request.image_snapshot}
                alt="Snapshot"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <VideoOff className="w-12 h-12" />
                <span className="text-sm">Câmera não disponível</span>
              </div>
            )}

            {/* Stream status indicator */}
            {request?.camera_url && !streamError && (
              <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-background/80 px-2 py-1 rounded text-xs">
                <Video className="w-3 h-3 text-destructive" />
                <span>AO VIVO</span>
              </div>
            )}
          </Card>

          {/* Request Info */}
          <div className="text-sm text-muted-foreground text-center">
            Chamada recebida em{' '}
            {request && format(new Date(request.created_at), "HH:mm:ss 'de' dd/MM/yyyy", { locale: ptBR })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <Button
              variant="destructive"
              size="lg"
              className="flex-1 max-w-40 gap-2"
              onClick={handleDeny}
              disabled={loading}
            >
              {loading && action === 'deny' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <PhoneOff className="w-5 h-5" />
              )}
              Recusar
            </Button>
            
            <Button
              variant="default"
              size="lg"
              className="flex-1 max-w-40 gap-2 bg-green-600 hover:bg-green-700"
              onClick={handleApprove}
              disabled={loading}
            >
              {loading && action === 'approve' ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Phone className="w-5 h-5" />
              )}
              Liberar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
