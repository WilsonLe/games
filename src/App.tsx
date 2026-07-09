import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  ChefHat,
  Check,
  Clock,
  Flame,
  Gauge,
  Pause,
  Play,
  RotateCcw,
  Star,
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

type GameStatus = "ready" | "playing" | "paused" | "ended";
type SoundKind = "correct" | "complete" | "wrong";
type AudioContextWindow = Window & {
  webkitAudioContext?: typeof AudioContext;
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

const foodById = new Map(FOODS.map((food) => [food.id, food]));

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

function formatEarnedPoints(earned: number, streakBonus: number) {
  return streakBonus > 0 ? `+${earned} streak +${streakBonus}` : `+${earned}`;
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

function App() {
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
    <div className="appShell">
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
          <button className="gameNavItem gameNavItem--active" type="button">
            <span className="gameNavIcon">
              <Utensils size={20} />
            </span>
            <span>
              <strong>Conveyor Kitchen</strong>
              <small>Food order rush</small>
            </span>
          </button>
        </nav>

        <div className="learnerBadge">
          <span>English orders</span>
          <strong>2D arcade</strong>
        </div>
      </aside>

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

export default App;
