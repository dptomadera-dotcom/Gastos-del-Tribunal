import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
  Settings, Key, Database, LogOut, CheckCircle, 
  Sun, Moon 
} from 'lucide-react';

interface SettingsScreenProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
}

export default function SettingsScreen({ isDarkMode, setIsDarkMode }: SettingsScreenProps) {
  // Supabase connection config states
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseConfigSaved, setSupabaseConfigSaved] = useState(false);

  // Supabase Auth states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Gemini API Key states
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserEmail(session?.user?.email || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserEmail(session?.user?.email || null);
    });

    // Load configurations from localStorage
    setSupabaseUrlInput(localStorage.getItem('supabase_url_override') || 'https://vdgfxtbjocywcchwktzf.supabase.co');
    setSupabaseKeyInput(localStorage.getItem('supabase_key_override') || '');
    setGeminiApiKey(localStorage.getItem('gemini_api_key') || '');

    return () => subscription.unsubscribe();
  }, []);

  const handleSaveSupabaseConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (supabaseUrlInput.trim()) {
      localStorage.setItem('supabase_url_override', supabaseUrlInput.trim());
    } else {
      localStorage.removeItem('supabase_url_override');
    }
    
    if (supabaseKeyInput.trim()) {
      localStorage.setItem('supabase_key_override', supabaseKeyInput.trim());
    } else {
      localStorage.removeItem('supabase_key_override');
    }

    setSupabaseConfigSaved(true);
    setTimeout(() => {
      setSupabaseConfigSaved(false);
      window.location.reload();
    }, 1500);
  };

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', geminiApiKey.trim());
    setGeminiKeySaved(true);
    setTimeout(() => setGeminiKeySaved(false), 3000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        if (data.user && data.session) {
          setAuthMessage('¡Cuenta creada e inicio de sesión correcto!');
        } else {
          setAuthMessage('¡Registro completado! Por favor verifique su correo electrónico si es requerido.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail,
          password: authPassword,
        });
        if (error) throw error;
        setAuthMessage('Inicio de sesión correcto.');
      }
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Ocurrió un error en la autenticación.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthMessage('Sesión cerrada con éxito.');
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || 'Error al cerrar sesión.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const isSupabaseConfigured = () => {
    const url = localStorage.getItem('supabase_url_override') || import.meta.env.VITE_SUPABASE_URL;
    const key = localStorage.getItem('supabase_key_override') || import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!(url && key);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="settings-container">
      {/* 1. APARIENCIA */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight font-display">Apariencia y Tema</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">Personaliza el aspecto de tu cuaderno digital.</p>
          </div>
          <Sun className="h-6 w-6 text-amber-400" />
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Tema de la interfaz</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Elige entre tema claro para trabajar de día o tema oscuro.</p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition cursor-pointer text-xs font-semibold"
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500" />
                  Modo Claro
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-500" />
                  Modo Oscuro
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 2. CONFIGURACIÓN SUPABASE */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight font-display">Conexión con Supabase</h2>
            <p className="text-slate-400 text-[11px] mt-0.5">Parámetros del servidor para habilitar el almacenamiento en la nube.</p>
          </div>
          <Database className="h-6 w-6 text-emerald-400" />
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveSupabaseConfig} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-sb-url">
                  Supabase URL
                </label>
                <input
                  id="input-sb-url"
                  type="text"
                  placeholder="https://su-proyecto.supabase.co"
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-sb-key">
                  Supabase Anon Key
                </label>
                <input
                  id="input-sb-key"
                  type="password"
                  placeholder="Pegue la clave anon key del proyecto"
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                Deje estos campos en blanco para restablecer los valores del servidor predeterminados. Al guardar la app se reiniciará.
              </p>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shrink-0 cursor-pointer"
              >
                Guardar Conexión
              </button>
            </div>
            {supabaseConfigSaved && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-2">
                <CheckCircle className="h-4 w-4" /> ¡Configuración de Supabase guardada! Reiniciando...
              </p>
            )}
          </form>
        </div>
      </div>

      {/* 3. AUTENTICACIÓN SUPABASE (SÓLO SI ESTÁ CONFIGURADO) */}
      {isSupabaseConfigured() && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
          <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold tracking-tight font-display">Sincronización de Cuenta</h2>
              <p className="text-slate-400 text-[11px] mt-0.5">Inicie sesión para habilitar el guardado multi-dispositivo.</p>
            </div>
            <Settings className="h-6 w-6 text-emerald-400" />
          </div>
          <div className="p-6">
            {currentUserEmail ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Usuario conectado:</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currentUserEmail}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">✓ Conectado a la nube y encriptado</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    disabled={isAuthLoading}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-auth-email">
                      Correo Electrónico
                    </label>
                    <input
                      id="input-auth-email"
                      type="email"
                      required
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-auth-pass">
                      Contraseña
                    </label>
                    <input
                      id="input-auth-pass"
                      type="password"
                      required
                      placeholder="••••••••"
                      className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                    />
                  </div>
                </div>
                {authError && (
                  <p className="text-xs text-rose-600 font-bold bg-rose-950/10 p-2.5 rounded-lg">
                    ⚠ {authError}
                  </p>
                )}
                {authMessage && (
                  <p className="text-xs text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/20 p-2.5 rounded-lg">
                    {authMessage}
                  </p>
                )}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRegisterMode(!isRegisterMode)}
                    className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {isRegisterMode ? '¿Ya tiene cuenta? Iniciar Sesión' : '¿No tiene cuenta? Registrarse'}
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthLoading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow transition"
                  >
                    {isAuthLoading ? 'Procesando...' : isRegisterMode ? 'Crear Cuenta' : 'Iniciar Sesión'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 4. INTELIGENCIA ARTIFICIAL GEMINI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight font-display">Ajustes de Inteligencia Artificial (Gemini)</h2>
            <p className="text-slate-450 text-[11px] mt-0.5">Clave para posibilitar el escaneo inteligente OCR de justificantes.</p>
          </div>
          <Key className="h-6 w-6 text-indigo-400" />
        </div>
        <div className="p-6">
          <form onSubmit={handleSaveGeminiKey} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400" htmlFor="input-gemini-key">
                Gemini API Key
              </label>
              <div className="flex gap-2">
                <input
                  id="input-gemini-key"
                  type="password"
                  placeholder="Introduzca su API Key de Google Gemini"
                  className="flex-grow px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shrink-0 cursor-pointer"
                >
                  Guardar Clave
                </button>
              </div>
              <p className="text-[11px] text-slate-450 leading-relaxed mt-1.5">
                ¿No tiene una API Key? Consígala de forma gratuita en <a href="https://aistudio.google.com/" target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold">Google AI Studio</a>. Se guardará localmente en su navegador de forma segura.
              </p>
              {geminiKeySaved && (
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-2">
                  <CheckCircle className="h-4 w-4" /> ¡Clave API de Gemini guardada localmente!
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
