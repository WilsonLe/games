import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, MouseEvent, ReactNode } from "react";
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
  Volume2,
  X,
} from "lucide-react";
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
import gameKitchenBgUrl from "./assets/game-kitchen-bg.png";
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

type GuestPhase = "entering" | "seated" | "leaving";

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
  seatIndex: number;
  heardOrder: boolean;
  phase: GuestPhase;
  leavingAt?: number;
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

const customerSpriteById: Record<CustomerProfile["id"], string> = {
  mai: customerMaiUrl,
  leo: customerLeoUrl,
  nora: customerNoraUrl,
  ben: customerBenUrl,
  ivy: customerIvyUrl,
  sam: customerSamUrl,
};

const TARGET_SERVES = 24;
const ORDERS_PER_LEVEL = 4;
const MAX_LEVEL = Math.ceil(TARGET_SERVES / ORDERS_PER_LEVEL);
const HAPPY_GUEST_COMBO_BONUS = 15;
const FIRST_DISH_DELAY_MS = 1800;
const NEXT_GUEST_AFTER_COMPLETE_MS = 3_000;
const LEAVING_GUEST_VISIBLE_MS = 2_200;
const ORDER_LANES = 2;
const GAME_TITLE = "Table Talk Diner";
const GAME_PATH = "/games/table-talk-diner";
const TINY_CITY_TITLE = "Tiny City Delivery";
const TINY_CITY_PATH = "/games/tiny-city-delivery";
const TARGET_CITY_DELIVERIES = 10;
const MAX_CITY_MISTAKES = 5;
const CITY_STREAK_BONUS = 12;

