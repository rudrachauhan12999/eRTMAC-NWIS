/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Well } from '../data/wellsData.ts';
import { apiFetch } from './apiConfig.ts';

export class WellsApiError extends Error {}

export async function fetchWells(): Promise<Well[]> {
  const res = await apiFetch('/api/wells');
  if (!res.ok) {
    throw new WellsApiError(`Failed to load wells (HTTP ${res.status})`);
  }
  const data: { wells: Well[]; total: number } = await res.json();
  return data.wells;
}

export async function fetchNearbyWells(latitude: number, longitude: number, radiusKm: number): Promise<Well[]> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    radius_km: String(radiusKm),
  });
  const res = await apiFetch(`/api/wells/nearby?${params.toString()}`);
  if (!res.ok) {
    throw new WellsApiError(`Failed to load nearby wells (HTTP ${res.status})`);
  }
  const data: { wells: Well[]; center: { lat: number; lng: number }; radiusKm: number } = await res.json();
  return data.wells;
}
