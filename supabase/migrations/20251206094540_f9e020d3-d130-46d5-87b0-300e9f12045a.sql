
-- Create admin_settings table to store admin configuration
CREATE TABLE public.admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create admin_activity_logs table to track admin actions
CREATE TABLE public.admin_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_table text,
  target_id uuid,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_settings - only admins can access
CREATE POLICY "Admins can view settings" ON public.admin_settings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert settings" ON public.admin_settings
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update settings" ON public.admin_settings
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete settings" ON public.admin_settings
  FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS policies for admin_activity_logs - only admins can access
CREATE POLICY "Admins can view activity logs" ON public.admin_activity_logs
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert activity logs" ON public.admin_activity_logs
  FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at on admin_settings
CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable realtime for admin tables
ALTER TABLE public.admin_activity_logs REPLICA IDENTITY FULL;
