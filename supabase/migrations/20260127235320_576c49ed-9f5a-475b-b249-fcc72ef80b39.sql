-- Create table for telemetry thresholds
CREATE TABLE public.telemetry_thresholds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  central_id UUID NOT NULL REFERENCES public.centrals(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- temperature, humidity, current, power
  min_value NUMERIC,
  max_value NUMERIC,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(central_id, metric)
);

-- Enable RLS
ALTER TABLE public.telemetry_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view thresholds of their centrals"
ON public.telemetry_thresholds
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = telemetry_thresholds.central_id
  AND centrals.user_id = auth.uid()
));

CREATE POLICY "Users can create thresholds for their centrals"
ON public.telemetry_thresholds
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = telemetry_thresholds.central_id
  AND centrals.user_id = auth.uid()
));

CREATE POLICY "Users can update thresholds of their centrals"
ON public.telemetry_thresholds
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = telemetry_thresholds.central_id
  AND centrals.user_id = auth.uid()
));

CREATE POLICY "Users can delete thresholds of their centrals"
ON public.telemetry_thresholds
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = telemetry_thresholds.central_id
  AND centrals.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_telemetry_thresholds_updated_at
BEFORE UPDATE ON public.telemetry_thresholds
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry_thresholds;