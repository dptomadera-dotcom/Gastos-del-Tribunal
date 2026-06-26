/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Expense, Session, Profile, Justificante } from '../types';
import { 
  FileText, Plus, Trash2, Edit2, AlertTriangle, Info, MapPin, 
  Plane, Ship, Car, HelpCircle, Check, DollarSign, Image as ImageIcon,
  Compass, Navigation, Map, RefreshCw, Calendar, Filter, CalendarDays, X
} from 'lucide-react';
import ExpenseDashboard from './ExpenseDashboard';
import { MUNICIPALITIES, getDistanceByName, findClosestMunicipality } from '../data/municipalities';

interface ExpensesScreenProps {
  expenses: Expense[];
  sessions: Session[];
  profile: Profile | null;
  justificantes: Justificante[];
  onSave: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpensesScreen({
  expenses,
  sessions,
  profile,
  justificantes,
  onSave,
  onDelete,
}: ExpensesScreenProps) {
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Date range filters for expenses list
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<string>('all'); // 'all', 'month', 'last_month', 'quarter', 'year', 'custom'

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = today.getMonth(); // 0-indexed

    if (quickFilter === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (quickFilter === 'month') {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      setStartDate(formatDateForInput(firstDay));
      setEndDate(formatDateForInput(lastDay));
    } else if (quickFilter === 'last_month') {
      const firstDay = new Date(y, m - 1, 1);
      const lastDay = new Date(y, m, 0);
      setStartDate(formatDateForInput(firstDay));
      setEndDate(formatDateForInput(lastDay));
    } else if (quickFilter === 'quarter') {
      const quarterStartMonth = Math.floor(m / 3) * 3;
      const firstDay = new Date(y, quarterStartMonth, 1);
      const lastDay = new Date(y, quarterStartMonth + 3, 0);
      setStartDate(formatDateForInput(firstDay));
      setEndDate(formatDateForInput(lastDay));
    } else if (quickFilter === 'year') {
      const firstDay = new Date(y, 0, 1);
      const lastDay = new Date(y, 11, 31);
      setStartDate(formatDateForInput(firstDay));
      setEndDate(formatDateForInput(lastDay));
    }
  }, [quickFilter]);

  // Form states
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [isCustomRoute, setIsCustomRoute] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [medioTransporte, setMedioTransporte] = useState<Expense['medioTransporte']>('vehiculo_propio');
  const [kmRecorridos, setKmRecorridos] = useState(0);
  const [horaSalida, setHoraSalida] = useState('');
  const [horaLlegada, setHoraLlegada] = useState('');
  const [importeParking, setImporteParking] = useState(0);
  const [importeTaxi, setImporteTaxi] = useState(0);
  const [importeGuagua, setImporteGuagua] = useState(0);
  const [importeAlquiler, setImporteAlquiler] = useState(0);
  const [importeAlojamiento, setImporteAlojamiento] = useState(0);
  const [notas, setNotas] = useState('');
  const [associatedJustificantes, setAssociatedJustificantes] = useState<string[]>([]);

  // Manutención helper state
  const [manutencionCalculada, setManutencionCalculada] = useState(0);
  const [margenSalida, setMargenSalida] = useState(60); // min before flight
  const [margenLlegada, setMargenLlegada] = useState(60); // min after arrival

  // Auto-calculate distance when origin or destination changes
  useEffect(() => {
    if (!isCustomRoute && origen && destino) {
      const distance = getDistanceByName(origen, destino);
      if (distance !== null) {
        setKmRecorridos(distance);
      }
    }
  }, [origen, destino, isCustomRoute]);

