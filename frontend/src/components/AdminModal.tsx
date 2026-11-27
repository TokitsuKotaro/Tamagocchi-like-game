import { useState } from 'react'
import { SPECIES } from '../constants/species'
import type { PetData } from '../types/pet'

interface AdminModalProps {
  open: boolean
  onClose: () => void
  data: PetData
  userId: string
  onChangeUserId: (userId: string) => void
  onReset: () => void
  onReload: () => void
}

export function AdminModal({
  open,
  onClose,
  data,
  userId,
  onChangeUserId,
  onReset,
  onReload,
}: AdminModalProps) {
  const [draftUserId, setDraftUserId] = useState(userId)
  const [confirmReset, setConfirmReset] = useState(false)

  if (!open) return null

  const pet = data.currentPet
  const info = SPECIES[pet.speciesId]
  const bornAt = new Date(pet.bornAt * 1000).toLocaleString('ja-JP')
  const updatedAt = new Date(pet.lastUpdatedAt * 1000).toLocaleString('ja-JP')

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col bg-[#2b2b2b]/95 text-gray-100"
      role="dialog"
      aria-modal="true"
      aria-label="おとなよう 設定"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <h2 className="text-base font-bold">おとなよう（設定・デバッグ）</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-lg active:scale-90"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">ユーザー</h3>
          <div className="flex gap-2">
            <input
              value={draftUserId}
              onChange={(event) => setDraftUserId(event.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm outline-none focus:border-white/30"
              aria-label="userId"
            />
            <button
              type="button"
              onClick={() => onChangeUserId(draftUserId)}
              className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold active:scale-95"
            >
              切替
            </button>
          </div>
          <p className="mt-1 text-[11px] text-gray-500">localStorage のキーが切り替わります。</p>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">現在の状態</h3>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-lg bg-white/5 p-3 font-mono text-[11px]">
            <dt className="text-gray-400">speciesId</dt>
            <dd>{pet.speciesId}</dd>
            <dt className="text-gray-400">名前</dt>
            <dd>{pet.name}（{info.name}）</dd>
            <dt className="text-gray-400">stage</dt>
            <dd>{pet.stage}</dd>
            <dt className="text-gray-400">hunger</dt>
            <dd>{pet.hunger} / 5</dd>
            <dt className="text-gray-400">happiness</dt>
            <dd>{pet.happiness} / 5</dd>
            <dt className="text-gray-400">poopCount</dt>
            <dd>{pet.poopCount} / 3</dd>
            <dt className="text-gray-400">bornAt</dt>
            <dd>{bornAt}</dd>
            <dt className="text-gray-400">lastUpdatedAt</dt>
            <dd>{updatedAt}</dd>
          </dl>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">ポイント</h3>
          <dl className="grid grid-cols-5 gap-1 rounded-lg bg-white/5 p-3 text-center font-mono text-[11px]">
            {(['sea', 'land', 'magic', 'active', 'gentle'] as const).map((key) => (
              <div key={key}>
                <dt className="text-gray-400">{key}</dt>
                <dd className="text-base font-bold">{pet.points[key]}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-gray-400">図鑑</h3>
          <p className="rounded-lg bg-white/5 p-3 font-mono text-[11px] leading-relaxed">
            {data.encyclopedia.join(', ') || '（なし）'}
          </p>
        </section>

        <section className="space-y-2">
          <button
            type="button"
            onClick={onReload}
            className="w-full rounded-lg bg-white/10 px-3 py-2 text-xs font-bold active:scale-95"
          >
            再読み込み（遅延評価を再実行）
          </button>

          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="w-full rounded-lg bg-red-900/60 px-3 py-2 text-xs font-bold text-red-100 active:scale-95"
            >
              新しいタマゴからやり直す
            </button>
          ) : (
            <div className="rounded-lg border border-red-500/40 bg-red-950/40 p-3">
              <p className="mb-2 text-xs text-red-100">
                現在のペットを egg_01 に戻します。図鑑は維持されます。よろしいですか？
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onReset()
                    setConfirmReset(false)
                  }}
                  className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-bold active:scale-95"
                >
                  リセットする
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-bold active:scale-95"
                >
                  やめる
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
