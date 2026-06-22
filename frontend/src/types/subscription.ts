// ─── Types mirroring the backend's exact field names ──────────────────────────
// Source of truth: backend/src/lib/metrics.ts (EnrichedSubscription, Metrics)
//                  backend/src/routes/subscriptions.ts (request body shape)

export type BillingCycle = 'Monthly' | 'Yearly'   // backend uses title-case
export type SubscriptionStatus = 'Active' | 'Paused' // backend uses title-case

// Shape returned by GET /subscriptions (array) and POST + PATCH (single item).
// Computed fields (monthlyRate, daysUntilRenewal, renewingSoon) are always
// present — the backend runs enrichSubscription() before responding.
export interface Subscription {
  id: number
  serviceName: string
  cost: number
  billingCycle: BillingCycle
  nextRenewalDate: string       // 'YYYY-MM-DD'
  status: SubscriptionStatus
  createdAt: string
  updatedAt: string
  // Enriched by backend — never computed on the frontend
  monthlyRate: number           // yearly cost / 12, else original cost
  daysUntilRenewal: number      // Math.ceil((renewalDate - today) / 86400000)
  renewingSoon: boolean         // daysUntilRenewal <= 7 && status === 'Active'
}

// Shape returned by GET /subscriptions/metrics
export interface Metrics {
  totalMonthlyBurn: number          // sum of active monthlyRate values
  upcomingRenewalsCount: number     // count of active renewingSoon === true
}

// Envelope the API client assembles for App.tsx consumption.
// Both the list endpoint and the metrics endpoint are called together
// and merged into this shape so App.tsx always gets a consistent update.
export interface ApiResponse {
  subscriptions: Subscription[]
  metrics: Metrics
}

// Body sent to POST /subscriptions — raw form data, backend does the rest.
export interface SubscriptionPayload {
  serviceName: string
  cost: number
  billingCycle: BillingCycle
  nextRenewalDate: string
}
