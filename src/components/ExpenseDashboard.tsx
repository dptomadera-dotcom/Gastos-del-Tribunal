/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Expense, Profile } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Landmark, Car, Hotel, Receipt, HelpCircle 
} from 'lucide-react';

interface ExpenseDashboardProps {
  expenses: Expense[];
  profile: Profile | null;
}

export default function ExpenseDashboard({ expenses, profile }: ExpenseDashboardProps) {
  // Helper to calculate Mileage Rate
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

  // Group calculations
  let totalDietas = 0;
  let totalTransporte = 0;
  let totalAlojamiento = 0;

  expenses.forEach((exp) => {
    // Dietas / Manutenciones
    totalDietas += getExpenseManutencion(exp);

    // Alojamiento
    totalAlojamiento += exp.importeAlojamiento;

    // Transporte (combina kilometraje y otros medios o gastos de viaje directos)
    totalTransporte += getExpenseMileage(exp);
    totalTransporte += exp.importeParking;
    totalTransporte += exp.importeTaxi;
    totalTransporte += exp.importeGuagua;
    totalTransporte += exp.importeAlquiler;
  });

  const totalGeneral = totalDietas + totalTransporte + totalAlojamiento;

  // Chart data
  const data = [
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

  // Helper to get percentages safely
  const getPercentage = (value: number) => {
    if (totalGeneral === 0) return '0.0%';
    return `${((value / totalGeneral) * 100).toFixed(1)}%`;
  };

  // Custom tooltips matching system dark/light theme
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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 shadow-sm transition-all duration-200" id="expense-dashboard">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Tablero de Control: Resumen de Gastos Acumulados
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualización analítica en tiempo real de los gastos declarados por concepto indemnizatorio.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/30 px-3 py-1.5 rounded-xl">
          <Landmark className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Acumulado:</span>
          <span className="text-sm font-black font-mono text-indigo-600 dark:text-indigo-400 ml-1">
            {totalGeneral.toFixed(2)} €
          </span>
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
          <TrendingUp className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3 animate-pulse" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">El gráfico se generará al registrar gastos</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
            Utilice el formulario inferior para registrar dietas de viajes o kilometrajes. Los datos se agruparán automáticamente en este gráfico de barras.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Recharts Bar Chart */}
          <div className="lg:col-span-7 h-64 md:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:opacity-10" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 500 }}
                  axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace' }}
                  axisLine={{ stroke: '#cbd5e1', opacity: 0.3 }}
                  tickLine={false}
                  unit="€"
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }} />
                <Bar 
                  dataKey="Importe (€)" 
                  radius={[8, 8, 0, 0]} 
                  maxBarSize={60}
                  animationDuration={800}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Categorized Side Info */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Desglose por Categoría</h3>
            <div className="space-y-3">
              {data.map((item) => {
                const Icon = item.icon;
                return (
                  <div 
                    key={item.name} 
                    className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900 transition flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                      >
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          Porcentaje del total
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold font-mono text-slate-900 dark:text-slate-100 block">
                        {item['Importe (€)'].toFixed(2)} €
                      </span>
                      <span className="text-[10px] font-extrabold font-mono text-slate-500" style={{ color: item.color }}>
                        {getPercentage(item['Importe (€)'])}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
