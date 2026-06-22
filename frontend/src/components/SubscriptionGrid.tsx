import type { Subscription } from '../types/subscription'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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

// daysUntilRenewal and renewingSoon both come from the backend — no date math here.
function DaysCell({ days, isSoon }: { days: number; isSoon: boolean }) {
  if (days < 0) {
    return <Badge variant="destructive">Overdue</Badge>
  }
  return (
    <span className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">{days}d</span>
      {isSoon && (
        <Badge
          variant="outline"
          className="border-amber-300 bg-amber-100 text-amber-600 text-[10px] font-bold tracking-wide uppercase"
        >
          Renewing Soon
        </Badge>
      )}
    </span>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <p className="text-foreground font-medium mb-1">No subscriptions yet</p>
      <p className="text-muted-foreground text-sm">
        Add your first service above to start tracking your monthly burn.
      </p>
    </div>
  )
}

export default function SubscriptionGrid({ subscriptions, onToggle, togglingId }: Props) {
  if (subscriptions.length === 0) {
    return (
      <Card className="shadow-sm overflow-hidden">
        <EmptyState />
      </Card>
    )
  }

  return (
    <Card className="shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            {['Service', 'Cost / mo', 'Billing', 'Next renewal', 'Days left', 'Status'].map((h) => (
              <TableHead
                key={h}
                className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground"
              >
                {h}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>

        <TableBody>
          {subscriptions.map((sub) => {
            const isPaused = sub.status === 'Paused' // backend uses title-case
            const isToggling = togglingId === sub.id

            return (
              <TableRow
                key={sub.id}
                className={
                  isPaused
                    ? 'opacity-40'
                    : sub.renewingSoon
                      ? 'bg-amber-50 hover:bg-amber-100 border-l-4 border-l-amber-400'
                      : 'hover:bg-slate-50 border-l-4 border-l-transparent'
                }
                style={
                  isPaused
                    ? {
                        // Diagonal crosshatch signals this cost is excluded from burn rate.
                        backgroundImage:
                          'repeating-linear-gradient(-52deg, transparent 0px, transparent 5px, rgba(0,0,0,0.03) 5px, rgba(0,0,0,0.03) 6px)',
                      }
                    : {}
                }
              >
                {/* serviceName */}
                <TableCell className="font-medium text-sm truncate max-w-[180px]">
                  {sub.serviceName}
                </TableCell>

                {/* monthlyRate — normalised by backend (yearly cost / 12) */}
                <TableCell
                  className={`font-mono text-sm font-semibold ${isPaused ? 'line-through text-muted-foreground' : ''}`}
                >
                  ${sub.monthlyRate.toFixed(2)}
                </TableCell>

                {/* billingCycle */}
                <TableCell className="text-muted-foreground text-sm">
                  {sub.billingCycle}
                </TableCell>

                {/* nextRenewalDate */}
                <TableCell className="text-muted-foreground text-sm">
                  {fmtDate(sub.nextRenewalDate)}
                </TableCell>

                {/* daysUntilRenewal + renewingSoon — both computed by backend */}
                <TableCell>
                  <DaysCell days={sub.daysUntilRenewal} isSoon={sub.renewingSoon} />
                </TableCell>

                {/* Active / Paused toggle — fires PATCH /api/subscriptions/:id/toggle */}
                <TableCell>
                  <ToggleSwitch
                    active={!isPaused}
                    onToggle={() => onToggle(sub.id)}
                    disabled={isToggling}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </Card>
  )
}
