import { ALL_SPECIES_IDS, SPECIES, TOTAL_SPECIES_COUNT } from '../constants/species'
import type { SpeciesId } from '../types/pet'
import { CharacterImage } from './CharacterImage'

interface EncyclopediaModalProps {
  open: boolean
  onClose: () => void
  encyclopedia: SpeciesId[]
}

export function EncyclopediaModal({ open, onClose, encyclopedia }: EncyclopediaModalProps) {
  if (!open) return null

  const owned = new Set(encyclopedia)

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col bg-[#fdf6ec]"
      role="dialog"
      aria-modal="true"
      aria-label="ずかん"
    >
      <div className="flex items-center justify-between border-b-2 border-[#e8d3b5] px-4 py-3">
        <div>
          <h2 className="text-lg font-bold text-[#6b4f3a]">ずかん</h2>
          <p className="text-xs text-[#8a6a52]">
            {owned.size} / {TOTAL_SPECIES_COUNT} しゅるい みつけたよ
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="とじる"
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-sm active:scale-90"
        >
          ✕
        </button>
      </div>

      <div className="grid flex-1 grid-cols-3 content-start gap-2 overflow-y-auto p-3">
        {ALL_SPECIES_IDS.map((id) => {
          const info = SPECIES[id]
          const isOwned = owned.has(id)
          return (
            <div
              key={id}
              className={`flex flex-col items-center justify-center gap-1 rounded-3xl border-2 p-2 text-center shadow-sm ${
                isOwned ? 'border-[#e8d3b5] bg-white' : 'border-dashed border-[#e8d3b5] bg-[#f7e8d0]/40'
              }`}
            >
              {isOwned ? (
                <>
                  <CharacterImage speciesId={id} className="h-16 w-16" />
                  <p className="text-[11px] font-bold leading-tight text-[#6b4f3a]">{info.name}</p>
                </>
              ) : (
                <>
                  <span className="flex h-16 w-16 items-center justify-center text-4xl text-[#c9b294]">？</span>
                  <p className="text-[11px] font-bold text-[#c9b294]">？？？</p>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
