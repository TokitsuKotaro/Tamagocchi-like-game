import { describe, expect, it } from 'vitest'
import {
  applyAction,
  applyTimeElapsed,
  BABY_TO_CHILD_SECONDS,
  CHILD_TO_ADULT_SECONDS,
  createNewPetData,
  EGG_HATCH_SECONDS,
  evolveIfNeeded,
  pickAdultSpecies,
  pickChildSpecies,
} from './evolution'
import type { PetData, PetPoints, PetState, SpeciesId } from '../types/pet'

const NOW = 1_800_000_000

const points = (overrides: Partial<PetPoints> = {}): PetPoints => ({
  sea: 0,
  land: 0,
  magic: 0,
  active: 0,
  gentle: 0,
  ...overrides,
})

const pet = (overrides: Partial<PetState> = {}): PetState => ({
  name: 'ぷにちゃん',
  stage: 'egg',
  speciesId: 'egg_01',
  hunger: 5,
  happiness: 5,
  poopCount: 0,
  points: points(),
  bornAt: NOW,
  lastUpdatedAt: NOW,
  ...overrides,
})

const data = (petOverrides: Partial<PetState> = {}, encyclopedia: SpeciesId[] = ['egg_01']): PetData => ({
  userId: 'daughter-01',
  currentPet: pet(petOverrides),
  encyclopedia,
})

describe('applyTimeElapsed', () => {
  it('2時間ごとに空腹度が1減る', () => {
    const result = applyTimeElapsed(data({ hunger: 5 }), NOW + 2 * 3600)
    expect(result.currentPet.hunger).toBe(4)
  })

  it('空腹度は0未満にならない', () => {
    const result = applyTimeElapsed(data({ hunger: 1 }), NOW + 100 * 3600)
    expect(result.currentPet.hunger).toBe(0)
  })

  it('3時間ごとにごきげんが1減る', () => {
    const result = applyTimeElapsed(data({ happiness: 5 }), NOW + 6 * 3600)
    expect(result.currentPet.happiness).toBe(3)
  })

  it('ごきげんは0未満にならない', () => {
    const result = applyTimeElapsed(data({ happiness: 1 }), NOW + 100 * 3600)
    expect(result.currentPet.happiness).toBe(0)
  })

  it('4時間ごとにうんちが1増える', () => {
    const result = applyTimeElapsed(data({ poopCount: 0 }), NOW + 8 * 3600)
    expect(result.currentPet.poopCount).toBe(2)
  })

  it('うんちは3を超えない', () => {
    const result = applyTimeElapsed(data({ poopCount: 2 }), NOW + 100 * 3600)
    expect(result.currentPet.poopCount).toBe(3)
  })

  it('lastUpdatedAt が now に更新される', () => {
    const result = applyTimeElapsed(data(), NOW + 3600)
    expect(result.currentPet.lastUpdatedAt).toBe(NOW + 3600)
  })

  it('now が lastUpdatedAt 以前なら何も変わらない', () => {
    const before = data({ hunger: 3 })
    const result = applyTimeElapsed(before, NOW - 10)
    expect(result).toBe(before)
  })
})

describe('egg → baby', () => {
  it('gentle が3以上で孵化する', () => {
    const result = evolveIfNeeded(pet({ points: points({ gentle: 3 }) }), NOW)
    expect(result.stage).toBe('baby')
    expect(result.speciesId).toBe('baby_01')
  })

  it('10分経過で孵化する', () => {
    const result = evolveIfNeeded(pet(), NOW + EGG_HATCH_SECONDS)
    expect(result.stage).toBe('baby')
    expect(result.speciesId).toBe('baby_01')
  })

  it('条件を満たさなければ孵化しない', () => {
    const result = evolveIfNeeded(pet({ points: points({ gentle: 2 }) }), NOW + EGG_HATCH_SECONDS - 1)
    expect(result.stage).toBe('egg')
  })
})

describe('baby → child', () => {
  it('12時間経過で sea が最大なら child_sea', () => {
    const result = evolveIfNeeded(
      pet({ stage: 'baby', speciesId: 'baby_01', points: points({ sea: 3, land: 1, magic: 0 }) }),
      NOW + BABY_TO_CHILD_SECONDS,
    )
    expect(result.speciesId).toBe('child_sea')
  })

  it('12時間経過で land が最大なら child_land', () => {
    const result = evolveIfNeeded(
      pet({ stage: 'baby', speciesId: 'baby_01', points: points({ sea: 1, land: 4, magic: 2 }) }),
      NOW + BABY_TO_CHILD_SECONDS,
    )
    expect(result.speciesId).toBe('child_land')
  })

  it('12時間経過で magic が最大なら child_magic', () => {
    const result = evolveIfNeeded(
      pet({ stage: 'baby', speciesId: 'baby_01', points: points({ sea: 1, land: 2, magic: 5 }) }),
      NOW + BABY_TO_CHILD_SECONDS,
    )
    expect(result.speciesId).toBe('child_magic')
  })

  it('同点の場合は sea > land > magic の優先順位', () => {
    expect(pickChildSpecies(points({ sea: 2, land: 2, magic: 2 }))).toBe('child_sea')
    expect(pickChildSpecies(points({ sea: 0, land: 2, magic: 2 }))).toBe('child_land')
    expect(pickChildSpecies(points({ sea: 0, land: 0, magic: 0 }))).toBe('child_sea')
  })

  it('12時間未満では進化しない', () => {
    const result = evolveIfNeeded(
      pet({ stage: 'baby', speciesId: 'baby_01' }),
      NOW + BABY_TO_CHILD_SECONDS - 1,
    )
    expect(result.stage).toBe('baby')
  })
})

