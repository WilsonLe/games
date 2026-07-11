import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent, ReactNode } from "react";
import {
  BadgeCheck,
  Bike,
  BookOpen,
  Check,
  Flame,
  Gauge,
  Home,
  Languages,
  Mail,
  MapPin,
  Package,
  Pause,
  Play,
  RotateCcw,
  Route,
  Star,
  Volume2,
  X,
} from "lucide-react";
import customerMaiUrl from "./assets/sprites/customer-mai.png";
import foodBreadUrl from "./assets/sprites/food-bread.png";
import foodChickenUrl from "./assets/sprites/food-chicken.png";
import foodEggUrl from "./assets/sprites/food-egg.png";
import foodFishUrl from "./assets/sprites/food-fish.png";
import foodNoodlesUrl from "./assets/sprites/food-noodles.png";
import foodRiceUrl from "./assets/sprites/food-rice.png";
import foodSaladUrl from "./assets/sprites/food-salad.png";
import foodSoupUrl from "./assets/sprites/food-soup.png";
import foodTeaUrl from "./assets/sprites/food-tea.png";
import gameKitchenBgUrl from "./assets/game-kitchen-bg.png";
import playerChefUrl from "./assets/player-chef.png";
import type { DishWishSnapshot } from "./games/dish-wish/DishWishScene";
import type { DropHopSnapshot } from "./games/drop-hop/DropHopScene";

const DishWishStage = lazy(async () => {
  const module = await import("./games/dish-wish/DishWishStage");
  return { default: module.DishWishStage };
});

const DropHopMap = lazy(async () => {
  const module = await import("./games/drop-hop/DropHopMap");
  return { default: module.DropHopMap };
});

type FoodId = "rice" | "fish" | "chicken" | "egg" | "noodles" | "soup" | "salad" | "tea" | "bread";

type Food = {
  id: FoodId;
  name: string;
};

type CustomerProfile = {
  id: "mai" | "leo" | "nora" | "ben" | "ivy" | "sam";
  name: string;
};

type GuestPhase = "entering" | "seated" | "leaving";
type WalkDirection = "north" | "south" | "east" | "west";

type TilePoint = {
  col: number;
  row: number;
};

type SeatLayout = {
  table: TilePoint;
  customer: TilePoint;
  facing: WalkDirection;
};

type DifficultyProfile = {
  level: number;
  maxGuests: number;
  orderSize: number;
  timeToLastDishMs: number;
  dishGapMs: number;
  guestIntervalMs: number;
  beltTravelMs: number;
  decoyIntervalMs: number;
  firstDecoyDelayMs: number;
  patienceBufferMs: number;
};

type DinerLevelProfile = Omit<DifficultyProfile, "dishGapMs"> & {
  ordersToAdvance: number;
};

type ActiveGuest = {
  instanceId: string;
  customer: CustomerProfile;
  orderNumber: number;
  phrase: string;
  foods: FoodId[];
  servedFoods: FoodId[];
  createdAt: number;
  serviceStartsAt: number;
  expiresAt: number;
  seatIndex: number;
  heardOrder: boolean;
  practiceFoodId: FoodId | null;
  phase: GuestPhase;
  leavingAt?: number;
};

type ScheduledFood = {
  id: string;
  readyAt: number;
  dueAt: number;
  foodId: FoodId;
  targetGuestId: string | null;
  lane: number;
};

type BeltFood = {
  id: string;
  foodId: FoodId;
  targetGuestId: string | null;
  lane: number;
  slot: number;
  spawnedAt: number;
  travelMs: number;
  leavingAt?: number;
};

type MissedOrderRecap = {
  id: string;
  guestName: string;
  foods: FoodId[];
  retryFoodId: FoodId | null;
};

type CharacterVisual = TilePoint & {
  direction: WalkDirection;
  walking: boolean;
  done: boolean;
};

type Feedback = {
  kind: "neutral" | "good" | "bad";
  text: string;
};

type DinerIntroStep = "wait" | "select" | "serve";

type ServedEcho = {
  id: string;
  foodId: FoodId;
  guestName: string;
};

type LevelTransition = {
  level: number;
  message: string;
};

type GameStatus = "ready" | "playing" | "paused" | "ended";
type SoundKind = "correct" | "complete" | "wrong";
type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type LocationId =
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

type CityLocation = {
  id: LocationId;
  name: string;
  shortName: string;
  kind: "hub" | "shop" | "house" | "school" | "park" | "bridge" | "library" | "post";
  x: number;
  y: number;
};

type DeliveryItemId = "bread" | "tea" | "letter" | "book" | "package" | "salad" | "egg";

type DeliveryItem = {
  id: DeliveryItemId;
  name: string;
  pluralName: string;
  foodId?: FoodId;
  icon: "mail" | "book" | "package";
};

type CityMission = {
  id: string;
  phrase: string;
  pickup: LocationId;
  dropoff: LocationId;
  itemId: DeliveryItemId;
  quantity: number;
  relationLabel: string;
  focusWords: string[];
  reward: number;
  requiredStop?: LocationId;
};

const FOODS: Food[] = [
  { id: "rice", name: "rice" },
  { id: "fish", name: "fish" },
  { id: "chicken", name: "chicken" },
  { id: "egg", name: "egg" },
  { id: "noodles", name: "noodles" },
  { id: "soup", name: "soup" },
  { id: "salad", name: "salad" },
  { id: "tea", name: "tea" },
  { id: "bread", name: "bread" },
];

