-- roles
CREATE TABLE public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- users (extends Supabase auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id),
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- agencies
CREATE TABLE public.agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    ruc TEXT UNIQUE,
    email TEXT,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- agencies_users (join table for users belonging to agencies)
CREATE TABLE public.agencies_users (
    agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (agency_id, user_id)
);

-- vessels
CREATE TABLE public.vessels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE,
    capacity INT NOT NULL,
    vessel_type TEXT, -- ferry, tour
    owner_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- routes
CREATE TABLE public.routes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    duration_minutes INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- tours
CREATE TABLE public.tours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- availability
CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vessel_id UUID REFERENCES public.vessels(id) ON DELETE CASCADE,
    route_id UUID REFERENCES public.routes(id),
    tour_id UUID REFERENCES public.tours(id),
    date DATE NOT NULL,
    departure_time TIME NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    status TEXT DEFAULT 'active', -- active, blocked, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- reservations
CREATE TABLE public.reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    availability_id UUID REFERENCES public.availability(id),
    agency_id UUID REFERENCES public.agencies(id),
    user_id UUID REFERENCES public.profiles(id), -- the user who made the booking
    status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled
    total_price DECIMAL(10,2),
    commission_amount DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- vouchers
CREATE TABLE public.vouchers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    qr_code_token TEXT UNIQUE NOT NULL,
    pdf_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- audit_logs
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id),
    action TEXT NOT NULL,
    table_name TEXT,
    record_id UUID,
    old_value JSONB,
    new_value JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en las tablas principales
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vessels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

-- Nota: Para simplificar el inicio, crearemos políticas básicas permisivas,
-- luego se pueden restringir por rol.
CREATE POLICY "Allow read access to authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow read access to public" ON public.roles FOR SELECT TO public USING (true);
CREATE POLICY "Allow read access to public" ON public.agencies FOR SELECT TO public USING (true);
CREATE POLICY "Allow read access to public" ON public.vessels FOR SELECT TO public USING (true);
CREATE POLICY "Allow read access to public" ON public.availability FOR SELECT TO public USING (true);
