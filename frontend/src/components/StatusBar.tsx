import { MAX_HAPPINESS, MAX_HUNGER } from '../services/evolution'

interface StatusBarProps {
  hunger: number
  happiness: number
  onOpenAdmin: () => void
}

function RiceBall({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`text-xl leading-none transition-opacity ${filled ? 'opacity-100' : 'opacity-25 grayscale'}`}
    >
      🍙
    </span>
  )
}

function Heart({ filled }: { filled: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`text-xl leading-none transition-opacity ${filled ? 'opacity-100' : 'opacity-25 grayscale'}`}
    >
      ❤️
    </span>
  )
}

export function StatusBar({ hunger, happiness, onOpenAdmin }: StatusBarProps) {
  return (
    <header className="relative z-10 flex items-center justify-between gap-1 rounded-b-3xl border-b-4 border-[#e8d3b5] bg-[#f7e8d0]/95 px-2 pb-2 pt-3 shadow-sm">
      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap rounded-full bg-white/80 px-1.5 py-1 text-[10px] font-bold text-[#6b4f3a] shadow-sm">
          おなか
        </span>
        <div className="flex items-center gap-0.5" aria-label={`おなか ${hunger}/${MAX_HUNGER}`}>
          {Array.from({ length: MAX_HUNGER }, (_, i) => (
            <RiceBall key={i} filled={i < hunger} />
          ))}
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="whitespace-nowrap rounded-full bg-white/80 px-1.5 py-1 text-[10px] font-bold text-[#6b4f3a] shadow-sm">
          きげん
        </span>
        <div className="flex items-center gap-0.5" aria-label={`きげん ${happiness}/${MAX_HAPPINESS}`}>
          {Array.from({ length: MAX_HAPPINESS }, (_, i) => (
            <Heart key={i} filled={i < happiness} />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenAdmin}
        aria-label="おとなよう せってい"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/70 text-xl shadow-sm transition-transform active:scale-90"
      >
        ⚙️
      </button>
    </header>
  )
}
