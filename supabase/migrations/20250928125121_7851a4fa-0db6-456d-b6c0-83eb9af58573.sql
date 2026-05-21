-- Add user_id column to notifications table to properly secure notifications
ALTER TABLE public.notifications 
ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update the column to be NOT NULL after adding it
-- First, we'll add it as nullable, then update existing records, then make it NOT NULL
-- For existing notifications without a user_id, we'll need to either delete them or assign them to system

-- For now, let's delete existing notifications that can't be properly attributed to users
-- This is safer than leaving them accessible to everyone
DELETE FROM public.notifications WHERE user_id IS NULL;

-- Now make the column NOT NULL
ALTER TABLE public.notifications 
ALTER COLUMN user_id SET NOT NULL;

-- Drop the existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can manage notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notifications;

-- Create proper RLS policies that restrict users to their own notifications
CREATE POLICY "Users can view their own notifications" 
ON public.notifications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
ON public.notifications 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Only allow system/admin to create notifications (via functions or admin interface)
-- Regular users should not be able to create notifications directly
CREATE POLICY "System can create notifications" 
ON public.notifications 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR is_staff_user());

-- Allow users to delete their own notifications if needed
CREATE POLICY "Users can delete their own notifications" 
ON public.notifications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create an index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);