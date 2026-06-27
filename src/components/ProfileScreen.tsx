/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { User, Shield, MapPin, Car, CheckCircle, Cpu, Database, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

interface ProfileScreenProps {
  initialProfile: Profile | null;
  onSave: (profile: Profile) => void;
}

export default function ProfileScreen({ initialProfile, onSave }: ProfileScreenProps) {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [cargo, setCargo] = useState<'presidente' | 'secretario' | 'vocal_titular' | 'vocal_suplente'>('vocal_titular');
  const [desplazamiento, setDesplazamiento] = useState<'no_desplazado' | 'municipio' | 'isla_ccaa'>('no_desplazado');
  const [vehiculoMarca, setVehiculoMarca] = useState('');
  const [vehiculoModelo, setVehiculoModelo] = useState('');
  const [vehiculoMatricula, setVehiculoMatricula] = useState('');
  const [vehiculoTipo, setVehiculoTipo] = useState<'turismo' | 'motocicleta'>('turismo');

  const [saved, setSaved] = useState(false);

  // New States for Supabase Auth
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // New States for Gemini Key
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [geminiKeySaved, setGeminiKeySaved] = useState(false);

  // New States for Supabase Config Overrides
  const [supabaseUrlInput, setSupabaseUrlInput] = useState('');
  const [supabaseKeyInput, setSupabaseKeyInput] = useState('');
  const [supabaseConfigSaved, setSupabaseConfigSaved] = useState(false);

  useEffect(() => {
    // Check current auth status
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUserEmail(session?.user?.email || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUserEmail(session?.user?.email || null);
    });

    // Load Gemini Key from localStorage
    const savedKey = localStorage.getItem('gemini_api_key') || '';
    setGeminiApiKey(savedKey);

    // Load Supabase Config Overrides from localStorage
    setSupabaseUrlInput(localStorage.getItem('supabase_url_override') || 'https://vdgfxtbjocywcchwktzf.supabase.co');
    setSupabaseKeyInput(localStorage.getItem('supabase_key_override') || '');

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (initialProfile) {
      setDni(initialProfile.dni || '');
      setNombre(initialProfile.nombre || '');
      setApellidos(initialProfile.apellidos || '');
      setCargo(initialProfile.cargo || 'vocal_titular');
      setDesplazamiento(initialProfile.desplazamiento || 'no_desplazado');
      setVehiculoMarca(initialProfile.vehiculoMarca || '');
      setVehiculoModelo(initialProfile.vehiculoModelo || '');
      setVehiculoMatricula(initialProfile.vehiculoMatricula || '');
      setVehiculoTipo(initialProfile.vehiculoTipo || 'turismo');
    }
  }, [initialProfile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedProfile: Profile = {
      dni: dni.trim().toUpperCase(),
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      cargo,
      desplazamiento,
      vehiculoMarca: vehiculoMarca.trim(),
      vehiculoModelo: vehiculoModelo.trim(),
      vehiculoMatricula: vehiculoMatricula.trim().toUpperCase(),
      vehiculoTipo,
    };
    onSave(updatedProfile);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (isRegisterMode) {
        const { error } = await supabase.auth.signUp({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setAuthMessage('¡Registro completado! Inicie sesión ahora.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: authEmail.trim(),
          password: authPassword,
        });
        if (error) throw error;
        setAuthMessage('¡Inicio de sesión correcto!');
      }
      setAuthPassword('');
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

  const handleSaveGeminiKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', geminiApiKey.trim());
    setGeminiKeySaved(true);
    setTimeout(() => setGeminiKeySaved(false), 3000);
  };

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

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="profile-container">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
        {/* Banner */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight font-display">Perfil del Comisionado</h2>
            <p className="text-slate-400 text-sm mt-1">
              Configure sus datos base una sola vez para que el sistema aplique las reglas de indemnización oficiales.
            </p>
          </div>
          <User className="h-10 w-10 text-indigo-500 opacity-90" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Bloque 1: Datos Personales */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Shield className="h-4 w-4 text-emerald-600" />
              1. Identificación Personal
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-nombre">
                  Nombre
                </label>
                <input
                  id="input-nombre"
                  type="text"
                  required
                  placeholder="Ej. Juan"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-apellidos">
                  Apellidos
                </label>
                <input
                  id="input-apellidos"
                  type="text"
                  required
                  placeholder="Ej. García Pérez"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-dni">
                  DNI / NIE
                </label>
                <input
                  id="input-dni"
                  type="text"
                  required
                  placeholder="Ej. 12345678Z"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-mono transition"
                  value={dni}
                  onChange={(e) => setDni(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Bloque 2: Cargo y Desplazamiento */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <MapPin className="h-4 w-4 text-amber-500" />
              2. Cargo y Ámbito de Desplazamiento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="select-cargo">
                  Cargo en el Tribunal
                </label>
                <select
                  id="select-cargo"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value as any)}
                >
                  <option value="presidente">Presidente/a</option>
                  <option value="secretario">Secretario/a</option>
                  <option value="vocal_titular">Vocal Titular</option>
                  <option value="vocal_suplente">Vocal Suplente</option>
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  El Secretario/Presidente firman de forma digital todas las dietas oficiales.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="select-desplazamiento">
                  Situación de Desplazamiento Residencial
                </label>
                <select
                  id="select-desplazamiento"
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  value={desplazamiento}
                  onChange={(e) => setDesplazamiento(e.target.value as any)}
                >
                  <option value="no_desplazado">No desplazado (Mismo municipio de sede)</option>
                  <option value="municipio">Desplazado de municipio (Distinto municipio de la isla/zona)</option>
                  <option value="isla_ccaa">Desplazado de isla o CCAA (Requiere trayectos interinsulares/aéreos)</option>
                </select>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                  Determina si tiene derecho a indemnización por kilometraje y manutención según distancias.
                </p>
              </div>
            </div>
          </div>

          {/* Bloque 3: Datos de Vehículo propio (Opcional pero crítico) */}
          <div className="space-y-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 pb-1">
              <Car className="h-4 w-4 text-indigo-500" />
              3. Vehículo Propio (Opcional para justificar kilometraje y parking)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
              El aplicativo oficial de la Consejería exige especificar matrícula y marca de vehículo para cruzar con tickets de aparcamiento o calcular el abono de kilometraje.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="select-vehiculo-tipo">
                  Tipo de Vehículo
                </label>
                <select
                  id="select-vehiculo-tipo"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={vehiculoTipo}
                  onChange={(e) => setVehiculoTipo(e.target.value as any)}
                >
                  <option value="turismo">Automóvil (Turismo) — 0,26 €/km</option>
                  <option value="motocicleta">Motocicleta — 0,106 €/km</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-vehiculo-marca">
                  Marca
                </label>
                <input
                  id="input-vehiculo-marca"
                  type="text"
                  placeholder="Ej. Toyota"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={vehiculoMarca}
                  onChange={(e) => setVehiculoMarca(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-vehiculo-modelo">
                  Modelo
                </label>
                <input
                  id="input-vehiculo-modelo"
                  type="text"
                  placeholder="Ej. Yaris"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  value={vehiculoModelo}
                  onChange={(e) => setVehiculoModelo(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-vehiculo-matricula">
                  Matrícula
                </label>
                <input
                  id="input-vehiculo-matricula"
                  type="text"
                  placeholder="Ej. 1234ABC"
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 font-mono"
                  value={vehiculoMatricula}
                  onChange={(e) => setVehiculoMatricula(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Botón de guardar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {saved ? (
              <span className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 transition-all duration-300">
                <CheckCircle className="h-5 w-5" />
                ¡Datos guardados correctamente en la base de datos local!
              </span>
            ) : (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                Los datos permanecen seguros y encriptados localmente en su navegador.
              </span>
            )}

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition shadow-md hover:shadow-lg active:scale-98 cursor-pointer"
            >
              Guardar Perfil
            </button>
          </div>
        </form>
      </div>

      {/* 4. CONFIGURACIÓN DE GEMINI AI */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight font-display">Ajustes de Inteligencia Artificial (Gemini)</h2>
            <p className="text-slate-450 text-[11px] mt-0.5">
              Configure su clave de API para habilitar la lectura automática de tickets mediante visión artificial.
            </p>
          </div>
          <Cpu className="h-6 w-6 text-indigo-400" />
        </div>

        <form onSubmit={handleSaveGeminiKey} className="p-6 space-y-4">
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

      {/* 5. SINCRONIZACIÓN Y ACCESO SEGURO (SUPABASE) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold tracking-tight font-display">Sincronización con Supabase (Acceso Seguro)</h2>
            <p className="text-slate-450 text-[11px] mt-0.5">
              Inicie sesión para guardar sus datos en el servidor de forma encriptada y habilitar el guardado multi-dispositivo.
            </p>
          </div>
          <Database className="h-6 w-6 text-emerald-400" />
        </div>

        <div className="p-6 space-y-4">
          {/* Configuración de Credenciales del Proyecto Supabase (Para entornos sin .env como GitHub Pages) */}
          <form onSubmit={handleSaveSupabaseConfig} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Configuración de Conexión Supabase (Opcional / Hostings Públicos)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1" htmlFor="input-sb-url">
                  Supabase URL
                </label>
                <input
                  id="input-sb-url"
                  type="text"
                  placeholder="https://su-proyecto.supabase.co"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
                  value={supabaseUrlInput}
                  onChange={(e) => setSupabaseUrlInput(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 mb-1" htmlFor="input-sb-key">
                  Supabase Anon Key
                </label>
                <input
                  id="input-sb-key"
                  type="password"
                  placeholder="Pegue la clave pública anon key"
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-600 font-mono"
                  value={supabaseKeyInput}
                  onChange={(e) => setSupabaseKeyInput(e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-slate-400">
                Guarde para sobreescribir la configuración por defecto y poder iniciar sesión.
              </span>
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 text-white font-semibold text-xs rounded-md transition cursor-pointer"
              >
                Guardar Conexión
              </button>
            </div>
            {supabaseConfigSaved && (
              <p className="text-[10px] text-emerald-600 font-bold mt-1">
                ✓ Configuración guardada. Recargando aplicación...
              </p>
            )}
          </form>

          <div className="h-px bg-slate-100 dark:bg-slate-850 my-2"></div>

          {currentUserEmail ? (
            /* Usuario autenticado */
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Estado de la cuenta:</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{currentUserEmail}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">✓ Conectado de forma segura y encriptada</p>
                </div>
                <button
                  onClick={handleSignOut}
                  disabled={isAuthLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-750 text-white font-semibold text-xs rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Cerrar Sesión
                </button>
              </div>
              <p className="text-xs text-slate-450 leading-relaxed">
                Sus dietas, sesiones y justificantes locales se sincronizarán automáticamente con Supabase siempre que tenga conexión a Internet.
              </p>
            </div>
          ) : (
            /* Formulario de Login/Registro */
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
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
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
    </div>
  );
}
