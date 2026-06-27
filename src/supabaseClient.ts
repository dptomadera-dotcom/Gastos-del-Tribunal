import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vdgfxtbjocywcchwktzf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn(
    'Supabase VITE_SUPABASE_ANON_KEY no está configurada. La aplicación funcionará en modo Local (IndexedDB) temporalmente hasta que configures las variables de entorno en el archivo .env.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Función utilitaria para verificar si la conexión a Supabase es viable
export async function checkSupabaseConnection(): Promise<boolean> {
  if (!supabaseAnonKey) return false;
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
