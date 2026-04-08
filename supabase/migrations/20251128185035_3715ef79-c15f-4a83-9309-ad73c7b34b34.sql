-- Create centrals table
CREATE TABLE public.centrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  location TEXT,
  model TEXT,
  serial_number TEXT,
  ip_address TEXT,
  online BOOLEAN DEFAULT false,
  battery_ok BOOLEAN DEFAULT true,
  ac_power_ok BOOLEAN DEFAULT true,
  last_communication TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.centrals ENABLE ROW LEVEL SECURITY;

-- Users can only see their own centrals
CREATE POLICY "Users can view their own centrals"
ON public.centrals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own centrals
CREATE POLICY "Users can create their own centrals"
ON public.centrals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own centrals
CREATE POLICY "Users can update their own centrals"
ON public.centrals
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own centrals
CREATE POLICY "Users can delete their own centrals"
ON public.centrals
FOR DELETE
USING (auth.uid() = user_id);

-- Add central_id to events table
ALTER TABLE public.events ADD COLUMN central_id UUID REFERENCES public.centrals(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_centrals_user_id ON public.centrals(user_id);
CREATE INDEX idx_events_central_id ON public.events(central_id);

-- Enable realtime for centrals
ALTER PUBLICATION supabase_realtime ADD TABLE public.centrals;