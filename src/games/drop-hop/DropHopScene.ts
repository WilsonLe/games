import Phaser from "phaser";
import courierWalkSheetUrl from "../../assets/sprites/generated/walk/customer-mai-walk-sheet.png";

export type DropHopLocationId =
  | "depot"
  | "bakery"
  | "park"
  | "market"
  | "school"
  | "redHouse"
  | "toyShop"
  | "bridge"
  | "library"
  | "blueHouse"
  | "postOffice";

export type DropHopLocationKind =
  | "hub"
  | "shop"
  | "house"
  | "school"
  | "park"
  | "bridge"
  | "library"
  | "post";

export type DropHopLocationView = {
  id: DropHopLocationId;
  name: string;
  shortName: string;
  kind: DropHopLocationKind;
  x: number;
  y: number;
};

export type DropHopSnapshot = {
  status: "ready" | "playing" | "paused" | "ended";
  locations: DropHopLocationView[];
  roads: Array<[DropHopLocationId, DropHopLocationId]>;
  usedRoadKeys: string[];
  path: DropHopLocationId[];
  currentLocationId: DropHopLocationId;
  pickupId: DropHopLocationId | null;
  dropoffId: DropHopLocationId;
  requiredStopId: DropHopLocationId | null;
  deliveredLocationId: DropHopLocationId | null;
  packagePicked: boolean;
  relationLabel: string;
};

export type DropHopSceneCallbacks = {
  onLocationSelect: (locationId: DropHopLocationId) => void;
};

const KIND_COLORS: Record<DropHopLocationKind, number> = {
  hub: 0xf1b83f,
  shop: 0xe58b4a,
  house: 0xdb675f,
  school: 0x5f91ce,
  park: 0x65ad72,
  bridge: 0xa88663,
  library: 0x8d6db8,
  post: 0x4e9e9a,
};

