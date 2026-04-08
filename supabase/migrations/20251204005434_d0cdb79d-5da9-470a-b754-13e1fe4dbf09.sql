-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create zones table for managing alarm zones per central
CREATE TABLE public.zones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  central_id UUID NOT NULL REFERENCES public.centrals(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'normal' CHECK (status IN ('normal', 'open', 'violated', 'bypass')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;

-- Users can view zones of their own centrals
CREATE POLICY "Users can view zones of their centrals"
ON public.zones
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.centrals 
    WHERE centrals.id = zones.central_id 
    AND centrals.user_id = auth.uid()
  )
);

-- Users can create zones for their own centrals
CREATE POLICY "Users can create zones for their centrals"
ON public.zones
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.centrals 
    WHERE centrals.id = zones.central_id 
    AND centrals.user_id = auth.uid()
  )
);

-- Users can update zones of their own centrals
CREATE POLICY "Users can update zones of their centrals"
ON public.zones
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.centrals 
    WHERE centrals.id = zones.central_id 
    AND centrals.user_id = auth.uid()
  )
);

-- Users can delete zones of their own centrals
CREATE POLICY "Users can delete zones of their centrals"
ON public.zones
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.centrals 
    WHERE centrals.id = zones.central_id 
    AND centrals.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_zones_updated_at
BEFORE UPDATE ON public.zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for zones table
ALTER PUBLICATION supabase_realtime ADD TABLE public.zones;