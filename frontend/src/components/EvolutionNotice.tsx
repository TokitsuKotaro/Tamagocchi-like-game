import { SPECIES } from '../constants/species'
import type { SpeciesId } from '../types/pet'
import { CharacterImage } from './CharacterImage'

interface EvolutionNoticeProps {
  speciesId: SpeciesId | null
  onDismiss: () => void
}

export function EvolutionNotice({ speciesId, onDismiss }: EvolutionNoticeProps) {
  if (!speciesId) return null
  const info = SPECIES[speciesId]

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 p-6"
      role="alertdialog"
      aria-modal="true"
      aria-label="へんしんしたよ"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-3 rounded-3xl border-4 border-[#f7e8d0] bg-[#fdf6ec] p-6 text-center shadow-2xl">
        <p className="text-xl font-bold text-[#6b4f3a]">へんしんしたよ！</p>
        <div className="animate-sparkle">
          <CharacterImage speciesId={speciesId} className="h-36 w-36" />
        </div>
        <p className="text-lg font-bold text-[#6b4f3a]">{info.name}</p>
        <p className="text-xs text-[#8a6a52]">{info.description}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-1 h-14 w-full rounded-2xl bg-[#f2b8c6] text-base font-bold text-[#6b4f3a] shadow active:scale-95"
        >
          やったー！
        </button>
      </div>
    </div>
  )
}
