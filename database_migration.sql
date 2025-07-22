-- Migration: Add device binding columns to users table
-- This migration adds device_id and device_info columns to enable device binding security

-- Add device_id column to users table
ALTER TABLE public.users 
ADD COLUMN device_id VARCHAR(255) UNIQUE,
ADD COLUMN device_info JSONB,
ADD COLUMN device_registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Add index for faster device lookups
CREATE INDEX idx_users_device_id ON public.users(device_id);

-- Add device change requests table
CREATE TABLE IF NOT EXISTS public.device_change_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    current_device_id VARCHAR(255),
    new_device_id VARCHAR(255),
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT device_change_requests_pkey PRIMARY KEY (id),
    CONSTRAINT device_change_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT device_change_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id)
);

-- Add indexes for device change requests
CREATE INDEX idx_device_change_requests_user_id ON public.device_change_requests(user_id);
CREATE INDEX idx_device_change_requests_status ON public.device_change_requests(status);

-- Add RLS policies for device change requests
ALTER TABLE public.device_change_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own device change requests
CREATE POLICY "Users can view own device change requests" ON public.device_change_requests
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own device change requests
CREATE POLICY "Users can insert own device change requests" ON public.device_change_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all device change requests
CREATE POLICY "Admins can view all device change requests" ON public.device_change_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Policy: Admins can update device change requests
CREATE POLICY "Admins can update device change requests" ON public.device_change_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Add comments for documentation
COMMENT ON COLUMN public.users.device_id IS 'Unique device identifier for device binding security';
COMMENT ON COLUMN public.users.device_info IS 'JSON object containing device information (name, model, platform, etc.)';
COMMENT ON COLUMN public.users.device_registered_at IS 'Timestamp when device was first registered';

COMMENT ON TABLE public.device_change_requests IS 'Table for tracking device change requests that require admin approval';
COMMENT ON COLUMN public.device_change_requests.status IS 'Status of the device change request: pending, approved, or rejected';
COMMENT ON COLUMN public.device_change_requests.reason IS 'Reason provided by user for requesting device change'; 