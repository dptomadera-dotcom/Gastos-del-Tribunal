/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Session, Expense, Profile, Justificante } from '../types';
import { 
  FileArchive, Download, CheckCircle, AlertTriangle, FileText, 
  User, ShieldAlert, KeyRound, Loader2, RefreshCw, Printer,
  Database, FileSpreadsheet
} from 'lucide-react';
import JSZip from 'jszip';
import { jsPDF } from 'jspdf';

interface ExportScreenProps {
  sessions: Session[];
  expenses: Expense[];
  profile: Profile | null;
  justificantes: Justificante[];
}

// Helper to load any image URL into base64 safely
const loadImage = (url: string): Promise<string | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    if (url.startsWith('data:')) {
      resolve(url);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL('image/jpeg');
          resolve(base64);
        } else {
          resolve(null);
        }
      } catch (e) {
        console.warn('Error rendering image to canvas in PDF export:', e);
        resolve(null);
      }
    };
    img.onerror = () => {
      console.warn('Failed to load image URL in PDF export:', url);
      resolve(null);
    };
    img.src = url;
  });
};

const drawFallbackBox = (doc: jsPDF, x: number, y: number, w: number, h: number) => {
  doc.setDrawColor(203, 213, 225);
  doc.setLineDashPattern([2, 2], 0);
  doc.rect(x, y, w, h, 'D');
  doc.setLineDashPattern([], 0); // Reset dash pattern
  
  doc.setFillColor(248, 250, 252);
  doc.rect(x + 0.5, y + 0.5, w - 1, h - 1, 'F');
  
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VISTA PREVIA DE JUSTIFICANTE NO DISPONIBLE', x + w / 2, y + h / 2 - 5, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('El archivo original está adjunto de forma segura en el archivo ZIP.', x + w / 2, y + h / 2 + 5, { align: 'center' });
};

