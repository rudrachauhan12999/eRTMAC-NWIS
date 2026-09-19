/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HistoricalIncident } from '../data/wellsData.ts';
import { apiFetch } from './apiConfig.ts';

export class EventsApiError extends Error {}

export async function fetchEvents(): Promise<HistoricalIncident[]> {
  const res = await apiFetch('/api/events');
  if (!res.ok) {
    throw new EventsApiError(`Failed to load documents (HTTP ${res.status})`);
  }
  const data: { events: HistoricalIncident[]; total: number } = await res.json();
  return data.events;
}

export async function fetchWellEvents(wellId: string): Promise<HistoricalIncident[]> {
  const res = await apiFetch(`/api/wells/${encodeURIComponent(wellId)}/events`);
  if (!res.ok) {
    throw new EventsApiError(`Failed to load events for this well (HTTP ${res.status})`);
  }
  const data: { events: HistoricalIncident[]; total: number } = await res.json();
  return data.events;
}

export async function createEvent(incident: HistoricalIncident): Promise<HistoricalIncident> {
  const res = await apiFetch('/api/events', {
    method: 'POST',
    body: JSON.stringify(incident),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new EventsApiError(body.detail || `Failed to index document (HTTP ${res.status})`);
  }
  return res.json();
}

export async function deleteEvent(eventId: string): Promise<void> {
  const res = await apiFetch(`/api/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
  });
  if (!res.ok && res.status !== 404) {
    throw new EventsApiError(`Failed to delete document (HTTP ${res.status})`);
  }
}
