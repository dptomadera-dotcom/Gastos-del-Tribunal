/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Profile {
  dni: string;
  nombre: string;
  apellidos: string;
  cargo: 'presidente' | 'secretario' | 'vocal_titular' | 'vocal_suplente';
  desplazamiento: 'no_desplazado' | 'municipio' | 'isla_ccaa';
  vehiculoMarca: string;
  vehiculoModelo: string;
  vehiculoMatricula: string;
  vehiculoTipo: 'turismo' | 'motocicleta';
}

export interface Session {
  id: string;
  fecha: string; // YYYY-MM-DD
  numero: number;
  horaInicio: string; // HH:MM
  horaFin: string; // HH:MM
  modalidad: 'presencial' | 'telematica';
  esFestivo: boolean;
}

export interface Expense {
  id: string;
  sesionesAsociadas: string[]; // List of Session IDs
  origen: string;
  destino: string;
  medioTransporte: 'vehiculo_propio' | 'avion' | 'barco' | 'guagua' | 'tranvia' | 'taxi' | 'otro';
  kmRecorridos: number;
  horaSalida: string; // HH:MM (Crucial for Avión/Barco)
  horaLlegada: string; // HH:MM (Crucial for Avión/Barco)
  importeParking: number;
  importeTaxi: number;
  importeGuagua: number;
  importeAlquiler: number;
  importeAlojamiento: number;
  notas: string;
  justificantesAsociados: string[]; // List of Justificante IDs
}

export interface Justificante {
  id: string;
  fotoUrl: string; // base64 or object URL (we store base64 in IndexedDB)
  titulo: string;
  fecha: string;
  tipo: 'Factura Hotel' | 'Tarjeta de Embarque' | 'Ticket Parking' | 'Ticket Taxi' | 'Ticket Guagua' | 'Otro';
  gastoId?: string; // Associated expense ID
}