describe('child → adult', () => {
  const child = (speciesId: SpeciesId, p: PetPoints): PetState =>
    pet({ stage: 'child', speciesId, points: p })

  it('うみ系統: gentle - active >= 2 で adult_sea_fish', () => {
    expect(pickAdultSpecies('child_sea', points({ gentle: 4, active: 2 }))).toBe('adult_sea_fish')
  })
  it('うみ系統: active - gentle >= 2 で adult_sea_shark', () => {
    expect(pickAdultSpecies('child_sea', points({ gentle: 1, active: 3 }))).toBe('adult_sea_shark')
  })
  it('うみ系統: バランスで adult_sea_seal', () => {
    expect(pickAdultSpecies('child_sea', points({ gentle: 3, active: 2 }))).toBe('adult_sea_seal')
  })

  it('りく系統: gentle - active >= 2 で adult_land_panda', () => {
    expect(pickAdultSpecies('child_land', points({ gentle: 5, active: 3 }))).toBe('adult_land_panda')
  })
  it('りく系統: active - gentle >= 2 で adult_land_trex', () => {
    expect(pickAdultSpecies('child_land', points({ gentle: 0, active: 2 }))).toBe('adult_land_trex')
  })
  it('りく系統: バランスで adult_land_tricera', () => {
    expect(pickAdultSpecies('child_land', points({ gentle: 2, active: 2 }))).toBe('adult_land_tricera')
  })

  it('ふしぎ系統: gentle - active >= 2 で adult_magic_fairy', () => {
    expect(pickAdultSpecies('child_magic', points({ gentle: 2, active: 0 }))).toBe('adult_magic_fairy')
  })
  it('ふしぎ系統: active - gentle >= 2 で adult_magic_dragon', () => {
    expect(pickAdultSpecies('child_magic', points({ gentle: 0, active: 2 }))).toBe('adult_magic_dragon')
  })
  it('ふしぎ系統: バランスで adult_magic_ghost', () => {
    expect(pickAdultSpecies('child_magic', points({ gentle: 1, active: 1 }))).toBe('adult_magic_ghost')
  })

  it('36時間経過で adult に進化する', () => {
    const result = evolveIfNeeded(
      child('child_sea', points({ gentle: 4, active: 0 })),
      NOW + CHILD_TO_ADULT_SECONDS,
    )
    expect(result.stage).toBe('adult')
    expect(result.speciesId).toBe('adult_sea_fish')
  })

  it('36時間未満では進化しない', () => {
    const result = evolveIfNeeded(
      child('child_sea', points({ gentle: 4, active: 0 })),
      NOW + CHILD_TO_ADULT_SECONDS - 1,
    )
    expect(result.stage).toBe('child')
  })
})

describe('applyAction', () => {
  it('feed_sea で hunger +1 と sea ポイント +1', () => {
    const result = applyAction(data({ hunger: 3 }), 'feed_sea', NOW)
    expect(result.data.currentPet.hunger).toBe(4)
    expect(result.data.currentPet.points.sea).toBe(1)
  })

  it('feed_land で land ポイント +1', () => {
    const result = applyAction(data(), 'feed_land', NOW)
    expect(result.data.currentPet.points.land).toBe(1)
  })

  it('feed_magic で magic ポイント +1', () => {
    const result = applyAction(data(), 'feed_magic', NOW)
    expect(result.data.currentPet.points.magic).toBe(1)
  })

  it('play で happiness +1 と active ポイント +1', () => {
    const result = applyAction(data({ happiness: 2 }), 'play', NOW)
    expect(result.data.currentPet.happiness).toBe(3)
    expect(result.data.currentPet.points.active).toBe(1)
  })

  it('pet で happiness +1 と gentle ポイント +1', () => {
    const result = applyAction(data({ happiness: 2 }), 'pet', NOW)
    expect(result.data.currentPet.happiness).toBe(3)
    expect(result.data.currentPet.points.gentle).toBe(1)
  })

  it('clean で poopCount が 0 になる', () => {
    const result = applyAction(data({ poopCount: 3 }), 'clean', NOW)
    expect(result.data.currentPet.poopCount).toBe(0)
  })

  it('hunger は5を超えない', () => {
    const result = applyAction(data({ hunger: 5 }), 'feed_sea', NOW)
    expect(result.data.currentPet.hunger).toBe(5)
  })

  it('pet を3回すると卵が孵化し evolved=true', () => {
    let current = data()
    let evolved = false
    for (let i = 0; i < 3; i += 1) {
      const result = applyAction(current, 'pet', NOW)
      current = result.data
      evolved = result.evolved
    }
    expect(current.currentPet.stage).toBe('baby')
    expect(evolved).toBe(true)
  })

  it('進化すると図鑑に登録される', () => {
    let current = data()
    for (let i = 0; i < 3; i += 1) {
      current = applyAction(current, 'pet', NOW).data
    }
    expect(current.encyclopedia).toContain('baby_01')
  })

  it('アクション実行時にも遅延評価が適用される', () => {
    const result = applyAction(data({ hunger: 5 }), 'clean', NOW + 4 * 3600)
    expect(result.data.currentPet.hunger).toBe(3)
    expect(result.data.currentPet.poopCount).toBe(0)
  })
})

describe('createNewPetData', () => {
  it('初期状態は egg_01 で図鑑に egg_01 が登録される', () => {
    const created = createNewPetData('daughter-01', NOW)
    expect(created.currentPet.speciesId).toBe('egg_01')
    expect(created.currentPet.stage).toBe('egg')
    expect(created.encyclopedia).toEqual(['egg_01'])
  })
})
