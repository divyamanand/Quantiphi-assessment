import { useState } from 'react'
import type { SubscriptionPayload, BillingCycle } from '../types/subscription'

interface FormState {
  name: string
  cost: string
  billing_cycle: BillingCycle
  next_renewal_date: string
}

interface Props {
  onSubmit: (payload: SubscriptionPayload) => void
  submitting: boolean
}

const EMPTY: FormState = {
  name: '',
  cost: '',
  billing_cycle: 'monthly',
  next_renewal_date: '',
}

// Collects user input and fires onSubmit(payload) — no validation logic,
// no cost normalisation. Raw form values go straight to the backend.
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
    if (!form.name.trim()) return setError('Service name is required.')
    const cost = Number(form.cost)
    if (!form.cost || isNaN(cost) || cost <= 0) return setError('Enter a valid cost greater than 0.')
    if (!form.next_renewal_date) return setError('Pick a renewal date.')

    // Send raw values — backend normalises cost and computes monthly rate.
    onSubmit({
      name: form.name.trim(),
      cost,
      billing_cycle: form.billing_cycle,
      next_renewal_date: form.next_renewal_date,
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
          <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Service name
          </label>
          <input
            type="text"
            placeholder="e.g. Netflix"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Cost */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[110px]">
          <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Cost ($)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={form.cost}
            onChange={(e) => set('cost', e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-300 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition font-mono"
          />
        </div>

        {/* Billing cycle */}
        <div className="flex flex-col gap-1.5 min-w-[130px]">
          <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Billing cycle
          </label>
          <select
            value={form.billing_cycle}
            onChange={(e) => set('billing_cycle', e.target.value as BillingCycle)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition bg-white cursor-pointer"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        {/* Renewal date picker */}
        <div className="flex flex-col gap-1.5 min-w-[160px]">
          <label className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
            Next renewal date
          </label>
          <input
            type="date"
            value={form.next_renewal_date}
            onChange={(e) => set('next_renewal_date', e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2 rounded-lg transition cursor-pointer disabled:cursor-not-allowed"
        >
          {submitting ? 'Adding…' : 'Add subscription'}
        </button>
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-500">{error}</p>
      )}
    </form>
  )
}
