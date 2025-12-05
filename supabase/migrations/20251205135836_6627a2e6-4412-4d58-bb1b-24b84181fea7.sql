-- Allow admins to delete payment requests
CREATE POLICY "Admins can delete payment requests" 
ON public.payment_requests 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));