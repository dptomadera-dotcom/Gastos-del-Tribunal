/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  getProfile, saveProfile, 
  getSessions, saveSession, deleteSession, 
  getExpenses, saveExpense, deleteExpense, 
  getJustificantes, saveJustificante, deleteJustificante 
} from './db';
import { Profile, Session, Expense, Justificante } from './types';

// Components
import ProfileScreen from './components/ProfileScreen';
import SessionsScreen from './components/SessionsScreen';
import ExpensesScreen from './components/ExpensesScreen';
import ScannerScreen from './components/ScannerScreen';
import ExportScreen from './components/ExportScreen';
import QuickStartGuide from './components/QuickStartGuide';
import TableroScreen from './components/TableroScreen';

// Icons
import { 
  User, Calendar, FileText, Camera, Download, 
  Scale, ShieldCheck, Landmark, CheckCircle2,
  Sun, Moon, LayoutDashboard, ChevronLeft, ChevronRight, Menu, HelpCircle
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tablero' | 'perfil' | 'sesiones' | 'gastos' | 'escanner' | 'exportar'>('tablero');

  // Sidebar collapse state
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    return saved === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem('sidebar_collapsed', String(newVal));
      return newVal;
    });
  };

  // PWA Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState<boolean>(false);

  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  };

  useEffect(() => {
    // Detect if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    setIsInstalled(isStandalone);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIOS()) {
      setShowIOSInstructions(true);
    }
  };

  // Dark mode state with automatic recovery from localStorage or system prefers
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Application database states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [justificantes, setJustificantes] = useState<Justificante[]>([]);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Load all initial data from IndexedDB
  useEffect(() => {
    async function loadData() {
      try {
        const [profData, sessData, expData, justData] = await Promise.all([
          getProfile(),
          getSessions(),
          getExpenses(),
          getJustificantes(),
        ]);
        setProfile(profData);
        setSessions(sessData);
        setExpenses(expData);
        setJustificantes(justData);

        // If profile is already configured, go to tablero as default
        if (profData && profData.dni) {
          setActiveTab('tablero');
        } else {
          setActiveTab('perfil');
        }
      } catch (err) {
        console.error('Error loading data from IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // PROFILE Handlers
  const handleSaveProfile = async (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    await saveProfile(updatedProfile);
  };

  // SESSIONS Handlers
  const handleSaveSession = async (session: Session) => {
    const updatedSessions = sessions.some((s) => s.id === session.id)
      ? sessions.map((s) => (s.id === session.id ? session : s))
      : [...sessions, session];
    
    setSessions(updatedSessions);
    await saveSession(session);
  };

  const handleDeleteSession = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar esta sesión de trabajo?')) {
      setSessions(sessions.filter((s) => s.id !== id));
      await deleteSession(id);

      // Clean up references in expenses
      const updatedExpenses = expenses.map((exp) => {
        if (exp.sesionesAsociadas.includes(id)) {
          return {
            ...exp,
            sesionesAsociadas: exp.sesionesAsociadas.filter((sid) => sid !== id),
          };
        }
        return exp;
      });

      // Filter out expenses with no sessions left
      for (const exp of updatedExpenses) {
        if (exp.sesionesAsociadas.length === 0) {
          await deleteExpense(exp.id);
        } else {
          await saveExpense(exp);
        }
      }
      setExpenses(updatedExpenses.filter((exp) => exp.sesionesAsociadas.length > 0));
    }
  };

  // EXPENSES Handlers
  const handleSaveExpense = async (expense: Expense) => {
    const updatedExpenses = expenses.some((e) => e.id === expense.id)
      ? expenses.map((e) => (e.id === expense.id ? expense : e))
      : [...expenses, expense];

    setExpenses(updatedExpenses);
    await saveExpense(expense);
  };

  const handleDeleteExpense = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar este registro de dieta?')) {
      setExpenses(expenses.filter((e) => e.id !== id));
      await deleteExpense(id);

      // Remove from justificantes
      const updatedJusts = justificantes.map((just) => {
        if (just.gastoId === id) {
          return { ...just, gastoId: undefined };
        }
        return just;
      });
      setJustificantes(updatedJusts);
      for (const just of updatedJusts) {
        await saveJustificante(just);
      }
    }
  };

  // JUSTIFICANTES Handlers
  const handleSaveJustificante = async (just: Justificante) => {
    const updatedJusts = [...justificantes, just];
    setJustificantes(updatedJusts);
    await saveJustificante(just);
  };

  const handleDeleteJustificante = async (id: string) => {
    if (confirm('¿Desea eliminar este justificante de su cartera?')) {
      setJustificantes(justificantes.filter((j) => j.id !== id));
      await deleteJustificante(id);

      // Remove association in expenses
      const updatedExpenses = expenses.map((exp) => {
        if (exp.justificantesAsociados?.includes(id)) {
          return {
            ...exp,
            justificantesAsociados: exp.justificantesAsociados.filter((jid) => jid !== id),
          };
        }
        return exp;
      });
      setExpenses(updatedExpenses);
      for (const exp of updatedExpenses) {
        await saveExpense(exp);
      }
    }
  };

  const handleAssociateWithExpense = async (justId: string, expenseId: string | undefined) => {
    // 1. Update justificante model
    const updatedJusts = justificantes.map((j) => {
      if (j.id === justId) {
        return { ...j, gastoId: expenseId };
      }
      return j;
    });
    setJustificantes(updatedJusts);
    
    const targetJust = updatedJusts.find((j) => j.id === justId);
    if (targetJust) {
      await saveJustificante(targetJust);
    }

    // 2. Clean previous expense links
    let updatedExpenses = expenses.map((exp) => {
      if (exp.justificantesAsociados?.includes(justId) && exp.id !== expenseId) {
        return {
          ...exp,
          justificantesAsociados: exp.justificantesAsociados.filter((id) => id !== justId),
        };
      }
      return exp;
    });

    // 3. Add to new expense link
    if (expenseId) {
      updatedExpenses = updatedExpenses.map((exp) => {
        if (exp.id === expenseId) {
          const list = exp.justificantesAsociados || [];
          if (!list.includes(justId)) {
            return { ...exp, justificantesAsociados: [...list, justId] };
          }
        }
        return exp;
      });
    }

    setExpenses(updatedExpenses);
    for (const exp of updatedExpenses) {
      await saveExpense(exp);
    }
  };

  // Calculated stats for header counters
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

  const totalCalculatedAcumulado = expenses.reduce((acc, exp) => acc + getExpenseTotal(exp), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Landmark className="h-12 w-12 text-slate-800 dark:text-slate-200 animate-pulse mx-auto" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cargando base de datos local...</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Mis Gastos Tribunal 2026 está preparando su entorno personal seguro.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden antialiased transition-colors duration-200 print:h-auto print:overflow-visible">
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-slate-900 text-white flex flex-col shrink-0 transition-all duration-300 ease-in-out print:hidden`}>
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-6'} flex-grow flex flex-col overflow-y-auto`}>
          {/* Logo / Title */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'} mb-8`}>
            <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shrink-0">
              <Scale className="h-5.5 w-5.5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xs font-black leading-tight uppercase tracking-wider text-white">
                  Mis Gastos
                </h1>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mt-0.5">
                  Tribunal 2026
                </p>
              </div>
            )}
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1">
            <button
              id="tab-tablero"
              onClick={() => setActiveTab('tablero')}
              title={isSidebarCollapsed ? 'Tablero de Control' : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'tablero'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5 shrink-0" />
              {!isSidebarCollapsed && <span>Tablero de Control</span>}
            </button>

            <button
              id="tab-perfil"
              onClick={() => setActiveTab('perfil')}
              title={isSidebarCollapsed ? 'Perfil de Vocal' : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'perfil'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <User className="h-4.5 w-4.5 shrink-0" />
              {!isSidebarCollapsed && <span>Perfil de Vocal</span>}
            </button>

            <button
              id="tab-sesiones"
              onClick={() => setActiveTab('sesiones')}
              title={isSidebarCollapsed ? `Mis Sesiones (${sessions.length})` : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'sesiones'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Calendar className="h-4.5 w-4.5 shrink-0" />
              {!isSidebarCollapsed && <span className="flex-grow text-left">Mis Sesiones</span>}
              {!isSidebarCollapsed && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'sesiones' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {sessions.length}
                </span>
              )}
            </button>

            <button
              id="tab-gastos"
              onClick={() => setActiveTab('gastos')}
              title={isSidebarCollapsed ? `Registro de Dieta (${expenses.length})` : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'gastos'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="h-4.5 w-4.5 shrink-0" />
              {!isSidebarCollapsed && <span className="flex-grow text-left">Registro de Dieta</span>}
              {!isSidebarCollapsed && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'gastos' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {expenses.length}
                </span>
              )}
            </button>

            <button
              id="tab-escanner"
              onClick={() => setActiveTab('escanner')}
              title={isSidebarCollapsed ? `Justificantes (${justificantes.length})` : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                activeTab === 'escanner'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Camera className="h-4.5 w-4.5 shrink-0" />
              {!isSidebarCollapsed && <span className="flex-grow text-left">Justificantes</span>}
              {!isSidebarCollapsed && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  activeTab === 'escanner' ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {justificantes.length}
                </span>
              )}
            </button>

            <a
              href="/Gastos-del-Tribunal/Manual_Usuario_Gastos_Tribunal.pdf"
              target="_blank"
              rel="noopener noreferrer"
              title={isSidebarCollapsed ? 'Manual de Usuario (PDF)' : undefined}
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3'} text-sm font-medium rounded-lg transition-colors text-slate-400 hover:bg-slate-800 hover:text-white`}
            >
              <HelpCircle className="h-4.5 w-4.5 shrink-0 text-slate-400" />
              {!isSidebarCollapsed && <span className="flex-grow text-left">Manual Usuario</span>}
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-indigo-400">
                  PDF
                </span>
              )}
            </a>
          </nav>
        </div>

        {/* Sidebar Footer with primary action */}
        <div className={`${isSidebarCollapsed ? 'p-3' : 'p-6'} border-t border-slate-800 bg-slate-950/40 shrink-0 space-y-2`}>
          {/* Botón de Instalación PWA (oculto si ya está instalada) */}
          {!isInstalled && (deferredPrompt || isIOS()) && (
            <button
              onClick={handleInstallClick}
              title={isSidebarCollapsed ? 'Instalar aplicación en el móvil' : undefined}
              className="w-full font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            >
              <span>📲</span>
              {!isSidebarCollapsed && <span>Instalar App Móvil</span>}
            </button>
          )}

          <button
            onClick={() => setActiveTab('exportar')}
            title={isSidebarCollapsed ? 'Exportar a Secretaría' : undefined}
            className={`w-full font-semibold ${isSidebarCollapsed ? 'py-3 px-0' : 'py-3 px-4'} rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg cursor-pointer ${
              activeTab === 'exportar'
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <span>📤</span>
            {!isSidebarCollapsed && <span>Exportar a Secretaría</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col h-full overflow-hidden print:h-auto print:overflow-visible">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between shrink-0 transition-colors duration-200 print:hidden">
          <div className="flex items-center gap-3">
            {/* Botón para contraer/expandir menú */}
            <button
              onClick={toggleSidebar}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer focus:outline-none shrink-0"
              title={isSidebarCollapsed ? 'Expandir menú' : 'Contraer menú'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="h-5 w-5" />
              ) : (
                <ChevronLeft className="h-5 w-5" />
              )}
            </button>

            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/40 rounded uppercase shrink-0">
              {profile?.cargo ? profile.cargo.toUpperCase().replace('_', ' ') : 'Vocal Titular'}
            </span>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate hidden md:inline-block">
              {activeTab === 'tablero' && 'Tablero de Control / Análisis de Gastos'}
              {activeTab === 'perfil' && 'Perfil del Comisionado'}
              {activeTab === 'sesiones' && 'Gestión de Sesiones de Trabajo'}
              {activeTab === 'gastos' && 'Nueva Liquidación de Gasto / Registro de Dietas'}
              {activeTab === 'escanner' && 'Escáner y Cartera de Justificantes'}
              {activeTab === 'exportar' && 'Preparar Expediente de Liquidación'}
            </h2>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 truncate md:hidden">
              {activeTab === 'tablero' && 'Tablero'}
              {activeTab === 'perfil' && 'Perfil'}
              {activeTab === 'sesiones' && 'Sesiones'}
              {activeTab === 'gastos' && 'Gastos'}
              {activeTab === 'escanner' && 'Escáner'}
              {activeTab === 'exportar' && 'Exportar'}
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
              <span className="text-slate-400 dark:text-slate-500 font-medium">DNI:</span>
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{profile?.dni || 'Sin configurar'}</span>
            </div>
            {profile?.vehiculoMatricula && (
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1.5 rounded-lg transition-colors">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Vehículo:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300">{profile.vehiculoMarca} {profile.vehiculoModelo} ({profile.vehiculoMatricula})</span>
              </div>
            )}
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-3 py-1.5 rounded-lg transition-colors">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Estimado</span>
              <span className="font-mono text-sm">{totalCalculatedAcumulado.toFixed(2)} €</span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
            
            {/* Theme Selector Toggle Button */}
            <button
              id="theme-toggle"
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-medium shadow-sm hover:shadow"
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="h-4 w-4 text-amber-500 animate-pulse-subtle" />
                  <span className="hidden sm:inline text-[11px] text-slate-300">Modo Claro</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 text-indigo-600" />
                  <span className="hidden sm:inline text-[11px] text-slate-600">Modo Oscuro</span>
                </>
              )}
            </button>
          </div>
        </header>
 
        {/* Content Box */}
        <div className="flex-1 p-8 overflow-y-auto bg-slate-50/70 dark:bg-slate-950/40 transition-colors duration-200 print:p-0 print:bg-white print:overflow-visible">
          <div className="print:hidden">
            <QuickStartGuide 
              profile={profile} 
              sessions={sessions} 
              expenses={expenses} 
              justificantes={justificantes} 
              activeTab={activeTab} 
              onNavigate={(tab) => setActiveTab(tab)} 
            />
          </div>

          {activeTab === 'tablero' && (
            <TableroScreen
              profile={profile}
              sessions={sessions}
              expenses={expenses}
              justificantes={justificantes}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}
          {activeTab === 'perfil' && (
            <ProfileScreen initialProfile={profile} onSave={handleSaveProfile} />
          )}
          {activeTab === 'sesiones' && (
            <SessionsScreen 
              sessions={sessions} 
              onSave={handleSaveSession} 
              onDelete={handleDeleteSession} 
            />
          )}
          {activeTab === 'gastos' && (
            <ExpensesScreen 
              expenses={expenses} 
              sessions={sessions} 
              profile={profile}
              justificantes={justificantes}
              onSave={handleSaveExpense} 
              onDelete={handleDeleteExpense} 
            />
          )}
          {activeTab === 'escanner' && (
            <ScannerScreen 
              justificantes={justificantes} 
              expenses={expenses}
              onSaveJustificante={handleSaveJustificante} 
              onDeleteJustificante={handleDeleteJustificante}
              onAssociateWithExpense={handleAssociateWithExpense}
            />
          )}
          {activeTab === 'exportar' && (
            <ExportScreen 
              sessions={sessions}
              expenses={expenses}
              profile={profile}
              justificantes={justificantes}
            />
          )}
        </div>
      </main>

      {/* iOS PWA Installation Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="text-center space-y-2">
              <span className="text-4xl" role="img" aria-label="phone">📱</span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Instalar en tu iPhone / iPad</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apple no permite la instalación automática desde el navegador, pero puedes añadirla manualmente a tu pantalla de inicio:
              </p>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 space-y-2 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <p className="flex gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">1.</span>
                <span>Abre el enlace en el navegador <strong>Safari</strong>.</span>
              </p>
              <p className="flex gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">2.</span>
                <span>Pulsa el botón de <strong>Compartir</strong> (el icono del cuadrado con una flecha hacia arriba en la parte inferior).</span>
              </p>
              <p className="flex gap-2">
                <span className="font-bold text-indigo-600 dark:text-indigo-400">3.</span>
                <span>Desliza el menú hacia abajo y selecciona <strong>"Añadir a la pantalla de inicio"</strong>.</span>
              </p>
            </div>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
