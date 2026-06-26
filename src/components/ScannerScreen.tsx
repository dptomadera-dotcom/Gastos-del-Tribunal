/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Justificante, Expense } from '../types';
import { 
  Camera, Upload, Trash2, Link as LinkIcon, CheckCircle, 
  AlertCircle, Eye, X, Image as ImageIcon, Sparkles, RefreshCw, FileText
} from 'lucide-react';

interface ScannerScreenProps {
  justificantes: Justificante[];
  expenses: Expense[];
  onSaveJustificante: (just: Justificante) => void;
  onDeleteJustificante: (id: string) => void;
  onAssociateWithExpense: (justId: string, expenseId: string | undefined) => void;
}

export default function ScannerScreen({
  justificantes,
  expenses,
  onSaveJustificante,
  onDeleteJustificante,
  onAssociateWithExpense,
}: ScannerScreenProps) {
  // Form and capture states
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [tipo, setTipo] = useState<Justificante['tipo']>('Ticket Parking');
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [associatedExpenseId, setAssociatedExpenseId] = useState<string>('');

  // Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Drag & drop state
  const [dragActive, setDragActive] = useState(false);

  // Zoom view modal
  const [zoomedJustificante, setZoomedJustificante] = useState<Justificante | null>(null);

  // Stop camera when component unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    setCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Error starting webcam:', err);
      setCameraError(
        'No se pudo acceder a la cámara. Compruebe los permisos o suba el archivo manualmente.'
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setFotoUrl(dataUrl);
        // Set a default title if empty
        if (!titulo) {
          setTitulo(`Escaneo ${tipo} — ${fecha.split('-').reverse().slice(0, 2).join('/')}`);
        }
        stopCamera();
      }
    }
  };

  // Convert File to Base64
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, seleccione un archivo de imagen (PNG, JPEG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFotoUrl(e.target.result as string);
        if (!titulo) {
          const fileNameClean = file.name.split('.')[0].substring(0, 30);
          setTitulo(fileNameClean);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Drag & drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fotoUrl) {
      alert('Por favor, escanee o suba una foto del justificante.');
      return;
    }

    const newJustificante: Justificante = {
      id: `just_${Date.now()}`,
      fotoUrl,
      titulo: titulo.trim(),
      fecha,
      tipo,
      gastoId: associatedExpenseId ? associatedExpenseId : undefined,
    };

    onSaveJustificante(newJustificante);

    // If an expense was selected, update its association
    if (associatedExpenseId) {
      onAssociateWithExpense(newJustificante.id, associatedExpenseId);
    }

    // Reset uploader form
    setFotoUrl(null);
    setTitulo('');
    setAssociatedExpenseId('');
  };

  // Pre-generate simulated demo recipe to facilitate testing
  const loadDemoReceipt = () => {
    // A elegant SVG base64 mock receipt
    const demoSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400"><rect width="300" height="400" fill="%23fcfbf7" stroke="%23e2e8f0" stroke-width="4"/><line x1="15" y1="40" x2="285" y2="40" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="4 4"/><text x="150" y="30" font-family="monospace" font-size="14" font-weight="bold" text-anchor="middle" fill="%23334155">FACTURA SIMULADA TRIBUNAL</text><text x="20" y="80" font-family="monospace" font-size="12" fill="%2364748b">ID: TF-2026-99381</text><text x="20" y="100" font-family="monospace" font-size="12" fill="%2364748b">FECHA: 2026-06-14</text><text x="20" y="125" font-family="monospace" font-size="12" font-weight="bold" fill="%23334155">CONCEPTO: ALOJAMIENTO INDIVIDUAL</text><text x="20" y="145" font-family="monospace" font-size="11" fill="%23475569">- Estancia Hotel Sede (1 noche)</text><text x="20" y="165" font-family="monospace" font-size="11" fill="%23ef4444">* TOPE OFICIAL APLICADO: 106,94 EUR</text><line x1="15" y1="200" x2="285" y2="200" stroke="%23cbd5e1" stroke-width="2"/><text x="20" y="230" font-family="monospace" font-size="12" fill="%23334155">Subtotal: 97,22 EUR</text><text x="20" y="250" font-family="monospace" font-size="12" fill="%23334155">IGIC (10%): 9,72 EUR</text><text x="20" y="280" font-family="monospace" font-size="14" font-weight="bold" fill="%230f172a">TOTAL: 106,94 EUR</text><rect x="20" y="310" width="260" height="40" rx="4" fill="%23f1f5f9" stroke="%23cbd5e1"/><text x="150" y="335" font-family="monospace" font-size="10" fill="%23475569" text-anchor="middle">JUSTIFICANTE PARA LA CONSEJERIA</text></svg>`;
    setFotoUrl(demoSvg);
    setTitulo(`Factura Hotel Sede — 14/06/2026`);
    setTipo('Factura Hotel');
  };

  return (
    <div className="space-y-6" id="scanner-container">
      {/* Sección Superior: Escáner / Capturador */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between">
            <div>
              <h2 className="font-bold font-display text-sm text-white">Escáner de Tickets y Facturas</h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Digitalice sus justificantes físicos para incluirlos en el archivo ZIP oficial.</p>
            </div>
            <Camera className="h-5 w-5 text-indigo-400" />
          </div>

          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
            {/* Cámara activa */}
            {cameraActive ? (
              <div className="relative aspect-video rounded-xl bg-slate-950 overflow-hidden border border-slate-800 flex flex-col items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-4 flex gap-2">
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs rounded-lg shadow transition flex items-center gap-1.5"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Capturar Foto
                  </button>
                  <button
                    type="button"
                    onClick={stopCamera}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg shadow transition"
                  >
                    Detener Cámara
                  </button>
                </div>
              </div>
            ) : fotoUrl ? (
              /* Previsualización del Justificante */
              <div className="relative flex flex-col items-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="relative w-48 h-48 border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                  <img
                    src={fotoUrl}
                    alt="Previsualización de justificante"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => setFotoUrl(null)}
                    className="absolute top-1.5 right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition shadow"
                    title="Quitar foto"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                  Foto cargada con éxito. Configure los campos a la derecha para guardarla.
                </p>
              </div>
            ) : (
              /* Zona de arrastre de archivos */
              <div
                className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-10 px-4 text-center transition ${
                  dragActive ? 'border-slate-900 bg-slate-50/50' : 'border-slate-200 hover:bg-slate-50/30'
                }`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-10 w-10 text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700 mb-1">Arrastre o seleccione su ticket</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mb-4 leading-relaxed">
                  Arrastre sus archivos de imagen aquí o haga clic para buscarlos en su ordenador. También puede usar la cámara.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer transition">
                    Seleccionar Archivo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileInputChange}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
                  >
                    <Camera className="h-3.5 w-3.5 text-slate-500" />
                    Usar Cámara
                  </button>

                  <button
                    type="button"
                    onClick={loadDemoReceipt}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition flex items-center gap-1.5"
                    title="Simular un ticket para pruebas rápidas"
                  >
                    <RefreshCw className="h-3.5 w-3.5 text-indigo-500" />
                    Cargar Demo
                  </button>
                </div>

                {cameraError && (
                  <p className="text-[11px] text-rose-500 font-medium mt-3 flex items-center gap-1 justify-center">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {cameraError}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Formulario de Clasificación */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-fit">
          <div className="bg-slate-900 border-b border-slate-800 p-4 text-white flex items-center justify-between">
            <h2 className="font-bold font-display text-sm text-white">Clasificador de Justificante</h2>
            <LinkIcon className="h-4 w-4 text-indigo-400" />
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="input-just-titulo">
                Título del Justificante
              </label>
              <input
                id="input-just-titulo"
                type="text"
                required
                placeholder="Ej. Ticket Gasolinera / Factura Hotel Sede"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="select-just-tipo">
                  Tipo de Gasto
                </label>
                <select
                  id="select-just-tipo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                >
                  <option value="Factura Hotel">Factura Hotel</option>
                  <option value="Tarjeta de Embarque">Tarjeta de Embarque</option>
                  <option value="Ticket Parking">Ticket Parking</option>
                  <option value="Ticket Taxi">Ticket Taxi</option>
                  <option value="Ticket Guagua">Ticket Guagua</option>
                  <option value="Otro">Otro Justificante</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="input-just-fecha">
                  Fecha del Ticket
                </label>
                <input
                  id="input-just-fecha"
                  type="date"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                />
              </div>
            </div>

            {/* Clasificador Automático: Vincular a gasto registrado */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="select-just-gasto">
                Asociar a Gasto Diario Registrado (Opcional)
              </label>
              <select
                id="select-just-gasto"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 transition"
                value={associatedExpenseId}
                onChange={(e) => setAssociatedExpenseId(e.target.value)}
              >
                <option value="">-- No asociar (Dejar en la cartera) --</option>
                {expenses.map((exp) => {
                  const sNums = exp.sesionesAsociadas
                    .map(sid => expenses.find(x => x.id === exp.id) && expenses.length > 0 ? expenses.indexOf(exp) + 1 : '')
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <option key={exp.id} value={exp.id}>
                      Dieta {exp.origen} ➔ {exp.destino} (Sesión {sNums})
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                La Consejería exige vincular de manera estricta los documentos PDF o imágenes justificativos de cada gasto reclamado.
              </p>
            </div>

            <button
              type="submit"
              disabled={!fotoUrl}
              className={`w-full py-2.5 text-white font-semibold text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer ${
                fotoUrl 
                  ? 'bg-indigo-600 hover:bg-indigo-700' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              Guardar en Cartera de Justificantes
            </button>
          </form>
        </div>
      </div>

      {/* Cartera de Justificantes Guardados */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center justify-between">
          <span>Mi Cartera de Justificantes Escaneados</span>
          <span className="text-xs bg-slate-100 text-slate-800 font-bold px-2 py-0.5 rounded-full">
            {justificantes.length} justificantes
          </span>
        </h2>

        {justificantes.length === 0 ? (
          <div className="text-center py-10">
            <ImageIcon className="h-10 w-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500 font-medium">Su cartera está vacía</p>
            <p className="text-xs text-slate-400 mt-1">
              Escanee tickets usando la webcam o suba archivos desde su ordenador en el panel superior.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {justificantes.map((just) => {
              const matchedExpense = expenses.find((e) => e.id === just.gastoId);

              return (
                <div
                  key={just.id}
                  className="bg-slate-50 border border-slate-200/60 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between hover:border-slate-300 transition"
                >
                  <div className="relative aspect-video bg-white border-b border-slate-100 overflow-hidden flex items-center justify-center group">
                    <img
                      src={just.fotoUrl}
                      alt={just.titulo}
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                    {/* Botones Flotantes en Hover */}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        onClick={() => setZoomedJustificante(just)}
                        className="p-1.5 bg-white rounded-lg text-slate-900 hover:bg-slate-100 transition shadow"
                        title="Ver en grande"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteJustificante(just.id)}
                        className="p-1.5 bg-rose-600 rounded-lg text-white hover:bg-rose-700 transition shadow"
                        title="Eliminar justificante"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 bg-slate-200 text-slate-700 text-[9px] font-bold rounded">
                          {just.tipo}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {just.fecha.split('-').reverse().join('/')}
                        </span>
                      </div>
                      <h3 className="text-xs font-extrabold text-slate-950 mt-1.5 truncate" title={just.titulo}>
                        {just.titulo}
                      </h3>
                    </div>

                    <div className="pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px]">
                      {matchedExpense ? (
                        <div className="text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded truncate max-w-full">
                          <CheckCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Asociado a {matchedExpense.origen}</span>
                        </div>
                      ) : (
                        <div className="text-amber-700 font-medium flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded truncate max-w-full">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Sin asociar a dieta</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Zoom */}
      {zoomedJustificante && (
        <div className="fixed inset-0 bg-slate-950/85 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl relative flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[10px] bg-slate-200 px-2 py-0.5 rounded font-bold uppercase text-slate-700">
                  {zoomedJustificante.tipo}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{zoomedJustificante.titulo}</h3>
              </div>
              <button
                onClick={() => setZoomedJustificante(null)}
                className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 bg-slate-100 flex items-center justify-center max-h-[60vh]">
              <img
                src={zoomedJustificante.fotoUrl}
                alt={zoomedJustificante.titulo}
                className="max-w-full max-h-[50vh] object-contain rounded shadow-lg"
                referrerPolicy="no-referrer"
              />
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
              <span>Fecha del ticket: {zoomedJustificante.fecha.split('-').reverse().join('/')}</span>
              <button
                onClick={() => {
                  onDeleteJustificante(zoomedJustificante.id);
                  setZoomedJustificante(null);
                }}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg font-semibold flex items-center gap-1 transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar Gasto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
