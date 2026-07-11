import { useEffect, useRef } from "react";
import Phaser from "phaser";

type PhaserGameHostProps<TScene extends Phaser.Scene> = {
  ariaLabel: string;
  backgroundColor?: string;
  className?: string;
  createScene: () => TScene;
  onSceneChange: (scene: TScene | null) => void;
};

export function PhaserGameHost<TScene extends Phaser.Scene>({
  ariaLabel,
  backgroundColor = "#17312d",
  className,
  createScene,
  onSceneChange,
}: PhaserGameHostProps<TScene>) {
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const parent = parentRef.current;

    if (!parent) {
      return undefined;
    }

    const scene = createScene();
    onSceneChange(scene);

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      transparent: false,
      backgroundColor,
      audio: { noAudio: true },
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true,
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: "100%",
        height: "100%",
      },
      input: {
        activePointers: 3,
      },
      scene: [scene],
    });

    return () => {
      onSceneChange(null);
      game.destroy(true);
    };
  }, [backgroundColor, createScene, onSceneChange]);

  return <div ref={parentRef} className={className} role="img" aria-label={ariaLabel} />;
}
