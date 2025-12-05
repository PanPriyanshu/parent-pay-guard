-- Create enum for app roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy: users can view their own roles
CREATE POLICY "Users can view own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Add status values and admin tracking to payment_requests
ALTER TABLE public.payment_requests 
ADD COLUMN IF NOT EXISTS admin_credited BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_reverted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS game_company TEXT DEFAULT NULL;

-- Create policy for admins to view all payment requests
CREATE POLICY "Admins can view all payment requests"
ON public.payment_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create policy for admins to update payment requests
CREATE POLICY "Admins can update payment requests"
ON public.payment_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));