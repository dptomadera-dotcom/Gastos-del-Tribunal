/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Profile } from '../types';
import { User, Shield, MapPin, Car, CheckCircle } from 'lucide-react';

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

  return (
    <div className="max-w-3xl mx-auto space-y-6" id="profile-container">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 shadow-sm overflow-hidden transition-colors duration-200">
        {/* Banner */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight font-display">Perfil del Comisionado</h2>
            <p className="text-slate-450 text-sm mt-1">
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
    </div>
  );
}
