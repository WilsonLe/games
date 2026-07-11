import Phaser from "phaser";
import customerBenWalkSheetUrl from "../../assets/sprites/generated/walk/customer-ben-walk-sheet.png";
import customerIvyWalkSheetUrl from "../../assets/sprites/generated/walk/customer-ivy-walk-sheet.png";
import customerLeoWalkSheetUrl from "../../assets/sprites/generated/walk/customer-leo-walk-sheet.png";
import customerMaiWalkSheetUrl from "../../assets/sprites/generated/walk/customer-mai-walk-sheet.png";
import customerNoraWalkSheetUrl from "../../assets/sprites/generated/walk/customer-nora-walk-sheet.png";
import customerSamWalkSheetUrl from "../../assets/sprites/generated/walk/customer-sam-walk-sheet.png";
import foodBreadUrl from "../../assets/sprites/food-bread.png";
import foodChickenUrl from "../../assets/sprites/food-chicken.png";
import foodEggUrl from "../../assets/sprites/food-egg.png";
import foodFishUrl from "../../assets/sprites/food-fish.png";
import foodNoodlesUrl from "../../assets/sprites/food-noodles.png";
import foodRiceUrl from "../../assets/sprites/food-rice.png";
import foodSaladUrl from "../../assets/sprites/food-salad.png";
import foodSoupUrl from "../../assets/sprites/food-soup.png";
import foodTeaUrl from "../../assets/sprites/food-tea.png";
import gameKitchenBgUrl from "../../assets/game-kitchen-bg.png";

export type DishWishFoodId =
  | "rice"
  | "fish"
  | "chicken"
  | "egg"
  | "noodles"
  | "soup"
  | "salad"
  | "tea"
  | "bread";

export type DishWishCustomerId = "mai" | "leo" | "nora" | "ben" | "ivy" | "sam";
export type DishWishGuestPhase = "entering" | "seated" | "leaving";
export type DishWishDirection = "north" | "south" | "east" | "west";

export type DishWishGuestView = {
  id: string;
  customerId: DishWishCustomerId;
  customerName: string;
  phase: DishWishGuestPhase;
  seatIndex: number;
  heardOrder: boolean;
  phrase: string;
  foods: DishWishFoodId[];
  servedFoods: DishWishFoodId[];
  patienceRatio: number;
  visual: {
    col: number;
    row: number;
    direction: DishWishDirection;
    walking: boolean;
    done: boolean;
  };
};

export type DishWishFoodView = {
  id: string;
  foodId: DishWishFoodId;
  lane: number;
  slot: number;
  progress: number;
  leaving: boolean;
};

export type DishWishSnapshot = {
  now: number;
  status: "ready" | "playing" | "paused" | "ended";
  selectedGuestId: string | null;
  guests: DishWishGuestView[];
  foods: DishWishFoodView[];
  beltTravelLabel: string;
};

export type DishWishSceneCallbacks = {
  onGuestSelect: (guestId: string) => void;
  onFoodDrop: (foodId: string, guestId: string | null) => void;
};

type GridLayout = {
  mobile: boolean;
  tile: number;
  left: number;
  top: number;
  columns: number;
  rows: number;
};

type GuestSpriteEntry = {
  sprite: Phaser.GameObjects.Sprite;
  customerId: DishWishCustomerId;
};

type FoodEntry = {
  container: Phaser.GameObjects.Container;
  art: Phaser.GameObjects.Image;
  life: Phaser.GameObjects.Rectangle;
  label: Phaser.GameObjects.Text;
  foodId: DishWishFoodId;
};

const FOOD_NAMES: Record<DishWishFoodId, string> = {
  rice: "rice",
  fish: "fish",
  chicken: "chicken",
  egg: "egg",
  noodles: "noodles",
  soup: "soup",
  salad: "salad",
  tea: "tea",
  bread: "bread",
};

const FOOD_ASSETS: Record<DishWishFoodId, string> = {
  rice: foodRiceUrl,
  fish: foodFishUrl,
  chicken: foodChickenUrl,
  egg: foodEggUrl,
  noodles: foodNoodlesUrl,
  soup: foodSoupUrl,
  salad: foodSaladUrl,
  tea: foodTeaUrl,
  bread: foodBreadUrl,
};

