interface Props {
  active: boolean
  onToggle: () => void
  disabled?: boolean
}

// Pure UI toggle — no state, no logic. Fires onToggle() on click.
export default function ToggleSwitch({ active, onToggle, disabled = false }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      disabled={disabled}
      className="flex items-center gap-2 cursor-pointer disabled:cursor-wait"
    >
      {/* Track */}
      <span
        className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 ${
          active ? 'bg-emerald-500' : 'bg-slate-300'
        }`}
      >
        {/* Thumb */}
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${
            active ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </span>

      <span
        className={`text-xs font-semibold transition-colors ${
          active ? 'text-emerald-600' : 'text-slate-400'
        }`}
      >
        {active ? 'Active' : 'Paused'}
      </span>
    </button>
  )
}
