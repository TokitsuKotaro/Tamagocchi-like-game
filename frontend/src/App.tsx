import { useState } from 'react'
import { ActionBar } from './components/ActionBar'
import { AdminModal } from './components/AdminModal'
import { EncyclopediaModal } from './components/EncyclopediaModal'
import { EvolutionNotice } from './components/EvolutionNotice'
import { FoodModal } from './components/FoodModal'
import { PetStage } from './components/PetStage'
import { StatusBar } from './components/StatusBar'
import { usePetGame } from './hooks/usePetGame'

export default function App() {
  const {
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
  } = usePetGame()

  const [foodOpen, setFoodOpen] = useState(false)
  const [encyclopediaOpen, setEncyclopediaOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)

  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-[#efe0cd]">
      <div className="relative flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-[#fdf6ec] shadow-2xl">
        {loading && !data && (
          <div className="flex flex-1 items-center justify-center text-[#6b4f3a]">
            よみこみちゅう…
          </div>
        )}

        {error && !data && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-[#6b4f3a]">
            <p>よみこみに しっぱいしました</p>
            <button
              type="button"
              onClick={() => void reload(userId)}
              className="h-14 rounded-2xl bg-[#f2b8c6] px-6 font-bold shadow active:scale-95"
            >
              もういちど
            </button>
          </div>
        )}

        {data && (
          <>
            <StatusBar
              hunger={data.currentPet.hunger}
              happiness={data.currentPet.happiness}
              onOpenAdmin={() => setAdminOpen(true)}
            />

            <PetStage
              pet={data.currentPet}
              effects={effects}
              jumpKey={jumpKey}
              onPet={() => void performAction('pet')}
            />

            <ActionBar
              onFeed={() => setFoodOpen(true)}
              onPlay={() => void performAction('play')}
              onClean={() => void performAction('clean')}
              onOpenEncyclopedia={() => setEncyclopediaOpen(true)}
              poopCount={data.currentPet.poopCount}
            />

            <FoodModal
              open={foodOpen}
              onClose={() => setFoodOpen(false)}
              onSelect={(action) => void performAction(action)}
            />

            <EncyclopediaModal
              open={encyclopediaOpen}
              onClose={() => setEncyclopediaOpen(false)}
              encyclopedia={data.encyclopedia}
            />

            <AdminModal
              open={adminOpen}
              onClose={() => setAdminOpen(false)}
              data={data}
              userId={userId}
              onChangeUserId={changeUserId}
              onReset={() => void reset()}
              onReload={() => void reload(userId)}
            />

            <EvolutionNotice
              speciesId={evolutionNotice}
              onDismiss={dismissEvolutionNotice}
            />
          </>
        )}
      </div>
    </div>
  )
}
