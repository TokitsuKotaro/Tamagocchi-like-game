import { useCallback, useEffect, useRef, useState } from 'react'
import { petRepository } from '../services/petRepository'
import type { ActionType, PetData, SpeciesId } from '../types/pet'

const USER_ID_KEY = 'henshin-tamago:userId'
const DEFAULT_USER_ID = 'daughter-01'

export function getUserId(): string {
  const stored = localStorage.getItem(USER_ID_KEY)
  if (stored) return stored
  localStorage.setItem(USER_ID_KEY, DEFAULT_USER_ID)
  return DEFAULT_USER_ID
}

export function setUserId(userId: string): void {
  localStorage.setItem(USER_ID_KEY, userId)
}

export interface FloatingEffect {
  id: number
  emoji: string
  x: number
}

export function usePetGame() {
  const [userId, setUserIdState] = useState<string>(() => getUserId())
  const [data, setData] = useState<PetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [effects, setEffects] = useState<FloatingEffect[]>([])
  const [jumpKey, setJumpKey] = useState(0)
  const [evolutionNotice, setEvolutionNotice] = useState<SpeciesId | null>(null)
  const effectId = useRef(0)

  const reload = useCallback(async (id: string, showSpinner = true) => {
    if (showSpinner) setLoading(true)
    setError(null)
    try {
      const loaded = await petRepository.load(id)
      setData(loaded)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'よみこみに しっぱいしました')
    } finally {
      if (showSpinner) setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    petRepository
      .load(userId)
      .then((loaded) => {
        if (!cancelled) setData(loaded)
      })
      .catch((e: unknown) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : 'よみこみに しっぱいしました')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    const timer = window.setInterval(() => {
      void reload(userId, false)
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [userId, reload])

  const spawnEffect = useCallback((emoji: string) => {
    effectId.current += 1
    const id = effectId.current
    const x = 20 + Math.random() * 60
    setEffects((prev) => [...prev, { id, emoji, x }])
    window.setTimeout(() => {
      setEffects((prev) => prev.filter((effect) => effect.id !== id))
    }, 1400)
  }, [])

  const performAction = useCallback(
    async (action: ActionType) => {
      const previousSpeciesId = data?.currentPet.speciesId
      try {
        const result = await petRepository.performAction(userId, action)
        setData(result.data)
        setJumpKey((key) => key + 1)
        if (action === 'pet') spawnEffect('💖')
        else if (action === 'play') spawnEffect('🎵')
        else if (action.startsWith('feed_')) spawnEffect('✨')
        else if (action === 'clean') spawnEffect('🫧')
        const evolved =
          result.evolved ||
          (previousSpeciesId !== undefined &&
            result.data.currentPet.speciesId !== previousSpeciesId)
        if (evolved) {
          setEvolutionNotice(result.data.currentPet.speciesId)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'アクションに しっぱいしました')
      }
    },
    [userId, data, spawnEffect],
  )

  const reset = useCallback(async () => {
    const next = await petRepository.reset(userId)
    setData(next)
    setEvolutionNotice(null)
  }, [userId])

  const changeUserId = useCallback((nextId: string) => {
    const trimmed = nextId.trim()
    if (!trimmed) return
    setUserId(trimmed)
    setUserIdState(trimmed)
  }, [])

  const dismissEvolutionNotice = useCallback(() => setEvolutionNotice(null), [])

  return {
    userId,
    data,
    loading,
    error,
    effects,
    jumpKey,
    evolutionNotice,
    performAction,
    reset,
    reload,
    changeUserId,
    dismissEvolutionNotice,
  }
}
