-- Create packages table
CREATE TABLE public.packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN (
    'pending_approval', 'approved', 'matched', 'quote_sent', 'quote_accepted', 
    'quote_rejected', 'payment_confirmed', 'payment_pending', 'in_transit', 
    'received_by_traveler', 'delivered_to_office'
  )),
  item_description TEXT NOT NULL,
  estimated_price DECIMAL(10,2),
  item_link TEXT,
  purchase_origin TEXT NOT NULL,
  package_destination TEXT NOT NULL,
  delivery_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
  additional_notes TEXT,
  matched_trip_id UUID,
  quote JSONB,
  traveler_address JSONB,
  confirmed_delivery_address JSONB,
  matched_trip_dates JSONB,
  purchase_confirmation JSONB,
  tracking_info JSONB,
  payment_receipt JSONB,
  traveler_confirmation JSONB,
  office_delivery JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trips table  
CREATE TABLE public.trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN (
    'pending_approval', 'approved', 'active', 'completed'
  )),
  from_city TEXT NOT NULL,
  to_city TEXT NOT NULL,
  departure_date TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_date TIMESTAMP WITH TIME ZONE NOT NULL,
  first_day_packages TIMESTAMP WITH TIME ZONE NOT NULL,
  last_day_packages TIMESTAMP WITH TIME ZONE NOT NULL,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  package_receiving_address JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for matched trips
ALTER TABLE public.packages 
ADD CONSTRAINT fk_packages_matched_trip 
FOREIGN KEY (matched_trip_id) REFERENCES public.trips(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages
CREATE POLICY "Users can view packages they created or that are matched to their trips" 
ON public.packages 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  matched_trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create their own packages" 
ON public.packages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own packages or admins can update any" 
ON public.packages 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete packages" 
ON public.packages 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for trips  
CREATE POLICY "Users can view all approved trips and their own trips" 
ON public.trips 
FOR SELECT 
USING (
  status != 'pending_approval' OR 
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own trips or admins can update any" 
ON public.trips 
FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Only admins can delete trips" 
ON public.trips 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'));

-- Add indexes for better performance
CREATE INDEX idx_packages_user_id ON public.packages(user_id);
CREATE INDEX idx_packages_status ON public.packages(status);
CREATE INDEX idx_packages_matched_trip_id ON public.packages(matched_trip_id);
CREATE INDEX idx_trips_user_id ON public.trips(user_id);
CREATE INDEX idx_trips_status ON public.trips(status);

-- Add triggers for updated_at
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trips_updated_at  
BEFORE UPDATE ON public.trips
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();