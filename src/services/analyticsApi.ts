/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { apiFetch } from './apiConfig.ts';

export class AnalyticsApiError extends Error {}

export interface AnalyticsOverview {
  wellId: string | null;
  wells: { total: number; byStatus: Record<string, number>; note: string };
  events: {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    bySourceType: Record<string, number>;
    byFormation: Record<string, number>;
    depthDistribution: Record<string, number>;
    note: string;
  };
  alerts: {
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    bySourceType: Record<string, number>;
    simulationDerivedCount: number;
    note: string;
  };
  documents: {
    total: number;
    bySourceType: Record<string, number>;
    totalChunksIndexed: number;
    note: string;
  };
}

export interface WellComparisonEntry {
  wellId: string;
  wellName: string;
  distanceKm: number;
  targetDepthM: number;
  formationDepthStartM: number | null;
  formationDepthEndM: number | null;
  hasMudLossEvent: boolean;
  sourceType: string;
}

export interface FormationAnalyticsEntry {
  formation: string;
  depthStartM: number;
  depthEndM: number;
  hazardSeverity: string;
  incidentCount: number;
  totalNptHours: number;
  severityDistribution: Record<string, number>;
}

export interface FormationAnalyticsResponse {
  formations: FormationAnalyticsEntry[];
  wellComparison: WellComparisonEntry[];
}

export async function fetchAnalyticsOverview(wellId?: string): Promise<AnalyticsOverview> {
  const params = wellId ? `?wellId=${encodeURIComponent(wellId)}` : '';
  const res = await apiFetch(`/api/analytics/overview${params}`);
  if (!res.ok) {
    throw new AnalyticsApiError(`Failed to load analytics overview (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchFormationAnalytics(wellId?: string): Promise<FormationAnalyticsResponse> {
  const params = wellId ? `?wellId=${encodeURIComponent(wellId)}` : '';
  const res = await apiFetch(`/api/analytics/formations${params}`);
  if (!res.ok) {
    throw new AnalyticsApiError(`Failed to load formation analytics (HTTP ${res.status})`);
  }
  return res.json();
}
