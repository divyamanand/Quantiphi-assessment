import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getSubscriptions, addSubscription, toggleSubscription, deleteSubscription } from './api/subscriptions'
import { ApiError } from './lib/errors'
import type { Subscription, Metrics, SubscriptionPayload } from './types/subscription'
import MetricsRow from './components/MetricsRow'
import EntryForm from './components/EntryForm'
import SubscriptionGrid from './components/SubscriptionGrid'
import { Toaster } from './components/ui/sonner'

export default function App() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Applies an API response to local state.
  // GET, POST, and PATCH all return the same ApiResponse shape.
  function applyResponse(data: { subscriptions: Subscription[]; metrics: Metrics }) {
    setSubscriptions(data.subscriptions)
    setMetrics(data.metrics)
  }

  // ── Initial load ───────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSubscriptions()
      applyResponse(data)
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Could not load subscriptions. Please refresh the page.',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ── Add subscription ───────────────────────────────────────────────────────
  async function handleAdd(payload: SubscriptionPayload) {
    setSubmitting(true)
    try {
      // Raw form values — backend normalises cost and computes monthly rate.
      const data = await addSubscription(payload)
      applyResponse(data)
      toast.success('Subscription added.')
    } catch (err) {
      // Surface backend validation messages for 4xx (e.g. "serviceName is required")
      // so the user knows exactly what to fix.
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to add subscription. Please try again.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  // ── Delete subscription ────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    setDeletingId(id)
    try {
      const data = await deleteSubscription(id)
      applyResponse(data)
      toast.success('Subscription removed.')
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to remove subscription. Try again.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ── Toggle active / paused ─────────────────────────────────────────────────
  async function handleToggle(id: number) {
    setTogglingId(id)
    try {
      // Backend toggles status and returns full updated list + recalculated metrics.
      // Burn rate reflects the change immediately — paused costs excluded server-side.
      const data = await toggleSubscription(id)
      applyResponse(data)
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : 'Failed to update subscription status. Try again.',
      )
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Toaster renders toast notifications above all other content */}
      <Toaster richColors position="top-right" />

      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-mono font-bold text-white text-sm">
            $
          </div>
          <span className="font-semibold text-slate-800 tracking-tight">SubTrack</span>
        </div>
        <span className="text-xs text-slate-400 tracking-wide">
          Subscription Tracker &amp; Renewal Dashboard
        </span>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Metric cards — values are whatever the API returned */}
        <MetricsRow metrics={metrics} loading={loading} />

        {/* Entry form — sends raw input to backend */}
        <EntryForm onSubmit={handleAdd} submitting={submitting} />

        {/* Subscription table — renders enriched data from backend */}
        {loading ? (
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-5 py-16 text-center text-slate-400 text-sm">
            Loading subscriptions…
          </div>
        ) : (
          <SubscriptionGrid
            subscriptions={subscriptions}
            onToggle={handleToggle}
            togglingId={togglingId}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
      </main>
    </div>
  )
}
