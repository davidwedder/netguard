-- Create enum for person types
CREATE TYPE public.person_type AS ENUM ('resident', 'visitor', 'service_provider');

-- Create enum for person status
CREATE TYPE public.person_status AS ENUM ('allowed', 'blocked');

-- Create table for registered people
CREATE TABLE public.people (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  central_id UUID NOT NULL REFERENCES public.centrals(id) ON DELETE CASCADE,
  type public.person_type NOT NULL,
  name TEXT NOT NULL,
  document_type TEXT, -- RG, CPF, CNPJ
  document_number TEXT,
  company_name TEXT, -- For service providers
  phone TEXT,
  notes TEXT,
  status public.person_status NOT NULL DEFAULT 'allowed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view people of their centrals"
ON public.people
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = people.central_id
  AND centrals.user_id = auth.uid()
));

CREATE POLICY "Users can create people for their centrals"
ON public.people
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = people.central_id
  AND centrals.user_id = auth.uid()
));

CREATE POLICY "Users can update people of their centrals"
ON public.people
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = people.central_id
  AND centrals.user_id = auth.uid()
));

CREATE POLICY "Users can delete people of their centrals"
ON public.people
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM centrals
  WHERE centrals.id = people.central_id
  AND centrals.user_id = auth.uid()
));

-- Trigger for updated_at
CREATE TRIGGER update_people_updated_at
BEFORE UPDATE ON public.people
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.people;