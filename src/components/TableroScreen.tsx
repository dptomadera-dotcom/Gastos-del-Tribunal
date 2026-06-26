/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Profile, Session, Expense, Justificante } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Landmark, Calendar, Car, Camera, ArrowRight,
  ShieldAlert, CheckCircle2, User, HelpCircle, Receipt, Hotel, AlertTriangle
} from 'lucide-react';

interface TableroScreenProps {
  profile: Profile | null;
  sessions: Session[];
  expenses: Expense[];
  justificantes: Justificante[];
  onNavigate: (tab: 'perfil' | 'sesiones' | 'gastos' | 'escanner' | 'exportar') => void;
}

export default function TableroScreen({
  profile,
  sessions,
  expenses,
  justificantes,
  onNavigate
}: TableroScreenProps) {

  // Mileage rate calculation
  const getKmRate = () => {
    if (!profile) return 0.26;
    return profile.vehiculoTipo === 'motocicleta' ? 0.106 : 0.26;
  };

  const getExpenseMileage = (exp: Expense) => {
    if (exp.medioTransporte !== 'vehiculo_propio') return 0;
    return exp.kmRecorridos * getKmRate();
  };

  const getExpenseManutencion = (exp: Expense) => {
    if (exp.medioTransporte !== 'avion' && exp.medioTransporte !== 'barco') return 0;
    try {
      const [hSalida, mSalida] = exp.horaSalida.split(':').map(Number);
      const [hLlegada, mLlegada] = exp.horaLlegada.split(':').map(Number);
      const minsSalidaEfectiva = hSalida * 60 + mSalida - 60; 
      const minsLlegadaEfectiva = hLlegada * 60 + mLlegada + 60;
      const horaLimiteAlmuerzo = 14 * 60;
      const horaLimiteCena = 22 * 60;

      if (minsSalidaEfectiva < horaLimiteAlmuerzo && minsLlegadaEfectiva > horaLimiteCena) {
        return 39.00;
      } else if (minsSalidaEfectiva < horaLimiteAlmuerzo || minsLlegadaEfectiva > horaLimiteAlmuerzo) {
        return 19.50;
      }
    } catch (e) {}
    return 0;
  };

  const getExpenseTotal = (exp: Expense) => {
    let total = 0;
    total += getExpenseMileage(exp);
    total += exp.importeParking;
    total += exp.importeTaxi;
    total += exp.importeGuagua;
    total += exp.importeAlquiler;
    total += exp.importeAlojamiento;
    total += getExpenseManutencion(exp);
    return total;
  };

  // Group calculations
  let totalDietas = 0;
  let totalTransporte = 0;
  let totalAlojamiento = 0;
  let totalKm = 0;

  expenses.forEach((exp) => {
    totalDietas += getExpenseManutencion(exp);
    totalAlojamiento += exp.importeAlojamiento;
    
    // Transporte costs
    totalTransporte += getExpenseMileage(exp);
    totalTransporte += exp.importeParking;
    totalTransporte += exp.importeTaxi;
    totalTransporte += exp.importeGuagua;
    totalTransporte += exp.importeAlquiler;

    if (exp.medioTransporte === 'vehiculo_propio') {
      totalKm += exp.kmRecorridos;
    }
  });

  const totalGeneral = totalDietas + totalTransporte + totalAlojamiento;

  // Chart data
  const chartData = [
    {
      name: 'Dietas',
      'Importe (€)': Number(totalDietas.toFixed(2)),
      color: '#6366f1', // Indigo
      icon: Receipt,
    },
    {
      name: 'Transporte',
      'Importe (€)': Number(totalTransporte.toFixed(2)),
      color: '#f59e0b', // Amber
      icon: Car,
    },
    {
      name: 'Alojamiento',
      'Importe (€)': Number(totalAlojamiento.toFixed(2)),
      color: '#10b981', // Emerald
      icon: Hotel,
    },
  ];

  const getPercentage = (value: number) => {
    if (totalGeneral === 0) return '0.0%';
    return `${((value / totalGeneral) * 100).toFixed(1)}%`;
  };

  // Custom tooltips matching system theme
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0];
      return (
        <div className="bg-slate-900 text-white dark:bg-slate-950 px-3 py-2.5 rounded-lg border border-slate-800 text-xs shadow-xl font-sans">
          <p className="font-bold text-slate-200">{dataPoint.name}</p>
          <p className="font-mono text-sm font-extrabold text-indigo-400 mt-1">
            {dataPoint.value.toFixed(2)} €
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Porcentaje: {getPercentage(dataPoint.value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Missing elements notifications
  const hasProfile = !!(profile && profile.dni);
  const hasSessions = sessions.length > 0;
  const hasExpenses = expenses.length > 0;

  return (
    <div className="space-y-6" id="tablero-screen-container">
      {/* Welcome Hero Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl border border-slate-800 p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15),transparent_40%)]" />
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-indigo-500/30 uppercase tracking-widest">
              TRIBUNAL 2026
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold px-2.5 py-1 rounded-md border border-emerald-500/30 uppercase tracking-widest">
              BASE LOCAL CIFRADA
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
            {hasProfile 
              ? `¡Hola de nuevo, ${profile?.nombre}!` 
              : '¡Bienvenido a su Tablero de Control de Gastos!'
            }
          </h1>
          <p className="text-xs text-slate-300 max-w-xl font-medium">
            Gestione las dietas de alojamiento, manutención y kilometraje para la justificación de su tribunal de oposición.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => onNavigate('exportar')}
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition duration-150 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Landmark className="h-4 w-4" />
            Preparar Liquidación
          </button>
        </div>
      </div>

      {/* Main Stats Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total General */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs flex items-center gap-4 transition duration-200">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Landmark className="h-5.5 w-5.5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
              Total Acumulado
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white block">
              {totalGeneral.toFixed(2)} €
            </span>
            <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 block">
              Estimación de abono
            </span>
          </div>
        </div>

        {/* Sessions Count */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs flex items-center gap-4 transition duration-200">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Calendar className="h-5.5 w-5.5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
              Sesiones de Trabajo
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white block">
              {sessions.length}
            </span>
            <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 block">
              {sessions.filter(s => s.modalidad === 'presencial').length} presenciales
            </span>
          </div>
        </div>

        {/* Total Kilómetros */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs flex items-center gap-4 transition duration-200">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Car className="h-5.5 w-5.5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
              Distancia de Viaje
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white block">
              {totalKm.toFixed(1)} km
            </span>
            <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 block">
              Vehículo: {profile?.vehiculoTipo || 'No config.'}
            </span>
          </div>
        </div>

        {/* Justificantes Count */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-xs flex items-center gap-4 transition duration-200">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-2xs">
            <Camera className="h-5.5 w-5.5" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block tracking-wider">
              Comprobantes Digitales
            </span>
            <span className="text-lg font-black font-mono text-slate-900 dark:text-white block">
              {justificantes.length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
              {justificantes.filter(j => j.gastoId).length} vinculados
            </span>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recharts Bar Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-850 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  Gráfico de Gastos por Categoría
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Análisis comparativo de indemnizaciones acumuladas por conceptos de Dietas, Transporte y Alojamiento.
                </p>
              </div>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-850 rounded-2xl bg-slate-50/50 dark:bg-slate-900/10 my-4">
                <TrendingUp className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-4 animate-pulse" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Aún no hay gastos registrados</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Registre sus desplazamientos y dietas en la pestaña de <strong className="text-indigo-600 dark:text-indigo-400">Registro de Dieta</strong> para autogenerar este gráfico interactivo.
                </p>
                <button
                  onClick={() => onNavigate('gastos')}
                  className="mt-5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-bold py-2 px-4 rounded-xl transition cursor-pointer flex items-center gap-1 mx-auto"
                >
                  Ir a Registrar Dietas
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="h-72 w-full my-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                      axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                      tickLine={false}
                      unit="€"
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.03)' }} />
                    <Bar 
                      dataKey="Importe (€)" 
                      radius={[8, 8, 0, 0]} 
                      maxBarSize={60}
                      animationDuration={800}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {expenses.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex flex-wrap gap-4 items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">Actualizado en tiempo real con la base de datos local IndexedDB</span>
              <button
                onClick={() => onNavigate('gastos')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                Gestionar gastos
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Breakdown & System Status */}
        <div className="lg:col-span-4 space-y-6">
          {/* Breakdown Stats Card */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Desglose Económico
            </h3>
            
            <div className="space-y-3.5">
              {chartData.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${item.color}15`, color: item.color }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">
                          {item['Importe (€)'].toFixed(2)} €
                        </span>
                        <span className="text-[10px] font-extrabold font-mono ml-2" style={{ color: item.color }}>
                          {getPercentage(item['Importe (€)'])}
                        </span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="h-1.5 bg-slate-50 dark:bg-slate-850 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: totalGeneral > 0 ? `${(item['Importe (€)'] / totalGeneral) * 100}%` : '0%',
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Liquidación:</span>
              <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                {totalGeneral.toFixed(2)} €
              </span>
            </div>
          </div>

          {/* Action Center & Warnings */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Estado de la Declaración
            </h3>

            <div className="space-y-3">
              {/* Profile Configured status */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 text-xs">
                {hasProfile ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">Perfil Configurado</p>
                      <p className="text-[10px] text-slate-400">Datos personales y vehículo guardados de forma correcta.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <p className="font-bold text-slate-700 dark:text-slate-300">Perfil Incompleto</p>
                      <p className="text-[10px] text-slate-400">Necesita rellenar su DNI y datos de comisionado.</p>
                      <button
                        onClick={() => onNavigate('perfil')}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5 flex items-center gap-0.5 cursor-pointer"
                      >
                        Completar Perfil
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Sessions status */}
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 text-xs">
                {hasSessions ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-slate-700 dark:text-slate-300">Sesiones Registradas</p>
                      <p className="text-[10px] text-slate-400">Tiene {sessions.length} sesiones de trabajo agendadas en su calendario.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-grow">
                      <p className="font-bold text-slate-700 dark:text-slate-300">Sin Sesiones</p>
                      <p className="text-[10px] text-slate-400">Debe registrar sesiones de tribunal para poder asociarles gastos.</p>
                      <button
                        onClick={() => onNavigate('sesiones')}
                        className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5 flex items-center gap-0.5 cursor-pointer"
                      >
                        Añadir Sesiones
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Expenses checklist */}
              {hasSessions && !hasExpenses && (
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850 text-xs">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div className="flex-grow">
                    <p className="font-bold text-slate-700 dark:text-slate-300">Sin Dieta Declarada</p>
                    <p className="text-[10px] text-slate-400">Registre un desplazamiento o dieta para sus sesiones registradas.</p>
                    <button
                      onClick={() => onNavigate('gastos')}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5 flex items-center gap-0.5 cursor-pointer"
                    >
                      Añadir Dietas de Viaje
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