const foodArtById: Record<FoodId, string> = {
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

const CUSTOMERS: CustomerProfile[] = [
  { id: "mai", name: "Mia" },
  { id: "leo", name: "Leo" },
  { id: "nora", name: "Nora" },
  { id: "ben", name: "Ben" },
  { id: "ivy", name: "Ivy" },
  { id: "sam", name: "Sam" },
];

const FIRST_DISH_DELAY_MS = 1_800;

const DINER_LEVELS: DinerLevelProfile[] = [
  {
    level: 1,
    ordersToAdvance: 4,
    maxGuests: 1,
    orderSize: 1,
    timeToLastDishMs: FIRST_DISH_DELAY_MS,
    guestIntervalMs: 7_600,
    beltTravelMs: 15_000,
    decoyIntervalMs: 9_000,
    firstDecoyDelayMs: 12_000,
    patienceBufferMs: 15_000,
  },
  {
    level: 2,
    ordersToAdvance: 4,
    maxGuests: 1,
    orderSize: 1,
    timeToLastDishMs: FIRST_DISH_DELAY_MS,
    guestIntervalMs: 7_000,
    beltTravelMs: 14_400,
    decoyIntervalMs: 7_400,
    firstDecoyDelayMs: 9_000,
    patienceBufferMs: 14_500,
  },
  {
    level: 3,
    ordersToAdvance: 4,
    maxGuests: 1,
    orderSize: 2,
    timeToLastDishMs: 5_200,
    guestIntervalMs: 6_800,
    beltTravelMs: 13_800,
    decoyIntervalMs: 6_800,
    firstDecoyDelayMs: 7_600,
    patienceBufferMs: 14_500,
  },
  {
    level: 4,
    ordersToAdvance: 4,
    maxGuests: 2,
    orderSize: 2,
    timeToLastDishMs: 6_200,
    guestIntervalMs: 6_000,
    beltTravelMs: 13_100,
    decoyIntervalMs: 5_600,
    firstDecoyDelayMs: 6_200,
    patienceBufferMs: 13_800,
  },
  {
    level: 5,
    ordersToAdvance: 4,
    maxGuests: 2,
    orderSize: 2,
    timeToLastDishMs: 7_600,
    guestIntervalMs: 5_200,
    beltTravelMs: 12_200,
    decoyIntervalMs: 4_700,
    firstDecoyDelayMs: 5_200,
    patienceBufferMs: 13_200,
  },
  {
    level: 6,
    ordersToAdvance: 4,
    maxGuests: 3,
    orderSize: 3,
    timeToLastDishMs: 9_200,
    guestIntervalMs: 4_400,
    beltTravelMs: 11_200,
    decoyIntervalMs: 3_800,
    firstDecoyDelayMs: 4_300,
    patienceBufferMs: 12_600,
  },
];

const TARGET_SERVES = DINER_LEVELS.reduce((total, profile) => total + profile.ordersToAdvance, 0);
const MAX_LEVEL = DINER_LEVELS.length;

if (MAX_LEVEL !== 6 || TARGET_SERVES !== 24) {
  throw new Error("Dish Wish progression must stay at six levels and twenty-four total orders.");
}

if (DINER_LEVELS.some((profile) => profile.orderSize > FOODS.length)) {
  throw new Error("Dish Wish orders cannot request more unique foods than exist in the menu.");
}
const HAPPY_GUEST_COMBO_BONUS = 15;
const NEXT_GUEST_AFTER_COMPLETE_MS = 3_000;
const DINER_CLOCK_MS = 100;
const CHARACTER_STEP_MS = 360;
const LEAVING_GUEST_LINGER_MS = 350;
const DISH_EXIT_MS = 360;
const WRONG_DISH_PATIENCE_BASE_MS = 2_500;
const WRONG_DISH_PATIENCE_PER_LEVEL_MS = 500;
const SERVED_DISH_PATIENCE_BONUS_MS = 2_000;
const SUPPLY_DELAY_RETRY_MS = 650;
const MISSED_RECAP_MS = 5_500;
const MAX_PRACTICE_REPEATS_PER_FOOD = 2;
const ORDER_LANES = 2;
const DISH_PASS_CAPACITY = 6;
const PORTAL_TITLE = "Lingo Game";
const DISH_WISH_TITLE = "Dish Wish";
const DISH_WISH_PATH = "/games/dish-wish";
const DROP_HOP_TITLE = "Drop Hop";
const DROP_HOP_PATH = "/games/drop-hop";
const LEGACY_DISH_WISH_PATH = "/games/table-talk-diner";
const LEGACY_DROP_HOP_PATH = "/games/tiny-city-delivery";
const TARGET_CITY_DELIVERIES = 10;
const MAX_CITY_MISTAKES = 5;
const CITY_STREAK_BONUS = 12;

function normalizePath(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

function canonicalizePath(path: string) {
  const normalizedPath = normalizePath(path);

  if (normalizedPath === LEGACY_DISH_WISH_PATH) {
    return DISH_WISH_PATH;
  }

  if (normalizedPath === LEGACY_DROP_HOP_PATH) {
    return DROP_HOP_PATH;
  }

  return normalizedPath;
}

const INTRO_ORDER_TEMPLATE = (items: string) => `I'd like ${items}, please.`;

const ORDER_TEMPLATES: Array<(items: string) => string> = [
  (items) => `Could I please have ${items}?`,
  (items) => `May I order ${items}?`,
  (items) => `Can I get ${items} for dinner?`,
  (items) => `I'm hungry for ${items}.`,
  (items) => `Please bring me ${items}.`,
  (items) => `I'd love ${items} today.`,
  (items) => `Do you have ${items}? I'd like that.`,
  (items) => `For my meal, I want ${items}.`,
  (items) => `Could you serve ${items}, please?`,
];

const HAPPY_GUEST_LINES = [
  "That was perfect. Thank you.",
  "Great service. I am happy.",
  "Everything is right. Thanks.",
  "Wonderful. That is exactly what I ordered.",
  "Delicious. I will come back again.",
  "Nice work. The meal was great.",
];

const DINER_FLOOR_COLUMNS = 10;
const DINER_FLOOR_ROWS = 5;
const DINER_DOOR_TILE: TilePoint = { col: 0, row: DINER_FLOOR_ROWS - 1 };

const SEAT_LAYOUT: SeatLayout[] = [
  { table: { col: 2, row: 1 }, customer: { col: 1, row: 1 }, facing: "east" },
  { table: { col: 7, row: 1 }, customer: { col: 8, row: 1 }, facing: "west" },
  { table: { col: 2, row: 3 }, customer: { col: 2, row: 4 }, facing: "north" },
  { table: { col: 7, row: 3 }, customer: { col: 7, row: 2 }, facing: "south" },
];

const foodById = new Map(FOODS.map((food) => [food.id, food]));

const CITY_LOCATIONS: CityLocation[] = [
  { id: "depot", name: "Delivery Depot", shortName: "Depot", kind: "hub", x: 50, y: 87 },
  { id: "bakery", name: "Bakery", shortName: "Bakery", kind: "shop", x: 17, y: 74 },
  { id: "park", name: "Park", shortName: "Park", kind: "park", x: 17, y: 48 },
  { id: "market", name: "Market", shortName: "Market", kind: "shop", x: 17, y: 23 },
  { id: "school", name: "School", shortName: "School", kind: "school", x: 43, y: 48 },
  { id: "redHouse", name: "Red House", shortName: "Red House", kind: "house", x: 43, y: 22 },
  { id: "toyShop", name: "Toy Shop", shortName: "Toy Shop", kind: "shop", x: 43, y: 74 },
  { id: "bridge", name: "Bridge", shortName: "Bridge", kind: "bridge", x: 62, y: 58 },
  { id: "library", name: "Library", shortName: "Library", kind: "library", x: 81, y: 58 },
  { id: "blueHouse", name: "Blue House", shortName: "Blue House", kind: "house", x: 81, y: 25 },
  { id: "postOffice", name: "Post Office", shortName: "Post", kind: "post", x: 81, y: 79 },
];

const CITY_ROADS: Array<[LocationId, LocationId]> = [
  ["depot", "bakery"],
  ["depot", "toyShop"],
  ["depot", "postOffice"],
  ["bakery", "park"],
  ["bakery", "toyShop"],
  ["park", "market"],
  ["park", "school"],
  ["market", "redHouse"],
  ["school", "redHouse"],
  ["school", "bridge"],
  ["toyShop", "bridge"],
  ["bridge", "library"],
  ["library", "blueHouse"],
  ["library", "postOffice"],
];

const CITY_ITEMS: DeliveryItem[] = [
  { id: "bread", name: "bread", pluralName: "bread", foodId: "bread", icon: "package" },
  { id: "tea", name: "tea", pluralName: "cups of tea", foodId: "tea", icon: "package" },
  { id: "letter", name: "letter", pluralName: "letters", icon: "mail" },
  { id: "book", name: "book", pluralName: "books", icon: "book" },
  { id: "package", name: "package", pluralName: "packages", icon: "package" },
  { id: "salad", name: "salad", pluralName: "salads", foodId: "salad", icon: "package" },
  { id: "egg", name: "egg", pluralName: "eggs", foodId: "egg", icon: "package" },
];

const CITY_MISSIONS: CityMission[] = [
  {
    id: "behind-school",
    phrase: "Pick up the bread at the bakery. Take it to the red house behind the school.",
    pickup: "bakery",
    dropoff: "redHouse",
    itemId: "bread",
    quantity: 1,
    relationLabel: "behind the school",
    focusWords: ["bread", "bakery", "behind", "school", "red house"],
    reward: 95,
  },
  {
    id: "three-letters",
    phrase: "Deliver three letters to the post office.",
    pickup: "depot",
    dropoff: "postOffice",
    itemId: "letter",
    quantity: 3,
    relationLabel: "three letters",
    focusWords: ["three", "letters", "post office"],
    reward: 80,
  },
  {
    id: "between-school-library",
    phrase: "Take the package to the bridge between the school and the library.",
    pickup: "toyShop",
    dropoff: "bridge",
    itemId: "package",
    quantity: 1,
    relationLabel: "between school and library",
    focusWords: ["package", "bridge", "between", "school", "library"],
    reward: 105,
  },
  {
    id: "over-bridge",
    phrase: "Pick up the book at the school. Go over the bridge and deliver it to the library.",
    pickup: "school",
    dropoff: "library",
    itemId: "book",
    quantity: 1,
    relationLabel: "over the bridge",
    focusWords: ["book", "school", "over", "bridge", "library"],
    requiredStop: "bridge",
    reward: 120,
  },
  {
    id: "next-to-bakery",
    phrase: "Take two cups of tea to the park next to the bakery.",
    pickup: "bakery",
    dropoff: "park",
    itemId: "tea",
    quantity: 2,
    relationLabel: "next to the bakery",
    focusWords: ["two", "tea", "park", "next to", "bakery"],
    reward: 90,
  },
  {
    id: "across-bridge",
    phrase: "Take the egg to the blue house across the bridge.",
    pickup: "market",
    dropoff: "blueHouse",
    itemId: "egg",
    quantity: 1,
    relationLabel: "across the bridge",
    focusWords: ["egg", "blue house", "across", "bridge"],
    requiredStop: "bridge",
    reward: 125,
  },
  {
    id: "inside-red-house",
    phrase: "Put the package inside the red house behind the school.",
    pickup: "depot",
    dropoff: "redHouse",
    itemId: "package",
    quantity: 1,
    relationLabel: "inside the red house",
    focusWords: ["package", "inside", "red house", "behind", "school"],
    reward: 100,
  },
  {
    id: "outside-blue-house",
    phrase: "Leave two salads outside the blue house.",
    pickup: "market",
    dropoff: "blueHouse",
    itemId: "salad",
    quantity: 2,
    relationLabel: "outside the blue house",
    focusWords: ["two", "salads", "outside", "blue house"],
    reward: 100,
  },
  {
    id: "next-to-park",
    phrase: "Deliver one letter to the school next to the park.",
    pickup: "postOffice",
    dropoff: "school",
    itemId: "letter",
    quantity: 1,
    relationLabel: "next to the park",
    focusWords: ["one", "letter", "school", "next to", "park"],
    reward: 92,
  },
  {
    id: "across-river-post",
    phrase: "Bring three packages across the bridge to the post office.",
    pickup: "toyShop",
    dropoff: "postOffice",
    itemId: "package",
    quantity: 3,
    relationLabel: "across the bridge",
    focusWords: ["three", "packages", "across", "bridge", "post office"],
    requiredStop: "bridge",
    reward: 130,
  },
];

const cityLocationById = new Map(CITY_LOCATIONS.map((location) => [location.id, location]));
const cityItemById = new Map(CITY_ITEMS.map((item) => [item.id, item]));
const cityNeighbors = CITY_ROADS.reduce((neighbors, [from, to]) => {
  neighbors[from].add(to);
  neighbors[to].add(from);
  return neighbors;
}, Object.fromEntries(CITY_LOCATIONS.map((location) => [location.id, new Set<LocationId>()])) as Record<LocationId, Set<LocationId>>);

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getSeatLayout(seatIndex: number) {
  return SEAT_LAYOUT[seatIndex % SEAT_LAYOUT.length];
}

function chooseAvailableSeatIndex(guests: ActiveGuest[], sequence: number) {
  const occupiedSeats = new Set(guests.map((guest) => guest.seatIndex));

  for (let offset = 0; offset < SEAT_LAYOUT.length; offset += 1) {
    const seatIndex = (sequence + offset) % SEAT_LAYOUT.length;

    if (!occupiedSeats.has(seatIndex)) {
      return seatIndex;
    }
  }

  return null;
}

function getWalkDirection(from: TilePoint, to: TilePoint): WalkDirection {
  if (to.col > from.col) {
    return "east";
  }

  if (to.col < from.col) {
    return "west";
  }

  if (to.row < from.row) {
    return "north";
  }

  return "south";
}

function getTileKey(point: TilePoint) {
  return `${point.col}:${point.row}`;
}

function buildTileRoute(start: TilePoint, end: TilePoint) {
  const startKey = getTileKey(start);
  const endKey = getTileKey(end);
  const blockedTileKeys = new Set(SEAT_LAYOUT.map((seat) => getTileKey(seat.table)));
  blockedTileKeys.delete(startKey);
  blockedTileKeys.delete(endKey);

  const pointsByKey = new Map<string, TilePoint>([[startKey, start]]);
  const previousKeyByKey = new Map<string, string | null>([[startKey, null]]);
  const queue: TilePoint[] = [start];
  const neighborOffsets: TilePoint[] = [
    { col: 1, row: 0 },
    { col: 0, row: -1 },
    { col: 0, row: 1 },
    { col: -1, row: 0 },
  ];

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
    const current = queue[queueIndex];
    const currentKey = getTileKey(current);

    if (currentKey === endKey) {
      break;
    }

    for (const offset of neighborOffsets) {
      const next = { col: current.col + offset.col, row: current.row + offset.row };
      const nextKey = getTileKey(next);
      const isOnFloor =
        next.col >= 0 &&
        next.col < DINER_FLOOR_COLUMNS &&
        next.row >= 0 &&
        next.row < DINER_FLOOR_ROWS;

      if (!isOnFloor || blockedTileKeys.has(nextKey) || previousKeyByKey.has(nextKey)) {
        continue;
      }

      pointsByKey.set(nextKey, next);
      previousKeyByKey.set(nextKey, currentKey);
      queue.push(next);
    }
  }

  if (!previousKeyByKey.has(endKey)) {
    return [{ ...start }];
  }

  const reversedPath: TilePoint[] = [];
  let currentKey: string | null = endKey;

  while (currentKey) {
    const point = pointsByKey.get(currentKey);

    if (point) {
      reversedPath.push(point);
    }

    currentKey = previousKeyByKey.get(currentKey) ?? null;
  }

  return reversedPath.reverse();
}

function getRouteDuration(path: TilePoint[], stepMs: number) {
  return Math.max(0, path.length - 1) * stepMs;
}

function getRouteVisual(path: TilePoint[], startedAt: number, now: number, stepMs: number): CharacterVisual {
  const fallback = path[0] ?? DINER_DOOR_TILE;
  const segmentCount = Math.max(0, path.length - 1);

  if (segmentCount === 0) {
    return { ...fallback, direction: "south", walking: false, done: true };
  }

  const duration = getRouteDuration(path, stepMs);
  const elapsed = clamp(now - startedAt, 0, duration);
  const done = elapsed >= duration;
  const segmentIndex = done
    ? segmentCount - 1
    : Math.min(Math.floor(elapsed / stepMs), segmentCount - 1);
  const segmentStart = path[segmentIndex] ?? fallback;
  const segmentEnd = path[segmentIndex + 1] ?? segmentStart;
  const segmentProgress = done ? 1 : (elapsed - segmentIndex * stepMs) / stepMs;

  return {
    col: segmentStart.col + (segmentEnd.col - segmentStart.col) * segmentProgress,
    row: segmentStart.row + (segmentEnd.row - segmentStart.row) * segmentProgress,
    direction: getWalkDirection(segmentStart, segmentEnd),
    walking: now - startedAt < duration + DINER_CLOCK_MS,
    done,
  };
}

function getGuestPath(guest: ActiveGuest) {
  const seat = getSeatLayout(guest.seatIndex);
  return buildTileRoute(DINER_DOOR_TILE, seat.customer);
}

function getGuestWalkDuration(guest: ActiveGuest) {
  return getRouteDuration(getGuestPath(guest), CHARACTER_STEP_MS);
}

function getGuestRouteTransitionDuration(guest: ActiveGuest) {
  return getGuestWalkDuration(guest) + DINER_CLOCK_MS;
}

function getGuestVisual(guest: ActiveGuest, now: number): CharacterVisual {
  const seat = getSeatLayout(guest.seatIndex);

  if (guest.phase === "entering") {
    return getRouteVisual(getGuestPath(guest), guest.createdAt, now, CHARACTER_STEP_MS);
  }

  if (guest.phase === "leaving") {
    const path = [...getGuestPath(guest)].reverse();
    return getRouteVisual(path, guest.leavingAt ?? now, now, CHARACTER_STEP_MS);
  }

  return { ...seat.customer, direction: seat.facing, walking: false, done: true };
}

function formatTime(ms: number) {
  return `${Math.max(0, Math.ceil(ms / 1000))}s`;
}

function getFoodName(foodId: FoodId) {
  return foodById.get(foodId)?.name ?? foodId;
}

function formatList(items: string[]) {
  if (items.length <= 1) {
    return items[0] ?? "";
  }

  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }

  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function getCityLocationName(locationId: LocationId) {
  return cityLocationById.get(locationId)?.name ?? locationId;
}

function getCityRoadKey(from: LocationId, to: LocationId) {
  return [from, to].sort().join(":");
}

function getCityItemLabel(item: DeliveryItem, quantity: number) {
  if (quantity === 1) {
    return item.name;
  }

  return `${quantity} ${item.pluralName}`;
}

function formatEarnedPoints(earned: number, comboBonus: number) {
  return comboBonus > 0 ? `+${earned} happy guest combo +${comboBonus}` : `+${earned}`;
}

function formatCityEarnedPoints(earned: number, streakBonus: number) {
  return streakBonus > 0 ? `+${earned} route streak +${streakBonus}` : `+${earned}`;
}

function getNextCityMission(index: number) {
  return CITY_MISSIONS[index % CITY_MISSIONS.length];
}

function levelForServed(served: number) {
  let completionThreshold = 0;

  for (const profile of DINER_LEVELS) {
    completionThreshold += profile.ordersToAdvance;

    if (served < completionThreshold) {
      return profile.level;
    }
  }

  return MAX_LEVEL;
}

function difficultyForLevel(level: number): DifficultyProfile {
  const profile = DINER_LEVELS[clamp(level, 1, MAX_LEVEL) - 1];

  return {
    ...profile,
    dishGapMs: Math.round(profile.timeToLastDishMs / Math.max(1, profile.orderSize - 1)),
  };
}

function getLevelTransitionMessage(previousLevel: number, nextLevel: number) {
  const previousProfile = DINER_LEVELS[previousLevel - 1];
  const nextProfile = DINER_LEVELS[nextLevel - 1];
  const changes: string[] = [];

  if (!previousProfile || !nextProfile) {
    return `Level ${nextLevel}! Keep listening carefully as the diner changes pace.`;
  }

  if (previousLevel === 1 && nextLevel > 1) {
    changes.push("orders use more English sentence patterns");
  }

  if (nextProfile.orderSize > previousProfile.orderSize) {
    changes.push(`orders can ask for ${nextProfile.orderSize} dishes`);
  }

  if (nextProfile.maxGuests > previousProfile.maxGuests) {
    changes.push(`up to ${nextProfile.maxGuests} guests can order at once`);
  }

  if (previousLevel === 1 && nextProfile.firstDecoyDelayMs < previousProfile.firstDecoyDelayMs) {
    changes.push("extra dishes appear sooner");
  }

  if (
    nextProfile.guestIntervalMs < previousProfile.guestIntervalMs &&
    nextProfile.orderSize === previousProfile.orderSize &&
    nextProfile.maxGuests === previousProfile.maxGuests &&
    changes.length < 2
  ) {
    changes.push("guests arrive faster");
  }

  if (nextProfile.beltTravelMs < previousProfile.beltTravelMs && changes.length < 2) {
    changes.push("dishes leave the pass sooner");
  }

  if (nextProfile.firstDecoyDelayMs < previousProfile.firstDecoyDelayMs && changes.length < 2) {
    changes.push("extra dishes appear sooner");
  }

  if (nextProfile.decoyIntervalMs < previousProfile.decoyIntervalMs && changes.length < 2) {
    changes.push("extra dishes show up more often");
  }

  if (nextProfile.patienceBufferMs < previousProfile.patienceBufferMs && changes.length === 0) {
    changes.push("guests wait a little less");
  }

  const summary = formatList(changes.length > 0 ? changes : ["the diner changes pace"]);
  const sentence = summary.charAt(0).toUpperCase() + summary.slice(1);

  return `Level ${nextLevel}! ${sentence}.`;
}

function selectFoods(sequence: number, count: number, level: number, practiceFoodId?: FoodId | null) {
  const foods: FoodId[] = [];

  if (practiceFoodId) {
    foods.push(practiceFoodId);
  }

  let cursor = (sequence * 3 + level) % FOODS.length;

  while (foods.length < count) {
    const nextFood = FOODS[cursor % FOODS.length].id;

    if (!foods.includes(nextFood)) {
      foods.push(nextFood);
    }

    cursor += 3;
  }

  return foods;
}

function getNextRequiredFood(guest: Pick<ActiveGuest, "foods" | "servedFoods">) {
  return guest.foods.find((foodId) => {
    const required = guest.foods.filter((candidate) => candidate === foodId).length;
    const served = guest.servedFoods.filter((candidate) => candidate === foodId).length;
    return served < required;
  }) ?? guest.foods[0] ?? null;
}

function makeOrderPhrase(seed: number, foodNames: string[], level: number) {
  if (level === 1) {
    return INTRO_ORDER_TEMPLATE(formatList(foodNames));
  }

  const template = ORDER_TEMPLATES[Math.abs(seed) % ORDER_TEMPLATES.length];
  return template(formatList(foodNames));
}

function renderOrderPhrase(guest: ActiveGuest) {
  const orderedFoodsByName = new Map(
    guest.foods.map((foodId) => {
      const foodName = getFoodName(foodId);
      return [foodName, foodId] as const;
    }),
  );
  const foodNamePattern = [...orderedFoodsByName.keys()]
    .map((foodName) => foodName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");

  return guest.phrase.split(new RegExp(`(${foodNamePattern})`, "g")).map((part, index) => {
    const foodId = orderedFoodsByName.get(part);

    if (!foodId) {
      return part;
    }

    const served = guest.servedFoods.includes(foodId);

    return (
      <span
        className={cx("guestSpeech__dish", served && "guestSpeech__dish--served")}
        key={`${guest.instanceId}-phrase-${foodId}-${index}`}
        aria-label={served ? `${part}, served` : part}
      >
        {part}
      </span>
    );
  });
}

function makeGuest(
  sequence: number,
  now: number,
  profile: DifficultyProfile,
  seatIndex: number,
  practiceFoodId: FoodId | null = null,
) {
  const customer = CUSTOMERS[sequence % CUSTOMERS.length];
  const foods = selectFoods(sequence, profile.orderSize, profile.level, practiceFoodId);
  const foodNames = foods.map((foodId) => getFoodName(foodId));
  const phrase = makeOrderPhrase(sequence + Math.floor(now / 1000), foodNames, profile.level);
  const instanceId = `guest-${sequence}-${now}`;
  const provisionalGuest: ActiveGuest = {
    instanceId,
    customer,
    orderNumber: sequence + 1,
    phrase,
    foods,
    servedFoods: [],
    createdAt: now,
    serviceStartsAt: now,
    expiresAt: now,
    seatIndex,
    heardOrder: false,
    practiceFoodId,
    phase: "entering",
  };
  const serviceStartsAt = now + getGuestRouteTransitionDuration(provisionalGuest);
  const guest: ActiveGuest = {
    ...provisionalGuest,
    serviceStartsAt,
    expiresAt: serviceStartsAt + profile.timeToLastDishMs + profile.patienceBufferMs,
  };

  const scheduledFoods: ScheduledFood[] = foods.map((foodId, index) => {
    const offset =
      foods.length === 1
        ? FIRST_DISH_DELAY_MS
        : FIRST_DISH_DELAY_MS +
          Math.round((index / (foods.length - 1)) * (profile.timeToLastDishMs - FIRST_DISH_DELAY_MS));

    const readyAt = serviceStartsAt + offset;

    return {
      id: `scheduled-${instanceId}-${foodId}-${index}`,
      readyAt,
      dueAt: readyAt,
      foodId,
      targetGuestId: instanceId,
      lane: (sequence + index) % ORDER_LANES,
    };
  });

  return { guest, scheduledFoods };
}

function makeDecoyFood(sequence: number, now: number, profile: DifficultyProfile, slot: number): BeltFood {
  const foodId = FOODS[(sequence * 5 + profile.level) % FOODS.length].id;

  return {
    id: `decoy-${sequence}-${now}`,
    foodId,
    targetGuestId: null,
    lane: (sequence + profile.level) % ORDER_LANES,
    slot,
    spawnedAt: now,
    travelMs: profile.beltTravelMs,
  };
}

function chooseAvailableDishSlot(currentFoods: BeltFood[]) {
  const occupiedSlots = new Set(currentFoods.map((food) => food.slot));

  for (let slot = 0; slot < DISH_PASS_CAPACITY; slot += 1) {
    if (!occupiedSlots.has(slot)) {
      return slot;
    }
  }

  return null;
}

function chooseSpawnLane(preferredLane: number, currentFoods: BeltFood[], now: number) {
  for (let offset = 0; offset < ORDER_LANES; offset += 1) {
    const lane = (preferredLane + offset) % ORDER_LANES;
    const laneIsClear = currentFoods.every((food) => {
      const progress = (now - food.spawnedAt) / food.travelMs;
      return food.lane !== lane || progress > 0.24;
    });

    if (laneIsClear) {
      return lane;
    }
  }

  return null;
}

function speak(text: string, rate = 0.9) {
  if (!("speechSynthesis" in window)) {
    return false;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate;
  utterance.pitch = 1;
  utterance.volume = 0.95;
  window.speechSynthesis.speak(utterance);
  return true;
}

function scheduleTone(
  audioContext: AudioContext,
  frequency: number,
  delaySeconds: number,
  durationSeconds: number,
  type: OscillatorType,
  volume: number,
) {
  const startAt = audioContext.currentTime + delaySeconds;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationSeconds);

  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationSeconds + 0.04);
}

function needsFood(guest: ActiveGuest, foodId: FoodId) {
  const required = guest.foods.filter((id) => id === foodId).length;
  const served = guest.servedFoods.filter((id) => id === foodId).length;
  return served < required;
}

function getMissingFoods(guest: ActiveGuest) {
  const missingFoods: FoodId[] = [];
  const seen = new Set<FoodId>();

  guest.foods.forEach((foodId) => {
    if (needsFood(guest, foodId) && !seen.has(foodId)) {
      missingFoods.push(foodId);
      seen.add(foodId);
    }
  });

  return missingFoods;
}

function getNextNeededFoodId(guest: ActiveGuest) {
  return guest.foods.find((foodId) => needsFood(guest, foodId)) ?? null;
}

function getGuestSupplyHint(guest: ActiveGuest, beltFoods: BeltFood[], scheduledFoods: ScheduledFood[], now: number) {
  if (guest.phase !== "seated" || !guest.heardOrder) {
    return null;
  }

  const nextFoodId = getNextNeededFoodId(guest);

  if (!nextFoodId) {
    return null;
  }

  const foodName = getFoodName(nextFoodId);
  const visibleMatch = beltFoods.some((food) => !food.leavingAt && food.foodId === nextFoodId);

  if (visibleMatch) {
    return `On the pass: ${foodName}`;
  }

  const nextScheduledFood = scheduledFoods
    .filter((food) => food.targetGuestId === guest.instanceId && food.foodId === nextFoodId)
    .sort((left, right) => left.dueAt - right.dueAt)[0];

  if (!nextScheduledFood) {
    return null;
  }

  if (nextScheduledFood.readyAt <= now && nextScheduledFood.dueAt > now) {
    return `Coming next: ${foodName}`;
  }

  const secondsUntilDue = Math.max(1, Math.ceil((nextScheduledFood.dueAt - now) / 1000));
  return `Coming next: ${foodName} · ${secondsUntilDue}s`;
}

function choosePracticeFoodId(missedFoods: FoodId[], orderNumber: number, practiceCounts: Map<FoodId, number>) {
  const candidates = missedFoods.filter((foodId) => (practiceCounts.get(foodId) ?? 0) < MAX_PRACTICE_REPEATS_PER_FOOD);

  if (candidates.length === 0) {
    return null;
  }

  return candidates[orderNumber % candidates.length];
}

function isGuestComplete(guest: ActiveGuest) {
  return guest.foods.every((foodId) => !needsFood(guest, foodId));
}

function FoodArt({ id }: { id: FoodId }) {
  return (
    <span className={cx("foodArt", `foodArt--${id}`)} aria-hidden="true">
      <img src={foodArtById[id]} alt="" draggable="false" />
    </span>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="statPill">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


function CityCargoArt({ item, quantity }: { item: DeliveryItem; quantity: number }) {
  return (
    <span className="cityCargoArt" aria-hidden="true">
      {item.foodId ? <FoodArt id={item.foodId} /> : item.icon === "mail" ? <Mail size={28} /> : item.icon === "book" ? <BookOpen size={28} /> : <Package size={28} />}
      {quantity > 1 && <strong>{quantity}</strong>}
    </span>
  );
}

function DropHopGame({ onExit }: { onExit: () => void }) {
  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");
  const [missionIndex, setMissionIndex] = useState(0);
  const [currentLocationId, setCurrentLocationId] = useState<LocationId>("depot");
  const [packagePicked, setPackagePicked] = useState(false);
  const [path, setPath] = useState<LocationId[]>(["depot"]);
  const [score, setScore] = useState(0);
  const [delivered, setDelivered] = useState(0);
  const [streak, setStreak] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [deliveredLocationId, setDeliveredLocationId] = useState<LocationId | null>(null);
  const [feedback, setFeedback] = useState<Feedback>({
    kind: "neutral",
    text: "Ready for the first delivery.",
  });

  const mission = getNextCityMission(missionIndex);
  const item = cityItemById.get(mission.itemId) ?? CITY_ITEMS[0];
  const cargoLabel = getCityItemLabel(item, mission.quantity);
  const isCityWon = delivered >= TARGET_CITY_DELIVERIES;
  const mistakesLeft = Math.max(0, MAX_CITY_MISTAKES - mistakes);
  const level = clamp(Math.floor(delivered / 2) + 1, 1, 5);
  const audioContextRef = useRef<AudioContext | null>(null);

  const playSound = useCallback((kind: SoundKind) => {
    const AudioContextCtor = window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;

    if (!AudioContextCtor) {
      return false;
    }

    const audioContext = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    if (kind === "correct") {
      scheduleTone(audioContext, 523.25, 0, 0.08, "triangle", 0.07);
      scheduleTone(audioContext, 698.46, 0.08, 0.1, "triangle", 0.075);
      return true;
    }

    if (kind === "complete") {
      scheduleTone(audioContext, 587.33, 0, 0.08, "triangle", 0.07);
      scheduleTone(audioContext, 783.99, 0.08, 0.1, "triangle", 0.08);
      scheduleTone(audioContext, 1174.66, 0.19, 0.13, "triangle", 0.075);
      return true;
    }

    scheduleTone(audioContext, 170, 0, 0.14, "sawtooth", 0.055);
    scheduleTone(audioContext, 120, 0.12, 0.16, "sawtooth", 0.05);
    return true;
  }, []);

  const loadMission = useCallback((nextIndex: number, text?: string) => {
    const nextMission = getNextCityMission(nextIndex);
    const nextPackagePicked = nextMission.pickup === "depot";

    setMissionIndex(nextIndex);
    setCurrentLocationId("depot");
    setPackagePicked(nextPackagePicked);
    setPath(["depot"]);
    setDeliveredLocationId(null);
    setFeedback({
      kind: "neutral",
      text: text ?? nextMission.phrase,
    });
    speak(nextMission.phrase);
  }, []);

  const resetCityGame = useCallback(() => {
    const firstMission = getNextCityMission(0);
    const firstPackagePicked = firstMission.pickup === "depot";

    setMissionIndex(0);
    setCurrentLocationId("depot");
    setPackagePicked(firstPackagePicked);
    setPath(["depot"]);
    setScore(0);
    setDelivered(0);
    setStreak(0);
    setMistakes(0);
    setDeliveredLocationId(null);
    setFeedback({ kind: "neutral", text: firstMission.phrase });
    speak(firstMission.phrase);
    setGameStatus("playing");
  }, []);

  const pauseCityGame = useCallback(() => {
    setGameStatus("paused");
    setFeedback({ kind: "neutral", text: "Drop Hop is paused." });
  }, []);

  const resumeCityGame = useCallback(() => {
    setGameStatus("playing");
    setFeedback({ kind: "neutral", text: mission.phrase });
  }, [mission.phrase]);

  const toggleCityGameStatus = useCallback(() => {
    if (gameStatus === "ready" || gameStatus === "ended") {
      resetCityGame();
      return;
    }

    if (gameStatus === "playing") {
      pauseCityGame();
      return;
    }

    resumeCityGame();
  }, [gameStatus, pauseCityGame, resetCityGame, resumeCityGame]);

  const addCityMistake = useCallback((text: string) => {
    playSound("wrong");
    setStreak(0);
    setMistakes((currentMistakes) => {
      const nextMistakes = currentMistakes + 1;

      if (nextMistakes >= MAX_CITY_MISTAKES) {
        setGameStatus("ended");
      }

      return nextMistakes;
    });
    setFeedback({ kind: "bad", text });
    speak(text, 1.02);
  }, [playSound]);

  const listenToCityMission = useCallback(() => {
    const hasAudio = speak(mission.phrase);
    setFeedback({
      kind: hasAudio ? "neutral" : "bad",
      text: hasAudio ? mission.phrase : "Audio is not available in this browser.",
    });
  }, [mission.phrase]);

  const completeCityMission = useCallback(
    (nextPath: LocationId[]) => {
      const nextDelivered = delivered + 1;
      const nextStreak = streak + 1;
      const cleanPathBonus = Math.max(0, 8 - Math.max(0, nextPath.length - 1)) * 4;
      const streakBonus = Math.max(0, nextStreak - 1) * CITY_STREAK_BONUS;
      const earned = mission.reward + cleanPathBonus + streakBonus;
      const earnedLabel = formatCityEarnedPoints(earned, streakBonus);

      setScore((currentScore) => currentScore + earned);
      setDelivered(nextDelivered);
      setStreak(nextStreak);
      setDeliveredLocationId(mission.dropoff);
      playSound("complete");

      if (nextDelivered >= TARGET_CITY_DELIVERIES) {
        setFeedback({ kind: "good", text: `All deliveries complete. ${earnedLabel}` });
        speak("All deliveries complete. Great work.", 1);
        setGameStatus("ended");
        return;
      }

      const nextMissionText = `Delivered ${cargoLabel}. ${earnedLabel}`;
      loadMission(missionIndex + 1, nextMissionText);
    },
    [cargoLabel, delivered, loadMission, mission.dropoff, mission.reward, missionIndex, playSound, streak],
  );

  const handleCityLocationClick = useCallback(
    (locationId: LocationId) => {
      if (gameStatus !== "playing") {
        const text =
          gameStatus === "paused"
            ? "Resume the route to keep moving."
            : gameStatus === "ended"
              ? "Start a new route to make more deliveries."
              : "Start the first delivery.";
        setFeedback({ kind: "neutral", text });
        return;
      }

      const currentLocation = cityLocationById.get(currentLocationId);
      const nextLocation = cityLocationById.get(locationId);

      if (!currentLocation || !nextLocation) {
        return;
      }

      if (locationId === currentLocationId) {
        if (!packagePicked && locationId === mission.pickup) {
          setPackagePicked(true);
          setFeedback({ kind: "good", text: `Picked up ${cargoLabel} at the ${nextLocation.name}.` });
          playSound("correct");
          speak(`Picked up ${cargoLabel}.`, 1.03);
          return;
        }

        setFeedback({ kind: "neutral", text: `You are at the ${nextLocation.name}.` });
        return;
      }

      if (!cityNeighbors[currentLocationId].has(locationId)) {
        addCityMistake(`No road from ${currentLocation.shortName} to ${nextLocation.shortName}.`);
        return;
      }

      const nextPath = [...path, locationId];
      setCurrentLocationId(locationId);
      setPath(nextPath);

      if (!packagePicked) {
        if (locationId === mission.pickup) {
          setPackagePicked(true);
          setFeedback({ kind: "good", text: `Picked up ${cargoLabel} at the ${nextLocation.name}.` });
          playSound("correct");
          speak(`Picked up ${cargoLabel}.`, 1.03);
          return;
        }

        setFeedback({ kind: "neutral", text: `${nextLocation.name}. Pick up ${cargoLabel} at the ${getCityLocationName(mission.pickup)}.` });
        return;
      }

      if (locationId !== mission.dropoff) {
        setFeedback({ kind: "neutral", text: `${nextLocation.name}. Look for ${mission.relationLabel}.` });
        return;
      }

      if (mission.requiredStop && !nextPath.includes(mission.requiredStop)) {
        addCityMistake(`The order says ${mission.relationLabel}. Visit the ${getCityLocationName(mission.requiredStop)} first.`);
        return;
      }

      completeCityMission(nextPath);
    },
    [
      addCityMistake,
      cargoLabel,
      completeCityMission,
      currentLocationId,
      gameStatus,
      mission.dropoff,
      mission.pickup,
      mission.relationLabel,
      mission.requiredStop,
      packagePicked,
      path,
      playSound,
    ],
  );

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const dropHopSnapshot: DropHopSnapshot = useMemo(
    () => ({
      status: gameStatus,
      locations: CITY_LOCATIONS,
      roads: CITY_ROADS,
      usedRoadKeys: path.slice(1).map((locationId, index) => getCityRoadKey(path[index], locationId)),
      path,
      currentLocationId,
      pickupId: packagePicked ? null : mission.pickup,
      dropoffId: mission.dropoff,
      requiredStopId: mission.requiredStop ?? null,
      deliveredLocationId,
      packagePicked,
      relationLabel: mission.relationLabel,
    }),
    [
      currentLocationId,
      deliveredLocationId,
      gameStatus,
      mission.dropoff,
      mission.pickup,
      mission.relationLabel,
      mission.requiredStop,
      packagePicked,
      path,
    ],
  );

  return (
    <div className={cx("appShell", "appShell--city", gameStatus === "playing" && "appShell--playing")}>
      <div className="sceneBackdrop" aria-hidden="true">
        <div className="sceneBackdrop__image sceneBackdrop__image--city" />
      </div>

      <main className="mainSurface">
        <header className="topBar">
          <div>
            <p className="eyebrow">Tiny town simulator</p>
            <h1>{DROP_HOP_TITLE}</h1>
          </div>

          <div className="topActions">
            <button className="iconButton" type="button" onClick={onExit} aria-label="Back to game portal">
              <Home size={18} />
            </button>
            <button className="primaryButton" type="button" onClick={toggleCityGameStatus}>
              {gameStatus === "playing" ? <Pause size={18} /> : <Play size={18} />}
              <span>
                {gameStatus === "ready"
                  ? "Start Route"
                  : gameStatus === "playing"
                    ? "Pause"
                    : gameStatus === "paused"
                      ? "Resume"
                      : "New Route"}
              </span>
            </button>
            <button className="iconButton" type="button" onClick={resetCityGame} aria-label="Reset Drop Hop">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        <section className="scoreStrip" aria-label="Delivery stats">
          <StatPill icon={<Star size={17} />} label="Score" value={score} />
          <StatPill icon={<BadgeCheck size={17} />} label="Drops" value={`${delivered}/${TARGET_CITY_DELIVERIES}`} />
          <StatPill icon={<Flame size={17} />} label="Streak" value={streak} />
          <StatPill icon={<X size={17} />} label="Lives" value={mistakesLeft} />
          <StatPill icon={<Gauge size={17} />} label="Level" value={level} />
        </section>

        {gameStatus === "ended" && (
          <section className={cx("resultBanner", isCityWon ? "resultBanner--win" : "resultBanner--lost")}>
            <strong>{isCityWon ? "City route complete" : "Route closed"}</strong>
            <span>{isCityWon ? "Every package found the right place." : "Too many wrong turns ended the route."}</span>
          </section>
        )}

        <section className="gameGrid cityGameGrid">
          <section className="cityMissionColumn">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Current order</p>
                <h2>Delivery Ticket</h2>
              </div>
              <button className="iconButton iconButton--soft" type="button" onClick={listenToCityMission} aria-label="Play delivery order">
                <Volume2 size={18} />
              </button>
            </div>

            <article className="deliveryTicket">
              <div className="deliveryTicket__cargo">
                <CityCargoArt item={item} quantity={mission.quantity} />
                <div>
                  <strong>{cargoLabel}</strong>
                  <span>{packagePicked ? "In basket" : `Pick up: ${getCityLocationName(mission.pickup)}`}</span>
                </div>
              </div>

              <p className="guestPhrase cityOrderPhrase">{mission.phrase}</p>

              <div className="deliverySteps" aria-label="Delivery steps">
                <span className={cx(mission.pickup === currentLocationId || packagePicked ? "deliveryStep--done" : undefined)}>
                  <MapPin size={15} />
                  {getCityLocationName(mission.pickup)}
                </span>
                <span className={cx(mission.requiredStop && path.includes(mission.requiredStop) ? "deliveryStep--done" : undefined)}>
                  <Route size={15} />
                  {mission.requiredStop ? getCityLocationName(mission.requiredStop) : mission.relationLabel}
                </span>
                <span className={cx(currentLocationId === mission.dropoff ? "deliveryStep--done" : undefined)}>
                  <Home size={15} />
                  {getCityLocationName(mission.dropoff)}
                </span>
              </div>
            </article>

            <div className={cx("feedbackBar", `feedbackBar--${feedback.kind}`)} role="status">
              {feedback.text}
            </div>
          </section>

          <Suspense fallback={<div className="gameRendererFallback">Loading city map…</div>}>
            <DropHopMap snapshot={dropHopSnapshot} onLocationSelect={handleCityLocationClick} />
          </Suspense>

          <aside className="enginePanel cityWordPanel">
            <div>
              <p className="eyebrow">Words in motion</p>
              <h2>Route Clues</h2>
            </div>

            <div className="wordChipGrid">
              {mission.focusWords.map((word) => (
                <span className="wordChip" key={word}>
                  {word}
                </span>
              ))}
            </div>

            <div className="engineGrid cityFacts">
              <span>
                <small>Now at</small>
                <strong>{getCityLocationName(currentLocationId)}</strong>
              </span>
              <span>
                <small>Cargo</small>
                <strong>{packagePicked ? cargoLabel : "empty"}</strong>
              </span>
              <span>
                <small>Target phrase</small>
                <strong>{mission.relationLabel}</strong>
              </span>
              <span>
                <small>Roads used</small>
                <strong>{Math.max(0, path.length - 1)}</strong>
              </span>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function RestaurantGame({ onExit }: { onExit: () => void }) {
  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");
  const [now, setNow] = useState(Date.now());
  const [activeGuests, setActiveGuests] = useState<ActiveGuest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [scheduledFoods, setScheduledFoods] = useState<ScheduledFood[]>([]);
  const [beltFoods, setBeltFoods] = useState<BeltFood[]>([]);
  const [score, setScore] = useState(0);
  const [served, setServed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [guidedGuestId, setGuidedGuestId] = useState<string | null>(null);
  const [introOrderComplete, setIntroOrderComplete] = useState(false);
  const [servedEcho, setServedEcho] = useState<ServedEcho | null>(null);
  const [levelTransition, setLevelTransition] = useState<LevelTransition | null>(null);
  const [levelTransitionFocused, setLevelTransitionFocused] = useState(false);
  const [compactHelpOpen, setCompactHelpOpen] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>({
    kind: "neutral",
    text: "Guests are arriving. Tap a seated guest to hear an order.",
  });
  const [missedRecap, setMissedRecap] = useState<MissedOrderRecap | null>(null);

  const guestSequenceRef = useRef(0);
  const foodSequenceRef = useRef(0);
  const nextGuestAtRef = useRef(Date.now());
  const nextDecoyAtRef = useRef(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);
  const consumedDishIdsRef = useRef<Set<string>>(new Set());
  const practiceQueueRef = useRef<FoodId[]>([]);
  const practiceCountsRef = useRef<Map<FoodId, number>>(new Map());

  const level = levelForServed(served);
  const difficulty = useMemo(() => difficultyForLevel(level), [level]);

  const guidedGuest = useMemo(
    () => activeGuests.find((guest) => guest.instanceId === guidedGuestId) ?? null,
    [activeGuests, guidedGuestId],
  );
  const introStep = useMemo<DinerIntroStep | null>(() => {
    if (introOrderComplete || !guidedGuest) {
      return null;
    }

    if (guidedGuest.phase !== "seated") {
      return "wait";
    }

    return guidedGuest.heardOrder ? "serve" : "select";
  }, [guidedGuest, introOrderComplete]);
  const introTargetFoodId = useMemo(() => {
    if (introStep !== "serve" || !guidedGuest) {
      return null;
    }

    return getNextRequiredFood(guidedGuest);
  }, [guidedGuest, introStep]);
  const introTargetFoodName = introTargetFoodId ? getFoodName(introTargetFoodId) : null;
  const selectedGuest = useMemo(
    () => activeGuests.find((guest) => guest.instanceId === selectedGuestId && guest.phase !== "leaving") ?? null,
    [activeGuests, selectedGuestId],
  );
  const orderPanelGuest = selectedGuest?.heardOrder ? selectedGuest : guidedGuest?.heardOrder ? guidedGuest : null;

  const activeGuestCount = activeGuests.filter((guest) => guest.phase !== "leaving").length;
  const isShiftWon = served >= TARGET_SERVES;

  const playSound = useCallback((kind: SoundKind) => {
    const AudioContextCtor = window.AudioContext ?? (window as AudioContextWindow).webkitAudioContext;

    if (!AudioContextCtor) {
      return false;
    }

    const audioContext = audioContextRef.current ?? new AudioContextCtor();
    audioContextRef.current = audioContext;

    if (audioContext.state === "suspended") {
      void audioContext.resume();
    }

    if (kind === "correct") {
      scheduleTone(audioContext, 660, 0, 0.09, "triangle", 0.08);
      scheduleTone(audioContext, 880, 0.08, 0.1, "triangle", 0.075);
      return true;
    }

    if (kind === "complete") {
      scheduleTone(audioContext, 523.25, 0, 0.08, "triangle", 0.07);
      scheduleTone(audioContext, 659.25, 0.08, 0.08, "triangle", 0.075);
      scheduleTone(audioContext, 783.99, 0.16, 0.1, "triangle", 0.08);
      scheduleTone(audioContext, 1046.5, 0.27, 0.14, "triangle", 0.075);
      return true;
    }

    scheduleTone(audioContext, 180, 0, 0.16, "sawtooth", 0.06);
    scheduleTone(audioContext, 130, 0.14, 0.18, "sawtooth", 0.055);
    return true;
  }, []);

  const replayFoodWord = useCallback((foodId: FoodId) => {
    const foodName = getFoodName(foodId);
    const hasAudio = speak(foodName, 1.02);

    setFeedback({
      kind: hasAudio ? "neutral" : "bad",
      text: hasAudio ? `Listen: ${foodName}.` : "Audio is not available in this browser.",
    });
  }, []);

  const replayGuestPhrase = useCallback((guest: ActiveGuest) => {
    const hasAudio = speak(guest.phrase);

    setFeedback({
      kind: hasAudio ? "neutral" : "bad",
      text: hasAudio ? `${guest.customer.name}: ${guest.phrase}` : "Audio is not available in this browser.",
    });
  }, []);

  const addGuest = useCallback((spawnNow: number, profile: DifficultyProfile, seatIndex: number) => {
    const practiceFoodId = practiceQueueRef.current.shift() ?? null;
    const { guest, scheduledFoods: guestFoods } = makeGuest(
      guestSequenceRef.current,
      spawnNow,
      profile,
      seatIndex,
      practiceFoodId,
    );
    guestSequenceRef.current += 1;

    setActiveGuests((currentGuests) => [...currentGuests, guest]);
    setScheduledFoods((currentFoods) => [...currentFoods, ...guestFoods]);
    setFeedback({
      kind: "neutral",
      text: `${guest.customer.name} is walking to table ${seatIndex + 1}. Get ready to listen.`,
    });
  }, []);

  const resetGame = useCallback(() => {
    const startTime = Date.now();
    const profile = difficultyForLevel(1);
    const firstGuest = makeGuest(0, startTime, profile, 0);

    guestSequenceRef.current = 1;
    foodSequenceRef.current = 0;
    nextGuestAtRef.current = startTime + 900;
    nextDecoyAtRef.current = startTime + profile.firstDecoyDelayMs;

    setNow(startTime);
    setActiveGuests([firstGuest.guest]);
    setSelectedGuestId(null);
    setGuidedGuestId(firstGuest.guest.instanceId);
    setIntroOrderComplete(false);
    setScheduledFoods([...firstGuest.scheduledFoods]);
    setBeltFoods([]);
    setScore(0);
    setServed(0);
    setCombo(0);
    setServedEcho(null);
    setLevelTransition(null);
    setLevelTransitionFocused(false);
    setCompactHelpOpen(false);
    setMissedRecap(null);
    consumedDishIdsRef.current.clear();
    practiceQueueRef.current = [];
    practiceCountsRef.current.clear();
    setFeedback({
      kind: "neutral",
      text: `${firstGuest.guest.customer.name} is walking to table 1. Watch for the glow, then tap the table to hear the order.`,
    });
    setGameStatus("playing");
  }, []);

  const resetCombo = useCallback((text: string) => {
    setCombo(0);
    setFeedback({ kind: "bad", text });
  }, []);

  const queuePracticeRetry = useCallback((guest: ActiveGuest) => {
    const missedFoods = getMissingFoods(guest);
    const practiceFoodId = choosePracticeFoodId(missedFoods, guest.orderNumber, practiceCountsRef.current);

    if (!practiceFoodId) {
      return { missedFoods, practiceFoodId: null };
    }

    if (!practiceQueueRef.current.includes(practiceFoodId)) {
      practiceQueueRef.current.push(practiceFoodId);
      practiceCountsRef.current.set(practiceFoodId, (practiceCountsRef.current.get(practiceFoodId) ?? 0) + 1);
    }

    return { missedFoods, practiceFoodId };
  }, []);

  const revealGuestOrder = useCallback((guest: ActiveGuest) => {
    if (guest.phase !== "seated") {
      return;
    }

    const hasAudio = speak(guest.phrase);
    const isGuidedFirstOrder = !introOrderComplete && guest.instanceId === guidedGuestId;
    const guidedFoodId = isGuidedFirstOrder ? getNextRequiredFood(guest) : null;
    const guidedFoodName = guidedFoodId ? getFoodName(guidedFoodId) : "the matching dish";

    setActiveGuests((currentGuests) =>
      currentGuests.map((currentGuest) =>
        currentGuest.instanceId === guest.instanceId
          ? { ...currentGuest, heardOrder: true }
          : currentGuest,
      ),
    );
    setFeedback({
      kind: hasAudio ? "neutral" : "bad",
      text: isGuidedFirstOrder
        ? hasAudio
          ? `Now serve ${guidedFoodName}. This first order is untimed.`
          : `Audio is not available. Read the order card and serve ${guidedFoodName}. This first order is untimed.`
        : hasAudio
          ? `${guest.customer.name}: ${guest.phrase}${guest.practiceFoodId ? ` Practice again: ${getFoodName(guest.practiceFoodId)}.` : ""}`
          : "Audio is not available in this browser.",
    });
  }, [guidedGuestId, introOrderComplete]);

  const handleGuestSelect = useCallback(
    (guest: ActiveGuest) => {
      if (guest.phase !== "seated") {
        return;
      }

      setSelectedGuestId(guest.instanceId);
      revealGuestOrder(guest);
    },
    [revealGuestOrder],
  );

  const handleFoodDrop = useCallback(
    (food: BeltFood, guestId: string | null) => {
      if (gameStatus !== "playing") {
        setFeedback({ kind: "neutral", text: "The diner is getting ready." });
        return;
      }

      const foodName = getFoodName(food.foodId);
      const droppedGuest = activeGuests.find((guest) => guest.phase !== "leaving" && guest.instanceId === guestId);

      if (!droppedGuest) {
        setFeedback({ kind: "neutral", text: `Drag ${foodName} to the guest who ordered it.` });
        return;
      }

      const isGuidedFirstOrder = !introOrderComplete && droppedGuest.instanceId === guidedGuestId;
      const guidedFoodId = isGuidedFirstOrder ? getNextRequiredFood(droppedGuest) : null;
      const guidedFoodName = guidedFoodId ? getFoodName(guidedFoodId) : "the matching dish";

      if (!droppedGuest.heardOrder) {
        setFeedback({
          kind: "neutral",
          text: isGuidedFirstOrder
            ? `Step 1: tap ${droppedGuest.customer.name}'s table to hear the order.`
            : `Select ${droppedGuest.customer.name} to hear the order before serving.`,
        });
        speak(`Select ${droppedGuest.customer.name} to hear the order first.`, 1.02);
        return;
      }

      if (consumedDishIdsRef.current.has(food.id)) {
        return;
      }

      const interactionAt = Date.now();

      if (!needsFood(droppedGuest, food.foodId)) {
        if (isGuidedFirstOrder) {
          playSound("wrong");
          speak(`Try ${guidedFoodName}.`, 1.02);
          setFeedback({
            kind: "neutral",
            text: `Try again. Look for ${guidedFoodName}. This first order is untimed.`,
          });
          return;
        }

        const patiencePenaltyMs =
          WRONG_DISH_PATIENCE_BASE_MS + (difficulty.level - 1) * WRONG_DISH_PATIENCE_PER_LEVEL_MS;
        const patiencePenaltySeconds = patiencePenaltyMs / 1000;
        setActiveGuests((currentGuests) =>
          currentGuests.map((currentGuest) =>
            currentGuest.instanceId === droppedGuest.instanceId
              ? { ...currentGuest, expiresAt: Math.max(interactionAt, currentGuest.expiresAt - patiencePenaltyMs) }
              : currentGuest,
          ),
        );
        playSound("wrong");
        speak(`${droppedGuest.customer.name} did not order ${foodName}.`, 1.02);
        setFeedback({
          kind: "bad",
          text: `${droppedGuest.customer.name} did not order ${foodName} and lost ${patiencePenaltySeconds} seconds of patience.`,
        });
        return;
      }

      consumedDishIdsRef.current.add(food.id);
      setServedEcho({ id: `${food.id}-${interactionAt}`, foodId: food.foodId, guestName: droppedGuest.customer.name });
      setBeltFoods((currentFoods) =>
        currentFoods.map((currentFood) =>
          currentFood.id === food.id
            ? { ...currentFood, leavingAt: currentFood.leavingAt ?? interactionAt }
            : currentFood,
        ),
      );

      const secondsLeft = Math.ceil((droppedGuest.expiresAt - interactionAt) / 1000);
      const timeBonus = Math.max(0, secondsLeft);
      const levelBonus = difficulty.level * 5;
      const nextMatchingGuest: ActiveGuest = {
        ...droppedGuest,
        expiresAt: droppedGuest.expiresAt + SERVED_DISH_PATIENCE_BONUS_MS,
        heardOrder: true,
        phase: "seated",
        servedFoods: [...droppedGuest.servedFoods, food.foodId],
      };
      const completedGuest = isGuestComplete(nextMatchingGuest) ? nextMatchingGuest : null;
      const nextCombo = completedGuest ? combo + 1 : combo;
      const comboBonus = completedGuest ? Math.max(0, nextCombo - 1) * HAPPY_GUEST_COMBO_BONUS : 0;
      const earned = 35 + timeBonus + levelBonus + comboBonus;
      const earnedLabel = formatEarnedPoints(earned, comboBonus);
      const completedAt = Date.now();
      const nextGuests: ActiveGuest[] = activeGuests.map((guest) =>
        guest.instanceId === droppedGuest.instanceId
          ? completedGuest
            ? { ...nextMatchingGuest, phase: "leaving" as const, leavingAt: completedAt }
            : nextMatchingGuest
          : guest,
      );

      setActiveGuests(nextGuests);

      setScore((currentScore) => currentScore + earned);
      if (completedGuest) {
        setCombo(nextCombo);
      }

      if (completedGuest) {
        const nextServed = served + 1;
        const nextLevel = levelForServed(nextServed);
        const happyLine = HAPPY_GUEST_LINES[(completedGuest.orderNumber + nextServed) % HAPPY_GUEST_LINES.length];
        setServed(nextServed);
        if (nextLevel > difficulty.level) {
          setLevelTransitionFocused(false);
          setLevelTransition({
            level: nextLevel,
            message: getLevelTransitionMessage(difficulty.level, nextLevel),
          });
        }
        setScheduledFoods((currentFoods) =>
          currentFoods.filter((scheduledFood) => scheduledFood.targetGuestId !== completedGuest?.instanceId),
        );
        setBeltFoods((currentFoods) =>
          currentFoods.map((currentFood) =>
            currentFood.targetGuestId === completedGuest.instanceId
              ? { ...currentFood, leavingAt: currentFood.leavingAt ?? completedAt }
              : currentFood,
          ),
        );
        setSelectedGuestId((currentSelected) => (currentSelected === completedGuest.instanceId ? null : currentSelected));
        if (isGuidedFirstOrder) {
          setIntroOrderComplete(true);
          setGuidedGuestId(null);
        }
        if (nextGuestAtRef.current <= completedAt) {
          nextGuestAtRef.current = completedAt + NEXT_GUEST_AFTER_COMPLETE_MS;
        }
        setFeedback({
          kind: "good",
          text:
            nextServed >= TARGET_SERVES
              ? `Dinner service complete. ${earnedLabel}`
              : isGuidedFirstOrder
                ? `Great job. You served ${foodName}. The next guests will be timed. ${earnedLabel}`
                : `${completedGuest.customer.name} leaves happy. ${earnedLabel}`,
        });
        playSound("complete");
        speak(nextServed >= TARGET_SERVES ? "Dinner service complete. All guests are happy." : happyLine, 1);

        if (nextServed >= TARGET_SERVES) {
          setGameStatus("ended");
        }
      } else {
        setFeedback({ kind: "good", text: `Served ${foodName}. ${earnedLabel}` });
        playSound("correct");
        speak(`Served ${foodName}.`, 1.04);
      }
    },
    [activeGuests, combo, difficulty.level, gameStatus, guidedGuestId, introOrderComplete, playSound, served],
  );

  useEffect(() => {
    if (gameStatus !== "playing") {
      return undefined;
    }

    const clock = window.setInterval(() => setNow(Date.now()), DINER_CLOCK_MS);
    return () => window.clearInterval(clock);
  }, [gameStatus]);

  useEffect(() => {
    if (!servedEcho) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setServedEcho((currentEcho) => (currentEcho?.id === servedEcho.id ? null : currentEcho));
    }, 1_000);

    return () => window.clearTimeout(timeout);
  }, [servedEcho]);

  useEffect(() => {
    if (!levelTransition || levelTransitionFocused) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setLevelTransition((currentTransition) =>
        currentTransition?.level === levelTransition.level ? null : currentTransition,
      );
    }, 4_000);

    return () => window.clearTimeout(timeout);
  }, [levelTransition, levelTransitionFocused]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const newlySeatedGuests = activeGuests.filter(
      (guest) => guest.phase === "entering" && now >= guest.serviceStartsAt,
    );

    if (newlySeatedGuests.length === 0) {
      return;
    }

    setActiveGuests((currentGuests) =>
      currentGuests.map((guest) =>
        newlySeatedGuests.some((seatedGuest) => seatedGuest.instanceId === guest.instanceId)
          ? { ...guest, phase: "seated" }
          : guest,
      ),
    );
    const guidedGuestSeated = !introOrderComplete && guidedGuestId
      ? newlySeatedGuests.find((guest) => guest.instanceId === guidedGuestId)
      : null;

    if (guidedGuestSeated) {
      setFeedback({
        kind: "neutral",
        text: `${guidedGuestSeated.customer.name} is seated. Tap the glowing table to hear the order. This first order is untimed.`,
      });
      return;
    }

    const seatedNames = formatList(newlySeatedGuests.map((guest) => guest.customer.name));
    setFeedback({
      kind: "neutral",
      text: `${seatedNames} ${newlySeatedGuests.length === 1 ? "is" : "are"} seated. Tap a table to hear the order.`,
    });
  }, [activeGuests, gameStatus, guidedGuestId, introOrderComplete, now]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    if (activeGuestCount < difficulty.maxGuests && now >= nextGuestAtRef.current && served < TARGET_SERVES) {
      const seatIndex = chooseAvailableSeatIndex(activeGuests, guestSequenceRef.current);

      if (seatIndex !== null) {
        addGuest(now, difficulty, seatIndex);
        nextGuestAtRef.current = now + difficulty.guestIntervalMs;
      }
    }
  }, [activeGuestCount, activeGuests, addGuest, difficulty, gameStatus, now, served]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const readyFoods = scheduledFoods.filter((food) => food.dueAt <= now);
    const decoyIsDue = now >= nextDecoyAtRef.current;

    if (readyFoods.length === 0 && !decoyIsDue) {
      return;
    }

    const nextBeltFoods = [...beltFoods];
    const futureFoods = scheduledFoods.filter((food) => food.dueAt > now);
    const delayedFoods: ScheduledFood[] = [];
    const blockedPatienceByGuestId = new Map<string, number>();

    for (const food of readyFoods) {
      const slot = chooseAvailableDishSlot(nextBeltFoods);
      const lane = slot === null ? null : chooseSpawnLane(food.lane, nextBeltFoods, now);

      if (slot === null || lane === null) {
        delayedFoods.push({ ...food, dueAt: now + SUPPLY_DELAY_RETRY_MS });

        if (food.targetGuestId) {
          blockedPatienceByGuestId.set(
            food.targetGuestId,
            Math.max(blockedPatienceByGuestId.get(food.targetGuestId) ?? 0, SUPPLY_DELAY_RETRY_MS),
          );
        }
        continue;
      }

      const spawnSequence = foodSequenceRef.current;
      foodSequenceRef.current += 1;
      nextBeltFoods.push({
        id: `belt-${food.id}-${now}-${spawnSequence}`,
        foodId: food.foodId,
        targetGuestId: food.targetGuestId,
        lane,
        slot,
        spawnedAt: now,
        travelMs: difficulty.beltTravelMs,
      });
    }

    if (readyFoods.length > 0) {
      setScheduledFoods([...futureFoods, ...delayedFoods]);
    }

    if (blockedPatienceByGuestId.size > 0) {
      setActiveGuests((currentGuests) =>
        currentGuests.map((guest) => {
          const patienceCompensationMs = blockedPatienceByGuestId.get(guest.instanceId);

          if (!patienceCompensationMs || guest.phase === "leaving") {
            return guest;
          }

          return {
            ...guest,
            expiresAt: guest.expiresAt + patienceCompensationMs,
          };
        }),
      );
    }

    if (decoyIsDue) {
      const slot = chooseAvailableDishSlot(nextBeltFoods);
      const decoy = slot === null ? null : makeDecoyFood(foodSequenceRef.current, now, difficulty, slot);
      const lane = decoy ? chooseSpawnLane(decoy.lane, nextBeltFoods, now) : null;

      if (!decoy || lane === null) {
        nextDecoyAtRef.current = now + SUPPLY_DELAY_RETRY_MS;
      } else {
        foodSequenceRef.current += 1;
        nextBeltFoods.push({ ...decoy, lane });
        nextDecoyAtRef.current = now + difficulty.decoyIntervalMs;
      }
    }

    if (nextBeltFoods.length !== beltFoods.length) {
      setBeltFoods(nextBeltFoods);
    }
  }, [beltFoods, difficulty, gameStatus, now, scheduledFoods]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const leavingFoodIds = new Set<string>();
    const recycleFoods: ScheduledFood[] = [];

    for (const food of beltFoods) {
      if (food.leavingAt || (now - food.spawnedAt) / food.travelMs < 1) {
        continue;
      }

      leavingFoodIds.add(food.id);
      const guestStillNeedsFood =
        food.targetGuestId &&
        activeGuests.some(
          (guest) => guest.phase !== "leaving" && guest.instanceId === food.targetGuestId && needsFood(guest, food.foodId),
        );

      if (guestStillNeedsFood) {
        const recycleSequence = foodSequenceRef.current;
        foodSequenceRef.current += 1;
        const readyAt = now + Math.min(difficulty.dishGapMs, 5_600);
        recycleFoods.push({
          id: `recycle-${food.id}-${now}-${recycleSequence}`,
          readyAt,
          dueAt: readyAt,
          foodId: food.foodId,
          targetGuestId: food.targetGuestId,
          lane: (food.lane + 1) % ORDER_LANES,
        });
      }
    }

    if (leavingFoodIds.size > 0) {
      setBeltFoods((currentFoods) =>
        currentFoods.map((food) =>
          leavingFoodIds.has(food.id) ? { ...food, leavingAt: food.leavingAt ?? now } : food,
        ),
      );
    }

    if (recycleFoods.length > 0) {
      setScheduledFoods((currentScheduledFoods) => {
        const scheduledKeys = new Set(
          currentScheduledFoods.map((food) => `${food.targetGuestId ?? "decoy"}:${food.foodId}`),
        );
        const uniqueRecycleFoods = recycleFoods.filter((food) => {
          const key = `${food.targetGuestId ?? "decoy"}:${food.foodId}`;

          if (scheduledKeys.has(key)) {
            return false;
          }

          scheduledKeys.add(key);
          return true;
        });

        return [...currentScheduledFoods, ...uniqueRecycleFoods];
      });
    }
  }, [activeGuests, beltFoods, difficulty.dishGapMs, gameStatus, now]);

  useEffect(() => {
    const nextExitAt = beltFoods.reduce(
      (earliest, food) => (food.leavingAt ? Math.min(earliest, food.leavingAt + DISH_EXIT_MS) : earliest),
      Number.POSITIVE_INFINITY,
    );

    if (!Number.isFinite(nextExitAt)) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      const cleanupAt = Date.now();
      setBeltFoods((currentFoods) =>
        currentFoods.filter((food) => !food.leavingAt || cleanupAt - food.leavingAt < DISH_EXIT_MS),
      );
    }, Math.max(0, nextExitAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [beltFoods]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const expiredGuests = activeGuests.filter(
      (guest) =>
        guest.phase !== "leaving" &&
        guest.expiresAt <= now &&
        !(guest.instanceId === guidedGuestId && !introOrderComplete),
    );

    if (expiredGuests.length === 0) {
      return;
    }

    setActiveGuests((currentGuests) =>
      currentGuests.map((guest) =>
        expiredGuests.some((expiredGuest) => expiredGuest.instanceId === guest.instanceId)
          ? { ...guest, phase: "leaving", leavingAt: now }
          : guest,
      ),
    );
    setScheduledFoods((currentFoods) =>
      currentFoods.filter((food) => !expiredGuests.some((guest) => guest.instanceId === food.targetGuestId)),
    );
    setBeltFoods((currentFoods) =>
      currentFoods.map((food) =>
        expiredGuests.some((guest) => guest.instanceId === food.targetGuestId)
          ? { ...food, leavingAt: food.leavingAt ?? now }
          : food,
      ),
    );
    setSelectedGuestId((currentSelected) =>
      expiredGuests.some((guest) => guest.instanceId === currentSelected) ? null : currentSelected,
    );

    const recapGuest = expiredGuests[0];
    let recapResult = { missedFoods: getMissingFoods(recapGuest), practiceFoodId: null as FoodId | null };

    expiredGuests.forEach((guest, index) => {
      const retryResult = queuePracticeRetry(guest);

      if (index === 0) {
        recapResult = retryResult;
      }
    });

    const missedFoodNames = recapResult.missedFoods.map((foodId) => getFoodName(foodId));

    setMissedRecap({
      id: `missed-${recapGuest.instanceId}-${now}`,
      guestName: recapGuest.customer.name,
      foods: recapResult.missedFoods,
      retryFoodId: recapResult.practiceFoodId,
    });
    playSound("wrong");
    resetCombo(
      recapResult.practiceFoodId
        ? `${recapGuest.customer.name} left before the last dish. Missed ${formatList(missedFoodNames)}. ${getFoodName(recapResult.practiceFoodId)} will come back later.`
        : `${recapGuest.customer.name} left before the last dish. Missed ${formatList(missedFoodNames)}.`,
    );
  }, [activeGuests, gameStatus, guidedGuestId, introOrderComplete, now, playSound, queuePracticeRetry, resetCombo]);

  useEffect(() => {
    if (selectedGuestId && activeGuests.some((guest) => guest.instanceId === selectedGuestId && guest.phase !== "leaving")) {
      return;
    }

    setSelectedGuestId(null);
  }, [activeGuests, selectedGuestId]);

  useEffect(() => {
    if (!missedRecap) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setMissedRecap((currentRecap) => (currentRecap?.id === missedRecap.id ? null : currentRecap));
    }, MISSED_RECAP_MS);

    return () => window.clearTimeout(timeout);
  }, [missedRecap]);

  useEffect(() => {
    const leavingGuests = activeGuests.filter(
      (guest) =>
        guest.phase === "leaving" &&
        guest.leavingAt &&
        now - guest.leavingAt > getGuestRouteTransitionDuration(guest) + LEAVING_GUEST_LINGER_MS,
    );

    if (leavingGuests.length === 0) {
      return;
    }

    setActiveGuests((currentGuests) =>
      currentGuests.filter(
        (guest) =>
          !leavingGuests.some((leavingGuest) => leavingGuest.instanceId === guest.instanceId),
      ),
    );
  }, [activeGuests, now]);

  useEffect(() => {
    resetGame();
  }, [resetGame]);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const dishWishSnapshot: DishWishSnapshot = useMemo(
    () => ({
      now,
      status: gameStatus,
      selectedGuestId,
      guests: activeGuests.map((guest) => {
        const patiencePaused = guest.instanceId === guidedGuestId && !introOrderComplete;

        return {
          id: guest.instanceId,
          customerId: guest.customer.id,
          customerName: guest.customer.name,
          phase: guest.phase,
          seatIndex: guest.seatIndex,
          heardOrder: guest.heardOrder,
          phrase: guest.phrase,
          foods: guest.foods,
          servedFoods: guest.servedFoods,
          practiceHint:
            guest.heardOrder && guest.practiceFoodId ? `Practice again: ${getFoodName(guest.practiceFoodId)}` : null,
          supplyHint: getGuestSupplyHint(guest, beltFoods, scheduledFoods, now),
          patiencePaused,
          patienceRatio: patiencePaused
            ? 1
            : clamp(
                (guest.expiresAt - now) / Math.max(1, guest.expiresAt - guest.serviceStartsAt),
                0,
                1,
              ),
          visual: getGuestVisual(guest, now),
        };
      }),
      foods: beltFoods.map((food) => ({
        id: food.id,
        foodId: food.foodId,
        lane: food.lane,
        slot: food.slot,
        progress: clamp((now - food.spawnedAt) / food.travelMs, 0, 1),
        leaving: Boolean(food.leavingAt),
      })),
      guide:
        introStep && guidedGuest
          ? {
              step: introStep,
              guestId: guidedGuest.instanceId,
              seatIndex: guidedGuest.seatIndex,
              targetFoodId: introTargetFoodId,
            }
          : null,
      beltTravelLabel: `${beltFoods.length}/${DISH_PASS_CAPACITY} dishes · ${formatTime(difficulty.beltTravelMs)} pass`,
    }),
    [
      activeGuests,
      beltFoods,
      difficulty.beltTravelMs,
      gameStatus,
      guidedGuest,
      guidedGuestId,
      introOrderComplete,
      introStep,
      introTargetFoodId,
      now,
      scheduledFoods,
      selectedGuestId,
    ],
  );

  const handlePhaserGuestSelect = useCallback(
    (guestId: string) => {
      const guest = activeGuests.find((candidate) => candidate.instanceId === guestId);

      if (guest) {
        handleGuestSelect(guest);
      }
    },
    [activeGuests, handleGuestSelect],
  );

  const handlePhaserFoodDrop = useCallback(
    (foodId: string, guestId: string | null) => {
      const food = beltFoods.find((candidate) => candidate.id === foodId && !candidate.leavingAt);

      if (food) {
        handleFoodDrop(food, guestId);
      }
    },
    [beltFoods, handleFoodDrop],
  );

  return (
    <div className={cx("appShell", gameStatus === "playing" && "appShell--playing")}>
      <div className="sceneBackdrop" aria-hidden="true">
        <div className="sceneBackdrop__image" />
      </div>

      <main className="mainSurface">
        <section className="gameHud" aria-label="Dinner service stats">
          <button className="gameHud__portalButton" type="button" onClick={onExit} aria-label="Back to game portal">
            <Home size={17} />
            <span>Games</span>
          </button>
          <StatPill icon={<Star size={17} />} label="Score" value={score} />
          <StatPill icon={<Check size={17} />} label="Orders" value={`${served}/${TARGET_SERVES}`} />
          <StatPill icon={<Gauge size={17} />} label="Level" value={difficulty.level} />
        </section>

        {gameStatus === "ended" ? (
          <section className={cx("resultBanner", isShiftWon ? "resultBanner--win" : "resultBanner--lost")}>
            <span>
              <strong>{isShiftWon ? "Dinner service complete" : "Service closed"}</strong>
              <span>{isShiftWon ? "All target orders were served." : "The dining room has stopped seating guests."}</span>
            </span>
            <button className="primaryButton" type="button" onClick={resetGame}>
              <RotateCcw size={18} />
              New Shift
            </button>
          </section>
        ) : (
          <>
            <p className="dinerNarration" role="status" aria-live="polite">
              {feedback.text}
            </p>

            {levelTransition ? (
              <aside
                className="dishWishLevelUp"
                aria-label={`Reached level ${levelTransition.level}`}
                onFocus={() => setLevelTransitionFocused(true)}
                onBlur={(event) => {
                  const nextFocus = event.relatedTarget;

                  if (!(nextFocus instanceof Node) || !event.currentTarget.contains(nextFocus)) {
                    setLevelTransitionFocused(false);
                  }
                }}
              >
                <p role="status" aria-live="polite">{levelTransition.message}</p>
                <button
                  type="button"
                  onClick={() => {
                    setLevelTransition(null);
                    setLevelTransitionFocused(false);
                  }}
                  aria-label="Dismiss level message"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </aside>
            ) : null}

            <section className="dishWishCoach" aria-label="Dish Wish learning help">
              {introStep && guidedGuest ? (
                <article className="dishWishCoach__panel dishWishCoach__panel--guide">
                  <p className="dishWishCoach__eyebrow">Guided first order · untimed</p>
                  <ol className="dishWishCoach__steps">
                    <li
                      className={cx(
                        "dishWishCoach__step",
                        introStep === "wait" || introStep === "select"
                          ? "dishWishCoach__step--current"
                          : "dishWishCoach__step--done",
                      )}
                    >
                      <span className="dishWishCoach__stepBadge" aria-hidden="true">
                        {introStep === "serve" ? <Check size={15} /> : "1"}
                      </span>
                      <span>
                        <strong>Hear the order</strong>
                        <small>
                          {introStep === "wait"
                            ? `Watch ${guidedGuest.customer.name} sit down, then tap the glowing table.`
                            : `Tap ${guidedGuest.customer.name}'s table to hear the order.`}
                        </small>
                      </span>
                    </li>
                    <li
                      className={cx(
                        "dishWishCoach__step",
                        introStep === "serve" && "dishWishCoach__step--current",
                      )}
                    >
                      <span className="dishWishCoach__stepBadge" aria-hidden="true">
                        2
                      </span>
                      <span>
                        <strong>Serve the match</strong>
                        <small>
                          {introStep === "serve" && introTargetFoodId
                            ? `Find ${introTargetFoodName} on the pass, then drag it to the table or use the keyboard buttons.`
                            : "After you hear the order, serve the matching dish."}
                        </small>
                      </span>
                    </li>
                  </ol>
                </article>
              ) : null}

              {introOrderComplete && !orderPanelGuest ? (
                <details
                  className="dishWishCoach__panel dishWishCoach__panel--compact"
                  onToggle={(event) => setCompactHelpOpen(event.currentTarget.open)}
                >
                  <summary>
                    <span>
                      <BookOpen size={17} aria-hidden="true" />
                      How to play
                    </span>
                    <small>{compactHelpOpen ? "Close help" : "Open help"}</small>
                  </summary>
                  <div className="dishWishCoach__compactBody">
                    <p className="dishWishCoach__hint">
                      Tap a seated table to hear the order, then serve the matching dish.
                    </p>
                    <p className={cx("dishWishCoach__status", `dishWishCoach__status--${feedback.kind}`)}>
                      {feedback.text}
                    </p>
                  </div>
                </details>
              ) : (
                <article className="dishWishCoach__panel dishWishCoach__panel--order">
                  <div className="dishWishCoach__panelHeader">
                  <div>
                    <p className="dishWishCoach__eyebrow">Order support</p>
                    <h2>{orderPanelGuest ? `Table ${orderPanelGuest.seatIndex + 1}` : "How to play"}</h2>
                  </div>
                  {orderPanelGuest ? (
                    <button
                      className="dishWishCoach__audioButton"
                      type="button"
                      onClick={() => replayGuestPhrase(orderPanelGuest)}
                      aria-label="Replay this order"
                    >
                      <Volume2 size={16} />
                      Hear again
                    </button>
                  ) : null}
                </div>

                {orderPanelGuest ? (
                  <>
                    <p className="dishWishCoach__phrase">{renderOrderPhrase(orderPanelGuest)}</p>
                    <div className="dishWishWordCards" aria-label="Target food words">
                      {orderPanelGuest.foods.map((foodId) => {
                        const servedFood = orderPanelGuest.servedFoods.includes(foodId);

                        return (
                          <article
                            className={cx("dishWishWordCard", servedFood && "dishWishWordCard--served")}
                            key={`${orderPanelGuest.instanceId}-${foodId}`}
                          >
                            <FoodArt id={foodId} />
                            <div className="dishWishWordCard__labelRow">
                              <strong>{getFoodName(foodId)}</strong>
                              {servedFood ? <BadgeCheck size={16} aria-hidden="true" /> : null}
                            </div>
                            <button
                              className="dishWishCoach__audioButton dishWishCoach__audioButton--card"
                              type="button"
                              onClick={() => replayFoodWord(foodId)}
                              aria-label={`Hear ${getFoodName(foodId)}`}
                            >
                              <Volume2 size={14} />
                              Say word
                            </button>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <p className="dishWishCoach__hint">
                    {introStep === "wait"
                      ? "The first guest is walking to the table."
                      : "Tap a seated table to hear the order, then serve the matching dish."}
                  </p>
                )}

                  <p className={cx("dishWishCoach__status", `dishWishCoach__status--${feedback.kind}`)}>{feedback.text}</p>
                </article>
              )}

              {servedEcho ? (
                <article className="dishWishCoach__panel dishWishCoach__panel--echo">
                  <p className="dishWishCoach__eyebrow">Word check</p>
                  <div className="dishWishCoach__echoRow">
                    <FoodArt id={servedEcho.foodId} />
                    <div>
                      <strong>{getFoodName(servedEcho.foodId)}</strong>
                      <small>{servedEcho.guestName} got the right dish.</small>
                    </div>
                    <button
                      className="dishWishCoach__audioButton dishWishCoach__audioButton--iconOnly"
                      type="button"
                      onClick={() => replayFoodWord(servedEcho.foodId)}
                      aria-label={`Hear ${getFoodName(servedEcho.foodId)} again`}
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                </article>
              ) : null}
            </section>
          </>
        )}

        {missedRecap ? (
          <section
            className={cx("missedRecap", levelTransition ? "missedRecap--withLevel" : undefined)}
            role="status"
            aria-live="polite"
            aria-label={`Missed order recap for ${missedRecap.guestName}`}
          >
            <div className="missedRecap__copy">
              <strong>Missed words</strong>
              <span>
                {missedRecap.guestName} missed {formatList(missedRecap.foods.map((foodId) => getFoodName(foodId)))}.
              </span>
              <span>
                {missedRecap.retryFoodId
                  ? `${getFoodName(missedRecap.retryFoodId)} will come back in a later order.`
                  : "Keep listening and try again on the next orders."}
              </span>
            </div>
            <div className="missedRecap__foods" aria-label="Missed food words">
              {missedRecap.foods.map((foodId) => (
                <span className="missedRecap__food" key={`${missedRecap.id}-${foodId}`}>
                  <FoodArt id={foodId} />
                  <span>{getFoodName(foodId)}</span>
                </span>
              ))}
            </div>
          </section>
        ) : null}

        <section className="gameGrid">
          <Suspense fallback={<div className="gameRendererFallback gameRendererFallback--dish">Loading restaurant…</div>}>
            <DishWishStage
              snapshot={dishWishSnapshot}
              onGuestSelect={handlePhaserGuestSelect}
              onFoodDrop={handlePhaserFoodDrop}
            />
          </Suspense>
        </section>
      </main>
    </div>
  );
}

function GamePortal({ onPlay }: { onPlay: (path: string) => void }) {
  const handleGameLinkClick = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, path: string) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      event.preventDefault();
      onPlay(path);
    },
    [onPlay],
  );

  return (
    <main className="portalShell">
      <div className="portalBackdrop" aria-hidden="true" />
      <section className="portalDashboard" aria-label="Game selection">
        <div className="portalHeader">
          <div className="portalMark">
            <Languages size={30} />
          </div>
          <div>
            <p className="eyebrow">Mini-game portal</p>
            <h1>{PORTAL_TITLE}</h1>
          </div>
        </div>

        <div className="portalGames">
          <a className="gameTile" href={DISH_WISH_PATH} onClick={(event) => handleGameLinkClick(event, DISH_WISH_PATH)}>
            <span className="gameTile__thumb">
              <img src={gameKitchenBgUrl} alt="" draggable="false" />
              <span className="gameTile__sprites" aria-hidden="true">
                <img src={playerChefUrl} alt="" draggable="false" />
                <img src={customerMaiUrl} alt="" draggable="false" />
                <FoodArt id="fish" />
              </span>
            </span>
            <span className="gameTile__body">
              <span className="gameTile__title">{DISH_WISH_TITLE}</span>
              <span className="gameTile__meta">Restaurant simulator for English food orders</span>
              <span className="gameTile__cta">
                <Play size={18} />
                Play
              </span>
            </span>
          </a>

          <a className="gameTile gameTile--city" href={DROP_HOP_PATH} onClick={(event) => handleGameLinkClick(event, DROP_HOP_PATH)}>
            <span className="gameTile__thumb gameTile__thumb--city">
              <span className="gameTile__cityPreview" aria-hidden="true">
                <span className="cityPreviewRoad cityPreviewRoad--one" />
                <span className="cityPreviewRoad cityPreviewRoad--two" />
                <span className="cityPreviewRiver" />
                <span className="cityPreviewStop cityPreviewStop--bakery">Bakery</span>
                <span className="cityPreviewStop cityPreviewStop--school">School</span>
                <span className="cityPreviewStop cityPreviewStop--house">Red House</span>
                <span className="cityPreviewBike">
                  <Bike size={34} />
                </span>
              </span>
            </span>
            <span className="gameTile__body">
              <span className="gameTile__title">{DROP_HOP_TITLE}</span>
              <span className="gameTile__meta">Delivery simulator for prepositions, directions, and quantities</span>
              <span className="gameTile__cta">
                <Play size={18} />
                Play
              </span>
            </span>
          </a>
        </div>
      </section>
    </main>
  );
}

