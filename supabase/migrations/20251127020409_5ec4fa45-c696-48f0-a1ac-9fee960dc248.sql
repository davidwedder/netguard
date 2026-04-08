-- Create events table for real-time monitoring
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('motion', 'zone-trigger', 'tamper', 'power-fail', 'door', 'command')),
  description TEXT NOT NULL,
  zone TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all events
CREATE POLICY "Users can view all events" 
ON public.events 
FOR SELECT 
TO authenticated
USING (true);

-- Allow authenticated users to insert events (for testing)
CREATE POLICY "Users can create events" 
ON public.events 
FOR INSERT 
TO authenticated
WITH CHECK (true);

-- Enable realtime for events table
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- Create index for faster queries
CREATE INDEX idx_events_timestamp ON public.events(timestamp DESC);
CREATE INDEX idx_events_type ON public.events(type);