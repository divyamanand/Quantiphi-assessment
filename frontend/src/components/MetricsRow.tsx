import type { Metrics } from '../types/subscription'

interface Props {
  metrics: Metrics | null
  loading: boolean
}

// Renders the two top-level metric cards.
// All values come directly from the API — no computation here.
export default function MetricsRow({ metrics, loading }: Props) {
  const burnRate = metrics?.monthly_burn_rate ?? 0
  const alertCount = metrics?.upcoming_renewals_count ?? 0

  return (
    <div className="grid grid-cols-2 gap-5 mb-6">
      {/* ── Monthly Burn Rate ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-7 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-transparent" />

        <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-3">
          Monthly Burn Rate
        </p>

        <p className="font-mono text-5xl font-bold text-slate-800 tracking-tight leading-none">
          {loading ? '—' : `$${burnRate.toFixed(2)}`}
        </p>

        <p className="mt-3 text-xs text-slate-400">
          Active subscriptions only
        </p>
      </div>

      {/* ── Upcoming Renewals ── */}
      <div className="bg-amber-50 rounded-2xl border border-amber-200 p-7 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-transparent" />

        <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500 mb-3">
          Renewing Soon
        </p>

        <p className="font-mono text-5xl font-bold text-amber-600 tracking-tight leading-none">
          {loading ? '—' : alertCount}
        </p>

        <p className="mt-3 text-xs text-amber-500">
          Active subscriptions within 7 days
        </p>
      </div>
    </div>
  )
}
