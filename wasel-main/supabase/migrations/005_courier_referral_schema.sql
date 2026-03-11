
-- Courier and Orders Schema Update
CREATE TABLE IF NOT EXISTS public.couriers (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    status TEXT DEFAULT 'pending',
    vehicle_type TEXT,
    balance DECIMAL DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS courier_id UUID REFERENCES public.couriers(id),
ADD COLUMN IF NOT EXISTS delivery_proof_url TEXT,
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'pending';

-- Referrals
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_id UUID REFERENCES auth.users(id),
    referred_id UUID REFERENCES auth.users(id),
    bonus_applied BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

