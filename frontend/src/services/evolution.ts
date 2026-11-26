import type {
  ActionResult,
  ActionType,
  PetData,
  PetPoints,
  PetState,
  SpeciesId,
} from '../types/pet'

export const MAX_HUNGER = 5
export const MAX_HAPPINESS = 5
export const MAX_POOP = 3

export const HUNGER_DECAY_SECONDS = 2 * 60 * 60
export const HAPPINESS_DECAY_SECONDS = 3 * 60 * 60
export const POOP_INTERVAL_SECONDS = 4 * 60 * 60

export const EGG_HATCH_SECONDS = 10 * 60
export const EGG_HATCH_GENTLE = 3
export const BABY_TO_CHILD_SECONDS = 12 * 60 * 60
export const CHILD_TO_ADULT_SECONDS = 36 * 60 * 60

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export function createEggPet(now: number, name = 'ぷにちゃん'): PetState {
  return {
    name,
    stage: 'egg',
    speciesId: 'egg_01',
    hunger: MAX_HUNGER,
    happiness: MAX_HAPPINESS,
    poopCount: 0,
    points: { sea: 0, land: 0, magic: 0, active: 0, gentle: 0 },
    bornAt: now,
    lastUpdatedAt: now,
  }
}

export function createNewPetData(
  userId: string,
  now: number,
  name?: string,
): PetData {
  return {
    userId,
    currentPet: createEggPet(now, name),
    encyclopedia: ['egg_01'],
  }
}

export function resetPet(data: PetData, now: number): PetData {
  return {
    ...data,
    currentPet: createEggPet(now, data.currentPet.name),
  }
}

export function pickChildSpecies(points: PetPoints): SpeciesId {
  const { sea, land, magic } = points
  if (sea >= land && sea >= magic) return 'child_sea'
  if (land >= magic) return 'child_land'
  return 'child_magic'
}

export function pickAdultSpecies(
  childSpeciesId: SpeciesId,
  points: PetPoints,
): SpeciesId {
  const diff = points.gentle - points.active
  switch (childSpeciesId) {
    case 'child_sea':
      if (diff >= 2) return 'adult_sea_fish'
      if (diff <= -2) return 'adult_sea_shark'
      return 'adult_sea_seal'
    case 'child_land':
      if (diff >= 2) return 'adult_land_panda'
      if (diff <= -2) return 'adult_land_trex'
      return 'adult_land_tricera'
    case 'child_magic':
      if (diff >= 2) return 'adult_magic_fairy'
      if (diff <= -2) return 'adult_magic_dragon'
      return 'adult_magic_ghost'
    default:
      return 'adult_magic_ghost'
  }
}

export function evolveIfNeeded(pet: PetState, now: number): PetState {
  switch (pet.stage) {
    case 'egg':
      if (
        pet.points.gentle >= EGG_HATCH_GENTLE ||
        now - pet.bornAt >= EGG_HATCH_SECONDS
      ) {
        return { ...pet, stage: 'baby', speciesId: 'baby_01' }
      }
      return pet
    case 'baby':
      if (now - pet.bornAt >= BABY_TO_CHILD_SECONDS) {
        return {
          ...pet,
          stage: 'child',
          speciesId: pickChildSpecies(pet.points),
        }
      }
      return pet
    case 'child':
      if (now - pet.bornAt >= CHILD_TO_ADULT_SECONDS) {
        return {
          ...pet,
          stage: 'adult',
          speciesId: pickAdultSpecies(pet.speciesId, pet.points),
        }
      }
      return pet
    case 'adult':
      return pet
  }
}

function withEncyclopedia(data: PetData, pet: PetState): PetData {
  if (data.encyclopedia.includes(pet.speciesId)) return data
  return { ...data, encyclopedia: [...data.encyclopedia, pet.speciesId] }
}

export function applyTimeElapsed(data: PetData, now: number): PetData {
  const pet = data.currentPet
  if (now <= pet.lastUpdatedAt) return data

  const elapsed = now - pet.lastUpdatedAt
  const hungerLoss = Math.floor(elapsed / HUNGER_DECAY_SECONDS)
  const happinessLoss = Math.floor(elapsed / HAPPINESS_DECAY_SECONDS)
  const poopGain = Math.floor(elapsed / POOP_INTERVAL_SECONDS)

  const decayed: PetState = {
    ...pet,
    hunger: clamp(pet.hunger - hungerLoss, 0, MAX_HUNGER),
    happiness: clamp(pet.happiness - happinessLoss, 0, MAX_HAPPINESS),
    poopCount: clamp(pet.poopCount + poopGain, 0, MAX_POOP),
    lastUpdatedAt: now,
  }

  const evolved = evolveIfNeeded(decayed, now)
  return withEncyclopedia({ ...data, currentPet: evolved }, evolved)
}

function applyActionEffect(pet: PetState, action: ActionType): PetState {
  switch (action) {
    case 'feed_sea':
      return {
        ...pet,
        hunger: clamp(pet.hunger + 1, 0, MAX_HUNGER),
        points: { ...pet.points, sea: pet.points.sea + 1 },
      }
    case 'feed_land':
      return {
        ...pet,
        hunger: clamp(pet.hunger + 1, 0, MAX_HUNGER),
        points: { ...pet.points, land: pet.points.land + 1 },
      }
    case 'feed_magic':
      return {
        ...pet,
        hunger: clamp(pet.hunger + 1, 0, MAX_HUNGER),
        points: { ...pet.points, magic: pet.points.magic + 1 },
      }
    case 'play':
      return {
        ...pet,
        happiness: clamp(pet.happiness + 1, 0, MAX_HAPPINESS),
        points: { ...pet.points, active: pet.points.active + 1 },
      }
    case 'pet':
      return {
        ...pet,
        happiness: clamp(pet.happiness + 1, 0, MAX_HAPPINESS),
        points: { ...pet.points, gentle: pet.points.gentle + 1 },
      }
    case 'clean':
      return { ...pet, poopCount: 0 }
  }
}

export function applyAction(
  data: PetData,
  action: ActionType,
  now: number,
): ActionResult {
  const previousSpeciesId = data.currentPet.speciesId
  const elapsed = applyTimeElapsed(data, now)
  const effected = applyActionEffect(elapsed.currentPet, action)
  const evolved = evolveIfNeeded(effected, now)
  const next = withEncyclopedia({ ...elapsed, currentPet: evolved }, evolved)
  return {
    data: next,
    evolved: evolved.speciesId !== previousSpeciesId,
    previousSpeciesId,
  }
}
