/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './apiConfig.ts';

export class TelemetryApiError extends Error {}

export interface TelemetryReading {
  timestamp: string;
  wellId: string;
  depthM: number;
  ropMhr: number;
  wobTons: number;
  rpm: number;
  torqueKNm: number;
  sppPsi: number;
  mudFlowInLpm: number;
  mudFlowOutLpm: number;
  pitVolumeM3: number;
  gasUnits: number;
  mudWeightInSG: number;
  mudWeightOutSG: number;
  activeFormation: string;
  hazardStatus: string;
  isSimulation: boolean;
  mode: 'DEMO_SIMULATION' | 'REAL_DATA';
  sourceType: 'public_document' | 'government_data' | 'geospatial_data' | 'derived' | 'synthetic_demo';
}

export async function fetchCurrentTelemetry(wellId?: string): Promise<TelemetryReading> {
  const params = wellId ? `?wellId=${encodeURIComponent(wellId)}` : '';
  const res = await apiFetch(`/api/telemetry/current${params}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new TelemetryApiError(body.detail || `Failed to load telemetry (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchTelemetryHistory(wellId?: string, limit = 20): Promise<TelemetryReading[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (wellId) params.set('wellId', wellId);
  const res = await apiFetch(`/api/telemetry/history?${params.toString()}`);
  if (!res.ok) {
    throw new TelemetryApiError(`Failed to load telemetry history (HTTP ${res.status})`);
  }
  const data: { readings: TelemetryReading[] } = await res.json();
  return data.readings;
}