function App() {
  const [path, setPath] = useState(() => canonicalizePath(window.location.pathname));

  useEffect(() => {
    const syncPathFromLocation = () => {
      const normalizedPath = normalizePath(window.location.pathname);
      const canonicalPath = canonicalizePath(normalizedPath);

      if (canonicalPath !== normalizedPath) {
        window.history.replaceState(window.history.state, "", canonicalPath);
      }

      setPath(canonicalPath);
    };

    syncPathFromLocation();
    window.addEventListener("popstate", syncPathFromLocation);
    return () => window.removeEventListener("popstate", syncPathFromLocation);
  }, []);

  useEffect(() => {
    document.title =
      path === DISH_WISH_PATH
        ? `${DISH_WISH_TITLE} | ${PORTAL_TITLE}`
        : path === DROP_HOP_PATH
          ? `${DROP_HOP_TITLE} | ${PORTAL_TITLE}`
          : PORTAL_TITLE;
  }, [path]);

  useEffect(() => {
    const isGameRoute = path === DISH_WISH_PATH || path === DROP_HOP_PATH;
    document.documentElement.classList.toggle("gameRouteActive", isGameRoute);

    return () => document.documentElement.classList.remove("gameRouteActive");
  }, [path]);

  const navigateToGame = useCallback((nextPath: string) => {
    const canonicalPath = canonicalizePath(nextPath);

    if (normalizePath(window.location.pathname) !== canonicalPath) {
      window.history.pushState(null, "", canonicalPath);
    }

    setPath(canonicalPath);
  }, []);

  if (path === DISH_WISH_PATH) {
    return <RestaurantGame onExit={() => navigateToGame("/")} />;
  }

  if (path === DROP_HOP_PATH) {
    return <DropHopGame onExit={() => navigateToGame("/")} />;
  }

  return <GamePortal onPlay={navigateToGame} />;
}

export default App;
