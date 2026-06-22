import type { Metrics } from '../types/subscription'
import { Card, CardContent } from '@/components/ui/card'

interface Props {
  metrics: Metrics | null
  loading: boolean
}

// Renders the two top-level metric cards.
// Field names match backend's Metrics type: totalMonthlyBurn, upcomingRenewalsCount.
export default function MetricsRow({ metrics, loading }: Props) {
  const burnRate = metrics?.totalMonthlyBurn ?? 0
  const alertCount = metrics?.upcomingRenewalsCount ?? 0

  return (
    <div className="grid grid-cols-2 gap-5 mb-6">
      {/* ── Total Monthly Burn Rate ── */}
      <Card className="relative overflow-hidden shadow-sm">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 to-transparent" />
        <CardContent className="p-7">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-muted-foreground mb-3">
            Total Monthly Burn Rate
          </p>
          <p className="font-mono text-5xl font-bold text-foreground tracking-tight leading-none">
            {loading ? '—' : `$${burnRate.toFixed(2)}`}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Active subscriptions only
          </p>
        </CardContent>
      </Card>

      {/* ── Upcoming Renewals Alert Count ── */}
      <Card className="relative overflow-hidden shadow-sm bg-amber-50 border-amber-200">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-400 to-transparent" />
        <CardContent className="p-7">
          <p className="text-[11px] font-semibold tracking-widest uppercase text-amber-500 mb-3">
            Upcoming Renewals Alert Count
          </p>
          <p className="font-mono text-5xl font-bold text-amber-600 tracking-tight leading-none">
            {loading ? '—' : alertCount}
          </p>
          <p className="mt-3 text-xs text-amber-500">
            Active subscriptions within 7 days
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