const KIND_ICONS: Record<DropHopLocationKind, string> = {
  hub: "◆",
  shop: "●",
  house: "⌂",
  school: "▣",
  park: "♣",
  bridge: "═",
  library: "▤",
  post: "✉",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export class DropHopScene extends Phaser.Scene {
  private callbacks: DropHopSceneCallbacks;
  private snapshot: DropHopSnapshot | null = null;
  private ready = false;
  private mapLayer?: Phaser.GameObjects.Container;
  private courierLayer?: Phaser.GameObjects.Container;
  private courier?: Phaser.GameObjects.Sprite;
  private cargoBadge?: Phaser.GameObjects.Container;
  private lastLocationId: DropHopLocationId | null = null;
  private reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  constructor(callbacks: DropHopSceneCallbacks) {
    super({ key: "DropHopScene" });
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: DropHopSceneCallbacks) {
    this.callbacks = callbacks;
  }

  setSnapshot(snapshot: DropHopSnapshot) {
    this.snapshot = snapshot;

    if (this.ready) {
      this.renderSnapshot();
    }
  }

  preload() {
    this.load.spritesheet("drop-courier", courierWalkSheetUrl, {
      frameWidth: 384,
      frameHeight: 256,
    });
  }

  create() {
    this.mapLayer = this.add.container(0, 0);
    this.courierLayer = this.add.container(0, 0);
    this.createCourierAnimations();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.renderSnapshot, this);
    this.ready = true;
    this.renderSnapshot();
  }

  shutdown() {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.renderSnapshot, this);
  }

  private createCourierAnimations() {
    (["south", "north", "east", "west"] as const).forEach((direction, row) => {
      const key = `drop-courier-${direction}`;

      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers("drop-courier", {
            start: row * 4,
            end: row * 4 + 3,
          }),
          frameRate: 5.55,
          repeat: -1,
        });
      }
    });
  }

  private renderSnapshot() {
    if (!this.ready || !this.snapshot || !this.mapLayer || !this.courierLayer) {
      return;
    }

    this.renderMap();
    this.renderCourier();
  }

  private pointFor(location: DropHopLocationView) {
    return {
      x: (location.x / 100) * this.scale.width,
      y: (location.y / 100) * this.scale.height,
    };
  }

  private renderMap() {
    const snapshot = this.snapshot;
    const layer = this.mapLayer;

    if (!snapshot || !layer) {
      return;
    }

    layer.removeAll(true);
    const width = this.scale.width;
    const height = this.scale.height;
    const compact = width < 620;
    const locationById = new Map(snapshot.locations.map((location) => [location.id, location]));
    const usedRoads = new Set(snapshot.usedRoadKeys);

    const background = this.add.graphics();
    background.fillStyle(0xb9dca7, 1);
    background.fillRoundedRect(2, 2, width - 4, height - 4, compact ? 14 : 20);
    background.lineStyle(compact ? 3 : 5, 0x17312d, 1);
    background.strokeRoundedRect(2, 2, width - 4, height - 4, compact ? 14 : 20);

    const blockWidth = width * 0.19;
    const blockHeight = height * 0.16;
    [
      [0.06, 0.08],
      [0.34, 0.08],
      [0.68, 0.08],
      [0.06, 0.36],
      [0.35, 0.37],
      [0.7, 0.4],
      [0.07, 0.67],
      [0.37, 0.69],
      [0.7, 0.7],
    ].forEach(([x, y], index) => {
      background.fillStyle(index % 2 === 0 ? 0xe8d59d : 0xdcc58b, 0.7);
      background.fillRoundedRect(width * x, height * y, blockWidth, blockHeight, 12);
    });

    background.lineStyle(compact ? 13 : 18, 0x5bb7d2, 0.88);
    background.beginPath();
    background.moveTo(width * 0.54, 0);
    background.lineTo(width * 0.62, height * 0.35);
    background.lineTo(width * 0.56, height * 0.7);
    background.lineTo(width * 0.66, height);
    background.strokePath();
    layer.add(background);

    const roads = this.add.graphics();
    snapshot.roads.forEach(([fromId, toId]) => {
      const from = locationById.get(fromId);
      const to = locationById.get(toId);

      if (!from || !to) {
        return;
      }

      const fromPoint = this.pointFor(from);
      const toPoint = this.pointFor(to);
      const key = [fromId, toId].sort().join("--");
      const used = usedRoads.has(key);
      roads.lineStyle(used ? (compact ? 8 : 11) : compact ? 5 : 7, used ? 0xf1b83f : 0xfff7dc, 1);
      roads.beginPath();
      roads.moveTo(fromPoint.x, fromPoint.y);
      roads.lineTo(toPoint.x, toPoint.y);
      roads.strokePath();
      roads.lineStyle(used ? 2 : 1, 0x17312d, used ? 0.75 : 0.35);
      roads.beginPath();
      roads.moveTo(fromPoint.x, fromPoint.y);
      roads.lineTo(toPoint.x, toPoint.y);
      roads.strokePath();
    });
    layer.add(roads);

    snapshot.path.forEach((locationId, index) => {
      const location = locationById.get(locationId);

      if (!location) {
        return;
      }

      const point = this.pointFor(location);
      const dot = this.add.circle(point.x, point.y, compact ? 4 : 6, 0x17312d, 0.82);
      dot.setStrokeStyle(2, 0xfffdf8);
      dot.setDepth(5 + index);
      layer.add(dot);
    });

    snapshot.locations.forEach((location) => {
      const point = this.pointFor(location);
      const isCurrent = location.id === snapshot.currentLocationId;
      const isPickup = location.id === snapshot.pickupId;
      const isDropoff = location.id === snapshot.dropoffId;
      const isRequired = location.id === snapshot.requiredStopId;
      const isDelivered = location.id === snapshot.deliveredLocationId;
      const radius = compact ? 19 : clamp(width * 0.032, 24, 34);
      const container = this.add.container(point.x, point.y);
      const marker = this.add.graphics();

      if (isPickup || isDropoff || isRequired) {
        marker.lineStyle(compact ? 4 : 6, isDropoff ? 0xd85b4b : isRequired ? 0x8d6db8 : 0xf1b83f, 0.9);
        marker.strokeCircle(0, 0, radius + (compact ? 5 : 8));
      }

      marker.fillStyle(isDelivered ? 0xf1b83f : KIND_COLORS[location.kind], 1);
      marker.lineStyle(isCurrent ? 5 : 3, 0x17312d, 1);
      marker.fillCircle(0, 0, radius);
      marker.strokeCircle(0, 0, radius);
      container.add(marker);

      const icon = this.add.text(0, -1, KIND_ICONS[location.kind], {
        color: "#17312d",
        fontFamily: "system-ui, sans-serif",
        fontSize: `${compact ? 16 : 21}px`,
        fontStyle: "bold",
      });
      icon.setOrigin(0.5);
      container.add(icon);

      const label = this.add.text(0, radius + 6, location.shortName, {
        color: "#17312d",
        fontFamily: "system-ui, sans-serif",
        fontSize: `${compact ? 9 : 12}px`,
        fontStyle: "bold",
        align: "center",
        backgroundColor: "#fffdf8",
        padding: { x: 4, y: 2 },
        wordWrap: { width: compact ? 70 : 100 },
      });
      label.setOrigin(0.5, 0);
      container.add(label);

      container.setSize(radius * 2.5, radius * 2.5);
      container.setInteractive(
        new Phaser.Geom.Circle(0, 0, radius * 1.35),
        Phaser.Geom.Circle.Contains,
      );
      container.input!.cursor = "pointer";
      container.on("pointerdown", () => this.callbacks.onLocationSelect(location.id));
      container.setDepth(20);
      layer.add(container);
    });

    const dropoff = locationById.get(snapshot.dropoffId);

    if (dropoff) {
      const point = this.pointFor(dropoff);
      const relation = this.add.text(point.x, point.y - (compact ? 38 : 52), snapshot.relationLabel, {
        color: "#fffdf8",
        fontFamily: "system-ui, sans-serif",
        fontSize: `${compact ? 9 : 12}px`,
        fontStyle: "bold",
        align: "center",
        backgroundColor: "#17312d",
        padding: { x: 6, y: 4 },
        wordWrap: { width: compact ? 105 : 150 },
      });
      relation.setOrigin(0.5, 1);
      relation.setDepth(30);
      layer.add(relation);
    }
  }

  private renderCourier() {
    const snapshot = this.snapshot;
    const layer = this.courierLayer;

    if (!snapshot || !layer) {
      return;
    }

    const location = snapshot.locations.find((candidate) => candidate.id === snapshot.currentLocationId);

    if (!location) {
      return;
    }

    const point = this.pointFor(location);
    const compact = this.scale.width < 620;

    if (!this.courier) {
      this.courier = this.add.sprite(point.x, point.y, "drop-courier", 0);
      this.courier.setOrigin(0.5, 0.82);
      this.courier.setDepth(80);
      layer.add(this.courier);
    }

    this.courier.setDisplaySize(compact ? 68 : 92, compact ? 46 : 62);
    const locationChanged = this.lastLocationId !== null && this.lastLocationId !== location.id;

    if (locationChanged && !this.reducedMotion) {
      const deltaX = point.x - this.courier.x;
      const deltaY = point.y - this.courier.y;
      const horizontal = Math.abs(deltaX) >= Math.abs(deltaY);
      const direction = horizontal ? (deltaX < 0 ? "west" : "east") : deltaY < 0 ? "north" : "south";
      this.courier.setFlipX(false);
      this.courier.play(`drop-courier-${direction}`, true);
      this.tweens.killTweensOf(this.courier);
      this.tweens.add({
        targets: this.courier,
        x: point.x,
        y: point.y,
        duration: 360,
        ease: "Sine.easeInOut",
        onComplete: () => {
          this.courier?.stop();
          this.courier?.setFrame(0);
          this.courier?.setFlipX(false);
        },
      });
    } else if (!this.tweens.isTweening(this.courier) || this.reducedMotion) {
      this.courier.setPosition(point.x, point.y);
      this.courier.setFrame(0);
    }

    this.lastLocationId = location.id;
    this.renderCargoBadge(this.courier.x, this.courier.y, snapshot.packagePicked, compact);

    if (this.cargoBadge && locationChanged && !this.reducedMotion) {
      this.tweens.add({
        targets: this.cargoBadge,
        x: point.x + (compact ? 21 : 28),
        y: point.y - (compact ? 21 : 27),
        duration: 360,
        ease: "Sine.easeInOut",
      });
    }
  }

  private renderCargoBadge(x: number, y: number, loaded: boolean, compact: boolean) {
    this.cargoBadge?.destroy(true);
    this.cargoBadge = undefined;

    if (!loaded || !this.courierLayer) {
      return;
    }

    const badge = this.add.container(x + (compact ? 21 : 28), y - (compact ? 21 : 27));
    const box = this.add.rectangle(0, 0, compact ? 19 : 24, compact ? 16 : 20, 0xf1b83f, 1);
    box.setStrokeStyle(2, 0x17312d);
    const mark = this.add.text(0, -1, "▣", {
      color: "#17312d",
      fontFamily: "system-ui, sans-serif",
      fontSize: `${compact ? 10 : 13}px`,
      fontStyle: "bold",
    });
    mark.setOrigin(0.5);
    badge.add([box, mark]);
    badge.setDepth(90);
    this.courierLayer.add(badge);
    this.cargoBadge = badge;
  }
}
