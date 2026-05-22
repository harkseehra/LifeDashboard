export type Tier = {
  name: string;
  emoji: string;
  threshold: number;
  message: string | null;
};

export const TIERS: Tier[] = [
  { name: "Seedling", emoji: "🌰", threshold: 0, message: null },
  { name: "Sprout", emoji: "🌱", threshold: 3, message: "Three days in. You started something." },
  { name: "Sapling", emoji: "🌿", threshold: 10, message: "Ten days. This is becoming a thing." },
  { name: "Young Tree", emoji: "🌳", threshold: 30, message: "A month. You're rooted now." },
  { name: "Tall Tree", emoji: "🌲", threshold: 100, message: "100 days. Look at you." },
  { name: "Ancient", emoji: "🪵", threshold: 365, message: "A year. You're the kind of person who does this now." },
];

export function getTierForStreak(streak: number): Tier {
  let current = TIERS[0];
  for (const tier of TIERS) {
    if (streak >= tier.threshold) current = tier;
    else break;
  }
  return current;
}

export function getNextTier(streak: number): Tier | null {
  for (const tier of TIERS) {
    if (tier.threshold > streak) return tier;
  }
  return null;
}

export function crossedTierThreshold(prevStreak: number, newStreak: number): Tier | null {
  for (const tier of TIERS) {
    if (tier.threshold > 0 && prevStreak < tier.threshold && newStreak >= tier.threshold) {
      return tier;
    }
  }
  return null;
}
