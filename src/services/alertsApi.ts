/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertItem } from '../data/wellsData.ts';
import { apiFetch } from './apiConfig.ts';

export class AlertsApiError extends Error {}

export async function fetchAlerts(wellId?: string): Promise<AlertItem[]> {
  const params = wellId ? `?wellId=${encodeURIComponent(wellId)}` : '';
  const res = await apiFetch(`/api/alerts${params}`);
  if (!res.ok) {
    throw new AlertsApiError(`Failed to load alerts (HTTP ${res.status})`);
  }
  const data: { alerts: AlertItem[] } = await res.json();
  return data.alerts;
}

export async function acknowledgeAlert(alertId: string): Promise<AlertItem> {
  const res = await apiFetch(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'POST' });
  if (!res.ok) {
    throw new AlertsApiError(`Failed to acknowledge alert (HTTP ${res.status})`);
  }
  return res.json();
}

export async function resolveAlert(alertId: string): Promise<AlertItem> {
  const res = await apiFetch(`/api/alerts/${encodeURIComponent(alertId)}/resolve`, { method: 'POST' });
  if (!res.ok) {
    throw new AlertsApiError(`Failed to resolve alert (HTTP ${res.status})`);
  }
  return res.json();
}
