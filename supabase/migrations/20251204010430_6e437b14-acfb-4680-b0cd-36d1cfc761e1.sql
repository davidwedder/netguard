-- Create telemetry table for sensor data
CREATE TABLE public.telemetry (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  central_id UUID NOT NULL REFERENCES public.centrals(id) ON DELETE CASCADE,
  temperature DECIMAL(5,2),
  humidity DECIMAL(5,2),
  current DECIMAL(8,3),
  power DECIMAL(10,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying by central and time
CREATE INDEX idx_telemetry_central_timestamp ON public.telemetry(central_id, timestamp DESC);

-- Enable Row Level Security
ALTER TABLE public.telemetry ENABLE ROW LEVEL SECURITY;

-- Users can view telemetry of their own centrals
CREATE POLICY "Users can view telemetry of their centrals"
ON public.telemetry
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.centrals
    WHERE centrals.id = telemetry.central_id
    AND centrals.user_id = auth.uid()
  )
);

-- Users can insert telemetry for their centrals
CREATE POLICY "Users can insert telemetry for their centrals"
ON public.telemetry
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.centrals
    WHERE centrals.id = telemetry.central_id
    AND centrals.user_id = auth.uid()
  )
);

-- Allow ESP32 to insert telemetry (service role or anon with central_id)
CREATE POLICY "ESP32 can insert telemetry"
ON public.telemetry
FOR INSERT
WITH CHECK (true);

-- Enable realtime for telemetry table
ALTER PUBLICATION supabase_realtime ADD TABLE public.telemetry;