  const handleGeolocateOrigin = () => {
    if (!navigator.geolocation) {
      setGeoError('La geolocalización no está soportada por su navegador.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const closest = findClosestMunicipality(latitude, longitude);
        setOrigen(closest.name);
        setGeoLoading(false);
      },
      (error) => {
        console.error('Error de geolocalización:', error);
        setGeoError('No se pudo acceder a la ubicación. Conceda permisos o seleccione manualmente.');
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Pre-fill fields or trigger calculations
  useEffect(() => {
    if (editingExpense) {
      setSelectedSessions(editingExpense.sesionesAsociadas || []);
      setOrigen(editingExpense.origen || '');
      setDestino(editingExpense.destino || '');
      setMedioTransporte(editingExpense.medioTransporte || 'vehiculo_propio');
      setKmRecorridos(editingExpense.kmRecorridos || 0);
      setHoraSalida(editingExpense.horaSalida || '');
      setHoraLlegada(editingExpense.horaLlegada || '');
      setImporteParking(editingExpense.importeParking || 0);
      setImporteTaxi(editingExpense.importeTaxi || 0);
      setImporteGuagua(editingExpense.importeGuagua || 0);
      setImporteAlquiler(editingExpense.importeAlquiler || 0);
      setImporteAlojamiento(editingExpense.importeAlojamiento || 0);
      setNotas(editingExpense.notas || '');
      setAssociatedJustificantes(editingExpense.justificantesAsociados || []);
    } else {
      resetForm();
    }
  }, [editingExpense]);

  // Handle automatic calculations whenever variables change
  useEffect(() => {
    // If transport is not avion/barco, manutencion is 0 unless special
    if (medioTransporte !== 'avion' && medioTransporte !== 'barco') {
      setManutencionCalculada(0);
      return;
    }

    if (!horaSalida || !horaLlegada) {
      setManutencionCalculada(0);
      return;
    }

    // Calculate simulated official maintenance allowance rules
    // Rule base: Saliendo antes de las 14:00 o llegando después de las 14:00/22:00
    // The administration adjusts departure/arrival times by applying airport/seaport checking margins (usually 60 mins)
    try {
      const [hSalida, mSalida] = horaSalida.split(':').map(Number);
      const [hLlegada, mLlegada] = horaLlegada.split(':').map(Number);

      // Convert departure & arrival into total minutes of the day
      let minsSalidaEfectiva = hSalida * 60 + mSalida - margenSalida; // e.g. leaving at 14:00 - 60min = 13:00 official departure start
      let minsLlegadaEfectiva = hLlegada * 60 + mLlegada + margenLlegada; // e.g. arriving at 13:00 + 60min = 14:00 official arrival return

      // Rules:
      // - Si el viaje de ida empieza antes de las 14:00 -> genera derecho a manutención de almuerzo (19,50 €).
      // - Si el viaje de vuelta termina después de las 14:00 y antes de las 22:00 -> genera derecho a manutención de almuerzo (19,50 €).
      // - Si el viaje de vuelta termina después de las 22:00 -> genera derecho a cena/manutención completa (39,00 €).
      let allowance = 0;

      // Simplification modeled exactly after Consejería algorithm:
      const horaLimiteAlmuerzo = 14 * 60; // 14:00 en minutos
      const horaLimiteCena = 22 * 60; // 22:00 en minutos

      if (minsSalidaEfectiva < horaLimiteAlmuerzo && minsLlegadaEfectiva > horaLimiteCena) {
        allowance = 39.00; // Complete
      } else if (minsSalidaEfectiva < horaLimiteAlmuerzo || minsLlegadaEfectiva > horaLimiteAlmuerzo) {
        allowance = 19.50; // Half
      }

      setManutencionCalculada(allowance);
    } catch (e) {
      setManutencionCalculada(0);
    }
  }, [medioTransporte, horaSalida, horaLlegada, margenSalida, margenLlegada]);

  const handleToggleSession = (id: string) => {
    if (selectedSessions.includes(id)) {
      setSelectedSessions(selectedSessions.filter(s => s !== id));
    } else {
      setSelectedSessions([...selectedSessions, id]);
    }
  };

  const handleToggleJustificante = (id: string) => {
    if (associatedJustificantes.includes(id)) {
      setAssociatedJustificantes(associatedJustificantes.filter(j => j !== id));
    } else {
      setAssociatedJustificantes([...associatedJustificantes, id]);
    }
  };

  const resetForm = () => {
    setEditingExpense(null);
    setSelectedSessions([]);
    setOrigen('');
    setDestino('');
    setMedioTransporte('vehiculo_propio');
    setKmRecorridos(0);
    setHoraSalida('');
    setHoraLlegada('');
    setImporteParking(0);
    setImporteTaxi(0);
    setImporteGuagua(0);
    setImporteAlquiler(0);
    setImporteAlojamiento(0);
    setNotas('');
    setAssociatedJustificantes([]);
    setIsCustomRoute(false);
    setGeoError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSessions.length === 0) {
      alert('Por favor, asocie al menos una sesión de trabajo a este gasto.');
      return;
    }

    const expenseToSave: Expense = {
      id: editingExpense ? editingExpense.id : `exp_${Date.now()}`,
      sesionesAsociadas: selectedSessions,
      origen: origen.trim(),
      destino: destino.trim(),
      medioTransporte,
      kmRecorridos: Number(kmRecorridos),
      horaSalida,
      horaLlegada,
      importeParking: Number(importeParking),
      importeTaxi: Number(importeTaxi),
      importeGuagua: Number(importeGuagua),
      importeAlquiler: Number(importeAlquiler),
      importeAlojamiento: Number(importeAlojamiento),
      notas: notas.trim(),
      justificantesAsociados: associatedJustificantes,
    };

    onSave(expenseToSave);
    resetForm();
  };

  const getKmRate = () => {
    if (!profile) return 0.26; // Default to car
    return profile.vehiculoTipo === 'motocicleta' ? 0.106 : 0.26;
  };

  const calculateMileageValue = (km: number) => {
    return Number((km * getKmRate()).toFixed(2));
  };

  const getExpenseTotal = (exp: Expense) => {
    let total = 0;
    
    // Mileage
    if (exp.medioTransporte === 'vehiculo_propio') {
      const rate = profile?.vehiculoTipo === 'motocicleta' ? 0.106 : 0.26;
      total += exp.kmRecorridos * rate;
    }

    // Additional imports
    total += exp.importeParking;
    total += exp.importeTaxi;
    total += exp.importeGuagua;
    total += exp.importeAlquiler;
    total += exp.importeAlojamiento;

    // Flight/boat maintenance allowance
    if (exp.medioTransporte === 'avion' || exp.medioTransporte === 'barco') {
      try {
        const [hSalida, mSalida] = exp.horaSalida.split(':').map(Number);
        const [hLlegada, mLlegada] = exp.horaLlegada.split(':').map(Number);
        const minsSalidaEfectiva = hSalida * 60 + mSalida - 60; 
        const minsLlegadaEfectiva = hLlegada * 60 + mLlegada + 60;
        const horaLimiteAlmuerzo = 14 * 60;
        const horaLimiteCena = 22 * 60;

        if (minsSalidaEfectiva < horaLimiteAlmuerzo && minsLlegadaEfectiva > horaLimiteCena) {
          total += 39.00;
        } else if (minsSalidaEfectiva < horaLimiteAlmuerzo || minsLlegadaEfectiva > horaLimiteAlmuerzo) {
          total += 19.50;
        }
      } catch (e) {}
    }

    return Number(total.toFixed(2));
  };

  // Check if selected sessions contain any telematic session
  const hasTelematicSelected = selectedSessions.some(id => {
    const s = sessions.find(sess => sess.id === id);
    return s?.modalidad === 'telematica';
  });

  // Filter expenses by selected date range
  const filteredExpenses = expenses.filter(exp => {
    if (!startDate && !endDate) return true;

    const sessionDates = exp.sesionesAsociadas
      .map(sid => sessions.find(s => s.id === sid)?.fecha)
      .filter((d): d is string => !!d);

    if (sessionDates.length === 0) return false;

    return sessionDates.some(dateStr => {
      if (startDate && dateStr < startDate) return false;
      if (endDate && dateStr > endDate) return false;
      return true;
    });
  });

  const totalFilteredAmount = filteredExpenses.reduce((sum, exp) => sum + getExpenseTotal(exp), 0);

  return (
    <div className="space-y-6">
      {/* Componente de tablero con gráfico Recharts */}
      <ExpenseDashboard expenses={expenses} profile={profile} />

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="expenses-container">
      {/* Columna Formulario */}
      <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
        <div className="bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between">
          <h2 className="font-bold font-display tracking-tight text-base text-white">
            {editingExpense ? 'Modificar Dieta / Gasto' : 'Nuevo Registro de Dieta Diaria'}
          </h2>
          <FileText className="h-5 w-5 text-indigo-400" />
        </div>

        {!profile && (
          <div className="p-4 bg-amber-50 border-b border-amber-100 text-amber-800 text-xs flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600" />
            <div>
              <strong>¡Perfil no configurado!</strong> Para calcular correctamente el importe del kilometraje, complete primero sus datos en la pestaña de <strong>Perfil</strong>.
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* 1. Selección de Sesiones */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              1. Asociar Sesión/es de Trabajo <span className="text-rose-500">*</span>
            </label>
            {sessions.length === 0 ? (
              <p className="text-xs text-rose-500 bg-rose-50/50 p-2.5 rounded-lg border border-rose-100 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                No hay sesiones de trabajo guardadas. Vaya primero a "Mis Sesiones" para registrarlas.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1.5 border border-slate-200 rounded-lg bg-slate-50">
                {sessions.map((sess) => {
                  const isSelected = selectedSessions.includes(sess.id);
                  return (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => handleToggleSession(sess.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                      Sesión {sess.numero} ({sess.fecha.split('-').slice(1).reverse().join('/')})
                    </button>
                  );
                })}
              </div>
            )}
            {hasTelematicSelected && (
              <p className="text-[11px] text-amber-600 font-medium flex items-center gap-1 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Atención: Ha seleccionado una sesión telemática. Recuerde que el aplicativo oficial no autoriza indemnizaciones por viaje para días virtuales.
              </p>
            )}
          </div>

          {/* 2. Itinerario & Selector de Ruta */}
          <div className="space-y-3" id="itinerario-component-container">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Itinerario del Desplazamiento
              </span>
              <div className="flex bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomRoute(false);
                    if (!MUNICIPALITIES.some(m => m.name === origen)) setOrigen('');
                    if (!MUNICIPALITIES.some(m => m.name === destino)) setDestino('');
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    !isCustomRoute 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Calculadora Automática
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomRoute(true)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition cursor-pointer ${
                    isCustomRoute 
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Manual / Libre
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ORIGEN */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="input-exp-origen">
                    Municipio de Origen
                  </label>
                  {!isCustomRoute && (
                    <button
                      type="button"
                      onClick={handleGeolocateOrigin}
                      disabled={geoLoading}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1 transition disabled:opacity-50 cursor-pointer"
                      title="Obtener ubicación actual para autoseleccionar origen"
                    >
                      <Navigation className={`h-3 w-3 ${geoLoading ? 'animate-spin' : ''}`} />
                      {geoLoading ? 'Localizando...' : 'Usar mi ubicación'}
                    </button>
                  )}
                </div>

                {isCustomRoute ? (
                  <input
                    id="input-exp-origen"
                    type="text"
                    required
                    placeholder="Ej. Santa Cruz de Tenerife"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                  />
                ) : (
                  <select
                    id="input-exp-origen"
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    value={origen}
                    onChange={(e) => setOrigen(e.target.value)}
                  >
                    <option value="">-- Seleccionar Origen --</option>
                    {MUNICIPALITIES.map((m) => (
                      <option key={`origen-${m.name}`} value={m.name}>
                        {m.name} ({m.island})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* DESTINO */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="input-exp-destino">
                  Municipio de Destino
                </label>
                {isCustomRoute ? (
                  <input
                    id="input-exp-destino"
                    type="text"
                    required
                    placeholder="Ej. San Cristóbal de La Laguna"
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  />
                ) : (
                  <select
                    id="input-exp-destino"
                    required
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                    value={destino}
                    onChange={(e) => setDestino(e.target.value)}
                  >
                    <option value="">-- Seleccionar Destino --</option>
                    {MUNICIPALITIES.map((m) => (
                      <option key={`destino-${m.name}`} value={m.name}>
                        {m.name} ({m.island})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {geoError && (
              <p className="text-[10px] text-rose-500 font-semibold bg-rose-50 dark:bg-rose-950/20 p-2 rounded-lg border border-rose-100 dark:border-rose-900/30">
                {geoError}
              </p>
            )}

            {/* Route indicator and stats banner */}
            {!isCustomRoute && origen && destino && origen !== destino && (
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100/50 dark:border-indigo-900/30 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center shrink-0">
                    <Map className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Ruta Geocalculada
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {origen} ➔ {destino}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                    {kmRecorridos} km
                  </p>
                  <p className="text-[9px] text-slate-400 uppercase font-bold tracking-tight">
                    Tiempo est.: ~{Math.round(kmRecorridos * 1.2)} min
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 3. Medio de Transporte */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="select-exp-transporte">
                Medio de Transporte
              </label>
              <select
                id="select-exp-transporte"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                value={medioTransporte}
                onChange={(e) => setMedioTransporte(e.target.value as any)}
              >
                <option value="vehiculo_propio">Vehículo Propio</option>
                <option value="avion">Avión (Vuelo)</option>
                <option value="barco">Barco (Ferry)</option>
                <option value="guagua">Guagua (Autobús)</option>
                <option value="tranvia">Tranvía / Metro</option>
                <option value="taxi">Taxi</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            {/* Kilómetros recorridos (Solo visible para Vehículo Propio) */}
            {medioTransporte === 'vehiculo_propio' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1" htmlFor="input-exp-km">
                  Kilómetros de Ida y Vuelta
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <input
                    id="input-exp-km"
                    type="number"
                    min="0"
                    disabled={!isCustomRoute}
                    className={`w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 transition ${
                      !isCustomRoute 
                        ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed' 
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                    }`}
                    value={kmRecorridos}
                    onChange={(e) => setKmRecorridos(Number(e.target.value))}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <span className="text-xs text-slate-400 font-medium">km</span>
                  </div>
                </div>
                {!isCustomRoute && origen && destino ? (
                  <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-semibold flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> Kilómetros calculados de forma automática
                  </p>
                ) : (
                  kmRecorridos > 0 && (
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      Auto-cálculo: {kmRecorridos} km × {getKmRate()} €/km = <strong className="text-slate-900 dark:text-white">{calculateMileageValue(kmRecorridos)} €</strong>
                    </p>
                  )
                )}
              </div>
            )}
          </div>

          {/* 4. Tiempos de Viaje (Frecuente para Avión/Barco) */}
          {(medioTransporte === 'avion' || medioTransporte === 'barco') && (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                {medioTransporte === 'avion' ? <Plane className="h-4 w-4 text-sky-600" /> : <Ship className="h-4 w-4 text-blue-600" />}
                Horas Oficiales de Salida y Llegada (Crucial para Manutención)
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                La Consejería aplica una tolerancia/margen oficial (de 30 a 90 min) de tránsito antes del despegue y después del aterrizaje para evaluar si el viaje da derecho a indemnización por alimentación.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="input-exp-hora-salida">
                    Hora Salida Vuelo/Barco
                  </label>
                  <input
                    id="input-exp-hora-salida"
                    type="time"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                    value={horaSalida}
                    onChange={(e) => setHoraSalida(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1" htmlFor="input-exp-hora-llegada">
                    Hora Llegada (Retorno)
                  </label>
                  <input
                    id="input-exp-hora-llegada"
                    type="time"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                    value={horaLlegada}
                    onChange={(e) => setHoraLlegada(e.target.value)}
                  />
                </div>
              </div>

              {/* Ajuste de Margen de la Consejería */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1" htmlFor="select-exp-margen-salida">
                    Margen Aeropuerto/Puerto (Ida)
                  </label>
                  <select
                    id="select-exp-margen-salida"
                    className="w-full px-2 py-1 border border-slate-200 rounded-md text-[11px] bg-white focus:outline-none"
                    value={margenSalida}
                    onChange={(e) => setMargenSalida(Number(e.target.value))}
                  >
                    <option value="30">30 min (Puerto estándar)</option>
                    <option value="60">60 min (Ferry / Aeropuerto nacional)</option>
                    <option value="90">90 min (Control de seguridad estricto)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 mb-1" htmlFor="select-exp-margen-llegada">
                    Margen Tránsito (Vuelta)
                  </label>
                  <select
                    id="select-exp-margen-llegada"
                    className="w-full px-2 py-1 border border-slate-200 rounded-md text-[11px] bg-white focus:outline-none"
                    value={margenLlegada}
                    onChange={(e) => setMargenLlegada(Number(e.target.value))}
                  >
                    <option value="30">30 min (Estándar)</option>
                    <option value="60">60 min (Maletas/Desembarque)</option>
                    <option value="90">90 min (Conexiones largas)</option>
                  </select>
                </div>
              </div>

              {horaSalida && horaLlegada && (
                <div className="p-3 rounded-lg border flex items-center justify-between bg-white mt-2 border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Indemnización Manutención</span>
                    <p className="text-xs font-semibold text-slate-800">
                      {manutencionCalculada === 39.00 
                        ? 'Derecho a Manutención Completa (Almuerzo y Cena)' 
                        : manutencionCalculada === 19.50 
                          ? 'Derecho a Media Manutención (Almuerzo o Cena)' 
                          : 'Sin indemnización por manutención calculada'}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-lg text-sm font-extrabold font-mono ${
                    manutencionCalculada > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {manutencionCalculada.toFixed(2)} €
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 5. Importes Adicionales y Alojamiento */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-700">5. Gastos Adicionales Justificables</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="input-exp-parking">
                  Aparcamiento / Parking
                </label>
                <input
                  id="input-exp-parking"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none font-mono"
                  value={importeParking || ''}
                  onChange={(e) => setImporteParking(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="input-exp-taxi">
                  Gastos de Taxi
                </label>
                <input
                  id="input-exp-taxi"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none font-mono"
                  value={importeTaxi || ''}
                  onChange={(e) => setImporteTaxi(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="input-exp-guagua">
                  Guagua / Tranvía
                </label>
                <input
                  id="input-exp-guagua"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none font-mono"
                  value={importeGuagua || ''}
                  onChange={(e) => setImporteGuagua(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1" htmlFor="input-exp-alquiler">
                  Coche Alquiler (Rentacar)
                </label>
                <input
                  id="input-exp-alquiler"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none font-mono"
                  value={importeAlquiler || ''}
                  onChange={(e) => setImporteAlquiler(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Alojamiento */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-2 mt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700" htmlFor="input-exp-alojamiento">
                  Gasto de Alojamiento (Hotel o Apartamento)
                </label>
                <span className="text-[10px] text-indigo-700 font-bold uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                  Tope: 106,94 € / noche
                </span>
              </div>
              
              <div className="relative rounded-lg shadow-sm max-w-xs">
                <input
                  id="input-exp-alojamiento"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition font-mono"
                  value={importeAlojamiento || ''}
                  onChange={(e) => setImporteAlojamiento(Number(e.target.value))}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-xs text-slate-400 font-semibold">€</span>
                </div>
              </div>

              {importeAlojamiento > 106.94 && (
                <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs text-rose-800 flex items-start gap-1.5 mt-2 animate-pulse-subtle">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Tope de alojamiento superado:</strong> El importe registrado ({importeAlojamiento} €) excede el máximo oficial de <strong>106,94 €</strong> por noche. El aplicativo oficial de la Consejería recortará automáticamente el abono a dicho tope.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 6. Notas o Itinerarios */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="textarea-exp-notas">
              Notas e Incidencias (Opcional)
            </label>
            <textarea
              id="textarea-exp-notas"
              rows={2}
              placeholder="Ej. Sede del tribunal sufrió reubicación o retrasos en el ferry de regreso..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
            />
          </div>

          {/* 7. Asociar Justificantes */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              6. Vincular Tickets o Facturas Escaneadas
            </label>
            {justificantes.length === 0 ? (
              <p className="text-[11px] text-slate-400 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Aún no ha escaneado o subido ningún justificante en la pestaña "Escáner". Podrá vincularlos más tarde.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-lg bg-slate-50">
                {justificantes.map((just) => {
                  const isLinked = associatedJustificantes.includes(just.id);
                  return (
                    <button
                      key={just.id}
                      type="button"
                      onClick={() => handleToggleJustificante(just.id)}
                      className={`p-2 rounded-lg border flex items-center justify-between text-left transition cursor-pointer ${
                        isLinked
                          ? 'bg-indigo-950 border-indigo-800 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {just.fotoUrl ? (
                          <img src={just.fotoUrl} alt="" className="w-8 h-8 object-cover rounded border border-slate-200" referrerPolicy="no-referrer" />
                        ) : (
                          <ImageIcon className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold truncate">{just.titulo}</p>
                          <p className={`text-[10px] ${isLinked ? 'text-slate-300' : 'text-slate-400'}`}>{just.tipo}</p>
                        </div>
                      </div>
                      <div className={`p-1 rounded-full ${isLinked ? 'bg-indigo-800 text-emerald-400' : 'bg-slate-100 text-slate-400'}`}>
                        <Check className="h-3 w-3" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2 pt-3 border-t border-slate-100">
            {editingExpense && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 py-2.5 text-slate-600 border border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-medium transition cursor-pointer"
              >
                Cancelar Edición
              </button>
            )}
            <button
              type="submit"
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition shadow-md hover:shadow-lg active:scale-98 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              {editingExpense ? 'Guardar Cambios' : 'Registrar Gasto Diario'}
            </button>
          </div>
        </form>
      </div>

      {/* Columna Listado */}
      <div className="xl:col-span-5 space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                Historial de Dietas
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {startDate || endDate ? (
                  <>
                    Mostrando <strong className="text-indigo-600 font-bold">{filteredExpenses.length}</strong> de <strong className="text-slate-800 font-bold">{expenses.length}</strong> ({totalFilteredAmount.toFixed(2)} €)
                  </>
                ) : (
                  <>
                    Total declaradas: <strong className="text-slate-900 font-bold">{expenses.length}</strong> ({expenses.reduce((sum, e) => sum + getExpenseTotal(e), 0).toFixed(2)} €)
                  </>
                )}
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-slate-400" />
          </div>

          {expenses.length > 0 && (
            /* Filtro por Rango de Fechas */
            <div className="bg-slate-50/80 rounded-xl border border-slate-150 p-3.5 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-indigo-500" />
                  Filtrar por Rango / Período
                </span>
                {(startDate || endDate || quickFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuickFilter('all');
                      setStartDate('');
                      setEndDate('');
                    }}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                    Limpiar
                  </button>
                )}
              </div>

              {/* Selector rápido (mes, trimestre, etc.) */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'all', label: 'Todos' },
                  { id: 'month', label: 'Este mes' },
                  { id: 'last_month', label: 'Mes anterior' },
                  { id: 'quarter', label: 'Trimestre' },
                  { id: 'year', label: 'Este año' }
                ].map(preset => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setQuickFilter(preset.id)}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition border cursor-pointer ${
                      quickFilter === preset.id
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Rango de fechas manual */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider" htmlFor="filter-start-date">
                    Desde
                  </label>
                  <input
                    id="filter-start-date"
                    type="date"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    value={startDate}
                    onChange={(e) => {
                      setQuickFilter('custom');
                      setStartDate(e.target.value);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-wider" htmlFor="filter-end-date">
                    Hasta
                  </label>
                  <input
                    id="filter-end-date"
                    type="date"
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                    value={endDate}
                    onChange={(e) => {
                      setQuickFilter('custom');
                      setEndDate(e.target.value);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {expenses.length === 0 ? (
            <div className="text-center py-10 px-4">
              <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500 font-medium">No se han registrado dietas aún</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Rellene el formulario para agregar sus trayectos de desplazamiento, kilometrajes e importes de parkings u hoteles.
              </p>
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <CalendarDays className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-600 font-medium">Sin coincidencias para el rango de fechas</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                No hay ningún gasto registrado cuyas sesiones asociadas estén entre el {startDate.split('-').reverse().join('/')} y el {endDate.split('-').reverse().join('/')}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuickFilter('all');
                  setStartDate('');
                  setEndDate('');
                }}
                className="mt-4 px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-indigo-600 rounded-lg hover:bg-slate-50 shadow-xs cursor-pointer"
              >
                Restablecer Filtro de Fecha
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {filteredExpenses.map((exp) => {
                const associatedSessNums = exp.sesionesAsociadas
                  .map(sid => sessions.find(s => s.id === sid)?.numero)
                  .filter(Boolean)
                  .join(', ');

                return (
                  <div key={exp.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[10px] font-bold rounded">
                          Sesión {associatedSessNums || 'S/N'}
                        </span>
                        <h3 className="text-xs font-bold text-slate-900 mt-1.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-500" />
                          {exp.origen} ➔ {exp.destino}
                        </h3>
                        <p className="text-[11px] text-slate-500 capitalize mt-0.5">
                          Transporte: <strong className="text-slate-800">{exp.medioTransporte.replace('_', ' ')}</strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-extrabold font-mono text-slate-900">
                          {getExpenseTotal(exp).toFixed(2)} €
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Importe Estimado</p>
                      </div>
                    </div>

                    {/* Desglose compacto */}
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 pt-2 border-t border-slate-50 text-[11px] font-mono text-slate-500">
                      {exp.medioTransporte === 'vehiculo_propio' && exp.kmRecorridos > 0 && (
                        <div>🚗 KM: {exp.kmRecorridos} ({calculateMileageValue(exp.kmRecorridos)}€)</div>
                      )}
                      {exp.importeParking > 0 && <div>🅿️ Parking: {exp.importeParking.toFixed(2)}€</div>}
                      {exp.importeTaxi > 0 && <div>🚕 Taxi: {exp.importeTaxi.toFixed(2)}€</div>}
                      {exp.importeGuagua > 0 && <div>🚌 Guagua: {exp.importeGuagua.toFixed(2)}€</div>}
                      {exp.importeAlquiler > 0 && <div>🔑 Alquiler: {exp.importeAlquiler.toFixed(2)}€</div>}
                      {exp.importeAlojamiento > 0 && (
                        <div className={exp.importeAlojamiento > 106.94 ? 'text-amber-600 font-bold' : ''}>
                          🏨 Hotel: {exp.importeAlojamiento.toFixed(2)}€
                        </div>
                      )}
                      {(exp.medioTransporte === 'avion' || exp.medioTransporte === 'barco') && exp.horaSalida && (
                        <div className="text-emerald-700 font-semibold">⏰ Manutención incl.</div>
                      )}
                    </div>

                    {/* Justificantes vinculados */}
                    {exp.justificantesAsociados && exp.justificantesAsociados.length > 0 && (
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <span className="text-[10px] text-slate-400">Tickets vinculados:</span>
                        <div className="flex -space-x-1.5">
                          {exp.justificantesAsociados.map(jid => {
                            const just = justificantes.find(j => j.id === jid);
                            if (!just) return null;
                            return (
                              <div
                                key={jid}
                                title={`${just.titulo} (${just.tipo})`}
                                className="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-100 flex items-center justify-center shrink-0"
                              >
                                {just.fotoUrl ? (
                                  <img src={just.fotoUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <FileText className="w-3 h-3 text-slate-400" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Notas */}
                    {exp.notas && (
                      <p className="text-[10px] text-slate-400 italic bg-slate-50 p-1.5 rounded border border-slate-100">
                        "{exp.notas}"
                      </p>
                    )}

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-50">
                      <button
                        onClick={() => setEditingExpense(exp)}
                        className="p-1 px-2.5 text-slate-500 hover:text-slate-950 hover:bg-slate-100 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <Edit2 className="h-3 w-3" />
                        Editar
                      </button>
                      <button
                        onClick={() => onDelete(exp.id)}
                        className="p-1 px-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded text-[11px] font-semibold flex items-center gap-1 transition"
                      >
                        <Trash2 className="h-3 w-3" />
                        Eliminar
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
    </div>
  );
}
