/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './apiConfig.ts';

export class RiskApiError extends Error {}

export interface RiskEvidenceItem {
  type: 'historical_event' | 'document';
  sourceType: 'public_document' | 'government_data' | 'geospatial_data' | 'derived' | 'synthetic_demo';
  eventId?: string;
  wellId?: string;
  wellName?: string;
  depthM?: number;
  eventType?: string;
  matchedOn?: string[];
  documentId?: string;
  documentName?: string;
  page?: number;
  excerpt?: string;
}

export interface PredictedRisk {
  name: string;
  probability: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  triggerFactor: string;
  contributingWells: string[];
  recommendedAction: string;
  signals: string[];
  evidence: RiskEvidenceItem[];
  sourceTypes: string[];
  isSimulation: boolean;
}

export interface RiskPredictResponse {
  wellId?: string;
  predictedRisks: PredictedRisk[];
  compositeRiskScore: number;
  isSimulation: boolean;
  sourceTypes: string[];
  calculationModel: any;
  geomechanicalMarginSG: any;
}

export async function predictRisk(
  depthM: number,
  mudWeightSG: number,
  formation?: string,
  wellId?: string
): Promise<RiskPredictResponse> {
  const res = await apiFetch('/api/risk/predict', {
    method: 'POST',
    body: JSON.stringify({ depthM, mudWeightSG, formation, wellId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new RiskApiError(body.detail || `Failed to compute risk (HTTP ${res.status})`);
  }
  return res.json();
}
