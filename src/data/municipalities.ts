/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Municipality {
  name: string;
  lat: number;
  lng: number;
  island: string;
}

export const MUNICIPALITIES: Municipality[] = [
  { name: 'Santa Cruz de Tenerife', lat: 28.4636, lng: -16.2518, island: 'Tenerife' },
  { name: 'San Cristóbal de La Laguna', lat: 28.4871, lng: -16.3139, island: 'Tenerife' },
  { name: 'Arona', lat: 28.0991, lng: -16.6806, island: 'Tenerife' },
  { name: 'Adeje', lat: 28.1215, lng: -16.7324, island: 'Tenerife' },
  { name: 'Puerto de la Cruz', lat: 28.4111, lng: -16.5451, island: 'Tenerife' },
  { name: 'La Orotava', lat: 28.3904, lng: -16.5244, island: 'Tenerife' },
  { name: 'Granadilla de Abona', lat: 28.1189, lng: -16.5786, island: 'Tenerife' },
  { name: 'Los Realejos', lat: 28.3845, lng: -16.5833, island: 'Tenerife' },
  { name: 'Icod de los Vinos', lat: 28.3711, lng: -16.7119, island: 'Tenerife' },
  { name: 'Tacoronte', lat: 28.4816, lng: -16.4154, island: 'Tenerife' },
  { name: 'Candelaria', lat: 28.3551, lng: -16.3726, island: 'Tenerife' },
  { name: 'Guía de Isora', lat: 28.2114, lng: -16.7788, island: 'Tenerife' },
  { name: 'Güímar', lat: 28.3149, lng: -16.4124, island: 'Tenerife' },
  { name: 'El Rosario', lat: 28.4239, lng: -16.3687, island: 'Tenerife' },
  { name: 'San Miguel de Abona', lat: 28.0984, lng: -16.6171, island: 'Tenerife' },
  { name: 'Santa Úrsula', lat: 28.4211, lng: -16.4889, island: 'Tenerife' },
  { name: 'Tegueste', lat: 28.5235, lng: -16.3197, island: 'Tenerife' },
  { name: 'Santiago del Teide', lat: 28.2974, lng: -16.8159, island: 'Tenerife' },
  { name: 'La Victoria de Acentejo', lat: 28.4328, lng: -16.4673, island: 'Tenerife' },
  { name: 'La Matanza de Acentejo', lat: 28.4485, lng: -16.4443, island: 'Tenerife' },
  { name: 'El Sauzal', lat: 28.4735, lng: -16.4385, island: 'Tenerife' },
  { name: 'Arico', lat: 28.1873, lng: -16.4912, island: 'Tenerife' },
  { name: 'Garachico', lat: 28.3725, lng: -16.7645, island: 'Tenerife' },
  { name: 'Buenavista del Norte', lat: 28.3695, lng: -16.8596, island: 'Tenerife' },
  { name: 'Los Silos', lat: 28.3685, lng: -16.7972, island: 'Tenerife' },
  { name: 'San Juan de la Rambla', lat: 28.3917, lng: -16.6478, island: 'Tenerife' },
  { name: 'El Tanque', lat: 28.3542, lng: -16.7794, island: 'Tenerife' },
  { name: 'Arafo', lat: 28.3411, lng: -16.4173, island: 'Tenerife' },
  { name: 'Fasnia', lat: 28.2369, lng: -16.4389, island: 'Tenerife' },
  { name: 'La Guancha', lat: 28.3719, lng: -16.6521, island: 'Tenerife' },
  { name: 'Vilaflor de Chasna', lat: 28.1593, lng: -16.6375, island: 'Tenerife' },
  
  // Key travel hubs & transport connections (Essential for official travel expenses)
  { name: 'Aeropuerto Tenerife Norte (TFN)', lat: 28.4827, lng: -16.3415, island: 'Tenerife' },
  { name: 'Aeropuerto Tenerife Sur (TFS)', lat: 28.0443, lng: -16.5725, island: 'Tenerife' },
  { name: 'Puerto de Los Cristianos', lat: 28.0487, lng: -16.7214, island: 'Tenerife' },
  { name: 'Puerto de Santa Cruz', lat: 28.4712, lng: -16.2443, island: 'Tenerife' },

  // Las Palmas / Gran Canaria major hubs for inter-island work
  { name: 'Las Palmas de Gran Canaria', lat: 28.1235, lng: -15.4363, island: 'Gran Canaria' },
  { name: 'Aeropuerto de Gran Canaria (LPA)', lat: 27.9319, lng: -15.3866, island: 'Gran Canaria' },
  { name: 'Maspalomas / San Bartolomé', lat: 27.7606, lng: -15.5861, island: 'Gran Canaria' },
  { name: 'Agaete (Puerto de las Nieves)', lat: 28.1014, lng: -15.7094, island: 'Gran Canaria' }
];

/**
 * Calculates great-circle distance between two points using the Haversine formula,
 * adjusted with a routing curvature multiplier (typically 1.35x - 1.45x) to model
 * realistic road distances in mountainous/highway geography.
 */
export function calculateDrivingDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDistance = R * c;

  if (directDistance < 0.1) return 0;

  // Curvature/elevation coefficient for Canarian/Spanish highway layout
  // (mountainous roads with curves have a higher real distance vs straight line)
  const isInterIsland = Math.abs(lng1 - lng2) > 0.4;
  const multiplier = isInterIsland ? 1.1 : 1.35; 

  const finalDistance = directDistance * multiplier;
  
  // Return rounded to 1 decimal place
  return Math.round(finalDistance * 10) / 10;
}

/**
 * Finds distance by municipality names.
 * If either is custom, returns null.
 */
export function getDistanceByName(originName: string, destName: string): number | null {
  if (!originName || !destName) return null;
  if (originName.trim().toLowerCase() === destName.trim().toLowerCase()) return 0;

  const origin = MUNICIPALITIES.find(
    (m) => m.name.toLowerCase() === originName.trim().toLowerCase()
  );
  const dest = MUNICIPALITIES.find(
    (m) => m.name.toLowerCase() === destName.trim().toLowerCase()
  );

  if (!origin || !dest) return null;

  return calculateDrivingDistance(origin.lat, origin.lng, dest.lat, dest.lng);
}

/**
 * Uses Geolocalisation API to locate the closest municipality from the preset list.
 */
export function findClosestMunicipality(lat: number, lng: number): Municipality {
  let closest = MUNICIPALITIES[0];
  let minDistance = Infinity;

  MUNICIPALITIES.forEach((m) => {
    // Basic flat distance check for finding the closest entry
    const dx = m.lat - lat;
    const dy = m.lng - lng;
    const dist = dx * dx + dy * dy;
    if (dist < minDistance) {
      minDistance = dist;
      closest = m;
    }
  });

  return closest;
}
