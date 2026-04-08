-- Create intercom_requests table for remote gate/intercom management
CREATE TABLE public.intercom_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  central_id UUID NOT NULL REFERENCES public.centrals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'expired')),
  camera_url TEXT,
  image_snapshot TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID
);

-- Enable RLS
ALTER TABLE public.intercom_requests ENABLE ROW LEVEL SECURITY;

-- Users can view intercom requests for their own centrals
CREATE POLICY "Users can view their own intercom requests"
ON public.intercom_requests
FOR SELECT
USING (
  central_id IN (
    SELECT id FROM public.centrals WHERE user_id = auth.uid()
  )
);

-- Users can update intercom requests for their own centrals
CREATE POLICY "Users can update their own intercom requests"
ON public.intercom_requests
FOR UPDATE
USING (
  central_id IN (
    SELECT id FROM public.centrals WHERE user_id = auth.uid()
  )
);

-- Service role can insert (for ESP32 endpoint)
CREATE POLICY "Service can insert intercom requests"
ON public.intercom_requests
FOR INSERT
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.intercom_requests;