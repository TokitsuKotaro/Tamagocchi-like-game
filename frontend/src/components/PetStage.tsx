import { useState } from 'react'
import { SPECIES } from '../constants/species'
import type { FloatingEffect } from '../hooks/usePetGame'
import type { PetState, SpeciesId } from '../types/pet'
import { CharacterImage } from './CharacterImage'

interface PetStageProps {
  pet: PetState
  effects: FloatingEffect[]
  jumpKey: number
  onPet: () => void
}

function backgroundFor(speciesId: SpeciesId, stage: PetState['stage']): string {
  if (stage === 'egg' || stage === 'baby') return '/assets/backgrounds/sea.png'
  if (speciesId.startsWith('child_sea') || speciesId.startsWith('adult_sea'))
    return '/assets/backgrounds/sea.png'
  if (speciesId.startsWith('child_land') || speciesId.startsWith('adult_land'))
    return '/assets/backgrounds/land.png'
  return '/assets/backgrounds/magic.png'
}

function fallbackGradient(speciesId: SpeciesId): string {
  if (speciesId.startsWith('child_land') || speciesId.startsWith('adult_land'))
    return 'from-[#dff0d8] via-[#eef7e6] to-[#fdf6ec]'
  if (speciesId.startsWith('child_magic') || speciesId.startsWith('adult_magic'))
    return 'from-[#e6dcf7] via-[#f3ecfb] to-[#fdf6ec]'
  return 'from-[#bfe3ec] via-[#e3f3f7] to-[#fdf6ec]'
}

export function PetStage({ pet, effects, jumpKey, onPet }: PetStageProps) {
  const [failedBg, setFailedBg] = useState<string | null>(null)
  const info = SPECIES[pet.speciesId]
  const hungry = pet.hunger === 0
  const background = backgroundFor(pet.speciesId, pet.stage)
  const bgFailed = failedBg === background

  return (
    <main className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden">
      {!bgFailed && (
        <img
          src={background}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={() => setFailedBg(background)}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        />
      )}
      {bgFailed && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 bg-gradient-to-b ${fallbackGradient(pet.speciesId)}`}
        />
      )}

      {hungry && (
        <div className="absolute left-1/2 top-4 z-10 -translate-x-1/2 animate-wiggle rounded-2xl border-2 border-[#e8d3b5] bg-white/95 px-4 py-2 text-center shadow-md">
          <p className="text-base font-bold text-[#6b4f3a]">おなか ぺこぺこ…</p>
          <p className="text-xs text-[#8a6a52]">ごはんを たべたいよ</p>
        </div>
      )}

      {pet.poopCount > 0 && (
        <div className="absolute bottom-24 left-4 z-10 flex gap-1" aria-label={`うんち ${pet.poopCount}こ`}>
          {Array.from({ length: pet.poopCount }, (_, i) => (
            <span key={i} className="text-2xl">💩</span>
          ))}
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 z-10">
        {effects.map((effect) => (
          <span
            key={effect.id}
            className="absolute bottom-40 animate-heart-pop text-3xl"
            style={{ left: `${effect.x}%` }}
          >
            {effect.emoji}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onPet}
        aria-label={`${info.name}を なでる`}
        className="relative z-10 flex h-56 w-56 items-center justify-center rounded-full outline-none transition-transform active:scale-95"
      >
        <div key={jumpKey} className={jumpKey > 0 ? 'animate-jump' : ''}>
          <div className="animate-float">
            <div className="animate-squish">
              <CharacterImage speciesId={pet.speciesId} className="h-48 w-48" />
            </div>
          </div>
        </div>
      </button>
    </main>
  )
}
