/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Session } from '../types';
import { Calendar, Plus, Trash2, Edit2, CheckCircle2, Video, MapPin, AlertCircle } from 'lucide-react';

interface SessionsScreenProps {
  sessions: Session[];
  onSave: (session: Session) => void;
  onDelete: (id: string) => void;
}

export default function SessionsScreen({ sessions, onSave, onDelete }: SessionsScreenProps) {
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  // Form states
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [numero, setNumero] = useState(1);
  const [horaInicio, setHoraInicio] = useState('08:30');
  const [horaFin, setHoraFin] = useState('14:30');
  const [modalidad, setModalidad] = useState<'presencial' | 'telematica'>('presencial');
  const [esFestivo, setEsFestivo] = useState(false);

  // Helper to pre-fill next session number
  React.useEffect(() => {
    if (!editingSession) {
      if (sessions.length > 0) {
        // Find highest session number and add 1
        const maxNum = Math.max(...sessions.map(s => s.numero), 0);
        setNumero(maxNum + 1);
        
        // Use the last date as starting point and add 1 day for convenience
        try {
          const lastDate = new Date(sessions[sessions.length - 1].fecha);
          lastDate.setDate(lastDate.getDate() + 1);
          setFecha(lastDate.toISOString().split('T')[0]);
        } catch (e) {
          setFecha(new Date().toISOString().split('T')[0]);
        }
      } else {
        setNumero(1);
        setFecha(new Date().toISOString().split('T')[0]);
      }
    }
  }, [sessions, editingSession]);

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setFecha(session.fecha);
    setNumero(session.numero);
    setHoraInicio(session.horaInicio);
    setHoraFin(session.horaFin);
    setModalidad(session.modalidad);
    setEsFestivo(session.esFestivo);
  };

  const handleCancelEdit = () => {
    setEditingSession(null);
    resetForm();
  };

  const resetForm = () => {
    setEditingSession(null);
    setModalidad('presencial');
    setEsFestivo(false);
    setHoraInicio('08:30');
    setHoraFin('14:30');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const sessionToSave: Session = {
      id: editingSession ? editingSession.id : `sess_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      fecha,
      numero: Number(numero),
      horaInicio,
      horaFin,
      modalidad,
      esFestivo,
    };
    onSave(sessionToSave);
    resetForm();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sessions-container">
      {/* Columna Formulario */}
      <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-fit transition-colors duration-200">
        <div className="bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between">
          <h2 className="font-bold font-display tracking-tight text-base text-white">
            {editingSession ? 'Editar Sesión de Trabajo' : 'Registrar Nueva Sesión'}
          </h2>
          <Calendar className="h-5 w-5 text-indigo-400" />
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-session-fecha">
                Fecha de la sesión
              </label>
              <input
                id="input-session-fecha"
                type="date"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-session-numero">
                Número de Sesión
              </label>
              <input
                id="input-session-numero"
                type="number"
                required
                min="1"
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                value={numero}
                onChange={(e) => setNumero(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-session-hora-inicio">
                Hora de Inicio
              </label>
              <input
                id="input-session-hora-inicio"
                type="time"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1" htmlFor="input-session-hora-fin">
                Hora de Fin
              </label>
              <input
                id="input-session-hora-fin"
                type="time"
                required
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Modalidad de Reunión
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                className={`flex items-center justify-center gap-2 py-2.5 px-3 text-sm rounded-lg border font-semibold transition cursor-pointer ${
                  modalidad === 'presencial'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => setModalidad('presencial')}
              >
                <MapPin className="h-4 w-4" />
                Presencial
              </button>
              <button
                type="button"
                className={`flex items-center justify-center gap-2 py-2.5 px-3 text-sm rounded-lg border font-semibold transition cursor-pointer ${
                  modalidad === 'telematica'
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                onClick={() => setModalidad('telematica')}
              >
                <Video className="h-4 w-4" />
                Telemática
              </button>
            </div>
            {modalidad === 'telematica' && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1.5 flex items-start gap-1 bg-amber-50 dark:bg-amber-950/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Las sesiones telemáticas no generan gastos de viaje (kilometraje ni manutención de transporte) en el aplicativo oficial.
              </p>
            )}
          </div>

          {/* Sábado, domingo o festivo */}
          <div className="flex items-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-850">
            <input
              id="checkbox-session-festivo"
              type="checkbox"
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 rounded cursor-pointer"
              checked={esFestivo}
              onChange={(e) => setEsFestivo(e.target.checked)}
            />
            <label htmlFor="checkbox-session-festivo" className="ml-2.5 text-xs text-slate-700 dark:text-slate-300 font-semibold cursor-pointer">
              ¿Es sábado, domingo o festivo nacional/regional/local?
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            {editingSession && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="flex-1 py-2.5 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {editingSession ? 'Guardar Cambios' : 'Registrar Sesión'}
            </button>
          </div>
        </form>
      </div>

      {/* Columna Listado */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-slate-100">Agenda de Sesiones</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Total registradas: <strong className="text-slate-900 dark:text-slate-100">{sessions.length}</strong>
              </p>
            </div>
            <Calendar className="h-5 w-5 text-slate-400" />
          </div>

          {sessions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Calendar className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Aún no hay sesiones registradas</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
                Registre las sesiones correspondientes a sus jornadas de trabajo en el panel lateral para asociarles gastos de dietas.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {sessions.map((session) => {
                const sessionDate = new Date(session.fecha);
                const dayStr = sessionDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
                const weekdayStr = sessionDate.toLocaleDateString('es-ES', { weekday: 'long' });

                return (
                  <div
                    key={session.id}
                    className={`p-4 rounded-xl border transition flex items-center justify-between ${
                      session.esFestivo 
                        ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 hover:border-rose-200 dark:hover:border-rose-800' 
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      {/* Calendario Badge */}
                      <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono ${
                        session.esFestivo 
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        <span className="text-[10px] uppercase font-bold tracking-tighter leading-none">
                          {sessionDate.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')}
                        </span>
                        <span className="text-lg font-extrabold leading-none mt-0.5">{dayStr.split(' ')[0]}</span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Sesión Nº {session.numero}
                          </span>
                          {session.modalidad === 'presencial' ? (
                            <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-semibold rounded-md flex items-center gap-1">
                              <MapPin className="h-2.5 w-2.5 text-slate-600 dark:text-slate-400" />
                              Presencial
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[10px] font-semibold rounded-md flex items-center gap-1">
                              <Video className="h-2.5 w-2.5 text-indigo-500 dark:text-indigo-400" />
                              Telemática
                            </span>
                          )}
                          {session.esFestivo && (
                            <span className="px-1.5 py-0.5 bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-semibold rounded-md">
                              Festivo/Finde
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span className="capitalize">{weekdayStr}</span>
                          <span className="text-slate-300 dark:text-slate-700">|</span>
                          <span className="font-mono">{session.horaInicio} - {session.horaFin}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(session)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
                        title="Editar sesión"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(session.id)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                        title="Eliminar sesión"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
