-- Esquema de base de datos para "Gastos del Tribunal" (React/TS Schema)
-- Copia y ejecuta este script en el SQL Editor de Supabase (https://supabase.com/dashboard/project/vdgfxtbjocywcchwktzf)

-- 1. TABLA: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id TEXT PRIMARY KEY, -- Será el UUID del usuario autenticado (auth.uid()::text)
    dni TEXT,
    nombre TEXT,
    apellidos TEXT,
    cargo TEXT, -- 'presidente' | 'secretario' | 'vocal_titular' | 'vocal_suplente'
    desplazamiento TEXT, -- 'no_desplazado' | 'municipio' | 'isla_ccaa'
    "vehiculoMarca" TEXT,
    "vehiculoModelo" TEXT,
    "vehiculoMatricula" TEXT,
    "vehiculoTipo" TEXT, -- 'turismo' | 'motocicleta'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso público a profiles" ON public.profiles;
CREATE POLICY "Permitir acceso individual a profiles" ON public.profiles
    FOR ALL
    TO authenticated
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);


-- 2. TABLA: SESSIONS
CREATE TABLE IF NOT EXISTS public.sessions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    fecha TEXT NOT NULL, -- YYYY-MM-DD
    numero INTEGER NOT NULL,
    "horaInicio" TEXT, -- HH:MM
    "horaFin" TEXT, -- HH:MM
    modalidad TEXT, -- 'presencial' | 'telematica'
    "esFestivo" BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso público a sessions" ON public.sessions;
CREATE POLICY "Permitir acceso individual a sessions" ON public.sessions
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 3. TABLA: EXPENSES
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    "sesionesAsociadas" TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    origen TEXT,
    destino TEXT,
    "medioTransporte" TEXT, -- 'vehiculo_propio' | 'avion' | 'barco' ...
    "kmRecorridos" NUMERIC DEFAULT 0 NOT NULL,
    "horaSalida" TEXT,
    "horaLlegada" TEXT,
    "importeParking" NUMERIC DEFAULT 0 NOT NULL,
    "importeTaxi" NUMERIC DEFAULT 0 NOT NULL,
    "importeGuagua" NUMERIC DEFAULT 0 NOT NULL,
    "importeAlquiler" NUMERIC DEFAULT 0 NOT NULL,
    "importeAlojamiento" NUMERIC DEFAULT 0 NOT NULL,
    notas TEXT,
    "justificantesAsociados" TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso público a expenses" ON public.expenses;
CREATE POLICY "Permitir acceso individual a expenses" ON public.expenses
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- 4. TABLA: JUSTIFICANTES
CREATE TABLE IF NOT EXISTS public.justificantes (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    "fotoUrl" TEXT, -- Almacena el base64 o link del archivo
    titulo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    tipo TEXT NOT NULL, -- 'Factura Hotel' | 'Tarjeta de Embarque' ...
    "gastoId" TEXT REFERENCES public.expenses(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.justificantes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir acceso público a justificantes" ON public.justificantes;
CREATE POLICY "Permitir acceso individual a justificantes" ON public.justificantes
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

