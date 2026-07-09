import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Bike,
  BookOpen,
  ChefHat,
  Check,
  Flame,
  Gauge,
  Home,
  Mail,
  MapPin,
  Navigation,
  Package,
  Pause,
  Play,
  RotateCcw,
  Route,
  School,
  Star,
  Store,
  Trees,
  Utensils,
  Volume2,
  X,
} from "lucide-react";
import spriteSheetUrl from "./assets/conveyor-kitchen-sprite-sheet.png";
import customerBenUrl from "./assets/sprites/customer-ben.png";
import customerIvyUrl from "./assets/sprites/customer-ivy.png";
import customerLeoUrl from "./assets/sprites/customer-leo.png";
import customerMaiUrl from "./assets/sprites/customer-mai.png";
import customerNoraUrl from "./assets/sprites/customer-nora.png";
import customerSamUrl from "./assets/sprites/customer-sam.png";
import foodBreadUrl from "./assets/sprites/food-bread.png";
import foodChickenUrl from "./assets/sprites/food-chicken.png";
import foodEggUrl from "./assets/sprites/food-egg.png";
import foodFishUrl from "./assets/sprites/food-fish.png";
import foodNoodlesUrl from "./assets/sprites/food-noodles.png";
import foodRiceUrl from "./assets/sprites/food-rice.png";
import foodSaladUrl from "./assets/sprites/food-salad.png";
import foodSoupUrl from "./assets/sprites/food-soup.png";
import foodTeaUrl from "./assets/sprites/food-tea.png";
import playerChefUrl from "./assets/player-chef.png";

type FoodId = "rice" | "fish" | "chicken" | "egg" | "noodles" | "soup" | "salad" | "tea" | "bread";

type Food = {
  id: FoodId;
  name: string;
};

type CustomerProfile = {
  id: "mai" | "leo" | "nora" | "ben" | "ivy" | "sam";
  name: string;
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
  patienceBufferMs: number;
};

type ActiveGuest = {
  instanceId: string;
  customer: CustomerProfile;
  orderNumber: number;
  phrase: string;
  foods: FoodId[];
  servedFoods: FoodId[];
  createdAt: number;
  expiresAt: number;
  level: number;
};

type ScheduledFood = {
  id: string;
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
  spawnedAt: number;
  travelMs: number;
};

type Feedback = {
  kind: "neutral" | "good" | "bad";
  text: string;
};

type GameId = "kitchen" | "city";
type GameStatus = "ready" | "playing" | "paused" | "ended";
type SoundKind = "correct" | "complete" | "wrong";
type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
};

