import { useCallback, useEffect, useRef } from "react";
import { PhaserGameHost } from "../../game-runtime/PhaserGameHost";
import {
  DishWishScene,
  type DishWishSceneCallbacks,
  type DishWishSnapshot,
} from "./DishWishScene";

type DishWishStageProps = {
  snapshot: DishWishSnapshot;
  onGuestSelect: (guestId: string) => void;
  onFoodDrop: (foodId: string, guestId: string | null) => void;
};

export function DishWishStage({ snapshot, onGuestSelect, onFoodDrop }: DishWishStageProps) {
  const sceneRef = useRef<DishWishScene | null>(null);
  const snapshotRef = useRef(snapshot);
  const callbacksRef = useRef<DishWishSceneCallbacks>({ onGuestSelect, onFoodDrop });

  snapshotRef.current = snapshot;
  callbacksRef.current = { onGuestSelect, onFoodDrop };

  const createScene = useCallback(
    () =>
      new DishWishScene({
        onGuestSelect: (guestId) => callbacksRef.current.onGuestSelect(guestId),
        onFoodDrop: (foodId, guestId) => callbacksRef.current.onFoodDrop(foodId, guestId),
      }),
    [],
  );

  const handleSceneChange = useCallback((scene: DishWishScene | null) => {
    sceneRef.current = scene;

    if (scene) {
      scene.setSnapshot(snapshotRef.current);
    }
  }, []);

  useEffect(() => {
    sceneRef.current?.setCallbacks({
      onGuestSelect: (guestId) => callbacksRef.current.onGuestSelect(guestId),
      onFoodDrop: (foodId, guestId) => callbacksRef.current.onFoodDrop(foodId, guestId),
    });
    sceneRef.current?.setSnapshot(snapshot);
  }, [snapshot]);

  const selectedGuest = snapshot.guests.find((guest) => guest.id === snapshot.selectedGuestId);

  return (
    <section className="restaurantStage restaurantStage--phaser" aria-label="Top down restaurant floor">
      <PhaserGameHost
        ariaLabel="Dish Wish animated restaurant grid"
        backgroundColor="#cc8f58"
        className="phaserStage phaserStage--dishWish"
        createScene={createScene}
        onSceneChange={handleSceneChange}
      />

      <section className="phaserA11yControls" aria-label="Dish Wish keyboard controls">
        <p>Keyboard controls</p>
        <div role="group" aria-label="Guest tables">
          {snapshot.guests
            .filter((guest) => guest.phase === "seated")
            .map((guest) => (
              <button
                type="button"
                key={guest.id}
                onClick={() => onGuestSelect(guest.id)}
                aria-pressed={guest.id === snapshot.selectedGuestId}
                aria-label={
                  guest.heardOrder
                    ? `${guest.customerName} ordered ${guest.foods.join(", ")}`
                    : `Hear ${guest.customerName}'s order`
                }
              >
                {guest.customerName}: {guest.heardOrder ? guest.phrase : "hear order"}
                <span
                  role="progressbar"
                  aria-label={`${guest.customerName} order time remaining`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(guest.patienceRatio * 100)}
                />
              </button>
            ))}
        </div>
        <div role="group" aria-label="Kitchen pass dishes">
          {snapshot.foods
            .filter((food) => !food.leaving)
            .map((food) => (
              <button
                type="button"
                key={food.id}
                disabled={snapshot.status !== "playing"}
                onClick={() => onFoodDrop(food.id, selectedGuest?.id ?? null)}
              >
                Serve {food.foodId}{selectedGuest ? ` to ${selectedGuest.customerName}` : " to selected guest"}
              </button>
            ))}
        </div>
      </section>
    </section>
  );
}
