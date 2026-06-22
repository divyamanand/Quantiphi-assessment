import { useState } from 'react'
import type { SubscriptionPayload, BillingCycle } from '../types/subscription'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import DatePicker from './DatePicker'

interface FormState {
  serviceName: string
  cost: string
  billingCycle: BillingCycle
  nextRenewalDate: string
}

interface Props {
  onSubmit: (payload: SubscriptionPayload) => void
  submitting: boolean
}

const EMPTY: FormState = {
  serviceName: '',
  cost: '',
  billingCycle: 'Monthly',
  nextRenewalDate: '',
}

// Collects user input and fires onSubmit(payload).
// Field names match backend's validateBody(): serviceName, cost, billingCycle, nextRenewalDate.
// No cost normalisation — backend handles that.
export default function EntryForm({ onSubmit, submitting }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [error, setError] = useState('')

  function set<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
    setError('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Basic presence checks — backend performs full validation.
    if (!form.serviceName.trim()) return setError('Service name is required.')
    const cost = Number(form.cost)
    if (!form.cost || isNaN(cost) || cost <= 0) return setError('Enter a valid cost greater than 0.')
    if (!form.nextRenewalDate) return setError('Pick a renewal date.')
    const today = new Date(); today.setHours(0, 0, 0, 0)
    if (new Date(form.nextRenewalDate + 'T00:00:00') < today) return setError('Renewal date must be today or in the future.')

    onSubmit({
      serviceName: form.serviceName.trim(),
      cost,
      billingCycle: form.billingCycle,
      nextRenewalDate: form.nextRenewalDate,
    })

    setForm(EMPTY)
    setError('')
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-slate-200 rounded-2xl p-5 mb-6 shadow-sm"
    >
      <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-400 mb-4">
        Add Subscription
      </p>

      <div className="flex gap-3 items-end flex-wrap">
        {/* Service name */}
        <div className="flex flex-col gap-1.5 flex-[2] min-w-[160px]">
          <Label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Service name
          </Label>
          <Input
            type="text"
            placeholder="e.g. Netflix"
            value={form.serviceName}
            onChange={(e) => set('serviceName', e.target.value)}
          />
        </div>

        {/* Cost — currency number field with visible $ prefix */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[110px]">
          <Label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Cost
          </Label>
          <div className="flex items-center border border-input rounded-md focus-within:ring-2 focus-within:ring-ring overflow-hidden">
            <span className="px-2.5 text-sm font-mono text-muted-foreground bg-muted border-r border-input h-full flex items-center select-none py-2">
              $
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={form.cost}
              onChange={(e) => set('cost', e.target.value)}
              className="border-0 rounded-none shadow-none focus-visible:ring-0 font-mono"
            />
          </div>
        </div>

        {/* Billing cycle — values must match backend enum: 'Monthly' | 'Yearly' */}
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <Label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Billing cycle
          </Label>
          <Select
            value={form.billingCycle}
            onValueChange={(v) => set('billingCycle', v as BillingCycle)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Monthly">Monthly</SelectItem>
              <SelectItem value="Yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Renewal date */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <Label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Next renewal date
          </Label>
          <DatePicker
            value={form.nextRenewalDate}
            onChange={(v) => set('nextRenewalDate', v)}
          />
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add subscription'}
        </Button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-destructive">{error}</p>
      )}
    </form>
  )
}