type GameScreenProps = {
  onGameChange: (game: GameId) => void;
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

const customerSpriteById: Record<CustomerProfile["id"], string> = {
  mai: customerMaiUrl,
  leo: customerLeoUrl,
  nora: customerNoraUrl,
  ben: customerBenUrl,
  ivy: customerIvyUrl,
  sam: customerSamUrl,
};

const TARGET_SERVES = 24;
const MAX_MISSES = 5;
const ORDERS_PER_LEVEL = 4;
const MAX_LEVEL = Math.ceil(TARGET_SERVES / ORDERS_PER_LEVEL);
const STREAK_BONUS_PER_HIT = 8;
const FIRST_DISH_DELAY_MS = 1800;
const NEXT_GUEST_AFTER_COMPLETE_MS = 3_000;
const ORDER_LANES = 2;
const CONVEYOR_KITCHEN_PATH = "/games/conveyor-kitchen";
const TINY_CITY_PATH = "/games/tiny-city-delivery";
const TARGET_CITY_DELIVERIES = 10;
const MAX_CITY_MISTAKES = 5;
const CITY_STREAK_BONUS = 12;

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

function formatTime(ms: number) {
  return `${Math.max(0, Math.ceil(ms / 1000))}s`;
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

function getCityItemLabel(item: DeliveryItem, quantity: number) {
  if (quantity === 1) {
    return item.name;
  }

  return `${quantity} ${item.pluralName}`;
}

function formatEarnedPoints(earned: number, streakBonus: number) {
  return streakBonus > 0 ? `+${earned} streak +${streakBonus}` : `+${earned}`;
}

function formatCityEarnedPoints(earned: number, streakBonus: number) {
  return streakBonus > 0 ? `+${earned} route streak +${streakBonus}` : `+${earned}`;
}

function getInitialGameFromPath(): GameId {
  return window.location.pathname.includes("tiny-city") ? "city" : "kitchen";
}

function getGamePath(game: GameId) {
  return game === "city" ? TINY_CITY_PATH : CONVEYOR_KITCHEN_PATH;
}

function getNextCityMission(index: number) {
  return CITY_MISSIONS[index % CITY_MISSIONS.length];
}

function levelForServed(served: number) {
  return clamp(Math.floor(served / ORDERS_PER_LEVEL) + 1, 1, MAX_LEVEL);
}

function difficultyForLevel(level: number): DifficultyProfile {
  const maxGuests = clamp(2 + Math.floor((level - 1) / 2), 2, 6);
  const orderSize = clamp(2 + Math.floor((level - 1) / 3), 2, 4);
  const timeToLastDishMs = 7_200 + (level - 1) * 2_250;

  return {
    level,
    maxGuests,
    orderSize,
    timeToLastDishMs,
    dishGapMs: Math.round(timeToLastDishMs / Math.max(1, orderSize - 1)),
    guestIntervalMs: clamp(5_600 - (level - 1) * 360, 2_500, 5_600),
    beltTravelMs: clamp(12_500 - (level - 1) * 260, 8_800, 12_500),
    decoyIntervalMs: clamp(3_900 - (level - 1) * 140, 2_200, 3_900),
    patienceBufferMs: 12_000 + (level - 1) * 1_200,
  };
}

function selectFoods(sequence: number, count: number, level: number) {
  const foods: FoodId[] = [];
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

function makeGuest(sequence: number, now: number, profile: DifficultyProfile) {
  const customer = CUSTOMERS[sequence % CUSTOMERS.length];
  const foods = selectFoods(sequence, profile.orderSize, profile.level);
  const foodNames = foods.map((foodId) => foodById.get(foodId)?.name ?? foodId);
  const phrase = `Could I please have ${formatList(foodNames)}?`;
  const instanceId = `guest-${sequence}-${now}`;
  const expiresAt = now + profile.timeToLastDishMs + profile.patienceBufferMs;

  const guest: ActiveGuest = {
    instanceId,
    customer,
    orderNumber: sequence + 1,
    phrase,
    foods,
    servedFoods: [],
    createdAt: now,
    expiresAt,
    level: profile.level,
  };

  const scheduledFoods: ScheduledFood[] = foods.map((foodId, index) => {
    const offset =
      foods.length === 1
        ? FIRST_DISH_DELAY_MS
        : FIRST_DISH_DELAY_MS +
          Math.round((index / (foods.length - 1)) * (profile.timeToLastDishMs - FIRST_DISH_DELAY_MS));

    return {
      id: `scheduled-${instanceId}-${foodId}-${index}`,
      dueAt: now + offset,
      foodId,
      targetGuestId: instanceId,
      lane: (sequence + index) % ORDER_LANES,
    };
  });

  return { guest, scheduledFoods };
}

function makeDecoyFood(sequence: number, now: number, profile: DifficultyProfile): BeltFood {
  const foodId = FOODS[(sequence * 5 + profile.level) % FOODS.length].id;

  return {
    id: `decoy-${sequence}-${now}`,
    foodId,
    targetGuestId: null,
    lane: (sequence + profile.level) % ORDER_LANES,
    spawnedAt: now,
    travelMs: profile.beltTravelMs,
  };
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

function CustomerSprite({ customer, active }: { customer: CustomerProfile; active?: boolean }) {
  return (
    <span className={cx("customerSprite", `customerSprite--${customer.id}`, active && "customerSprite--active")} aria-hidden="true">
      <img src={customerSpriteById[customer.id]} alt="" draggable="false" />
    </span>
  );
}

function StatPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
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

function GameRail({
  activeGame,
  badgeLabel,
  badgeValue,
  onGameChange,
}: {
  activeGame: GameId;
  badgeLabel: string;
  badgeValue: string;
  onGameChange: (game: GameId) => void;
}) {
  return (
    <aside className="portalRail" aria-label="Game portal">
      <div className="brandLockup">
        <span className="brandMark">
          <ChefHat size={24} />
        </span>
        <div>
          <strong>Amsoft Games</strong>
          <span>English Arcade</span>
        </div>
      </div>

      <nav className="gameNav" aria-label="Games">
        <button
          className={cx("gameNavItem", activeGame === "kitchen" && "gameNavItem--active")}
          type="button"
          onClick={() => onGameChange("kitchen")}
        >
          <span className="gameNavIcon">
            <Utensils size={20} />
          </span>
          <span>
            <strong>Conveyor Kitchen</strong>
            <small>Food order rush</small>
          </span>
        </button>

        <button
          className={cx("gameNavItem", activeGame === "city" && "gameNavItem--active")}
          type="button"
          onClick={() => onGameChange("city")}
        >
          <span className="gameNavIcon">
            <MapPin size={20} />
          </span>
          <span>
            <strong>Tiny City Delivery</strong>
            <small>Preposition routes</small>
          </span>
        </button>
      </nav>

      <div className="learnerBadge">
        <span>{badgeLabel}</span>
        <strong>{badgeValue}</strong>
      </div>
    </aside>
  );
}

function GuestCard({
  guest,
  now,
  selected,
  onSelect,
  onListen,
}: {
  guest: ActiveGuest;
  now: number;
  selected: boolean;
  onSelect: () => void;
  onListen: () => void;
}) {
  const patienceRatio = clamp((guest.expiresAt - now) / (guest.expiresAt - guest.createdAt), 0, 1);
  const remainingMs = Math.max(0, guest.expiresAt - now);

  return (
    <article className={cx("guestCard", selected && "guestCard--selected")} onClick={onSelect}>
      <div className="guestCard__top">
        <CustomerSprite active={selected} customer={guest.customer} />
        <div>
          <strong>{guest.customer.name}</strong>
          <span>Order {guest.orderNumber}</span>
        </div>
        <button
          className="iconButton iconButton--soft"
          type="button"
          aria-label={`Play ${guest.customer.name}'s order`}
          onClick={(event) => {
            event.stopPropagation();
            onListen();
          }}
        >
          <Volume2 size={18} />
        </button>
      </div>

      <p className="guestPhrase">{guest.phrase}</p>

      <div className="foodChecklist" aria-label={`${guest.customer.name}'s requested food`}>
        {guest.foods.map((foodId, index) => {
          const servedCount = guest.servedFoods.filter((servedFoodId) => servedFoodId === foodId).length;
          const requiredThroughThisChip = guest.foods.slice(0, index + 1).filter((orderedFoodId) => orderedFoodId === foodId).length;
          const served = servedCount >= requiredThroughThisChip;
          const food = foodById.get(foodId);

          return (
            <span className={cx("foodChip", served && "foodChip--served")} key={`${guest.instanceId}-${foodId}-${index}`}>
              <FoodArt id={foodId} />
              <span>{food?.name ?? foodId}</span>
              {served && <Check size={13} />}
            </span>
          );
        })}
      </div>

      <div className="guestTimer">
        <span style={{ width: `${patienceRatio * 100}%` }} />
      </div>
      <div className="guestMeta">
        <span>Level {guest.level}</span>
        <strong>{formatTime(remainingMs)}</strong>
      </div>
    </article>
  );
}

function ConveyorBelt({
  beltFoods,
  now,
  profile,
  onSelectFood,
}: {
  beltFoods: BeltFood[];
  now: number;
  profile: DifficultyProfile;
  onSelectFood: (food: BeltFood) => void;
}) {
  return (
    <div className="conveyorPanel" aria-label="Running food conveyor">
      <div className="beltHeader">
        <div>
          <p className="eyebrow">Conveyor</p>
          <h2>Food Belt</h2>
        </div>
        <span>{formatTime(profile.beltTravelMs)} crossing</span>
      </div>

      <div className="conveyorBelt">
        <div className="beltTrack beltTrack--top" />
        <div className="beltTrack beltTrack--bottom" />

        {beltFoods.map((food) => {
          const progress = clamp((now - food.spawnedAt) / food.travelMs, 0, 1);
          const left = 104 - progress * 116;
          const foodName = foodById.get(food.foodId)?.name ?? food.foodId;

          return (
            <button
              className={cx("beltFood", `beltFood--lane${food.lane}`)}
              data-belt-id={food.id}
              data-belt-food={food.foodId}
              key={food.id}
              type="button"
              style={{ left: `${left}%` }}
              onClick={() => onSelectFood(food)}
              aria-label={`Select ${foodName}`}
            >
              <FoodArt id={food.foodId} />
              <strong>{foodName}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EnginePanel({
  profile,
  activeGuestCount,
  levelProgress,
  streak,
}: {
  profile: DifficultyProfile;
  activeGuestCount: number;
  levelProgress: number;
  streak: number;
}) {
  const ordersUntilNextLevel = profile.level >= MAX_LEVEL ? 0 : ORDERS_PER_LEVEL - levelProgress;
  const ordersUntilNextLevelText =
    ordersUntilNextLevel === 0 ? "Max" : `${ordersUntilNextLevel} order${ordersUntilNextLevel === 1 ? "" : "s"}`;
  const nextStreakBonus = streak * STREAK_BONUS_PER_HIT;

  return (
    <aside className="enginePanel">
      <div>
        <p className="eyebrow">Generator</p>
        <h2>Difficulty Engine</h2>
      </div>

      <div className="engineGrid">
        <span>
          <small>Level</small>
          <strong>{profile.level}</strong>
        </span>
        <span>
          <small>Next level</small>
          <strong>{ordersUntilNextLevelText}</strong>
        </span>
        <span>
          <small>Guests</small>
          <strong>
            {activeGuestCount}/{profile.maxGuests}
          </strong>
        </span>
        <span>
          <small>Order size</small>
          <strong>{profile.orderSize} dishes</strong>
        </span>
        <span>
          <small>Time to last dish</small>
          <strong>{formatTime(profile.timeToLastDishMs)}</strong>
        </span>
        <span>
          <small>Dish gap</small>
          <strong>{formatTime(profile.dishGapMs)}</strong>
        </span>
        <span>
          <small>Next streak bonus</small>
          <strong>+{nextStreakBonus}</strong>
        </span>
      </div>

      <div className="assetPreview">
        <img src={spriteSheetUrl} alt="Generated Conveyor Kitchen food and guest sprite sheet" />
      </div>
    </aside>
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

function CityLocationIcon({ location }: { location: CityLocation }) {
  if (location.kind === "hub") {
    return <Navigation size={20} />;
  }

  if (location.kind === "school") {
    return <School size={20} />;
  }

  if (location.kind === "park") {
    return <Trees size={20} />;
  }

  if (location.kind === "library") {
    return <BookOpen size={20} />;
  }

  if (location.kind === "post") {
    return <Mail size={20} />;
  }

  if (location.kind === "shop") {
    return <Store size={20} />;
  }

  if (location.kind === "bridge") {
    return <Route size={20} />;
  }

  return <Home size={20} />;
}

function getRoadStyle(from: CityLocation, to: CityLocation) {
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;

  return {
    left: `${from.x}%`,
    top: `${from.y}%`,
    width: `${Math.hypot(deltaX, deltaY)}%`,
    transform: `rotate(${Math.atan2(deltaY, deltaX)}rad)`,
  } as React.CSSProperties;
}

function CityMap({
  currentLocationId,
  mission,
  packagePicked,
  path,
  deliveredLocationId,
  onLocationClick,
}: {
  currentLocationId: LocationId;
  mission: CityMission;
  packagePicked: boolean;
  path: LocationId[];
  deliveredLocationId: LocationId | null;
  onLocationClick: (locationId: LocationId) => void;
}) {
  const pickupId = packagePicked ? null : mission.pickup;
  const routeStops = new Set(path);
  const dropoffLocation = cityLocationById.get(mission.dropoff) ?? CITY_LOCATIONS[0];
  const requiredStopLocation = mission.requiredStop ? cityLocationById.get(mission.requiredStop) : null;

  return (
    <section className="cityMapPanel" aria-label="Tiny City map">
      <div className="cityMap">
        <div className="cityRiver" aria-hidden="true" />
        <div className="cityRiver cityRiver--lower" aria-hidden="true" />

        {CITY_ROADS.map(([fromId, toId]) => {
          const from = cityLocationById.get(fromId);
          const to = cityLocationById.get(toId);

          if (!from || !to) {
            return null;
          }

          const roadWasUsed = routeStops.has(fromId) && routeStops.has(toId);
          return (
            <span
              className={cx("cityRoad", roadWasUsed && "cityRoad--used")}
              key={`${fromId}-${toId}`}
              style={getRoadStyle(from, to)}
              aria-hidden="true"
            />
          );
        })}

        {path.map((locationId, index) => {
          const location = cityLocationById.get(locationId);

          if (!location) {
            return null;
          }

          return (
            <span
              className="routeDot"
              key={`${locationId}-${index}`}
              style={{ "--x": `${location.x}%`, "--y": `${location.y}%` } as React.CSSProperties}
              aria-hidden="true"
            />
          );
        })}

        <span
          className="cityWordBadge cityWordBadge--dropoff"
          style={{ "--x": `${dropoffLocation.x}%`, "--y": `${dropoffLocation.y}%` } as React.CSSProperties}
        >
          {mission.relationLabel}
        </span>
        {requiredStopLocation && (
          <span
            className="cityWordBadge cityWordBadge--bridge"
            style={{ "--x": `${requiredStopLocation.x}%`, "--y": `${requiredStopLocation.y}%` } as React.CSSProperties}
          >
            over
          </span>
        )}

        {CITY_LOCATIONS.map((location) => {
          const isCurrent = location.id === currentLocationId;
          const isPickup = location.id === pickupId;
          const isDropoff = location.id === mission.dropoff;
          const isRequiredStop = location.id === mission.requiredStop;
          const isDelivered = location.id === deliveredLocationId;

          return (
            <button
              className={cx(
                "cityLocation",
                `cityLocation--${location.kind}`,
                isCurrent && "cityLocation--current",
                isPickup && "cityLocation--pickup",
                isDropoff && "cityLocation--dropoff",
                isRequiredStop && "cityLocation--required",
                isDelivered && "cityLocation--delivered",
              )}
              key={location.id}
              style={{ "--x": `${location.x}%`, "--y": `${location.y}%` } as React.CSSProperties}
              type="button"
              onClick={() => onLocationClick(location.id)}
              aria-label={location.name}
            >
              <span className="cityLocation__icon">
                <CityLocationIcon location={location} />
              </span>
              <strong>{location.shortName}</strong>
            </button>
          );
        })}

        {(() => {
          const current = cityLocationById.get(currentLocationId) ?? CITY_LOCATIONS[0];
          return (
            <span
              className={cx("cityCourier", packagePicked && "cityCourier--loaded")}
              style={{ "--x": `${current.x}%`, "--y": `${current.y}%` } as React.CSSProperties}
              aria-hidden="true"
            >
              <Bike size={34} />
              {packagePicked && <Package size={16} />}
            </span>
          );
        })()}
      </div>
    </section>
  );
}

function TinyCityDeliveryGame({ onGameChange }: GameScreenProps) {
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
    setFeedback({ kind: "neutral", text: "Tiny City is paused." });
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
        setFeedback({ kind: "neutral", text: "Start the first delivery." });
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

  return (
    <div className={cx("appShell", "appShell--city", gameStatus === "playing" && "appShell--playing")}>
      <div className="sceneBackdrop" aria-hidden="true">
        <div className="sceneBackdrop__image sceneBackdrop__image--city" />
      </div>

      <GameRail activeGame="city" badgeLabel="English routes" badgeValue="Map arcade" onGameChange={onGameChange} />

      <main className="mainSurface">
        <header className="topBar">
          <div>
            <p className="eyebrow">Tiny town simulator</p>
            <h1>Tiny City Delivery</h1>
          </div>

          <div className="topActions">
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
            <button className="iconButton" type="button" onClick={resetCityGame} aria-label="Reset Tiny City">
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

          <CityMap
            currentLocationId={currentLocationId}
            deliveredLocationId={deliveredLocationId}
            mission={mission}
            packagePicked={packagePicked}
            path={path}
            onLocationClick={handleCityLocationClick}
          />

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

function ConveyorKitchenGame({ onGameChange }: GameScreenProps) {
  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");
  const [now, setNow] = useState(Date.now());
  const [activeGuests, setActiveGuests] = useState<ActiveGuest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [scheduledFoods, setScheduledFoods] = useState<ScheduledFood[]>([]);
  const [beltFoods, setBeltFoods] = useState<BeltFood[]>([]);
  const [score, setScore] = useState(0);
  const [served, setServed] = useState(0);
  const [streak, setStreak] = useState(0);
  const [misses, setMisses] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>({
    kind: "neutral",
    text: "Ready for the first conveyor shift.",
  });

  const guestSequenceRef = useRef(0);
  const foodSequenceRef = useRef(0);
  const nextGuestAtRef = useRef(Date.now());
  const nextDecoyAtRef = useRef(Date.now());
  const pauseStartedRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const level = levelForServed(served);
  const levelProgress = served % ORDERS_PER_LEVEL;
  const difficulty = useMemo(() => difficultyForLevel(level), [level]);

  const selectedGuest = useMemo(
    () => activeGuests.find((guest) => guest.instanceId === selectedGuestId) ?? activeGuests[0] ?? null,
    [activeGuests, selectedGuestId],
  );

  const livesLeft = Math.max(0, MAX_MISSES - misses);
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

  const addGuest = useCallback((spawnNow: number, profile: DifficultyProfile) => {
    const { guest, scheduledFoods: guestFoods } = makeGuest(guestSequenceRef.current, spawnNow, profile);
    guestSequenceRef.current += 1;

    setActiveGuests((currentGuests) => [...currentGuests, guest]);
    setScheduledFoods((currentFoods) => [...currentFoods, ...guestFoods]);
    setSelectedGuestId((currentSelected) => currentSelected ?? guest.instanceId);
    setFeedback({ kind: "neutral", text: `${guest.customer.name}: ${guest.phrase}` });
    speak(guest.phrase);
  }, []);

  const resetGame = useCallback(() => {
    const startTime = Date.now();
    const profile = difficultyForLevel(1);
    const firstGuest = makeGuest(0, startTime, profile);
    const secondGuest = makeGuest(1, startTime + 900, profile);

    guestSequenceRef.current = 2;
    foodSequenceRef.current = 0;
    nextGuestAtRef.current = startTime + profile.guestIntervalMs;
    nextDecoyAtRef.current = startTime + 2_000;
    pauseStartedRef.current = null;

    setNow(startTime);
    setActiveGuests([firstGuest.guest, secondGuest.guest]);
    setSelectedGuestId(firstGuest.guest.instanceId);
    setScheduledFoods([...firstGuest.scheduledFoods, ...secondGuest.scheduledFoods]);
    setBeltFoods([]);
    setScore(0);
    setServed(0);
    setStreak(0);
    setMisses(0);
    setFeedback({ kind: "neutral", text: "Conveyor started." });
    speak(firstGuest.guest.phrase);
    setGameStatus("playing");
  }, []);

  const pauseGame = useCallback(() => {
    pauseStartedRef.current = Date.now();
    setGameStatus("paused");
    setFeedback({ kind: "neutral", text: "Conveyor paused." });
  }, []);

  const resumeGame = useCallback(() => {
    const pauseStarted = pauseStartedRef.current;
    const pausedFor = pauseStarted ? Date.now() - pauseStarted : 0;
    pauseStartedRef.current = null;

    if (pausedFor > 0) {
      setActiveGuests((currentGuests) =>
        currentGuests.map((guest) => ({
          ...guest,
          createdAt: guest.createdAt + pausedFor,
          expiresAt: guest.expiresAt + pausedFor,
        })),
      );
      setScheduledFoods((currentFoods) =>
        currentFoods.map((food) => ({
          ...food,
          dueAt: food.dueAt + pausedFor,
        })),
      );
      setBeltFoods((currentFoods) =>
        currentFoods.map((food) => ({
          ...food,
          spawnedAt: food.spawnedAt + pausedFor,
        })),
      );
      nextGuestAtRef.current += pausedFor;
      nextDecoyAtRef.current += pausedFor;
    }

    setNow(Date.now());
    setGameStatus("playing");
    setFeedback({ kind: "neutral", text: "Conveyor resumed." });
  }, []);

  const toggleGameStatus = useCallback(() => {
    if (gameStatus === "ready" || gameStatus === "ended") {
      resetGame();
      return;
    }

    if (gameStatus === "playing") {
      pauseGame();
      return;
    }

    resumeGame();
  }, [gameStatus, pauseGame, resetGame, resumeGame]);

  const addMiss = useCallback((text: string) => {
    setMisses((currentMisses) => {
      const nextMisses = currentMisses + 1;

      if (nextMisses >= MAX_MISSES) {
        setGameStatus("ended");
      }

      return nextMisses;
    });
    setStreak(0);
    setFeedback({ kind: "bad", text });
  }, []);

  const listenToGuest = useCallback((guest: ActiveGuest) => {
    const hasAudio = speak(guest.phrase);
    setSelectedGuestId(guest.instanceId);
    setFeedback({
      kind: hasAudio ? "neutral" : "bad",
      text: hasAudio ? `${guest.customer.name}: ${guest.phrase}` : "Audio is not available in this browser.",
    });
  }, []);

  const handleFoodClick = useCallback(
    (food: BeltFood) => {
      if (gameStatus !== "playing") {
        setFeedback({ kind: "neutral", text: "Start the conveyor first." });
        return;
      }

      const foodName = foodById.get(food.foodId)?.name ?? food.foodId;
      const owningGuest =
        food.targetGuestId &&
        activeGuests.find((guest) => guest.instanceId === food.targetGuestId && needsFood(guest, food.foodId));
      const preferredGuest =
        selectedGuest && activeGuests.some((guest) => guest.instanceId === selectedGuest.instanceId)
          ? selectedGuest
          : null;
      const matchingGuest =
        owningGuest ||
        (preferredGuest && needsFood(preferredGuest, food.foodId)
          ? preferredGuest
          : activeGuests.find((guest) => needsFood(guest, food.foodId)));

      setBeltFoods((currentFoods) => currentFoods.filter((currentFood) => currentFood.id !== food.id));

      if (!matchingGuest) {
        playSound("wrong");
        speak(`No one ordered ${foodName}.`, 1.02);
        addMiss(`No guest needs ${foodName}.`);
        return;
      }

      const nextStreak = streak + 1;
      const secondsLeft = Math.ceil((matchingGuest.expiresAt - Date.now()) / 1000);
      const timeBonus = Math.max(0, secondsLeft);
      const levelBonus = difficulty.level * 5;
      const streakBonus = Math.max(0, nextStreak - 1) * STREAK_BONUS_PER_HIT;
      const earned = 35 + timeBonus + levelBonus + streakBonus;
      const earnedLabel = formatEarnedPoints(earned, streakBonus);
      const nextMatchingGuest: ActiveGuest = {
        ...matchingGuest,
        servedFoods: [...matchingGuest.servedFoods, food.foodId],
      };
      const completedGuest = isGuestComplete(nextMatchingGuest) ? nextMatchingGuest : null;
      const nextGuests = completedGuest
        ? activeGuests.filter((guest) => guest.instanceId !== matchingGuest.instanceId)
        : activeGuests.map((guest) =>
            guest.instanceId === matchingGuest.instanceId ? nextMatchingGuest : guest,
          );

      setActiveGuests(nextGuests);

      setScore((currentScore) => currentScore + earned);
      setStreak(nextStreak);

      if (completedGuest) {
        const nextServed = served + 1;
        const completedAt = Date.now();
        setServed(nextServed);
        setScheduledFoods((currentFoods) =>
          currentFoods.filter((scheduledFood) => scheduledFood.targetGuestId !== completedGuest?.instanceId),
        );
        if (nextGuestAtRef.current <= completedAt) {
          nextGuestAtRef.current = completedAt + NEXT_GUEST_AFTER_COMPLETE_MS;
        }
        setFeedback({
          kind: "good",
          text:
            nextServed >= TARGET_SERVES
              ? `Shift complete. ${earnedLabel}`
              : `${completedGuest.customer.name}'s order is complete. ${earnedLabel}`,
        });
        playSound("complete");
        speak(
          nextServed >= TARGET_SERVES
            ? "Shift complete. All orders served."
            : `Thank you. ${completedGuest.customer.name}'s order is complete.`,
          1,
        );

        if (nextServed >= TARGET_SERVES) {
          setGameStatus("ended");
        }
      } else {
        setFeedback({ kind: "good", text: `Served ${foodName}. ${earnedLabel}` });
        playSound("correct");
        speak(`Served ${foodName}.`, 1.04);
      }
    },
    [activeGuests, addMiss, difficulty.level, gameStatus, playSound, selectedGuest, served, streak],
  );

  useEffect(() => {
    if (gameStatus !== "playing") {
      return undefined;
    }

    const clock = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(clock);
  }, [gameStatus]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    if (activeGuests.length < difficulty.maxGuests && now >= nextGuestAtRef.current && served < TARGET_SERVES) {
      addGuest(now, difficulty);
      nextGuestAtRef.current = now + difficulty.guestIntervalMs;
    }

    if (now >= nextDecoyAtRef.current) {
      const decoy = makeDecoyFood(foodSequenceRef.current, now, difficulty);
      const lane = chooseSpawnLane(decoy.lane, beltFoods, now);

      if (lane === null) {
        nextDecoyAtRef.current = now + 650;
      } else {
        foodSequenceRef.current += 1;
        setBeltFoods([...beltFoods, { ...decoy, lane }]);
        nextDecoyAtRef.current = now + difficulty.decoyIntervalMs;
      }
    }
  }, [activeGuests.length, addGuest, beltFoods, difficulty, gameStatus, now, served]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const readyFoods = scheduledFoods.filter((food) => food.dueAt <= now);

    if (readyFoods.length === 0) {
      return;
    }

    const futureFoods = scheduledFoods.filter((food) => food.dueAt > now);
    const spawnedFoods: BeltFood[] = [];
    const delayedFoods: ScheduledFood[] = [];

    for (const food of readyFoods) {
      const lane = chooseSpawnLane(food.lane, [...beltFoods, ...spawnedFoods], now);

      if (lane === null) {
        delayedFoods.push({ ...food, dueAt: now + 650 });
        continue;
      }

      const spawnSequence = foodSequenceRef.current;
      foodSequenceRef.current += 1;
      spawnedFoods.push({
        id: `belt-${food.id}-${now}-${spawnSequence}`,
        foodId: food.foodId,
        targetGuestId: food.targetGuestId,
        lane,
        spawnedAt: now,
        travelMs: difficulty.beltTravelMs,
      });
    }

    setScheduledFoods([...futureFoods, ...delayedFoods]);

    if (spawnedFoods.length > 0) {
      setBeltFoods([...beltFoods, ...spawnedFoods]);
    }
  }, [beltFoods, difficulty.beltTravelMs, gameStatus, now, scheduledFoods]);

  useEffect(() => {
    if (gameStatus !== "playing") {
      return;
    }

    const stillVisible: BeltFood[] = [];
    const recycleFoods: ScheduledFood[] = [];

    for (const food of beltFoods) {
      const progress = (now - food.spawnedAt) / food.travelMs;

      if (progress < 1) {
        stillVisible.push(food);
        continue;
      }

      const guestStillNeedsFood =
        food.targetGuestId &&
        activeGuests.some((guest) => guest.instanceId === food.targetGuestId && needsFood(guest, food.foodId));

      if (guestStillNeedsFood) {
        const recycleSequence = foodSequenceRef.current;
        foodSequenceRef.current += 1;
        recycleFoods.push({
          id: `recycle-${food.id}-${now}-${recycleSequence}`,
          dueAt: now + Math.min(difficulty.dishGapMs, 5_600),
          foodId: food.foodId,
          targetGuestId: food.targetGuestId,
          lane: (food.lane + 1) % ORDER_LANES,
        });
      }
    }

    if (stillVisible.length !== beltFoods.length) {
      setBeltFoods(stillVisible);
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
    if (gameStatus !== "playing") {
      return;
    }

    const expiredGuests = activeGuests.filter((guest) => guest.expiresAt <= now);

    if (expiredGuests.length === 0) {
      return;
    }

    setActiveGuests((currentGuests) => currentGuests.filter((guest) => guest.expiresAt > now));
    setScheduledFoods((currentFoods) =>
      currentFoods.filter((food) => !expiredGuests.some((guest) => guest.instanceId === food.targetGuestId)),
    );
    setBeltFoods((currentFoods) =>
      currentFoods.filter((food) => !expiredGuests.some((guest) => guest.instanceId === food.targetGuestId)),
    );
    setSelectedGuestId((currentSelected) =>
      expiredGuests.some((guest) => guest.instanceId === currentSelected) ? null : currentSelected,
    );
    addMiss(`${expiredGuests[0].customer.name} left before the last dish.`);
  }, [activeGuests, addMiss, gameStatus, now]);

  useEffect(() => {
    if (selectedGuestId && activeGuests.some((guest) => guest.instanceId === selectedGuestId)) {
      return;
    }

    setSelectedGuestId(activeGuests[0]?.instanceId ?? null);
  }, [activeGuests, selectedGuestId]);

  useEffect(() => {
    return () => {
      void audioContextRef.current?.close();
      window.speechSynthesis?.cancel();
    };
  }, []);

  return (
    <div className={cx("appShell", gameStatus === "playing" && "appShell--playing")}>
      <div className="sceneBackdrop" aria-hidden="true">
        <div className="sceneBackdrop__image" />
      </div>

      <div className="playerSprite" aria-hidden="true">
        <img src={playerChefUrl} alt="" draggable="false" />
      </div>

      <GameRail activeGame="kitchen" badgeLabel="English orders" badgeValue="2D arcade" onGameChange={onGameChange} />

      <main className="mainSurface">
        <header className="topBar">
          <div>
            <p className="eyebrow">Game portal</p>
            <h1>Conveyor Kitchen</h1>
          </div>

          <div className="topActions">
            <button className="primaryButton" type="button" onClick={toggleGameStatus}>
              {gameStatus === "playing" ? <Pause size={18} /> : <Play size={18} />}
              <span>
                {gameStatus === "ready"
                  ? "Start Shift"
                  : gameStatus === "playing"
                    ? "Pause"
                    : gameStatus === "paused"
                      ? "Resume"
                      : "New Shift"}
              </span>
            </button>
            <button className="iconButton" type="button" onClick={resetGame} aria-label="Reset shift">
              <RotateCcw size={18} />
            </button>
          </div>
        </header>

        <section className="scoreStrip" aria-label="Shift stats">
          <StatPill icon={<Star size={17} />} label="Score" value={score} />
          <StatPill icon={<BadgeCheck size={17} />} label="Orders" value={`${served}/${TARGET_SERVES}`} />
          <StatPill icon={<Flame size={17} />} label="Streak" value={streak} />
          <StatPill icon={<X size={17} />} label="Lives" value={livesLeft} />
          <StatPill icon={<Gauge size={17} />} label="Level" value={difficulty.level} />
        </section>

        {gameStatus === "ended" && (
          <section className={cx("resultBanner", isShiftWon ? "resultBanner--win" : "resultBanner--lost")}>
            <strong>{isShiftWon ? "Shift complete" : "Kitchen closed"}</strong>
            <span>{isShiftWon ? "All target orders were served." : "Too many guests left unhappy."}</span>
          </section>
        )}

        <section className="gameGrid">
          <section className="guestColumn">
            <div className="sectionHeader">
              <div>
                <p className="eyebrow">Guest orders</p>
                <h2>Active Guests</h2>
              </div>
              <span>
                {activeGuests.length}/{difficulty.maxGuests}
              </span>
            </div>

            <div className="guestStack">
              {activeGuests.map((guest) => (
                <GuestCard
                  guest={guest}
                  key={guest.instanceId}
                  now={now}
                  selected={selectedGuest?.instanceId === guest.instanceId}
                  onListen={() => listenToGuest(guest)}
                  onSelect={() => setSelectedGuestId(guest.instanceId)}
                />
              ))}

              {activeGuests.length === 0 && (
                <div className="emptyGuests">
                  <ChefHat size={24} />
                  <span>{gameStatus === "ready" ? "Shift not started." : "Waiting for guests."}</span>
                </div>
              )}
            </div>
          </section>

          <section className="beltColumn">
            <ConveyorBelt beltFoods={beltFoods} now={now} profile={difficulty} onSelectFood={handleFoodClick} />

            <div className={cx("feedbackBar", `feedbackBar--${feedback.kind}`)} role="status">
              {feedback.text}
            </div>
          </section>

          <EnginePanel
            activeGuestCount={activeGuests.length}
            levelProgress={levelProgress}
            profile={difficulty}
            streak={streak}
          />
        </section>
      </main>
    </div>
  );
}

function App() {
  const [activeGame, setActiveGame] = useState<GameId>(getInitialGameFromPath);

  const handleGameChange = useCallback((game: GameId) => {
    setActiveGame(game);
    window.history.pushState({}, "", getGamePath(game));
  }, []);

  useEffect(() => {
    const handlePopState = () => setActiveGame(getInitialGameFromPath());
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  if (activeGame === "city") {
    return <TinyCityDeliveryGame onGameChange={handleGameChange} />;
  }

  return <ConveyorKitchenGame onGameChange={handleGameChange} />;
}

export default App;
