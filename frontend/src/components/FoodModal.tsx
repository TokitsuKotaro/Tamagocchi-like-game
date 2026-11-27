import type { ActionType } from '../types/pet'

interface FoodModalProps {
  open: boolean
  onClose: () => void
  onSelect: (action: ActionType) => void
}

const FOODS: { action: ActionType; emoji: string; label: string; description: string }[] = [
  { action: 'feed_sea', emoji: '🍮', label: 'うみゼリー', description: 'うみの いきものに なりやすいよ' },
  { action: 'feed_land', emoji: '🍖', label: 'おにく', description: 'りくの いきものに なりやすいよ' },
  { action: 'feed_magic', emoji: '🍬', label: 'ほしこんぺいとう', description: 'ふしぎな いきものに なりやすいよ' },
]

export function FoodModal({ open, onClose, onSelect }: FoodModalProps) {
  if (!open) return null

  return (
    <div
      className="absolute inset-0 z-20 flex items-end justify-center bg-black/30"
      role="dialog"
      aria-modal="true"
      aria-label="ごはんを えらぶ"
      onClick={onClose}
    >
      <div
        className="w-full rounded-t-3xl bg-[#fdf6ec] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#6b4f3a]">ごはんを えらんでね</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="とじる"
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-sm active:scale-90"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {FOODS.map((food) => (
            <button
              key={food.action}
              type="button"
              onClick={() => {
                onSelect(food.action)
                onClose()
              }}
              className="flex min-h-[120px] flex-col items-center justify-center gap-1 rounded-3xl border-2 border-[#e8d3b5] bg-white p-2 shadow-sm transition-transform active:scale-95"
            >
              <span className="text-4xl" aria-hidden="true">
                {food.emoji}
              </span>
              <span className="text-sm font-bold text-[#6b4f3a]">{food.label}</span>
              <span className="text-[10px] leading-tight text-[#8a6a52]">{food.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
