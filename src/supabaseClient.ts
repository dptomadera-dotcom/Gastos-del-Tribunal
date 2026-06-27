import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (typeof window !== 'undefined' && localStorage.getItem('supabase_url_override')) || import.meta.env.VITE_SUPABASE_URL || 'https://vdgfxtbjocywcchwktzf.supabase.co';
const supabaseAnonKey = (typeof window !== 'undefined' && localStorage.getItem('supabase_key_override')) || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey && (!import.meta.env || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn(
    'Supabase VITE_SUPABASE_ANON_KEY no está configurada. La aplicación funcionará en modo Local (IndexedDB) temporalmente hasta que configures las variables de entorno o la configures en la interfaz.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-anon-key-to-prevent-crash');

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
