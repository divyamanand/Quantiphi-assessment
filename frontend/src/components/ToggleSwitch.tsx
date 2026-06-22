import { Switch } from '@/components/ui/switch'

interface Props {
  active: boolean
  onToggle: () => void
  disabled?: boolean
}

// Pure UI toggle — no state, no logic. Fires onToggle() on click.
export default function ToggleSwitch({ active, onToggle, disabled = false }: Props) {
  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={active}
        onCheckedChange={onToggle}
        disabled={disabled}
        aria-label={active ? 'Pause subscription' : 'Activate subscription'}
      />
      <span className={`text-xs font-semibold ${active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
        {active ? 'Active' : 'Paused'}
      </span>
    </div>
  )
}
