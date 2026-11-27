import { useState } from 'react'
import { SPECIES } from '../constants/species'
import type { SpeciesId } from '../types/pet'

interface CharacterImageProps {
  speciesId: SpeciesId
  className?: string
}

export function CharacterImage({ speciesId, className }: CharacterImageProps) {
  const [failedId, setFailedId] = useState<SpeciesId | null>(null)
  const info = SPECIES[speciesId]
  const failed = failedId === speciesId

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 ${className ?? ''}`}
        role="img"
        aria-label={info.name}
      >
        <span className="text-8xl leading-none drop-shadow-sm">{info.emoji}</span>
        <span className="rounded-full bg-white/70 px-4 py-1 text-lg font-bold text-[#6b4f3a] shadow-sm">
          {info.name}
        </span>
      </div>
    )
  }

  return (
    <img
      src={`/assets/characters/${speciesId}.png`}
      alt={info.name}
      draggable={false}
      onError={() => setFailedId(speciesId)}
      className={`object-contain drop-shadow-md ${className ?? ''}`}
    />
  )
}