const CUSTOMER_ASSETS: Record<DishWishCustomerId, string> = {
  mai: customerMaiWalkSheetUrl,
  leo: customerLeoWalkSheetUrl,
  nora: customerNoraWalkSheetUrl,
  ben: customerBenWalkSheetUrl,
  ivy: customerIvyWalkSheetUrl,
  sam: customerSamWalkSheetUrl,
};

const TABLE_TILES = [
  { col: 2, row: 1 },
  { col: 7, row: 1 },
  { col: 2, row: 3 },
  { col: 7, row: 3 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function guestNeedsFood(guest: DishWishGuestView, foodId: DishWishFoodId) {
  const required = guest.foods.filter((id) => id === foodId).length;
  const served = guest.servedFoods.filter((id) => id === foodId).length;
  return served < required;
}

function formatFoodProgress(guest: DishWishGuestView) {
  const encountered = new Map<DishWishFoodId, number>();

  return guest.foods
    .map((foodId) => {
      const occurrence = encountered.get(foodId) ?? 0;
      const servedCount = guest.servedFoods.filter((servedFoodId) => servedFoodId === foodId).length;
      encountered.set(foodId, occurrence + 1);
      return `${occurrence < servedCount ? "✓" : "○"} ${FOOD_NAMES[foodId]}`;
    })
    .join("  ·  ");
}

export class DishWishScene extends Phaser.Scene {
  private callbacks: DishWishSceneCallbacks;
  private snapshot: DishWishSnapshot | null = null;
  private ready = false;
  private staticLayer?: Phaser.GameObjects.Container;
  private tableLayer?: Phaser.GameObjects.Container;
  private guestLayer?: Phaser.GameObjects.Container;
  private foodLayer?: Phaser.GameObjects.Container;
  private emptyMessage?: Phaser.GameObjects.Text;
  private guestSprites = new Map<string, GuestSpriteEntry>();
  private foodEntries = new Map<string, FoodEntry>();
  private draggingFoodId: string | null = null;
  private staticDirty = true;
  private reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

  constructor(callbacks: DishWishSceneCallbacks) {
    super({ key: "DishWishScene" });
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: DishWishSceneCallbacks) {
    this.callbacks = callbacks;
  }

  setSnapshot(snapshot: DishWishSnapshot) {
    this.snapshot = snapshot;

    if (this.ready) {
      this.renderSnapshot();
    }
  }

  preload() {
    this.load.image("dish-kitchen", gameKitchenBgUrl);

    Object.entries(FOOD_ASSETS).forEach(([id, url]) => {
      this.load.image(`dish-food-${id}`, url);
    });

    Object.entries(CUSTOMER_ASSETS).forEach(([id, url]) => {
      this.load.spritesheet(`dish-customer-${id}`, url, {
        frameWidth: 384,
        frameHeight: 256,
      });
    });
  }

  create() {
    this.staticLayer = this.add.container(0, 0);
    this.tableLayer = this.add.container(0, 0);
    this.guestLayer = this.add.container(0, 0);
    this.foodLayer = this.add.container(0, 0);

    this.createCustomerAnimations();
    this.bindDragEvents();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.handleResize, this);
    this.ready = true;
    this.renderSnapshot();
  }

  shutdown() {
    this.scale.off(Phaser.Scale.Events.RESIZE, this.handleResize, this);
  }

  private handleResize() {
    this.staticDirty = true;
    this.draggingFoodId = null;
    this.foodEntries.forEach((entry) => entry.container.destroy(true));
    this.foodEntries.clear();
    this.renderSnapshot();
  }

  private createCustomerAnimations() {
    (Object.keys(CUSTOMER_ASSETS) as DishWishCustomerId[]).forEach((customerId) => {
      const textureKey = `dish-customer-${customerId}`;
      (["south", "north", "east", "west"] as const).forEach((direction, row) => {
        const key = `dish-${customerId}-${direction}`;

        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(textureKey, {
              start: row * 4,
              end: row * 4 + 3,
            }),
            frameRate: 5.55,
            repeat: -1,
          });
        }
      });
    });
  }

  private bindDragEvents() {
    this.input.on(
      "dragstart",
      (_pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
        if (gameObject.getData("kind") !== "dish") {
          return;
        }

        this.draggingFoodId = gameObject.getData("food-instance-id") as string;
        gameObject.setDepth(100);
        this.renderTables();
      },
    );

    this.input.on(
      "drag",
      (
        _pointer: Phaser.Input.Pointer,
        gameObject: Phaser.GameObjects.Container,
        dragX: number,
        dragY: number,
      ) => {
        if (gameObject.getData("kind") === "dish") {
          gameObject.setPosition(dragX, dragY);
        }
      },
    );

    this.input.on(
      "dragend",
      (pointer: Phaser.Input.Pointer, gameObject: Phaser.GameObjects.Container) => {
        if (gameObject.getData("kind") !== "dish") {
          return;
        }

        const foodInstanceId = gameObject.getData("food-instance-id") as string;
        const guestId = this.findDropGuest(pointer.x, pointer.y);
        this.draggingFoodId = null;
        this.callbacks.onFoodDrop(foodInstanceId, guestId);
        this.renderSnapshot();
      },
    );
  }

  private getLayout(): GridLayout {
    const width = Math.max(320, this.scale.width);
    const height = Math.max(480, this.scale.height);
    const mobile = width < 560;
    const kitchenHeight = mobile ? clamp(height * 0.24, 132, 180) : clamp(height * 0.31, 165, 260);
    const inset = mobile ? 8 : clamp(width * 0.035, 16, 48);
    const columns = mobile ? 5 : 10;
    const rows = mobile ? 10 : 5;
    const availableWidth = width - inset * 2;
    const availableHeight = height - kitchenHeight - 12;
    const tile = Math.max(24, Math.min(availableWidth / columns, availableHeight / rows));
    const gridWidth = tile * columns;
    const gridHeight = tile * rows;

    return {
      mobile,
      tile,
      left: (width - gridWidth) / 2,
      top: kitchenHeight + Math.max(0, (availableHeight - gridHeight) / 2),
      columns,
      rows,
    };
  }

  private gridPoint(col: number, row: number, layout = this.getLayout()) {
    if (layout.mobile) {
      return {
        x: layout.left + (row + 0.5) * layout.tile,
        y: layout.top + (col + 0.5) * layout.tile,
      };
    }

    return {
      x: layout.left + (col + 0.5) * layout.tile,
      y: layout.top + (row + 0.5) * layout.tile,
    };
  }

  private renderSnapshot() {
    if (!this.ready || !this.snapshot || !this.staticLayer || !this.tableLayer || !this.guestLayer || !this.foodLayer) {
      return;
    }

    if (this.staticDirty) {
      this.renderStatic();
      this.staticDirty = false;
    }

    this.renderTables();
    this.renderGuests();
    this.renderFoods();
    this.renderEmptyMessage();
  }

  private renderStatic() {
    const layer = this.staticLayer;

    if (!layer) {
      return;
    }

    layer.removeAll(true);
    const width = this.scale.width;
    const layout = this.getLayout();
    const kitchenHeight = layout.top - 6;
    const backdrop = this.add.image(width / 2, kitchenHeight / 2, "dish-kitchen");
    backdrop.setDisplaySize(width, kitchenHeight);
    backdrop.setAlpha(0.82);
    layer.add(backdrop);

    const kitchenShade = this.add.rectangle(width / 2, kitchenHeight / 2, width, kitchenHeight, 0x17312d, 0.18);
    layer.add(kitchenShade);

    const floor = this.add.graphics();
    floor.fillStyle(0xf4d89a, 1);
    floor.fillRect(
      layout.left - 5,
      layout.top - 5,
      layout.tile * layout.columns + 10,
      layout.tile * layout.rows + 10,
    );
    floor.lineStyle(3, 0x17312d, 1);
    floor.strokeRect(
      layout.left - 5,
      layout.top - 5,
      layout.tile * layout.columns + 10,
      layout.tile * layout.rows + 10,
    );

    for (let row = 0; row < layout.rows; row += 1) {
      for (let col = 0; col < layout.columns; col += 1) {
        floor.fillStyle((row + col) % 2 === 0 ? 0xf9e8bd : 0xefd18f, 1);
        floor.fillRect(
          layout.left + col * layout.tile,
          layout.top + row * layout.tile,
          layout.tile,
          layout.tile,
        );
        floor.lineStyle(1, 0x9f7542, 0.26);
        floor.strokeRect(
          layout.left + col * layout.tile,
          layout.top + row * layout.tile,
          layout.tile,
          layout.tile,
        );
      }
    }

    layer.add(floor);

    const doorPoint = this.gridPoint(0, 4, layout);
    const door = this.add.rectangle(
      doorPoint.x,
      doorPoint.y + layout.tile * 0.18,
      layout.tile * 0.72,
      layout.tile * 0.92,
      0x7b3f27,
    );
    door.setStrokeStyle(Math.max(2, layout.tile * 0.06), 0x17312d);
    layer.add(door);

    const passY = Math.max(68, kitchenHeight * 0.57);
    const pass = this.add.rectangle(width / 2, passY, width - 20, clamp(kitchenHeight * 0.42, 74, 112), 0xe5a653, 0.96);
    pass.setStrokeStyle(4, 0x17312d);
    layer.add(pass);

    const label = this.add.text(18, passY - pass.displayHeight / 2 + 7, "Kitchen pass · drag a dish to a table", {
      color: "#17312d",
      fontFamily: "system-ui, sans-serif",
      fontSize: layout.mobile ? "11px" : "13px",
      fontStyle: "bold",
    });
    layer.add(label);

    const railWidth = width - 32;
    const slotWidth = railWidth / 6;

    for (let index = 0; index < 6; index += 1) {
      const x = 16 + slotWidth * (index + 0.5);
      const slot = this.add.ellipse(
        x,
        passY,
        clamp(slotWidth * 0.68, 40, 84),
        clamp(slotWidth * 0.4, 25, 48),
        0xfff5dc,
        0.35,
      );
      slot.setStrokeStyle(2, 0x17312d, 0.35);
      layer.add(slot);
    }
  }

  private renderTables() {
    const layer = this.tableLayer;
    const snapshot = this.snapshot;

    if (!layer || !snapshot) {
      return;
    }

    layer.removeAll(true);
    const layout = this.getLayout();
    const draggingFood = snapshot.foods.find((food) => food.id === this.draggingFoodId);

    TABLE_TILES.forEach((tile, seatIndex) => {
      const point = this.gridPoint(tile.col, tile.row, layout);
      const guest = snapshot.guests.find((candidate) => candidate.seatIndex === seatIndex);
      const selected = guest?.id === snapshot.selectedGuestId;
      const dropReady = Boolean(
        draggingFood && guest?.phase === "seated" && guest.heardOrder && guestNeedsFood(guest, draggingFood.foodId),
      );
      const radius = clamp(layout.tile * 0.58, 25, layout.mobile ? 42 : 58);
      const container = this.add.container(point.x, point.y);
      const table = this.add.graphics();
      table.fillStyle(selected ? 0xf1b83f : 0xd98f45, 1);
      table.lineStyle(selected ? 6 : 4, dropReady ? 0xfff5ba : 0x17312d, 1);
      table.fillCircle(0, 0, radius);
      table.strokeCircle(0, 0, radius);

      const chairColor = 0x58aa69;
      const chairSize = radius * 0.48;
      [[0, -radius * 0.92], [radius * 0.92, 0], [0, radius * 0.92], [-radius * 0.92, 0]].forEach(([x, y]) => {
        table.fillStyle(chairColor, 1);
        table.lineStyle(3, 0x17312d, 1);
        table.fillRoundedRect(x - chairSize / 2, y - chairSize / 2, chairSize, chairSize * 0.78, 6);
        table.strokeRoundedRect(x - chairSize / 2, y - chairSize / 2, chairSize, chairSize * 0.78, 6);
      });
      container.add(table);

      if (guest) {
        if (guest.phase === "seated") {
          const bubbleText = guest.heardOrder
            ? `${guest.phrase}\n${formatFoodProgress(guest)}`
            : "Tap to hear order";
          const bubbleWidth = clamp(layout.tile * (layout.mobile ? 3.1 : 3.6), 112, 270);
          const bubble = this.add.text(0, -radius - 12, bubbleText, {
            color: "#17312d",
            fontFamily: "system-ui, sans-serif",
            fontSize: `${clamp(layout.tile * 0.17, 9, 14)}px`,
            fontStyle: "bold",
            align: "center",
            backgroundColor: "#fffdf8",
            padding: { x: 8, y: 6 },
            wordWrap: { width: bubbleWidth - 16 },
          });
          bubble.setOrigin(0.5, 1);
          container.add(bubble);

          const barWidth = radius * 1.35;
          const barBack = this.add.rectangle(0, radius * 0.78, barWidth, 8, 0x17312d, 0.42);
          const patienceWidth = Math.max(1, barWidth * clamp(guest.patienceRatio, 0, 1));
          const bar = this.add.rectangle(-barWidth / 2, radius * 0.78, patienceWidth, 8, guest.patienceRatio < 0.3 ? 0xd85b4b : 0x58aa69);
          bar.setOrigin(0, 0.5);
          container.add([barBack, bar]);

          container.setSize(radius * 2.2, radius * 2.2);
          container.setInteractive(
            new Phaser.Geom.Circle(0, 0, radius * 1.15),
            Phaser.Geom.Circle.Contains,
          );
          container.input!.cursor = "pointer";
          container.on("pointerdown", () => this.callbacks.onGuestSelect(guest.id));
        }
      }

      layer.add(container);
    });
  }

  private renderGuests() {
    const snapshot = this.snapshot;
    const layer = this.guestLayer;

    if (!snapshot || !layer) {
      return;
    }

    const layout = this.getLayout();
    const liveIds = new Set(snapshot.guests.map((guest) => guest.id));

    this.guestSprites.forEach((entry, guestId) => {
      if (!liveIds.has(guestId)) {
        entry.sprite.destroy();
        this.guestSprites.delete(guestId);
      }
    });

    snapshot.guests.forEach((guest) => {
      let entry = this.guestSprites.get(guest.id);

      if (!entry || entry.customerId !== guest.customerId) {
        entry?.sprite.destroy();
        const sprite = this.add.sprite(0, 0, `dish-customer-${guest.customerId}`, 12);
        sprite.setOrigin(0.5, 1);
        layer.add(sprite);
        entry = { sprite, customerId: guest.customerId };
        this.guestSprites.set(guest.id, entry);
      }

      const point = this.gridPoint(guest.visual.col, guest.visual.row, layout);
      const targetY = point.y + layout.tile * 0.48;
      entry.sprite.setDisplaySize(layout.tile * 2.4, layout.tile * 1.6);
      entry.sprite.setDepth(20 + guest.visual.row);
      entry.sprite.setAlpha(guest.phase === "leaving" && guest.visual.done ? 0.35 : 1);
      entry.sprite.setFlipX(false);

      if (entry.sprite.x === 0 && entry.sprite.y === 0 || this.reducedMotion) {
        this.tweens.killTweensOf(entry.sprite);
        entry.sprite.setPosition(point.x, targetY);
      } else {
        this.tweens.killTweensOf(entry.sprite);
        this.tweens.add({
          targets: entry.sprite,
          x: point.x,
          y: targetY,
          duration: guest.visual.walking ? 105 : 70,
          ease: "Linear",
        });
      }

      if (guest.visual.walking && !this.reducedMotion) {
        entry.sprite.play(`dish-${guest.customerId}-${guest.visual.direction}`, true);
      } else {
        entry.sprite.stop();
        const row = guest.visual.direction === "north"
          ? 1
          : guest.visual.direction === "east"
            ? 2
            : guest.visual.direction === "west"
              ? 3
              : 0;
        entry.sprite.setFrame(row * 4);
      }
    });
  }

  private renderFoods() {
    const snapshot = this.snapshot;
    const layer = this.foodLayer;

    if (!snapshot || !layer) {
      return;
    }

    const layout = this.getLayout();
    const width = this.scale.width;
    const kitchenHeight = layout.top - 6;
    const passY = Math.max(68, kitchenHeight * 0.57);
    const railWidth = width - 32;
    const slotWidth = railWidth / 6;
    const liveIds = new Set(snapshot.foods.map((food) => food.id));

    this.foodEntries.forEach((entry, foodId) => {
      if (!liveIds.has(foodId)) {
        entry.container.destroy(true);
        this.foodEntries.delete(foodId);
      }
    });

    snapshot.foods.forEach((food, index) => {
      let entry = this.foodEntries.get(food.id);

      if (!entry || entry.foodId !== food.foodId) {
        entry?.container.destroy(true);
        const container = this.add.container(0, 0);
        const plate = this.add.ellipse(0, 8, clamp(slotWidth * 0.74, 42, 92), clamp(slotWidth * 0.48, 28, 58), 0xfff5dc, 1);
        plate.setStrokeStyle(3, 0x17312d);
        const art = this.add.image(0, 0, `dish-food-${food.foodId}`);
        const label = this.add.text(0, clamp(slotWidth * 0.24, 19, 31), FOOD_NAMES[food.foodId], {
          color: "#17312d",
          fontFamily: "system-ui, sans-serif",
          fontSize: `${clamp(slotWidth * 0.12, 9, 13)}px`,
          fontStyle: "bold",
          backgroundColor: "#fffdf8",
          padding: { x: 4, y: 2 },
        });
        label.setOrigin(0.5, 0);
        const lifeBack = this.add.rectangle(0, clamp(slotWidth * 0.39, 32, 48), clamp(slotWidth * 0.65, 38, 78), 6, 0x17312d, 0.35);
        const life = this.add.rectangle(-lifeBack.width / 2, lifeBack.y, lifeBack.width, 6, 0x58aa69, 1);
        life.setOrigin(0, 0.5);
        container.add([plate, art, label, lifeBack, life]);
        container.setSize(clamp(slotWidth * 0.82, 48, 100), clamp(kitchenHeight * 0.36, 58, 92));
        container.setInteractive(
          new Phaser.Geom.Rectangle(-container.width / 2, -container.height / 2, container.width, container.height),
          Phaser.Geom.Rectangle.Contains,
        );
        container.input!.cursor = "grab";
        container.setData("kind", "dish");
        container.setData("food-instance-id", food.id);
        this.input.setDraggable(container, true);
        layer.add(container);
        entry = { container, art, life, label, foodId: food.foodId };
        this.foodEntries.set(food.id, entry);
      }

      const homeX = 16 + slotWidth * (food.slot + 0.5);
      const homeY = passY + (food.lane === 0 ? -7 : 8);
      entry.container.setData("home-x", homeX);
      entry.container.setData("home-y", homeY);
      entry.container.setAlpha(food.leaving ? 0.35 : 1);

      if (this.draggingFoodId !== food.id) {
        entry.container.disableInteractive();

        if (!food.leaving && snapshot.status === "playing") {
          entry.container.setInteractive(
            new Phaser.Geom.Rectangle(-entry.container.width / 2, -entry.container.height / 2, entry.container.width, entry.container.height),
            Phaser.Geom.Rectangle.Contains,
          );
          entry.container.input!.cursor = "grab";
          this.input.setDraggable(entry.container, true);
        }

        entry.container.setPosition(homeX, homeY);
        entry.container.setDepth(30 + food.slot);
      }

      const artSize = clamp(slotWidth * 0.47, 30, 62);
      const texture = this.textures.get(`dish-food-${food.foodId}`).getSourceImage() as HTMLImageElement;
      const ratio = texture.width > 0 && texture.height > 0 ? texture.width / texture.height : 1;
      entry.art.setDisplaySize(artSize * ratio, artSize);
      entry.label.setText(FOOD_NAMES[food.foodId]);
      const maxLifeWidth = clamp(slotWidth * 0.65, 38, 78);
      entry.life.setDisplaySize(Math.max(1, maxLifeWidth * (1 - clamp(food.progress, 0, 1))), 6);
      entry.life.setFillStyle(food.progress > 0.75 ? 0xd85b4b : 0x58aa69);
    });

  }

  private renderEmptyMessage() {
    const snapshot = this.snapshot;

    this.emptyMessage?.destroy();
    this.emptyMessage = undefined;

    if (!snapshot || snapshot.guests.length > 0) {
      return;
    }

    const layout = this.getLayout();
    this.emptyMessage = this.add.text(
      this.scale.width / 2,
      layout.top + layout.tile * layout.rows * 0.62,
      snapshot.status === "ended" ? "All guests served." : "Waiting for guests to arrive.",
      {
        color: "#17312d",
        fontFamily: "system-ui, sans-serif",
        fontSize: `${clamp(layout.tile * 0.24, 12, 18)}px`,
        fontStyle: "bold",
        backgroundColor: "#fffdf8",
        padding: { x: 10, y: 6 },
      },
    );
    this.emptyMessage.setOrigin(0.5);
    this.emptyMessage.setDepth(50);
  }

  private findDropGuest(x: number, y: number) {
    const snapshot = this.snapshot;

    if (!snapshot) {
      return null;
    }

    const layout = this.getLayout();
    const radius = clamp(layout.tile * 0.9, 38, 92);

    for (const guest of snapshot.guests) {
      if (guest.phase !== "seated") {
        continue;
      }

      const tile = TABLE_TILES[guest.seatIndex];

      if (!tile) {
        continue;
      }

      const point = this.gridPoint(tile.col, tile.row, layout);

      if (Phaser.Math.Distance.Between(x, y, point.x, point.y) <= radius) {
        return guest.id;
      }
    }

    return null;
  }
}
