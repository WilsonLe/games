import { useCallback, useEffect, useRef } from "react";
import { PhaserGameHost } from "../../game-runtime/PhaserGameHost";
import {
  DropHopScene,
  type DropHopLocationId,
  type DropHopSceneCallbacks,
  type DropHopSnapshot,
} from "./DropHopScene";

type DropHopMapProps = {
  snapshot: DropHopSnapshot;
  onLocationSelect: (locationId: DropHopLocationId) => void;
};

export function DropHopMap({ snapshot, onLocationSelect }: DropHopMapProps) {
  const sceneRef = useRef<DropHopScene | null>(null);
  const snapshotRef = useRef(snapshot);
  const callbacksRef = useRef<DropHopSceneCallbacks>({ onLocationSelect });

  snapshotRef.current = snapshot;
  callbacksRef.current = { onLocationSelect };

  const createScene = useCallback(
    () =>
      new DropHopScene({
        onLocationSelect: (locationId) => callbacksRef.current.onLocationSelect(locationId),
      }),
    [],
  );

  const handleSceneChange = useCallback((scene: DropHopScene | null) => {
    sceneRef.current = scene;

    if (scene) {
      scene.setSnapshot(snapshotRef.current);
    }
  }, []);

  useEffect(() => {
    sceneRef.current?.setCallbacks({
      onLocationSelect: (locationId) => callbacksRef.current.onLocationSelect(locationId),
    });
    sceneRef.current?.setSnapshot(snapshot);
  }, [snapshot]);

  return (
    <section className="cityMapPanel cityMapPanel--phaser" aria-label="Drop Hop map">
      <PhaserGameHost
        ariaLabel="Drop Hop animated city route grid"
        backgroundColor="#b9dca7"
        className="phaserStage phaserStage--dropHop"
        createScene={createScene}
        onSceneChange={handleSceneChange}
      />

      <section className="phaserA11yControls phaserA11yControls--city" aria-label="Drop Hop keyboard map controls">
        <p>Keyboard map controls</p>
        <div role="group" aria-label="City locations">
          {snapshot.locations.map((location) => (
            <button
              type="button"
              key={location.id}
              onClick={() => onLocationSelect(location.id)}
              aria-current={location.id === snapshot.currentLocationId ? "location" : undefined}
            >
              {location.name}
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}
