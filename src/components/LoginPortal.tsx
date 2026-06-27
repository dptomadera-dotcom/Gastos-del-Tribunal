import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { ShieldCheck, LogIn, Laptop, ArrowRight } from 'lucide-react';

interface LoginPortalProps {
  onBypass: () => void;
  onSuccess: (email: string) => void;
}

export default function LoginPortal({ onBypass, onSuccess }: LoginPortalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isRegisterMode) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        if (data.user && data.session) {
          onSuccess(data.user.email || email);
        } else {
          setError('Registro completado. Por favor compruebe su correo electrónico si es requerido o intente iniciar sesión.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        if (data.user) {
          onSuccess(data.user.email || email);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error en la autenticación.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white overflow-y-auto">
      <div className="w-full max-w-md my-8 space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/5">
            <ShieldCheck className="h-9 w-9 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-indigo-300">
              Gastos del Tribunal
            </h1>
            <p className="text-slate-400 text-xs font-semibold tracking-wider uppercase mt-1">
              Cuaderno Digital de Liquidación
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-5">
          <div className="text-center space-y-1">
            <h2 className="text-sm font-bold text-slate-200">
              {isRegisterMode ? 'Crear cuenta de Vocal' : 'Iniciar Sesión en el Servidor'}
            </h2>
            <p className="text-[11px] text-slate-500">
              {isRegisterMode 
                ? 'Regístrese para guardar sus justificantes y dietas de forma encriptada.' 
                : 'Acceda para sincronizar sus dietas y justificantes con la nube.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="portal-email">
                  Correo Electrónico
                </label>
                <input
                  id="portal-email"
                  type="email"
                  required
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" htmlFor="portal-pass">
                  Contraseña
                </label>
                <input
                  id="portal-pass"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-950/20 border border-rose-900/30 p-3 rounded-xl font-medium">
                ⚠ {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <span>Procesando...</span>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{isRegisterMode ? 'Registrarse' : 'Entrar al Cuaderno'}</span>
                </>
              )}
            </button>
          </form>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setIsRegisterMode(!isRegisterMode)}
              className="text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
            >
              {isRegisterMode ? '¿Ya tiene cuenta? Iniciar Sesión' : '¿No tiene cuenta? Registrarse'}
            </button>
          </div>
        </div>

        {/* Local Mode / Offline Bypass Button */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <span className="h-px w-12 bg-slate-800"></span>
            <span>O continuación local</span>
            <span className="h-px w-12 bg-slate-800"></span>
          </div>

          <button
            onClick={onBypass}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800/80 transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
          >
            <Laptop className="h-4 w-4 text-slate-400" />
            <span>Continuar en Modo Local (Sin Cuenta)</span>
            <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
          </button>
          <p className="text-[10px] text-slate-500 leading-relaxed max-w-xs mx-auto">
            Los datos se guardarán exclusivamente en este dispositivo mediante IndexedDB y no requerirá conexión.
          </p>
        </div>
      </div>
    </div>
  );
}
