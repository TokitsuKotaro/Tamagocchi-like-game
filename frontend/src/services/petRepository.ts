import {
  applyAction,
  applyTimeElapsed,
  createNewPetData,
  resetPet,
} from './evolution'
import type { ActionResult, ActionType, PetData } from '../types/pet'

export interface PetRepository {
  load(userId: string): Promise<PetData>
  performAction(userId: string, action: ActionType): Promise<ActionResult>
  reset(userId: string): Promise<PetData>
}

const STORAGE_KEY_PREFIX = 'henshin-tamago:pet:'

const storageKey = (userId: string): string => `${STORAGE_KEY_PREFIX}${userId}`

const nowSeconds = (): number => Math.floor(Date.now() / 1000)

function readLocal(userId: string): PetData | null {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as PetData
    if (!parsed.currentPet || !Array.isArray(parsed.encyclopedia)) return null
    return parsed
  } catch {
    return null
  }
}

function writeLocal(data: PetData): void {
  localStorage.setItem(storageKey(data.userId), JSON.stringify(data))
}

const localStorageRepository: PetRepository = {
  async load(userId) {
    const existing = readLocal(userId)
    const base = existing ?? createNewPetData(userId, nowSeconds())
    const evaluated = applyTimeElapsed(base, nowSeconds())
    writeLocal(evaluated)
    return evaluated
  },

  async performAction(userId, action) {
    const existing = readLocal(userId) ?? createNewPetData(userId, nowSeconds())
    const result = applyAction(existing, action, nowSeconds())
    writeLocal(result.data)
    return result
  },

  async reset(userId) {
    const existing = readLocal(userId) ?? createNewPetData(userId, nowSeconds())
    const next = resetPet(existing, nowSeconds())
    writeLocal(next)
    return next
  },
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('VITE_API_BASE_URL is not set')
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return (await res.json()) as T
}

const apiRepository: PetRepository = {
  async load(userId) {
    return apiFetch<PetData>(`/pet?userId=${encodeURIComponent(userId)}`)
  },

  async performAction(userId, action) {
    const data = await apiFetch<PetData>('/pet/action', {
      method: 'POST',
      body: JSON.stringify({ userId, action }),
    })
    return { data, evolved: false, previousSpeciesId: data.currentPet.speciesId }
  },

  async reset(userId) {
    return apiFetch<PetData>('/pet/reset', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    })
  },
}

export const petRepository: PetRepository = API_BASE_URL
  ? apiRepository
  : localStorageRepository