export default function ExportScreen({ sessions, expenses, profile, justificantes }: ExportScreenProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const getKmRate = () => {
    if (!profile) return 0.26;
    return profile.vehiculoTipo === 'motocicleta' ? 0.106 : 0.26;
  };

  const getExpenseMileage = (exp: Expense) => {
    if (exp.medioTransporte !== 'vehiculo_propio') return 0;
    return Number((exp.kmRecorridos * getKmRate()).toFixed(2));
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
    return Number(total.toFixed(2));
  };

  const getGrandTotal = () => {
    return expenses.reduce((acc, exp) => acc + getExpenseTotal(exp), 0);
  };

  const generateZip = async () => {
    if (!profile) {
      alert('Debe completar sus datos de Perfil antes de exportar.');
      return;
    }
    if (expenses.length === 0) {
      alert('No hay ningún gasto registrado para exportar.');
      return;
    }

    setIsGenerating(true);
    setExportSuccess(false);

    try {
      const zip = new JSZip();

      // 1. Generate CSV File for Excel (UTF-8 with BOM to support accents properly)
      let csvContent = '\uFEFF'; // BOM
      csvContent += 'Fecha Dieta;Sesiones Asociadas;Origen;Destino;Transporte;Kilómetros;Importe Km;Aparcamiento;Taxi;Guagua/Tranvía;Alquiler Coche;Alojamiento;Manutención;Total Estimado;Notas\n';
      
      expenses.forEach((exp) => {
        const sessNums = exp.sesionesAsociadas
          .map(sid => sessions.find(s => s.id === sid)?.numero)
          .filter(Boolean)
          .join(', ');

        const sDates = exp.sesionesAsociadas
          .map(sid => sessions.find(s => s.id === sid)?.fecha)
          .filter(Boolean)
          .join(' / ');

        csvContent += `"${sDates}";"${sessNums}";"${exp.origen}";"${exp.destino}";"${exp.medioTransporte.replace('_', ' ')}";${exp.kmRecorridos};${getExpenseMileage(exp).toFixed(2)};${exp.importeParking.toFixed(2)};${exp.importeTaxi.toFixed(2)};${exp.importeGuagua.toFixed(2)};${exp.importeAlquiler.toFixed(2)};${exp.importeAlojamiento.toFixed(2)};${getExpenseManutencion(exp).toFixed(2)};${getExpenseTotal(exp).toFixed(2)};"${exp.notas || ''}"\n`;
      });

      zip.file('01_Resumen_Excel_Liquidacion.csv', csvContent);

      // 2. Generate Beautiful HTML Report for direct printing
      let htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Resumen de Liquidación de Dietas 2026</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.5; padding: 40px; margin: 0; background: #fff; }
    h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin-bottom: 5px; text-transform: uppercase; border-bottom: 3px solid #0f172a; padding-bottom: 10px; }
    .subtitle { font-size: 14px; color: #64748b; margin-bottom: 30px; }
    .section { margin-bottom: 25px; }
    h2 { font-size: 16px; font-weight: 700; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 15px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
    th { background: #f1f5f9; font-weight: bold; text-align: left; padding: 10px; border: 1px solid #cbd5e1; }
    td { padding: 10px; border: 1px solid #cbd5e1; }
    .total-row { font-weight: bold; background: #f8fafc; }
    .badge { display: inline-block; padding: 2px 6px; font-size: 10px; font-weight: bold; border-radius: 4px; background: #e2e8f0; }
    .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
    .meta-box { border: 1px solid #e2e8f0; padding: 15px; rounded: 8px; }
    .alert-box { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; padding: 12px; border-radius: 8px; font-size: 11px; margin-top: 20px; }
    .signature-area { display: flex; justify-content: space-between; margin-top: 60px; font-size: 12px; }
    .signature-line { width: 45%; border-top: 1px solid #94a3b8; text-align: center; padding-top: 10px; margin-top: 50px; }
  </style>
</head>
<body>
  <h1>Resumen de Dietas y Desplazamientos</h1>
  <div class="subtitle">Generado el ${new Date().toLocaleDateString('es-ES')} a las ${new Date().toLocaleTimeString('es-ES')} — Mis Gastos Tribunal 2026</div>

  <div class="meta-grid">
    <div class="meta-box">
      <h2>Datos del Comisionado</h2>
      <p><strong>Nombre completo:</strong> ${profile.nombre} ${profile.apellidos}</p>
      <p><strong>DNI / NIE:</strong> ${profile.dni}</p>
      <p><strong>Cargo:</strong> ${profile.cargo.toUpperCase().replace('_', ' ')}</p>
      <p><strong>Situación:</strong> ${profile.desplazamiento.toUpperCase().replace('_', ' ')}</p>
    </div>
    <div class="meta-box">
      <h2>Datos del Vehículo Utilizado</h2>
      <p><strong>Marca / Modelo:</strong> ${profile.vehiculoMarca || 'No especificado'} ${profile.vehiculoModelo || ''}</p>
      <p><strong>Matrícula:</strong> ${profile.vehiculoMatricula || 'No especificado'}</p>
      <p><strong>Tipo Vehículo:</strong> ${profile.vehiculoTipo === 'motocicleta' ? 'Motocicleta (0,106 €/km)' : 'Turismo (0,26 €/km)'}</p>
    </div>
  </div>

  <div class="section">
    <h2>Desglose Diario de Gastos de Dieta</h2>
    <table>
      <thead>
        <tr>
          <th>Fecha / Sesión</th>
          <th>Itinerario</th>
          <th>Transporte</th>
          <th>Km (Ida/Vta)</th>
          <th>Imp. Km</th>
          <th>Aparcam.</th>
          <th>Taxi</th>
          <th>Guagua</th>
          <th>Alquiler</th>
          <th>Alojamiento</th>
          <th>Manutención</th>
          <th>Total Día</th>
        </tr>
      </thead>
      <tbody>
        ${expenses.map(exp => {
          const sNums = exp.sesionesAsociadas
            .map(sid => sessions.find(s => s.id === sid)?.numero)
            .filter(Boolean)
            .join(', ');
          const sDates = exp.sesionesAsociadas
            .map(sid => sessions.find(s => s.id === sid)?.fecha.split('-').reverse().join('/'))
            .filter(Boolean)
            .join(' / ');

          return `
            <tr>
              <td>Sess ${sNums}<br><span style="color:#64748b;font-size:10px;">${sDates}</span></td>
              <td>${exp.origen} ➔ ${exp.destino}</td>
              <td style="text-transform: capitalize;">${exp.medioTransporte.replace('_', ' ')}</td>
              <td>${exp.medioTransporte === 'vehiculo_propio' ? exp.kmRecorridos : '-'}</td>
              <td>${getExpenseMileage(exp).toFixed(2)} €</td>
              <td>${exp.importeParking.toFixed(2)} €</td>
              <td>${exp.importeTaxi.toFixed(2)} €</td>
              <td>${exp.importeGuagua.toFixed(2)} €</td>
              <td>${exp.importeAlquiler.toFixed(2)} €</td>
              <td style="${exp.importeAlojamiento > 106.94 ? 'color:#b45309;font-weight:bold;' : ''}">${exp.importeAlojamiento.toFixed(2)} €</td>
              <td>${getExpenseManutencion(exp).toFixed(2)} €</td>
              <td style="font-weight:bold;">${getExpenseTotal(exp).toFixed(2)} €</td>
            </tr>
          `;
        }).join('')}
        <tr class="total-row">
          <td colspan="4" style="text-align:right;">Suma Total Reclamada:</td>
          <td>${expenses.reduce((s, e) => s + getExpenseMileage(e), 0).toFixed(2)} €</td>
          <td>${expenses.reduce((s, e) => s + e.importeParking, 0).toFixed(2)} €</td>
          <td>${expenses.reduce((s, e) => s + e.importeTaxi, 0).toFixed(2)} €</td>
          <td>${expenses.reduce((s, e) => s + e.importeGuagua, 0).toFixed(2)} €</td>
          <td>${expenses.reduce((s, e) => s + e.importeAlquiler, 0).toFixed(2)} €</td>
          <td>${expenses.reduce((s, e) => s + e.importeAlojamiento, 0).toFixed(2)} €</td>
          <td>${expenses.reduce((s, e) => s + getExpenseManutencion(e), 0).toFixed(2)} €</td>
          <td style="font-size:14px;color:#0f172a;">${getGrandTotal().toFixed(2)} €</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="alert-box">
    <strong>Aviso Importante para la Secretaría:</strong> Este documento es un resumen auxiliar individual. Las dietas deben ser introducidas en el <strong>Aplicativo Económico oficial de la Consejería</strong> por el Secretario para generar el <strong>Documento E-4 de Comisión de Servicio</strong>. El hotel tiene un tope oficial de 106,94 €/noche.
  </div>

  <div class="signature-area">
    <div class="signature-line">
      Firma del Comisionado (Miembro)<br><br><br>
      Fdo: ${profile.nombre} ${profile.apellidos}
    </div>
    <div class="signature-line">
      Visto Bueno del Presidente/a<br><br><br>
      Fdo: _________________________
    </div>
  </div>
</body>
</html>
      `;

      zip.file('02_Informe_Oficial_Imprimible.html', htmlContent);

      // 3. Add Scanned Receipts, sorted and cleanly numbered
      const receiptsFolder = zip.folder('justificantes');
      
      justificantes.forEach((just, idx) => {
        const orderNum = String(idx + 1).padStart(2, '0');
        const fileTitleClean = just.titulo.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        
        let ext = 'jpg';
        if (just.fotoUrl.startsWith('data:image/png')) ext = 'png';
        else if (just.fotoUrl.startsWith('data:image/svg')) ext = 'svg';
        else if (just.fotoUrl.startsWith('data:image/webp')) ext = 'webp';

        const fileName = `${orderNum}_${just.tipo.replace(/ /g, '_')}_${fileTitleClean}.${ext}`;
        
        // Extract raw Base64 data from URL
        if (just.fotoUrl.includes('base64,')) {
          const rawBase64 = just.fotoUrl.split('base64,')[1];
          receiptsFolder?.file(fileName, rawBase64, { base64: true });
        } else {
          // If not base64 (very rare since we store as base64), write as string
          receiptsFolder?.file(fileName, just.fotoUrl);
        }
      });

      // 4. Generate the ZIP as blob and trigger download
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Mis_Gastos_Tribunal_2026_${profile.apellidos.replace(/ /g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsGenerating(false);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 5000);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Ocurrió un error al compilar el archivo ZIP.');
      setIsGenerating(false);
    }
  };

  const generatePDF = async () => {
    if (!profile) {
      alert('Debe completar sus datos de Perfil antes de exportar.');
      return;
    }
    if (expenses.length === 0) {
      alert('No hay ningún gasto registrado para exportar.');
      return;
    }

    setIsGeneratingPDF(true);

    try {
      // 1. Initialize jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // 2. Styled Header
      // Top accent bar
      doc.setFillColor(79, 70, 229); // Indigo 600
      doc.rect(15, 15, 180, 3, 'F');

      // Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text('LIQUIDACIÓN OFICIAL DE DIETAS Y DESPLAZAMIENTOS', 15, 25);

      // Subtitle
      doc.setTextColor(100, 116, 139); // slate-500
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text('Tribunal de Oposición 2026 - Resumen de Gastos y Justificantes', 15, 30);

      // Metadata / Date on right
      const dateStr = new Date().toLocaleDateString('es-ES');
      const timeStr = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      doc.text(`Generado: ${dateStr} ${timeStr}`, 195, 25, { align: 'right' });

      // 3. Comisionado Personal Details Box
      doc.setFillColor(248, 250, 252); // slate-50
      doc.rect(15, 35, 180, 28, 'F');
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.rect(15, 35, 180, 28, 'D');

      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('DATOS DEL MIEMBRO DE TRIBUNAL:', 19, 41);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85); // slate-700
      
      const cargoText = profile.cargo.replace('_', ' ').toUpperCase();
      const despText = profile.desplazamiento.replace(/_/g, ' ').toUpperCase();

      doc.text(`Nombre y Apellidos: ${profile.nombre} ${profile.apellidos}`, 19, 46);
      doc.text(`DNI / NIE: ${profile.dni}`, 19, 50);
      doc.text(`Cargo del Vocal: ${cargoText}`, 19, 54);

      doc.text(`Desplazamiento Territorial: ${despText}`, 110, 46);
      
      const vehicleInfo = profile.vehiculoMarca 
        ? `${profile.vehiculoMarca} ${profile.vehiculoModelo} (${profile.vehiculoMatricula}) - ${profile.vehiculoTipo === 'motocicleta' ? 'Moto (0,106 €/km)' : 'Coche (0,26 €/km)'}`
        : 'No especificado / Sin vehículo propio';
      doc.text(`Vehículo Registrado: ${vehicleInfo}`, 110, 50);

      // Divider line in details
      doc.setDrawColor(241, 245, 249);
      doc.line(105, 38, 105, 60);

      // 4. Expenses Table Title
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('DESGLOSE DE ACTIVIDAD Y GASTOS DIARIOS', 15, 71);

      // 5. Drawing Table Header
      let currentY = 82;
      const rowHeight = 11;

      doc.setFillColor(30, 41, 59); // Slate 800
      doc.rect(15, 74, 180, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);

      doc.text('Sesión / Fecha', 16, 79);
      doc.text('Itinerario / Trayecto', 46, 79);
      doc.text('Transporte', 91, 79);
      doc.text('Km / Imp. Km', 128, 79, { align: 'right' });
      doc.text('Alojamiento', 143, 79, { align: 'right' });
      doc.text('Manutención', 158, 79, { align: 'right' });
      doc.text('Otros', 173, 79, { align: 'right' });
      doc.text('Suma Total', 193, 79, { align: 'right' });

      // Table Rows
      expenses.forEach((exp, idx) => {
        // Page break check
        if (currentY > 240) {
          // Bottom footer on current page
          doc.setTextColor(148, 163, 184);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.text(`Expediente Informativo - Liquidación Tribunal 2026`, 15, 287);
          
          doc.addPage();
          
          // Sub-header on new page
          doc.setFillColor(30, 41, 59);
          doc.rect(15, 15, 180, 8, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          
          doc.text('Sesión / Fecha', 16, 20);
          doc.text('Itinerario / Trayecto', 46, 20);
          doc.text('Transporte', 91, 20);
          doc.text('Km / Imp. Km', 128, 20, { align: 'right' });
          doc.text('Alojamiento', 143, 20, { align: 'right' });
          doc.text('Manutención', 158, 20, { align: 'right' });
          doc.text('Otros', 173, 20, { align: 'right' });
          doc.text('Suma Total', 193, 20, { align: 'right' });

          currentY = 23;
        }

        // Alternating background color
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252); // slate-50
          doc.rect(15, currentY, 180, rowHeight, 'F');
        }

        // Divider bottom border
        doc.setDrawColor(241, 245, 249);
        doc.line(15, currentY + rowHeight, 195, currentY + rowHeight);

        // Map session details
        const sessNums = exp.sesionesAsociadas
          .map(sid => sessions.find(s => s.id === sid)?.numero)
          .filter(Boolean)
          .join(', ');

        const sDates = exp.sesionesAsociadas
          .map(sid => {
            const dateVal = sessions.find(s => s.id === sid)?.fecha;
            return dateVal ? dateVal.split('-').reverse().join('/') : '';
          })
          .filter(Boolean)
          .join(', ');

        const col0Text = `Ses. ${sessNums}\n${sDates}`;
        const itineraryText = `${exp.origen} a\n${exp.destino}`;
        
        const med = exp.medioTransporte.replace(/_/g, ' ');
        const transportText = med.charAt(0).toUpperCase() + med.slice(1);

        const isPropio = exp.medioTransporte === 'vehiculo_propio';
        const kmText = isPropio 
          ? `${exp.kmRecorridos} km\n(${getExpenseMileage(exp).toFixed(2)} €)` 
          : '-';

        const alojText = `${exp.importeAlojamiento.toFixed(2)} €`;
        const manutText = `${getExpenseManutencion(exp).toFixed(2)} €`;

        const otherSum = exp.importeParking + exp.importeTaxi + exp.importeGuagua + exp.importeAlquiler;
        const otherText = `${otherSum.toFixed(2)} €`;

        const totalText = `${getExpenseTotal(exp).toFixed(2)} €`;

        // Render Row text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);

        doc.text(col0Text, 16, currentY + 4);
        doc.text(itineraryText, 46, currentY + 4, { maxWidth: 42 });
        doc.text(transportText, 91, currentY + 4);
        doc.text(kmText, 128, currentY + 4, { align: 'right' });
        
        if (exp.importeAlojamiento > 106.94) {
          doc.setTextColor(217, 119, 6); // warning color (amber-600)
          doc.setFont('helvetica', 'bold');
        }
        doc.text(alojText, 143, currentY + 4, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(51, 65, 85);

        doc.text(manutText, 158, currentY + 4, { align: 'right' });
        doc.text(otherText, 173, currentY + 4, { align: 'right' });

        // Total bold
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text(totalText, 193, currentY + 4, { align: 'right' });

        currentY += rowHeight;
      });

      // 6. Total Row
      if (currentY > 240) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(15, currentY, 180, 9, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(15, currentY, 180, 9, 'D');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text('TOTAL GENERAL SOLICITADO:', 150, currentY + 6, { align: 'right' });

      doc.setTextColor(79, 70, 229); // Indigo 600
      doc.setFontSize(10);
      doc.text(`${getGrandTotal().toFixed(2)} €`, 193, currentY + 6, { align: 'right' });

      currentY += 15;

      // 7. Regulation and verification Notice Box
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFillColor(254, 243, 199); // Amber 100
      doc.rect(15, currentY, 180, 18, 'F');
      doc.setDrawColor(251, 191, 36); // Amber 400
      doc.rect(15, currentY, 180, 18, 'D');

      doc.setTextColor(146, 64, 14); // Amber 800
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('CONFORMIDAD DE LÍMITES Y NORMATIVA DE CONSEJERÍA:', 18, currentY + 5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(120, 53, 4); // Amber 900
      const validationNote = 'Las indemnizaciones de alojamiento se han auditado automáticamente bajo el límite oficial de 106,94 €/noche. Las sesiones telemáticas registradas no han devengado transporte ni locomoción conforme a la normativa de asistencia de tribunales de Canarias.';
      doc.text(validationNote, 18, currentY + 9, { maxWidth: 174 });

      currentY += 28;

      // 8. Signatures Block
      if (currentY > 240) {
        doc.addPage();
        currentY = 25;
      }

      doc.setTextColor(71, 85, 105); // slate-600
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      // Signature text blocks
      const comLabel = `Firma del Vocal Comisionado\n\n\n\nFdo: ${profile.nombre} ${profile.apellidos}\nDNI: ${profile.dni}`;
      const presLabel = `Vº Bº del Presidente/a de Tribunal\n\n\n\nFdo: ________________________________`;

      doc.line(20, currentY + 16, 85, currentY + 16);
      doc.line(125, currentY + 16, 190, currentY + 16);

      doc.text(comLabel, 20, currentY + 20, { maxWidth: 65 });
      doc.text(presLabel, 125, currentY + 20, { maxWidth: 65 });

      // 9. Justificantes Annex
      if (justificantes.length > 0) {
        for (let i = 0; i < justificantes.length; i++) {
          const j = justificantes[i];
          doc.addPage();

          // Header banner for receipt
          doc.setFillColor(30, 41, 59); // Slate 800
          doc.rect(15, 15, 180, 11, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.text(`ANEXO DOCUMENTAL Nº ${i + 1}: ${j.tipo.toUpperCase()}`, 19, 22);

          // Subtext info
          const assocExp = j.gastoId ? expenses.find(e => e.id === j.gastoId) : null;
          const routeInfo = assocExp ? `  |  Itinerario: ${assocExp.origen} a ${assocExp.destino}` : '';
          
          doc.setTextColor(100, 116, 139); // slate-500
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.text(`Título: ${j.titulo}  |  Fecha: ${j.fecha ? j.fecha.split('-').reverse().join('/') : 'N/A'}${routeInfo}`, 15, 33);

          // Render Image
          const base64 = await loadImage(j.fotoUrl);
          if (base64) {
            try {
              // Standard A4: 210 x 297mm. Top takes up to 35mm. Bottom takes 15mm.
              // Space left is 247mm. We can center image within width 150mm and height 195mm
              doc.addImage(base64, 'JPEG', 30, 40, 150, 195, undefined, 'FAST');
            } catch (err) {
              console.warn('Error applying image to PDF:', err);
              drawFallbackBox(doc, 25, 40, 160, 200);
            }
          } else {
            drawFallbackBox(doc, 25, 40, 160, 200);
          }

          // Footer for current receipt page
          doc.setTextColor(148, 163, 184);
          doc.setFontSize(7.5);
          doc.text(`Documento de Justificación Digital - Tribunal de Oposición 2026`, 15, 287);
        }
      }

      // 10. Dynamic Page Numbering for all pages
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setTextColor(148, 163, 184);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Página ${p} de ${totalPages}`, 195, 287, { align: 'right' });
      }

      // Save PDF
      doc.save(`Expediente_Liquidacion_${profile.apellidos.replace(/ /g, '_')}_2026.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Hubo un error al compilar el documento PDF.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = () => {
    if (!profile) {
      alert('Debe completar sus datos de Perfil antes de imprimir.');
      return;
    }
    if (expenses.length === 0) {
      alert('No hay ningún gasto registrado para imprimir.');
      return;
    }
    window.print();
  };

  const downloadJSON = () => {
    try {
      const dataToSave = {
        profile,
        sessions,
        expenses,
        exportDate: new Date().toISOString(),
        version: "2026.1"
      };
      const blob = new Blob([JSON.stringify(dataToSave, null, 2)], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Copia_Seguridad_Tribunal_2026.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting JSON:', err);
      alert('No se pudo generar la copia de seguridad en JSON.');
    }
  };

  const downloadSessionsCSV = () => {
    try {
      if (sessions.length === 0) {
        alert('No hay sesiones registradas para exportar.');
        return;
      }
      let csvContent = '\uFEFF'; // BOM to support Spanish accents in Excel
      csvContent += 'ID;Numero_Sesion;Fecha;Hora_Inicio;Hora_Fin;Modalidad;Es_Festivo\n';
      
      sessions.forEach((s) => {
        const dateStr = s.fecha.split('-').reverse().join('/');
        csvContent += `"${s.id}";"${s.numero}";"${dateStr}";"${s.horaInicio || ''}";"${s.horaFin || ''}";"${s.modalidad}";"${s.esFestivo ? 'Sí' : 'No'}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Sesiones_Tribunal_2026.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting Sessions CSV:', err);
      alert('No se pudo generar el archivo CSV de sesiones.');
    }
  };

  const downloadExpensesCSV = () => {
    try {
      if (expenses.length === 0) {
        alert('No hay gastos o dietas registrados para exportar.');
        return;
      }
      let csvContent = '\uFEFF'; // BOM to support Spanish accents in Excel
      csvContent += 'ID_Gasto;Sesiones_Asociadas;Origen;Destino;Transporte;Kilometros;Importe_Kilometraje_Euros;Importe_Parking_Euros;Importe_Taxi_Euros;Importe_Guagua_Euros;Importe_Alquiler_Euros;Importe_Alojamiento_Euros;Importe_Manutencion_Euros;Total_Dia_Euros;Notas\n';
      
      expenses.forEach((exp) => {
        const sessNums = exp.sesionesAsociadas
          .map(sid => sessions.find(s => s.id === sid)?.numero)
          .filter(Boolean)
          .join(', ');

        csvContent += `"${exp.id}";"${sessNums}";"${exp.origen}";"${exp.destino}";"${exp.medioTransporte.replace('_', ' ')}";${exp.kmRecorridos};${getExpenseMileage(exp).toFixed(2)};${exp.importeParking.toFixed(2)};${exp.importeTaxi.toFixed(2)};${exp.importeGuagua.toFixed(2)};${exp.importeAlquiler.toFixed(2)};${exp.importeAlojamiento.toFixed(2)};${getExpenseManutencion(exp).toFixed(2)};${getExpenseTotal(exp).toFixed(2)};"${exp.notas || ''}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dietas_Y_Gastos_Tribunal_2026.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting Expenses CSV:', err);
      alert('No se pudo generar el archivo CSV de dietas y gastos.');
    }
  };

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6 print:hidden" id="export-container">
      {/* Tarjeta de Resumen y Exportación */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-display tracking-tight text-white">Exportar Documentos de Liquidación</h2>
            <p className="text-slate-400 text-sm mt-1">
              Genere el expediente ordenado para enviarlo al Secretario o Presidente del Tribunal.
            </p>
          </div>
          <FileArchive className="h-10 w-10 text-indigo-400 opacity-80 animate-pulse-subtle" />
        </div>

        <div className="p-6 space-y-6">
          {/* Alertas/Requisitos Previos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
                <User className="h-4 w-4 text-slate-500" />
                Estado del Expediente
              </h3>
              
              <ul className="space-y-2 text-xs">
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">Perfil Comisionado:</span>
                  {profile ? (
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">✔ Configurado</span>
                  ) : (
                    <span className="text-rose-600 font-semibold bg-rose-50 px-2 py-0.5 rounded">✘ Falta configurar</span>
                  )}
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">Sesiones Registradas:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${
                    sessions.length > 0 ? 'text-slate-800 bg-slate-100' : 'text-rose-600 bg-rose-50'
                  }`}>
                    {sessions.length} sesiones
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">Dietas/Gastos Diarios:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${
                    expenses.length > 0 ? 'text-slate-800 bg-slate-100' : 'text-rose-600 bg-rose-50'
                  }`}>
                    {expenses.length} gastos
                  </span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-500">Justificantes Escaneados:</span>
                  <span className={`font-semibold px-2 py-0.5 rounded ${
                    justificantes.length > 0 ? 'text-slate-800 bg-slate-100' : 'text-amber-600 bg-amber-50'
                  }`}>
                    {justificantes.length} justificantes
                  </span>
                </li>
              </ul>
            </div>

            {/* Avisos de Validación Automática */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 space-y-3">
              <h3 className="text-xs font-bold text-amber-800 flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldAlert className="h-4 w-4 text-amber-600" />
                Validación de Normativa Económica
              </h3>

              <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                <p>
                  • <strong>Tope de Alojamiento:</strong> El sistema verifica que las noches de hotel no superen los <strong>106,94 €</strong> oficiales.
                </p>
                <p>
                  • <strong>Kilometraje:</strong> Se aplica la tasa oficial de <strong>0,26 €/km</strong> para coche y <strong>0,106 €/km</strong> para moto según vehículo.
                </p>
                <p>
                  • <strong>Sesiones Telemáticas:</strong> Recuerde que no dan derecho al cobro de transporte o locomoción.
                </p>
              </div>
            </div>
          </div>

          {/* Tabla de Vista Previa */}
          {expenses.length > 0 && (
            <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Vista Previa de Liquidación</span>
                <span className="text-xs font-bold font-mono text-slate-900 bg-white px-2.5 py-1 border border-slate-100 rounded shadow-xs">
                  Suma Total Reclamada: {getGrandTotal().toFixed(2)} €
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-500">
                  <thead className="bg-slate-50 text-[10px] text-slate-400 uppercase font-semibold">
                    <tr>
                      <th className="px-4 py-2.5">Origen / Destino</th>
                      <th className="px-4 py-2.5">Medio</th>
                      <th className="px-4 py-2.5 text-right">Kilometraje</th>
                      <th className="px-4 py-2.5 text-right">Parking/Taxis</th>
                      <th className="px-4 py-2.5 text-right">Alojamiento</th>
                      <th className="px-4 py-2.5 text-right">Manutención</th>
                      <th className="px-4 py-2.5 text-right">Suma Día</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white font-mono">
                    {expenses.map((exp) => {
                      const totalParkingTaxiGuagua = exp.importeParking + exp.importeTaxi + exp.importeGuagua + exp.importeAlquiler;
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 font-sans text-slate-800 font-medium">
                            {exp.origen} ➔ {exp.destino}
                          </td>
                          <td className="px-4 py-3 font-sans text-slate-600 capitalize">
                            {exp.medioTransporte.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {getExpenseMileage(exp).toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-right">
                            {totalParkingTaxiGuagua.toFixed(2)} €
                          </td>
                          <td className={`px-4 py-3 text-right ${exp.importeAlojamiento > 106.94 ? 'text-amber-600 font-bold' : ''}`}>
                            {exp.importeAlojamiento.toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-right text-emerald-700">
                            {getExpenseManutencion(exp).toFixed(2)} €
                          </td>
                          <td className="px-4 py-3 text-right text-slate-900 font-bold">
                            {getExpenseTotal(exp).toFixed(2)} €
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Botones de Exportación e Impresión */}
          <div className="flex flex-col lg:flex-row items-center justify-between pt-6 border-t border-slate-100 gap-4">
            <div className="text-xs text-slate-500 text-center lg:text-left">
              Genere el expediente completo en formato ZIP con todos los justificantes ordenados y el informe, o imprima directamente el reporte de liquidación oficial para la firma física o digital.
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <button
                onClick={handlePrint}
                disabled={!profile || expenses.length === 0}
                className={`w-full sm:w-auto px-5 py-3.5 font-semibold text-sm rounded-xl transition shadow-xs hover:shadow-md flex items-center justify-center gap-2 cursor-pointer border ${
                  !profile || expenses.length === 0
                    ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-800'
                }`}
              >
                <Printer className="h-4.5 w-4.5 text-indigo-500" />
                Imprimir Informe
              </button>

              <button
                onClick={generatePDF}
                disabled={isGeneratingPDF || !profile || expenses.length === 0}
                className={`w-full sm:w-auto px-5 py-3.5 text-white font-semibold text-sm rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  !profile || expenses.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isGeneratingPDF ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Generando PDF...
                  </>
                ) : (
                  <>
                    <FileText className="h-4.5 w-4.5" />
                    Descargar PDF
                  </>
                )}
              </button>

              <button
                onClick={generateZip}
                disabled={isGenerating || !profile || expenses.length === 0}
                className={`w-full sm:w-auto px-5 py-3.5 text-white font-semibold text-sm rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                  !profile || expenses.length === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Compilando ZIP...
                  </>
                ) : (
                  <>
                    <Download className="h-4.5 w-4.5" />
                    Descargar ZIP
                  </>
                )}
              </button>
            </div>
          </div>

          {exportSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-bounce-subtle">
              <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
              <div>
                <strong>¡Expediente de Liquidación generado correctamente!</strong> Se ha descargado el archivo ZIP comprimido y ordenado en su sistema de archivos.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tarjeta de Exportación de Datos en Formatos Abiertos */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 px-6 py-4 bg-slate-50 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 text-sm uppercase tracking-wider">
              <Database className="h-4.5 w-4.5 text-indigo-500" />
              Formatos Abiertos (Backup y Gestión Personal)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Descargue sus datos brutos de sesiones y gastos para importarlos en Excel, hojas de cálculo o herramientas externas.
            </p>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Copia de Seguridad JSON */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50/80 transition flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Database className="h-4.5 w-4.5" />
                </span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Copia de Seguridad JSON</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Exporta la totalidad de sus datos estructurados (perfil, sesiones y listado de gastos) en un único archivo JSON estándar.
              </p>
            </div>
            <button
              onClick={downloadJSON}
              className="w-full py-2 px-3 text-xs font-semibold text-indigo-600 hover:text-white border border-indigo-200 hover:border-indigo-600 hover:bg-indigo-600 rounded-lg transition text-center cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Descargar JSON
            </button>
          </div>

          {/* Card 2: Sesiones en CSV */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50/80 transition flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                </span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Sesiones en CSV</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Descarga el listado completo de convocatorias, asistencias y sesiones registradas, listo para Excel u otras hojas de cálculo.
              </p>
            </div>
            <button
              onClick={downloadSessionsCSV}
              disabled={sessions.length === 0}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition text-center flex items-center justify-center gap-1.5 border ${
                sessions.length === 0
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-white border-indigo-200 hover:border-indigo-600 hover:bg-indigo-600 cursor-pointer'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              Descargar CSV
            </button>
          </div>

          {/* Card 3: Dietas y Gastos en CSV */}
          <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/40 hover:bg-slate-50/80 transition flex flex-col justify-between">
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <FileSpreadsheet className="h-4.5 w-4.5" />
                </span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Dietas y Gastos CSV</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Descarga el desglose diario de kilometraje, peajes, hoteles, manutenciones y totales para su control financiero personal.
              </p>
            </div>
            <button
              onClick={downloadExpensesCSV}
              disabled={expenses.length === 0}
              className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition text-center flex items-center justify-center gap-1.5 border ${
                expenses.length === 0
                  ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed'
                  : 'text-indigo-600 hover:text-white border-indigo-200 hover:border-indigo-600 hover:bg-indigo-600 cursor-pointer'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              Descargar CSV
            </button>
          </div>
        </div>
      </div>

      {/* Explicación del Proceso de Firma E-4 */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border border-amber-100 p-6 space-y-4">
        <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-amber-600" />
          Siguiente Paso: Documento E-4 (Comisión de Servicio)
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">
          Una vez descargado el <strong>archivo ZIP</strong>, envíeselo al <strong>Secretario o Presidente de su Tribunal</strong>. Él utilizará los datos estructurados para transcribirlos en el <strong>Aplicativo Económico oficial de la Consejería</strong>. 
        </p>
        <div className="p-4 bg-white rounded-xl border border-amber-100 text-xs text-slate-600 space-y-2">
          <p>
            1. El Secretario registrará su desplazamiento en la plataforma y cargará sus justificantes adjuntos.
          </p>
          <p>
            2. El sistema oficial generará el documento oficial <strong>Documento E-4 (Comisión de Servicio)</strong>.
          </p>
          <p>
            3. Recibirá una notificación en la plataforma oficial **Portafirmas**. Deberá acceder con su certificado digital/cl@ve para firmar el documento junto con el Presidente del Tribunal para que se proceda al abono de las dietas.
          </p>
        </div>
      </div>
    </div>

    {/* Dedicated Print Sheet - ONLY Visible on Print */}
    {profile && expenses.length > 0 && (
      <div className="hidden print:block bg-white p-10 text-slate-900 font-sans leading-relaxed max-w-4xl mx-auto">
        {/* Header of the official report */}
        <div className="border-b-4 border-slate-900 pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
                Resumen de Dietas y Desplazamientos
              </h1>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                Documento de Liquidación Auxiliar — Tribunal de Oposición 2026
              </p>
            </div>
            <div className="text-right">
              <span className="bg-slate-900 text-white text-[10px] font-extrabold px-3 py-1.5 rounded border border-slate-900 uppercase tracking-widest">
                BORRADOR DE LIQUIDACIÓN
              </span>
              <p className="text-[10px] text-slate-500 font-mono mt-1.5">
                Generado: {new Date().toLocaleDateString('es-ES')} {new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata Tables */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/20">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-2 mb-3">
              Datos del Comisionado
            </h2>
            <table className="w-full text-xs text-left text-slate-800 space-y-1">
              <tbody>
                <tr>
                  <td className="font-bold pr-3 py-1 w-1/3">Nombre completo:</td>
                  <td className="py-1">{profile.nombre} {profile.apellidos}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-3 py-1">DNI / NIE:</td>
                  <td className="py-1 font-mono">{profile.dni}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-3 py-1">Cargo en Tribunal:</td>
                  <td className="py-1 capitalize">{profile.cargo.replace('_', ' ')}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-3 py-1">Tipo Desplazamiento:</td>
                  <td className="py-1 capitalize">{profile.desplazamiento.replace('_', ' ')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/20">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-300 pb-2 mb-3">
              Datos del Vehículo Utilizado
            </h2>
            <table className="w-full text-xs text-left text-slate-800 space-y-1">
              <tbody>
                <tr>
                  <td className="font-bold pr-3 py-1 w-1/3">Marca / Modelo:</td>
                  <td className="py-1">{profile.vehiculoMarca || 'No especificado'} {profile.vehiculoModelo || ''}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-3 py-1">Matrícula:</td>
                  <td className="py-1 font-mono uppercase">{profile.vehiculoMatricula || 'No especificado'}</td>
                </tr>
                <tr>
                  <td className="font-bold pr-3 py-1">Tipo de Vehículo:</td>
                  <td className="py-1 capitalize">
                    {profile.vehiculoTipo === 'motocicleta' 
                      ? 'Motocicleta (0,106 €/km)' 
                      : 'Turismo (0,26 €/km)'}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold pr-3 py-1">Ámbito Territorial:</td>
                  <td className="py-1 capitalize">{profile.desplazamiento.replace('_', ' ')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Liquidation Table */}
        <div className="mb-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Desglose Diario de Dieta y Gastos Reclamados
          </h2>
          <table className="w-full border-collapse border border-slate-300 text-xs text-left text-slate-850">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold">
                <th className="border border-slate-300 p-2 text-[10px] uppercase">Sesión / Fecha</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase">Itinerario</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase">Transporte</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Km</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Imp. Km</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Parking</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Taxi</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Guagua</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Alquiler</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Alojamiento</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Manutención</th>
                <th className="border border-slate-300 p-2 text-[10px] uppercase text-right">Total Día</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-350">
              {expenses.map((exp) => {
                const sNums = exp.sesionesAsociadas
                  .map(sid => sessions.find(s => s.id === sid)?.numero)
                  .filter(Boolean)
                  .join(', ');
                const sDates = exp.sesionesAsociadas
                  .map(sid => sessions.find(s => s.id === sid)?.fecha.split('-').reverse().join('/'))
                  .filter(Boolean)
                  .join(' / ');

                return (
                  <tr key={exp.id}>
                    <td className="border border-slate-300 p-2 font-mono">
                      <span className="font-bold block">Ses. {sNums}</span>
                      <span className="text-[9px] text-slate-500 block leading-tight">{sDates}</span>
                    </td>
                    <td className="border border-slate-300 p-2 font-medium">
                      {exp.origen} ➔ {exp.destino}
                    </td>
                    <td className="border border-slate-300 p-2 capitalize">
                      {exp.medioTransporte.replace('_', ' ')}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {exp.medioTransporte === 'vehiculo_propio' ? exp.kmRecorridos : '-'}
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {getExpenseMileage(exp).toFixed(2)} €
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {exp.importeParking.toFixed(2)} €
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {exp.importeTaxi.toFixed(2)} €
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {exp.importeGuagua.toFixed(2)} €
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {exp.importeAlquiler.toFixed(2)} €
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {exp.importeAlojamiento.toFixed(2)} €
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono">
                      {getExpenseManutencion(exp).toFixed(2)} €
                    </td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">
                      {getExpenseTotal(exp).toFixed(2)} €
                    </td>
                  </tr>
                );
              })}
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-900">
                <td colSpan={4} className="border border-slate-300 p-2 text-right font-sans text-xs uppercase">
                  Totales Reclamados:
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                  {expenses.reduce((s, e) => s + getExpenseMileage(e), 0).toFixed(2)} €
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                  {expenses.reduce((s, e) => s + e.importeParking, 0).toFixed(2)} €
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                  {expenses.reduce((s, e) => s + e.importeTaxi, 0).toFixed(2)} €
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                  {expenses.reduce((s, e) => s + e.importeGuagua, 0).toFixed(2)} €
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                  {expenses.reduce((s, e) => s + e.importeAlquiler, 0).toFixed(2)} €
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                  {expenses.reduce((s, e) => s + e.importeAlojamiento, 0).toFixed(2)} €
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                  {expenses.reduce((s, e) => s + getExpenseManutencion(e), 0).toFixed(2)} €
                </td>
                <td className="border border-slate-300 p-2 text-right font-mono text-sm font-black text-indigo-700 bg-indigo-50/55">
                  {getGrandTotal().toFixed(2)} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Legal Notice */}
        <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-[10px] text-slate-600 leading-relaxed mb-10">
          <strong className="text-slate-900 uppercase block mb-1">Aviso Importante para la Secretaría del Tribunal:</strong>
          Este documento es un resumen de liquidación auxiliar individual generado por el sistema local seguro del comisionado. Las dietas deben ser introducidas en el <strong>Aplicativo Económico oficial de la Consejería</strong> por el Secretario para generar el <strong>Documento E-4 de Comisión de Servicio</strong>. El hotel tiene un tope de liquidación oficial de 106,94 €/noche.
        </div>

        {/* Signature Areas */}
        <div className="grid grid-cols-2 gap-12 mt-16 text-xs pt-8">
          <div className="border-t border-slate-400 text-center pt-3">
            <p className="font-bold text-slate-800">Firma del Comisionado (Miembro)</p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">Fdo: {profile.nombre} {profile.apellidos}</p>
            <div className="h-16 mt-2 border border-dashed border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400">
              [ Firma Electrónica / Autógrafa ]
            </div>
          </div>
          <div className="border-t border-slate-400 text-center pt-3">
            <p className="font-bold text-slate-800">Visto Bueno del Presidente/a</p>
            <p className="text-[10px] text-slate-500 mt-1">Fdo: __________________________________</p>
            <div className="h-16 mt-2 border border-dashed border-slate-200 rounded flex items-center justify-center text-[10px] text-slate-400">
              [ Sello y Firma ]
            </div>
          </div>
        </div>
      </div>
    )}
  </>
);
}
