interface ActionBarProps {
  onFeed: () => void
  onPlay: () => void
  onClean: () => void
  onOpenEncyclopedia: () => void
  poopCount: number
}

interface ActionButtonProps {
  label: string
  emoji: string
  onClick: () => void
  badge?: number
}

function ActionButton({ label, emoji, onClick, badge }: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative flex h-[76px] w-[76px] flex-col items-center justify-center gap-0.5 rounded-3xl border-2 border-[#e8d3b5] bg-[#fffaf0] shadow-md transition-transform active:scale-90"
    >
      <span className="text-3xl leading-none" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-xs font-bold text-[#6b4f3a]">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#e88f8f] text-xs font-bold text-white shadow">
          {badge}
        </span>
      )}
    </button>
  )
}

export function ActionBar({
  onFeed,
  onPlay,
  onClean,
  onOpenEncyclopedia,
  poopCount,
}: ActionBarProps) {
  return (
    <nav className="relative z-10 flex items-center justify-around gap-2 rounded-t-3xl border-t-4 border-[#e8d3b5] bg-[#f7e8d0]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-2px_8px_rgba(0,0,0,0.05)]">
      <ActionButton label="ごはん" emoji="🍚" onClick={onFeed} />
      <ActionButton label="あそぶ" emoji="⚽" onClick={onPlay} />
      <ActionButton label="おそうじ" emoji="🧹" onClick={onClean} badge={poopCount} />
      <ActionButton label="ずかん" emoji="📖" onClick={onOpenEncyclopedia} />
    </nav>
  )
}
