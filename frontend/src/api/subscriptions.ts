// ─────────────────────────────────────────────────────────────────────────────
// API CLIENT — Mock implementation
//
// Every function mirrors a real backend endpoint.
// When the backend is ready:
//   1. Delete the entire "Mock store" section below.
//   2. Replace each function body with the real fetch() call shown in the
//      comment block above that function.
//   3. Keep the BASE_URL and the function signatures — components don't change.
// ─────────────────────────────────────────────────────────────────────────────

import type { ApiResponse, Subscription, SubscriptionPayload } from '../types/subscription'

// WIRE TO BACKEND: change this to your actual API base URL if it differs.
const BASE_URL = '/api/subscriptions'

const delay = (ms = 350): Promise<void> => new Promise((res) => setTimeout(res, ms))


// ─── Mock in-memory store (DELETE this entire block when wiring backend) ──────
const todayDate = (): Date => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysFromNow(n: number): string {
  const d = todayDate()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

type StoredSub = Omit<Subscription, 'monthly_cost' | 'days_remaining' | 'is_renewing_soon'>

let _store: StoredSub[] = [
  { id: 1, name: 'Netflix',         cost: 15.99,  billing_cycle: 'monthly', next_renewal_date: daysFromNow(3),  status: 'active' },
  { id: 2, name: 'Spotify',         cost: 9.99,   billing_cycle: 'monthly', next_renewal_date: daysFromNow(6),  status: 'active' },
  { id: 3, name: 'Adobe Creative',  cost: 659.88, billing_cycle: 'yearly',  next_renewal_date: daysFromNow(45), status: 'paused' },
  { id: 4, name: 'AWS',             cost: 34.50,  billing_cycle: 'monthly', next_renewal_date: daysFromNow(21), status: 'active' },
  { id: 5, name: 'YouTube Premium', cost: 13.99,  billing_cycle: 'monthly', next_renewal_date: daysFromNow(60), status: 'active' },
]
let _nextId = 6

// Simulates the server-side computation the backend will do.
function buildResponse(store: StoredSub[]): ApiResponse {
  const today = todayDate()

  const subscriptions: Subscription[] = store.map((s) => {
    const renewal = new Date(s.next_renewal_date + 'T00:00:00')
    renewal.setHours(0, 0, 0, 0)
    const days_remaining = Math.round((renewal.getTime() - today.getTime()) / 86400000)
    const monthly_cost =
      s.billing_cycle === 'yearly'
        ? parseFloat((s.cost / 12).toFixed(2))
        : s.cost

    return {
      ...s,
      monthly_cost,
      days_remaining,
      is_renewing_soon: s.status === 'active' && days_remaining >= 0 && days_remaining <= 7,
    }
  })

  const active = subscriptions.filter((s) => s.status === 'active')
  const monthly_burn_rate = parseFloat(
    active.reduce((sum, s) => sum + s.monthly_cost, 0).toFixed(2)
  )
  const upcoming_renewals_count = subscriptions.filter((s) => s.is_renewing_soon).length

  return { subscriptions, metrics: { monthly_burn_rate, upcoming_renewals_count } }
}
// ─── End mock store ────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// GET all subscriptions + dashboard metrics
//
// WIRE TO BACKEND:
//   const res = await fetch(BASE_URL)
//   if (!res.ok) throw new Error('Failed to fetch subscriptions')
//   return res.json() as Promise<ApiResponse>
//
// Endpoint: GET /api/subscriptions
// ─────────────────────────────────────────────────────────────────────────────
export async function getSubscriptions(): Promise<ApiResponse> {
  await delay()
  return buildResponse(_store)
}


// ─────────────────────────────────────────────────────────────────────────────
// POST a new subscription
//
// WIRE TO BACKEND:
//   const res = await fetch(BASE_URL, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(payload),
//   })
//   if (!res.ok) throw new Error('Failed to add subscription')
//   return res.json() as Promise<ApiResponse>
//
// Endpoint: POST /api/subscriptions
// Request:  SubscriptionPayload (raw form values — backend normalises cost)
// Response: ApiResponse (full updated list + recalculated metrics)
// ─────────────────────────────────────────────────────────────────────────────
export async function addSubscription(payload: SubscriptionPayload): Promise<ApiResponse> {
  await delay()
  _store.push({ id: _nextId++, ...payload, status: 'active' })
  return buildResponse(_store)
}


// ─────────────────────────────────────────────────────────────────────────────
// PATCH toggle a subscription's status (active ↔ paused)
//
// WIRE TO BACKEND:
//   const res = await fetch(`${BASE_URL}/${id}/toggle`, { method: 'PATCH' })
//   if (!res.ok) throw new Error('Failed to toggle subscription')
//   return res.json() as Promise<ApiResponse>
//
// Endpoint: PATCH /api/subscriptions/:id/toggle
// Response: ApiResponse (full updated list + recalculated metrics)
//           Burn rate updates automatically — paused costs are excluded server-side.
// ─────────────────────────────────────────────────────────────────────────────
export async function toggleSubscription(id: number): Promise<ApiResponse> {
  await delay(200)
  const sub = _store.find((s) => s.id === id)
  if (sub) sub.status = sub.status === 'active' ? 'paused' : 'active'
  return buildResponse(_store)
}

// Suppress unused variable warning for BASE_URL until backend is wired.
void BASE_URL
