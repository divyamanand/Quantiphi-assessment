// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT — wired to the real backend
//
// All requests go through Vite's proxy:
//   /api/* → http://localhost:4000/* (prefix stripped)
//
// Backend endpoints (Express, port 4000):
//   GET    /subscriptions              → Subscription[]
//   GET    /subscriptions/metrics      → Metrics
//   POST   /subscriptions              → Subscription  (single, newly created)
//   PATCH  /subscriptions/:id/toggle   → Subscription  (single, updated)
//   DELETE /subscriptions/:id          → 204 No Content
//
// Because POST and PATCH return only a single subscription (not the full list),
// this client re-fetches the full list + metrics after each mutation so
// App.tsx always receives a consistent ApiResponse.
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiResponse, Subscription, Metrics, SubscriptionPayload } from '../types/subscription'
import { NetworkError, ApiError } from '../lib/errors'

// In dev, Vite proxies /api/* to VITE_API_BASE_URL (see vite.config.js).
// In production builds, requests go directly to VITE_API_BASE_URL/subscriptions.
const API_ORIGIN = import.meta.env.VITE_API_BASE_URL ?? ''
const BASE = `${API_ORIGIN}/subscriptions`

async function http<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response

  try {
    res = await fetch(url, init)
  } catch {
    // fetch() rejects when the network is unavailable or the backend is unreachable.
    throw new NetworkError()
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string; errors?: string[]; code?: string }
    // Surface the backend's own message for 4xx (actionable validation errors).
    // Use a generic message for 5xx (nothing the user can act on).
    const message =
      res.status < 500
        ? (body.errors?.join(', ') ?? body.error ?? `Request failed (${res.status})`)
        : 'Server error. Try again shortly.'
    throw new ApiError(message, res.status, body.code)
  }

  // 204 No Content — return undefined cast to T
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

// Fetches the full list and metrics in parallel, merges into ApiResponse.
async function fetchAll(): Promise<ApiResponse> {
  const [subscriptions, metrics] = await Promise.all([
    http<Subscription[]>(BASE),
    http<Metrics>(`${BASE}/metrics`),
  ])
  return { subscriptions, metrics }
}


// ─────────────────────────────────────────────────────────────────────────────
// GET all subscriptions + dashboard metrics
// Calls GET /subscriptions and GET /subscriptions/metrics in parallel.
// ─────────────────────────────────────────────────────────────────────────────
export async function getSubscriptions(): Promise<ApiResponse> {
  return fetchAll()
}


// ─────────────────────────────────────────────────────────────────────────────
// POST a new subscription, then return the refreshed full list + metrics.
// Body field names must match backend's validateBody():
//   serviceName, cost, billingCycle, nextRenewalDate
// ─────────────────────────────────────────────────────────────────────────────
export async function addSubscription(payload: SubscriptionPayload): Promise<ApiResponse> {
  await http<Subscription>(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  // Re-fetch so App.tsx gets the full updated list + recalculated metrics.
  return fetchAll()
}


// ─────────────────────────────────────────────────────────────────────────────
// PATCH /subscriptions/:id/toggle, then return the refreshed full list + metrics.
// Backend toggles Active ↔ Paused and returns the updated single subscription.
// We re-fetch everything so metrics reflect the new status immediately.
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleSubscription(id: number): Promise<ApiResponse> {
  await http<Subscription>(`${BASE}/${id}/toggle`, { method: 'PATCH' })
  return fetchAll()
}


// ─────────────────────────────────────────────────────────────────────────────
// DELETE /subscriptions/:id, then return the refreshed full list + metrics.
// Backend returns 204 No Content on success.
// ─────────────────────────────────────────────────────────────────────────────
export async function deleteSubscription(id: number): Promise<ApiResponse> {
  await http<void>(`${BASE}/${id}`, { method: 'DELETE' })
  return fetchAll()
}