function normalizePath(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

const ORDER_TEMPLATES: Array<(items: string) => string> = [
  (items) => `Could I please have ${items}?`,
  (items) => `I'd like ${items}, please.`,
  (items) => `May I order ${items}?`,
  (items) => `Can I get ${items} for dinner?`,
  (items) => `I'm hungry for ${items}.`,
  (items) => `Please bring me ${items}.`,
  (items) => `I'd love ${items} today.`,
  (items) => `Do you have ${items}? I'd like that.`,
  (items) => `For my meal, I want ${items}.`,
  (items) => `Could you serve ${items}, please?`,
];

const GREETING_LINES = [
  "Welcome in. What would you like for dinner?",
  "Hi there. How can I help you today?",
  "Good evening. What can I get started for you?",
  "Hello. What are you having tonight?",
  "Thanks for coming in. What do you need?",
  "Welcome to the diner. What sounds good?",
  "Hi. Are you ready to order?",
  "Nice to see you. What would you like?",
  "Good to have you here. What can I bring you?",
  "Hello. What are you in the mood for?",
];

const HAPPY_GUEST_LINES = [
  "That was perfect. Thank you.",
  "Great service. I am happy.",
  "Everything is right. Thanks.",
  "Wonderful. That is exactly what I ordered.",
  "Delicious. I will come back again.",
  "Nice work. The meal was great.",
];

const SEAT_LAYOUT = [
  {
    x: "23%",
    y: "58%",
    waiterX: "30%",
    waiterY: "66%",
    bubbleShift: "-34%",
    mobileX: "30%",
    mobileY: "48%",
    mobileWaiterX: "42%",
    mobileWaiterY: "55%",
    mobileBubbleShift: "-36%",
  },
  {
    x: "49%",
    y: "56%",
    waiterX: "54%",
    waiterY: "65%",
    bubbleShift: "-50%",
    mobileX: "70%",
    mobileY: "48%",
    mobileWaiterX: "58%",
    mobileWaiterY: "55%",
    mobileBubbleShift: "-64%",
  },
  {
    x: "74%",
    y: "58%",
    waiterX: "68%",
    waiterY: "66%",
    bubbleShift: "-66%",
    mobileX: "30%",
    mobileY: "66%",
    mobileWaiterX: "42%",
    mobileWaiterY: "70%",
    mobileBubbleShift: "-36%",
  },
  {
    x: "28%",
    y: "80%",
    waiterX: "34%",
    waiterY: "86%",
    bubbleShift: "-36%",
    mobileX: "70%",
    mobileY: "66%",
    mobileWaiterX: "58%",
    mobileWaiterY: "70%",
    mobileBubbleShift: "-64%",
  },
  {
    x: "55%",
    y: "82%",
    waiterX: "50%",
    waiterY: "87%",
    bubbleShift: "-50%",
    mobileX: "30%",
    mobileY: "84%",
    mobileWaiterX: "42%",
    mobileWaiterY: "86%",
    mobileBubbleShift: "-36%",
  },
  {
    x: "78%",
    y: "79%",
    waiterX: "72%",
    waiterY: "85%",
    bubbleShift: "-66%",
    mobileX: "70%",
    mobileY: "84%",
    mobileWaiterX: "58%",
    mobileWaiterY: "86%",
    mobileBubbleShift: "-64%",
  },
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

function makeOrderPhrase(seed: number, foodNames: string[]) {
  const template = ORDER_TEMPLATES[Math.abs(seed) % ORDER_TEMPLATES.length];
  return template(formatList(foodNames));
}

function makeGuest(sequence: number, now: number, profile: DifficultyProfile) {
  const customer = CUSTOMERS[sequence % CUSTOMERS.length];
  const foods = selectFoods(sequence, profile.orderSize, profile.level);
  const foodNames = foods.map((foodId) => foodById.get(foodId)?.name ?? foodId);
  const phrase = makeOrderPhrase(sequence + Math.floor(now / 1000), foodNames);
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
    seatIndex: sequence % SEAT_LAYOUT.length,
    heardOrder: false,
    phase: "entering",
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
      <span className="customerSprite__shadow" />
      <span className="customerSprite__legs" />
      <span className="customerSprite__body" />
      <span className="customerSprite__arms" />
      <span className="customerSprite__head">
        <img src={customerSpriteById[customer.id]} alt="" draggable="false" />
      </span>
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

function GuestTable({
  guest,
  now,
  selected,
  onSelect,
}: {
  guest: ActiveGuest;
  now: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const patienceRatio = clamp((guest.expiresAt - now) / (guest.expiresAt - guest.createdAt), 0, 1);
  const remainingMs = Math.max(0, guest.expiresAt - now);
  const seat = SEAT_LAYOUT[guest.seatIndex % SEAT_LAYOUT.length];
  const tableStyle = {
    "--seat-x": seat.x,
    "--seat-y": seat.y,
    "--seat-x-mobile": seat.mobileX,
    "--seat-y-mobile": seat.mobileY,
    "--bubble-shift": seat.bubbleShift,
    "--bubble-shift-mobile": seat.mobileBubbleShift,
  } as CSSProperties;
  const showOrder = guest.heardOrder || selected;

  return (
    <button
      className={cx(
        "guestTable",
        selected && "guestTable--selected",
        !guest.heardOrder && "guestTable--unheard",
        guest.phase === "entering" && "guestTable--entering",
        guest.phase === "leaving" && "guestTable--leaving",
      )}
      disabled={guest.phase === "leaving"}
      key={guest.instanceId}
      style={tableStyle}
      type="button"
      onClick={onSelect}
      aria-label={guest.heardOrder ? `${guest.customer.name} ordered ${formatList(guest.foods)}` : `Ask ${guest.customer.name} for an order`}
    >
      <span className="dinerChair dinerChair--top" aria-hidden="true" />
      <span className="dinerChair dinerChair--right" aria-hidden="true" />
      <span className="dinerChair dinerChair--bottom" aria-hidden="true" />
      <span className="dinerChair dinerChair--left" aria-hidden="true" />
      <span className="dinerTable" aria-hidden="true" />
      <CustomerSprite customer={guest.customer} />
      <span className="guestTable__name">{guest.customer.name}</span>

      <span className="guestSpeech">
        <strong>{showOrder ? guest.phrase : "Tap to order"}</strong>
        {showOrder && (
          <span className="guestSpeech__foods" aria-label={`${guest.customer.name}'s requested food`}>
            {guest.foods.map((foodId, index) => {
              const servedCount = guest.servedFoods.filter((servedFoodId) => servedFoodId === foodId).length;
              const requiredThroughThisChip = guest.foods
                .slice(0, index + 1)
                .filter((orderedFoodId) => orderedFoodId === foodId).length;
              const served = servedCount >= requiredThroughThisChip;
              const food = foodById.get(foodId);

              return (
                <span className={cx("foodChip", served && "foodChip--served")} key={`${guest.instanceId}-bubble-${foodId}-${index}`}>
                  <FoodArt id={foodId} />
                  <span>{food?.name ?? foodId}</span>
                  {served && <Check size={13} />}
                </span>
              );
            })}
          </span>
        )}
        <small>{guest.phase === "leaving" ? "Leaving happy" : `${formatTime(remainingMs)} patience`}</small>
      </span>

      <span className="guestTimer">
        <span style={{ width: `${patienceRatio * 100}%` }} />
      </span>
    </button>
  );
}

function KitchenStation({
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
    <div className="kitchenStation" aria-label="Kitchen cooking station">
      <div className="stoveBank" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="prepCounter" aria-hidden="true">
        <span>Kitchen</span>
      </div>
      <div className="dishRail" aria-label="Kitchen pass dishes">
        <span className="dishRail__label">{formatTime(profile.beltTravelMs)} pass</span>

        {beltFoods.map((food) => {
          const progress = clamp((now - food.spawnedAt) / food.travelMs, 0, 1);
          const left = 6 + progress * 88;
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

function RestaurantStage({
  guests,
  now,
  selectedGuest,
  gameStatus,
  beltFoods,
  profile,
  onSelectGuest,
  onSelectFood,
}: {
  guests: ActiveGuest[];
  now: number;
  selectedGuest: ActiveGuest | null;
  gameStatus: GameStatus;
  beltFoods: BeltFood[];
  profile: DifficultyProfile;
  onSelectGuest: (guest: ActiveGuest) => void;
  onSelectFood: (food: BeltFood) => void;
}) {
  const selectedSeat =
    selectedGuest && selectedGuest.phase !== "leaving"
      ? SEAT_LAYOUT[selectedGuest.seatIndex % SEAT_LAYOUT.length]
      : null;
  const playerStyle = {
    "--player-x": selectedSeat?.waiterX ?? "12%",
    "--player-y": selectedSeat?.waiterY ?? "78%",
    "--player-x-mobile": selectedSeat?.mobileWaiterX ?? "50%",
    "--player-y-mobile": selectedSeat?.mobileWaiterY ?? "82%",
  } as CSSProperties;

  return (
    <section className="restaurantStage" aria-label="Top down restaurant floor">
      <div className="floorTiles" aria-hidden="true" />
      <div className="restaurantDoor" aria-hidden="true">
        <span />
      </div>
      <KitchenStation beltFoods={beltFoods} now={now} profile={profile} onSelectFood={onSelectFood} />

      {guests.map((guest) => (
        <GuestTable
          guest={guest}
          key={guest.instanceId}
          now={now}
          selected={selectedGuest?.instanceId === guest.instanceId}
          onSelect={() => onSelectGuest(guest)}
        />
      ))}

      {guests.length === 0 && (
        <div className="emptyGuests">
          <ChefHat size={24} />
          <span>{gameStatus === "ended" ? "All guests served." : "Waiting for guests to be seated."}</span>
        </div>
      )}

      <div className={cx("playerSprite", Boolean(selectedGuest) && "playerSprite--walking")} style={playerStyle} aria-hidden="true">
        <img src={playerChefUrl} alt="" draggable="false" />
      </div>
    </section>
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

function TinyCityDeliveryGame() {
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

function RestaurantGame() {
  const [gameStatus, setGameStatus] = useState<GameStatus>("ready");
  const [now, setNow] = useState(Date.now());
  const [activeGuests, setActiveGuests] = useState<ActiveGuest[]>([]);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [scheduledFoods, setScheduledFoods] = useState<ScheduledFood[]>([]);
  const [beltFoods, setBeltFoods] = useState<BeltFood[]>([]);
  const [score, setScore] = useState(0);
  const [served, setServed] = useState(0);
  const [combo, setCombo] = useState(0);
  const [, setFeedback] = useState<Feedback>({
    kind: "neutral",
    text: "Guests are arriving. Tap a guest to take an order.",
  });

  const guestSequenceRef = useRef(0);
  const foodSequenceRef = useRef(0);
  const nextGuestAtRef = useRef(Date.now());
  const nextDecoyAtRef = useRef(Date.now());
  const audioContextRef = useRef<AudioContext | null>(null);

  const level = levelForServed(served);
  const difficulty = useMemo(() => difficultyForLevel(level), [level]);

  const selectedGuest = useMemo(
    () => activeGuests.find((guest) => guest.instanceId === selectedGuestId && guest.phase !== "leaving") ?? null,
    [activeGuests, selectedGuestId],
  );

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

  const addGuest = useCallback((spawnNow: number, profile: DifficultyProfile) => {
    const { guest, scheduledFoods: guestFoods } = makeGuest(guestSequenceRef.current, spawnNow, profile);
    guestSequenceRef.current += 1;

    setActiveGuests((currentGuests) => [...currentGuests, guest]);
    setScheduledFoods((currentFoods) => [...currentFoods, ...guestFoods]);
    setFeedback({ kind: "neutral", text: `${guest.customer.name} walked in and took a table.` });
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

    setNow(startTime);
    setActiveGuests([firstGuest.guest, secondGuest.guest]);
    setSelectedGuestId(null);
    setScheduledFoods([...firstGuest.scheduledFoods, ...secondGuest.scheduledFoods]);
    setBeltFoods([]);
    setScore(0);
    setServed(0);
    setCombo(0);
    setFeedback({ kind: "neutral", text: "Tap a guest, listen to the order, then serve dishes from the kitchen pass." });
    setGameStatus("playing");
  }, []);

  const resetCombo = useCallback((text: string) => {
    setCombo(0);
    setFeedback({ kind: "bad", text });
  }, []);

  const handleGuestSelect = useCallback((guest: ActiveGuest) => {
    if (guest.phase === "leaving") {
      return;
    }

    const greeting = GREETING_LINES[(guest.orderNumber + guest.level) % GREETING_LINES.length];
    const hasAudio = speak(`${greeting} ${guest.phrase}`);
    setSelectedGuestId(guest.instanceId);
    setActiveGuests((currentGuests) =>
      currentGuests.map((currentGuest) =>
        currentGuest.instanceId === guest.instanceId
          ? { ...currentGuest, heardOrder: true, phase: "seated" }
          : currentGuest,
      ),
    );
    setFeedback({
      kind: hasAudio ? "neutral" : "bad",
      text: hasAudio ? `${guest.customer.name}: ${guest.phrase}` : "Audio is not available in this browser.",
    });
  }, []);

  const handleFoodClick = useCallback(
    (food: BeltFood) => {
      if (gameStatus !== "playing") {
        setFeedback({ kind: "neutral", text: "The diner is getting ready." });
        return;
      }

      const foodName = foodById.get(food.foodId)?.name ?? food.foodId;
      const owningGuest =
        food.targetGuestId &&
        activeGuests.find(
          (guest) => guest.phase !== "leaving" && guest.instanceId === food.targetGuestId && needsFood(guest, food.foodId),
        );
      const preferredGuest =
        selectedGuest && activeGuests.some((guest) => guest.phase !== "leaving" && guest.instanceId === selectedGuest.instanceId)
          ? selectedGuest
          : null;
      const matchingGuest =
        preferredGuest && needsFood(preferredGuest, food.foodId)
          ? preferredGuest
          : owningGuest || activeGuests.find((guest) => guest.phase !== "leaving" && needsFood(guest, food.foodId));

      setBeltFoods((currentFoods) => currentFoods.filter((currentFood) => currentFood.id !== food.id));

      if (!matchingGuest) {
        playSound("wrong");
        speak(`No one ordered ${foodName}.`, 1.02);
        resetCombo(`No guest needs ${foodName}.`);
        return;
      }

      const secondsLeft = Math.ceil((matchingGuest.expiresAt - Date.now()) / 1000);
      const timeBonus = Math.max(0, secondsLeft);
      const levelBonus = difficulty.level * 5;
      const nextMatchingGuest: ActiveGuest = {
        ...matchingGuest,
        heardOrder: true,
        phase: "seated",
        servedFoods: [...matchingGuest.servedFoods, food.foodId],
      };
      const completedGuest = isGuestComplete(nextMatchingGuest) ? nextMatchingGuest : null;
      const nextCombo = completedGuest ? combo + 1 : combo;
      const comboBonus = completedGuest ? Math.max(0, nextCombo - 1) * HAPPY_GUEST_COMBO_BONUS : 0;
      const earned = 35 + timeBonus + levelBonus + comboBonus;
      const earnedLabel = formatEarnedPoints(earned, comboBonus);
      const completedAt = Date.now();
      const nextGuests: ActiveGuest[] = activeGuests.map((guest) =>
        guest.instanceId === matchingGuest.instanceId
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
        const happyLine = HAPPY_GUEST_LINES[(completedGuest.orderNumber + nextServed) % HAPPY_GUEST_LINES.length];
        setServed(nextServed);
        setScheduledFoods((currentFoods) =>
          currentFoods.filter((scheduledFood) => scheduledFood.targetGuestId !== completedGuest?.instanceId),
        );
        setBeltFoods((currentFoods) =>
          currentFoods.filter((currentFood) => currentFood.targetGuestId !== completedGuest?.instanceId),
        );
        setSelectedGuestId((currentSelected) => (currentSelected === completedGuest.instanceId ? null : currentSelected));
        if (nextGuestAtRef.current <= completedAt) {
          nextGuestAtRef.current = completedAt + NEXT_GUEST_AFTER_COMPLETE_MS;
        }
        setFeedback({
          kind: "good",
          text:
            nextServed >= TARGET_SERVES
              ? `Dinner service complete. ${earnedLabel}`
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
    [activeGuests, combo, difficulty.level, gameStatus, playSound, resetCombo, selectedGuest, served],
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

    if (activeGuestCount < difficulty.maxGuests && now >= nextGuestAtRef.current && served < TARGET_SERVES) {
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
  }, [activeGuestCount, addGuest, beltFoods, difficulty, gameStatus, now, served]);

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
        activeGuests.some(
          (guest) => guest.phase !== "leaving" && guest.instanceId === food.targetGuestId && needsFood(guest, food.foodId),
        );

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

    const expiredGuests = activeGuests.filter((guest) => guest.phase !== "leaving" && guest.expiresAt <= now);

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
      currentFoods.filter((food) => !expiredGuests.some((guest) => guest.instanceId === food.targetGuestId)),
    );
    setSelectedGuestId((currentSelected) =>
      expiredGuests.some((guest) => guest.instanceId === currentSelected) ? null : currentSelected,
    );
    playSound("wrong");
    resetCombo(`${expiredGuests[0].customer.name} left before the last dish.`);
  }, [activeGuests, gameStatus, now, playSound, resetCombo]);

  useEffect(() => {
    if (selectedGuestId && activeGuests.some((guest) => guest.instanceId === selectedGuestId && guest.phase !== "leaving")) {
      return;
    }

    setSelectedGuestId(null);
  }, [activeGuests, selectedGuestId]);

  useEffect(() => {
    const leavingGuests = activeGuests.filter(
      (guest) => guest.phase === "leaving" && guest.leavingAt && now - guest.leavingAt > LEAVING_GUEST_VISIBLE_MS,
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

  return (
    <div className={cx("appShell", gameStatus === "playing" && "appShell--playing")}>
      <div className="sceneBackdrop" aria-hidden="true">
        <div className="sceneBackdrop__image" />
      </div>

      <main className="mainSurface">
        <section className="gameHud" aria-label="Dinner service stats">
          <StatPill icon={<Star size={17} />} label="Score" value={score} />
          <StatPill icon={<Check size={17} />} label="Orders" value={`${served}/${TARGET_SERVES}`} />
          <StatPill icon={<Gauge size={17} />} label="Level" value={difficulty.level} />
        </section>

        {gameStatus === "ended" && (
          <section className={cx("resultBanner", isShiftWon ? "resultBanner--win" : "resultBanner--lost")}>
            <strong>{isShiftWon ? "Dinner service complete" : "Service closed"}</strong>
            <span>{isShiftWon ? "All target orders were served." : "The dining room has stopped seating guests."}</span>
          </section>
        )}

        <section className="gameGrid">
          <RestaurantStage
            beltFoods={beltFoods}
            gameStatus={gameStatus}
            guests={activeGuests}
            now={now}
            profile={difficulty}
            selectedGuest={selectedGuest}
            onSelectFood={handleFoodClick}
            onSelectGuest={handleGuestSelect}
          />
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
            <ChefHat size={30} />
          </div>
          <div>
            <p className="eyebrow">Game portal</p>
            <h1>Table Talk Games</h1>
          </div>
        </div>

        <div className="portalGames">
          <a className="gameTile" href={GAME_PATH} onClick={(event) => handleGameLinkClick(event, GAME_PATH)}>
            <span className="gameTile__thumb">
              <img src={gameKitchenBgUrl} alt="" draggable="false" />
              <span className="gameTile__sprites" aria-hidden="true">
                <img src={playerChefUrl} alt="" draggable="false" />
                <img src={customerMaiUrl} alt="" draggable="false" />
                <FoodArt id="fish" />
              </span>
            </span>
            <span className="gameTile__body">
              <span className="gameTile__title">{GAME_TITLE}</span>
              <span className="gameTile__meta">Restaurant simulator for English food orders</span>
              <span className="gameTile__cta">
                <Play size={18} />
                Play
              </span>
            </span>
          </a>

          <a className="gameTile gameTile--city" href={TINY_CITY_PATH} onClick={(event) => handleGameLinkClick(event, TINY_CITY_PATH)}>
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
              <span className="gameTile__title">{TINY_CITY_TITLE}</span>
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
  const [path, setPath] = useState(() => normalizePath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => setPath(normalizePath(window.location.pathname));

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigateToGame = useCallback((nextPath: string) => {
    const normalizedNextPath = normalizePath(nextPath);

    if (normalizePath(window.location.pathname) !== normalizedNextPath) {
      window.history.pushState(null, "", normalizedNextPath);
    }

    setPath(normalizedNextPath);
  }, []);

  if (path === GAME_PATH) {
    return <RestaurantGame />;
  }

  if (path === TINY_CITY_PATH) {
    return <TinyCityDeliveryGame />;
  }

  return <GamePortal onPlay={navigateToGame} />;
}

export default App;
