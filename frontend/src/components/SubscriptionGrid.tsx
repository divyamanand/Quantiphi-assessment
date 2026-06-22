import type { Subscription } from '../types/subscription'
import ToggleSwitch from './ToggleSwitch'

interface Props {
  subscriptions: Subscription[]
  onToggle: (id: number) => void
  togglingId: number | null
}

function fmtDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Renders the days_remaining label + "Renewing Soon" badge.
// Both values come from the backend — no date math here.
function DaysCell({ days, isSoon }: { days: number; isSoon: boolean }) {
  if (days < 0) {
    return <span className="text-red-400 font-medium text-xs">Overdue</span>
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-slate-500 text-sm">{days}d</span>
      {isSoon && (
        <span className="inline-flex items-center gap-1 bg-amber-100 border border-amber-300 text-amber-600 text-[10px] font-bold tracking-wide uppercase px-2 py-0.5 rounded">
          ⚑ Soon
        </span>
      )}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <p className="text-slate-700 font-medium mb-1">No subscriptions yet</p>
      <p className="text-slate-400 text-sm">
        Add your first service above to start tracking your monthly burn.
      </p>
    </div>
  )
}

const HEADERS = ['Service', 'Cost / mo', 'Billing', 'Next renewal', 'Days left', 'Status']

// Renders the subscription table.
// - All displayed values come directly from the API response.
// - onToggle(id) is the only user event that triggers an API call.
export default function SubscriptionGrid({ subscriptions, onToggle, togglingId }: Props) {
  if (subscriptions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <EmptyState />
      </div>
    )
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Table header */}
      <div className="grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr_100px] px-5 py-3 bg-slate-50 border-b border-slate-200">
        {HEADERS.map((h) => (
          <span
            key={h}
            className="text-[10px] font-semibold tracking-widest uppercase text-slate-400"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {subscriptions.map((sub) => {
        const isPaused = sub.status === 'paused'
        const isToggling = togglingId === sub.id

        return (
          <div
            key={sub.id}
            className={`
              grid grid-cols-[2fr_1fr_1fr_1.2fr_1fr_100px] px-5 py-3.5
              border-b border-slate-100 last:border-0 items-center
              transition-all duration-200
              ${isPaused ? 'opacity-40' : 'hover:bg-slate-50'}
            `}
            style={
              isPaused
                ? {
                    // Diagonal crosshatch — signals this cost is excluded from burn rate.
                    backgroundImage:
                      'repeating-linear-gradient(-52deg, transparent 0px, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 6px)',
                  }
                : {}
            }
          >
            {/* Service name */}
            <span className="font-medium text-slate-800 text-sm truncate pr-2">
              {sub.name}
            </span>

            {/* monthly_cost — normalised by backend (yearly cost / 12) */}
            <span
              className={`font-mono text-sm font-semibold ${
                isPaused ? 'line-through text-slate-400' : 'text-slate-700'
              }`}
            >
              ${sub.monthly_cost.toFixed(2)}
            </span>

            {/* Billing cycle */}
            <span className="text-slate-400 text-sm capitalize">{sub.billing_cycle}</span>

            {/* Next renewal date */}
            <span className="text-slate-500 text-sm">{fmtDate(sub.next_renewal_date)}</span>

            {/* days_remaining + is_renewing_soon — both computed by backend */}
            <DaysCell days={sub.days_remaining} isSoon={sub.is_renewing_soon} />

            {/* Active / Paused toggle — fires PATCH /api/subscriptions/:id/toggle */}
            <ToggleSwitch
              active={!isPaused}
              onToggle={() => onToggle(sub.id)}
              disabled={isToggling}
            />
          </div>
        )
      })}
    </div>
  )
}
