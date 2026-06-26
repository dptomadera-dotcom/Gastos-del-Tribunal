/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, Calendar, FileText, Camera, ArrowRight, X, 
  CheckCircle2, Sparkles, HelpCircle, Info, Landmark
} from 'lucide-react';
import { Profile, Session, Expense, Justificante } from '../types';

interface QuickStartGuideProps {
  profile: Profile | null;
  sessions: Session[];
  expenses: Expense[];
  justificantes: Justificante[];
  activeTab: string;
  onNavigate: (tab: 'perfil' | 'sesiones' | 'gastos' | 'escanner' | 'exportar') => void;
}

export default function QuickStartGuide({
  profile,
  sessions,
  expenses,
  justificantes,
  activeTab,
  onNavigate
}: QuickStartGuideProps) {
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('hide_quick_start_guide');
    return saved !== 'true';
  });

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem('hide_quick_start_guide', 'true');
  };

  const handleShow = () => {
    setIsOpen(true);
    localStorage.setItem('hide_quick_start_guide', 'false');
  };

  // Determine current recommended step
  let currentStep = 1;
  let progressPercentage = 0;

  const hasProfile = !!(profile && profile.dni);
  const hasSessions = sessions.length > 0;
  const hasExpenses = expenses.length > 0;
  const hasJustificantes = justificantes.length > 0;

  if (!hasProfile) {
    currentStep = 1;
    progressPercentage = 10;
  } else if (!hasSessions) {
    currentStep = 2;
    progressPercentage = 40;
  } else if (!hasExpenses) {
    currentStep = 3;
    progressPercentage = 70;
  } else if (!hasJustificantes) {
    currentStep = 4;
    progressPercentage = 90;
  } else {
    currentStep = 5; // All done
    progressPercentage = 100;
  }

  const steps = [
    {
      num: 1,
      id: 'perfil' as const,
      title: 'Configurar Perfil',
      desc: 'Introduce tus datos personales, cuerpo, tipo de vehículo y de residencia.',
      icon: User,
      done: hasProfile,
      badge: 'Paso 1'
    },
    {
      num: 2,
      id: 'sesiones' as const,
      title: 'Registrar Sesiones',
      desc: 'Configura el calendario de sesiones presenciales o telemáticas del tribunal.',
      icon: Calendar,
      done: hasSessions,
      badge: 'Paso 2'
    },
    {
      num: 3,
      id: 'gastos' as const,
      title: 'Declarar Gastos',
      desc: 'Asocia desplazamientos (ida/vuelta) y dietas a tus sesiones registradas.',
      icon: FileText,
      done: hasExpenses,
      badge: 'Paso 3'
    },
    {
      num: 4,
      id: 'escanner' as const,
      title: 'Justificantes',
      desc: 'Adjunta y asocia tickets, facturas de parking, taxis o peajes a los gastos.',
      icon: Camera,
      done: hasJustificantes,
      badge: 'Paso 4'
    }
  ];

  if (!isOpen) {
    return (
      <div className="flex justify-end mb-4" id="quick-start-minimized">
        <button
          onClick={handleShow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-900/30 rounded-xl transition cursor-pointer shadow-xs"
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Mostrar Guía de Inicio Rápido
        </button>
      </div>
    );
  }

  return (
    <div 
      className="bg-gradient-to-br from-indigo-50/70 via-white to-slate-50/50 dark:from-slate-900 dark:via-slate-900/95 dark:to-slate-950 rounded-2xl border border-indigo-100 dark:border-slate-800 p-5 shadow-sm mb-6 transition-all duration-300 relative overflow-hidden"
      id="quick-start-guide"
    >
      {/* Decorative gradient corner */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-200/10 dark:bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Guía de Inicio: Circuito de Liquidación de Gastos
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Siga estos 4 sencillos pasos recomendados para preparar la declaración oficial de indemnizaciones sin errores de cálculo.
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer"
          title="Ocultar guía temporalmente"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mb-5 bg-slate-100 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
        <div 
          className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step) => {
          const StepIcon = step.icon;
          const isActive = currentStep === step.num;
          const isDone = step.done;

          return (
            <div
              key={step.num}
              onClick={() => onNavigate(step.id)}
              className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative flex flex-col justify-between group ${
                isActive
                  ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-md ring-2 ring-indigo-500/10 dark:ring-indigo-500/5 translate-y-[-2px]'
                  : isDone
                  ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-100 dark:border-emerald-900/30 opacity-80 hover:opacity-100 hover:border-emerald-200 dark:hover:border-emerald-800'
                  : 'bg-white/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
              }`}
            >
              {/* Badge indicating step number or done check */}
              <div className="flex items-center justify-between mb-3">
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isActive 
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400' 
                    : isDone
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {step.badge}
                </span>

                {isDone ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : isActive ? (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                ) : null}
              </div>

              {/* Title & Description */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <StepIcon className={`h-4 w-4 ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400' 
                      : isDone 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-slate-400 dark:text-slate-500'
                  }`} />
                  <span className={`text-xs font-extrabold ${
                    isActive 
                      ? 'text-indigo-900 dark:text-white' 
                      : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {step.title}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                  {step.desc}
                </p>
              </div>

              {/* Step indicator arrow */}
              <div className="mt-4 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
                <span className={
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : isDone 
                    ? 'text-emerald-600 dark:text-emerald-400' 
                    : 'text-slate-400 dark:text-slate-500'
                }>
                  {isActive ? 'Comenzar ahora' : isDone ? 'Completado' : 'Pendiente'}
                </span>
                <ArrowRight className={`h-3 w-3 transition transform group-hover:translate-x-1 ${
                  isActive 
                    ? 'text-indigo-600 dark:text-indigo-400' 
                    : 'text-slate-400 dark:text-slate-500'
                }`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion congratulations banner if everything completed */}
      {currentStep === 5 && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                ¡Enhorabuena! Has completado el circuito recomendado de liquidación de gastos.
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Todos tus pasos principales de configuración, agenda de sesiones, registro de gastos y comprobantes están listos.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('exportar')}
            className="self-start sm:self-center bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-500 dark:hover:bg-emerald-400 text-xs font-bold py-1.5 px-3.5 rounded-lg transition shrink-0 cursor-pointer shadow-sm flex items-center gap-1"
          >
            <Landmark className="h-3.5 w-3.5" />
            Ir a Generar Liquidación
          </button>
        </div>
      )}
    </div>
  );
}
