// ─── Shared types — consumed by both the API client and all components ─────────

export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionStatus = 'active' | 'paused'

// Shape of a single subscription as returned by the backend.
// All computed fields (monthly_cost, days_remaining, is_renewing_soon)
// are calculated server-side — the frontend never derives them.
export interface Subscription {
  id: number
  name: string
  cost: number                   // original entered cost
  billing_cycle: BillingCycle
  monthly_cost: number           // normalised by backend (yearly / 12)
  next_renewal_date: string      // 'YYYY-MM-DD'
  days_remaining: number         // backend calculates: renewal_date - today
  is_renewing_soon: boolean      // backend flags: days_remaining <= 7 && active
  status: SubscriptionStatus
}

// Dashboard metrics — computed server-side from active subscriptions only.
export interface Metrics {
  monthly_burn_rate: number         // sum of active monthly_cost values
  upcoming_renewals_count: number   // count of active is_renewing_soon === true
}

// Envelope returned by every API endpoint (GET, POST, PATCH).
export interface ApiResponse {
  subscriptions: Subscription[]
  metrics: Metrics
}

// Payload sent to POST /api/subscriptions — raw form data, no normalisation.
export interface SubscriptionPayload {
  name: string
  cost: number
  billing_cycle: BillingCycle
  next_renewal_date: string
}
