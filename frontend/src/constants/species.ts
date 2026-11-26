import type { Lineage, SpeciesId, Stage } from '../types/pet'

export interface SpeciesInfo {
  id: SpeciesId
  name: string
  stage: Stage
  lineage: Lineage | null
  emoji: string
  description: string
}

export const SPECIES: Record<SpeciesId, SpeciesInfo> = {
  egg_01: {
    id: 'egg_01',
    name: 'いきものタマゴ',
    stage: 'egg',
    lineage: null,
    emoji: '🥚',
    description: 'なんの いきものが うまれるかな？',
  },
  baby_01: {
    id: 'baby_01',
    name: 'ぷにっこ',
    stage: 'baby',
    lineage: null,
    emoji: '🐣',
    description: 'うまれたての ぷにぷに あかちゃん。',
  },
  child_sea: {
    id: 'child_sea',
    name: 'しずくっこ',
    stage: 'child',
    lineage: 'sea',
    emoji: '🫧',
    description: 'みずが だいすきな うみの こども。',
  },
  child_land: {
    id: 'child_land',
    name: 'もふっこ',
    stage: 'child',
    lineage: 'land',
    emoji: '🌱',
    description: 'もふもふで げんきな りくの こども。',
  },
  child_magic: {
    id: 'child_magic',
    name: 'ほしっこ',
    stage: 'child',
    lineage: 'magic',
    emoji: '✨',
    description: 'ほしの ひかりを あびた ふしぎな こども。',
  },
  adult_sea_fish: {
    id: 'adult_sea_fish',
    name: 'ニジイロさかな',
    stage: 'adult',
    lineage: 'sea',
    emoji: '🐠',
    description: 'にじいろに ひかる やさしい さかな。',
  },
  adult_sea_shark: {
    id: 'adult_sea_shark',
    name: 'かっこいいサメ',
    stage: 'adult',
    lineage: 'sea',
    emoji: '🦈',
    description: 'うみを すいすい およぐ かっこいい サメ。',
  },
  adult_sea_seal: {
    id: 'adult_sea_seal',
    name: 'にこにこアザラシ',
    stage: 'adult',
    lineage: 'sea',
    emoji: '🦭',
    description: 'いつも にこにこ えがおの アザラシ。',
  },
  adult_land_panda: {
    id: 'adult_land_panda',
    name: 'もふもふレッサーパンダ',
    stage: 'adult',
    lineage: 'land',
    emoji: '🦊',
    description: 'もふもふの しっぽが じまんの レッサーパンダ。',
  },
  adult_land_trex: {
    id: 'adult_land_trex',
    name: 'ガオガオきょうりゅう',
    stage: 'adult',
    lineage: 'land',
    emoji: '🦖',
    description: 'ガオーッと ほえる げんきな きょうりゅう。',
  },
  adult_land_tricera: {
    id: 'adult_land_tricera',
    name: 'ツノツノトリケラ',
    stage: 'adult',
    lineage: 'land',
    emoji: '🦕',
    description: 'つのが じまんの のんびり トリケラ。',
  },
  adult_magic_fairy: {
    id: 'adult_magic_fairy',
    name: 'プリンセスようせい',
    stage: 'adult',
    lineage: 'magic',
    emoji: '🧚',
    description: 'はねが きらきら ひかる ようせい。',
  },
  adult_magic_dragon: {
    id: 'adult_magic_dragon',
    name: 'そらとぶドラゴン',
    stage: 'adult',
    lineage: 'magic',
    emoji: '🐉',
    description: 'そらを じゆうに とぶ ドラゴン。',
  },
  adult_magic_ghost: {
    id: 'adult_magic_ghost',
    name: 'ねむねむおばけ',
    stage: 'adult',
    lineage: 'magic',
    emoji: '👻',
    description: 'いつも ねむそうな やさしい おばけ。',
  },
}

export const ALL_SPECIES_IDS = Object.keys(SPECIES) as SpeciesId[]

export const ADULT_SPECIES_IDS = ALL_SPECIES_IDS.filter(
  (id) => SPECIES[id].stage === 'adult',
)

export const TOTAL_SPECIES_COUNT = ALL_SPECIES_IDS.length
