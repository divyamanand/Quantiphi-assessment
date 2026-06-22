import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props {
  value: string        // YYYY-MM-DD or ''
  onChange: (v: string) => void
}

function parseLocal(yyyyMmDd: string): Date {
  const [y, m, d] = yyyyMmDd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function toYMD(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function DatePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const selected = value ? parseLocal(value) : undefined

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  function handleSelect(date: Date | undefined) {
    if (date) {
      onChange(toYMD(date))
      setOpen(false)
    }
  }

  const label = selected
    ? selected.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Pick a date'

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start text-left font-normal"
        >
          <CalendarIcon className="mr-2 size-4 opacity-50" />
          <span className={selected ? '' : 'text-muted-foreground'}>{label}</span>
        </Button>
      } />
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={{ before: today }}
        />
      </PopoverContent>
    </Popover>
  )
}
