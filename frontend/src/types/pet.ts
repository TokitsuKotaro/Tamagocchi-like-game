export type Stage = 'egg' | 'baby' | 'child' | 'adult'

export type Lineage = 'sea' | 'land' | 'magic'

export type SpeciesId =
  | 'egg_01'
  | 'baby_01'
  | 'child_sea'
  | 'child_land'
  | 'child_magic'
  | 'adult_sea_fish'
  | 'adult_sea_shark'
  | 'adult_sea_seal'
  | 'adult_land_panda'
  | 'adult_land_trex'
  | 'adult_land_tricera'
  | 'adult_magic_fairy'
  | 'adult_magic_dragon'
  | 'adult_magic_ghost'

export interface PetPoints {
  sea: number
  land: number
  magic: number
  active: number
  gentle: number
}

export interface PetState {
  name: string
  stage: Stage
  speciesId: SpeciesId
  hunger: number
  happiness: number
  poopCount: number
  points: PetPoints
  bornAt: number
  lastUpdatedAt: number
}

export interface PetData {
  userId: string
  currentPet: PetState
  encyclopedia: SpeciesId[]
}

export type ActionType =
  | 'feed_sea'
  | 'feed_land'
  | 'feed_magic'
  | 'play'
  | 'pet'
  | 'clean'

export interface ActionResult {
  data: PetData
  evolved: boolean
  previousSpeciesId: SpeciesId
}
