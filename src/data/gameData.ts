export type DifficultyTier = 'apprentice' | 'explorer' | 'master';

export type TableBadgeTier = 'unranked' | 'novice' | 'proficient' | 'expert';

export interface TablePerformanceStat {
  attempts: number;
  correctFirstTry: number;
  totalResponseTimeMs: number;
}

export interface TableBadgeInfo {
  tier: TableBadgeTier;
  label: string;
  accuracyPercent: number;
  avgTimeSeconds: number | null;
  attempts: number;
  nextTierLabel: string | null;
  nextRequirementText: string;
}

export function computeTableBadge(stat?: TablePerformanceStat): TableBadgeInfo {
  const attempts = stat?.attempts ?? 0;
  const correct = stat?.correctFirstTry ?? 0;
  const totalMs = stat?.totalResponseTimeMs ?? 0;

  const accuracyPercent = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const avgTimeSeconds =
    attempts > 0 ? Number((totalMs / attempts / 1000).toFixed(1)) : null;

  if (
    attempts >= 8 &&
    accuracyPercent >= 90 &&
    avgTimeSeconds !== null &&
    avgTimeSeconds <= 4.5
  ) {
    return {
      tier: 'expert',
      label: 'Expert',
      accuracyPercent,
      avgTimeSeconds,
      attempts,
      nextTierLabel: null,
      nextRequirementText: 'Max rank achieved! Lightning-fast mastery.',
    };
  }

  if (
    attempts >= 5 &&
    accuracyPercent >= 75 &&
    avgTimeSeconds !== null &&
    avgTimeSeconds <= 7.0
  ) {
    return {
      tier: 'proficient',
      label: 'Proficient',
      accuracyPercent,
      avgTimeSeconds,
      attempts,
      nextTierLabel: 'Expert',
      nextRequirementText: 'Need 8+ solves, ≥90% accuracy, and ≤4.5s avg speed for Expert.',
    };
  }

  if (attempts >= 3 && accuracyPercent >= 50) {
    return {
      tier: 'novice',
      label: 'Novice',
      accuracyPercent,
      avgTimeSeconds,
      attempts,
      nextTierLabel: 'Proficient',
      nextRequirementText: 'Need 5+ solves, ≥75% accuracy, and ≤7.0s avg speed for Proficient.',
    };
  }

  return {
    tier: 'unranked',
    label: 'Unranked',
    accuracyPercent,
    avgTimeSeconds,
    attempts,
    nextTierLabel: 'Novice',
    nextRequirementText: 'Complete 3+ solves with ≥50% accuracy to earn Novice.',
  };
}

export type StationType =
  | 'gold_room'
  | 'time_igloo'
  | 'crystal_cavern'
  | 'snowbully_patrol'
  | 'ice_ladder';

export interface MountainStation {
  id: string;
  level: 1 | 2 | 3;
  name: string;
  subtitle: string;
  type: StationType;
  description: string;
  rewardCoins: number;
  rewardSnowballs: number;
  xPercent: number;
  yPercent: number;
}

export interface TreasureItem {
  id: string;
  name: string;
  category: 'Royal Relic' | 'Alpine Gear' | 'Crystal Artifact' | 'Crown Jewel';
  lore: string;
  tableFocus: string;
  costCoins: number;
  iconName: string;
  accentColor: string;
}

export interface ExplorerRank {
  id: string;
  title: string;
  minTreasures: number;
  badgeText: string;
  perkDescription: string;
}

export const HERO_IMAGES = {
  mountain: '/src/assets/images/treasure_mountain_hero_1793856234114.jpg',
  explorer: '/src/assets/images/explorer_hero_avatar_1793856235779.jpg',
  snowbully: '/src/assets/images/snowbully_sprite_1793856236072.jpg',
  chest: '/src/assets/images/crystal_treasure_chest_1793856236367.jpg',
};

export const MOUNTAIN_STATIONS: MountainStation[] = [
  {
    id: 'station-gold-1',
    level: 1,
    name: 'Misty Lodge Gold Scales',
    subtitle: 'Level 1 · Base Camp Trail',
    type: 'gold_room',
    description: 'Balance the brass scales by multiplying crates of gold weights.',
    rewardCoins: 25,
    rewardSnowballs: 6,
    xPercent: 26,
    yPercent: 78,
  },
  {
    id: 'station-bully-1',
    level: 1,
    name: 'Pine Bridge Snowbully',
    subtitle: 'Level 1 · Frozen Crossing',
    type: 'snowbully_patrol',
    description: 'Catch the mischievous Snowbully with your net by solving rapid-fire multiplication.',
    rewardCoins: 30,
    rewardSnowballs: 8,
    xPercent: 58,
    yPercent: 70,
  },
  {
    id: 'station-igloo-2',
    level: 2,
    name: 'Ticking Time Igloo',
    subtitle: 'Level 2 · Glacier Ledge',
    type: 'time_igloo',
    description: 'Sync the frozen clock gears using 5-minute and 6-minute multiplication intervals.',
    rewardCoins: 35,
    rewardSnowballs: 10,
    xPercent: 42,
    yPercent: 52,
  },
  {
    id: 'station-crystal-2',
    level: 2,
    name: 'Echoing Crystal Cavern',
    subtitle: 'Level 2 · Sapphire Cliff',
    type: 'crystal_cavern',
    description: 'Cluster glowing ice crystals into equal rows and columns to shatter the frost seal.',
    rewardCoins: 45,
    rewardSnowballs: 12,
    xPercent: 70,
    yPercent: 45,
  },
  {
    id: 'station-ladder-3',
    level: 3,
    name: 'Summit Ice Stairway',
    subtitle: 'Level 3 · Castle Approach',
    type: 'ice_ladder',
    description: 'Find the missing multiplier factors to carve steps up to the Golden Castle Vault.',
    rewardCoins: 60,
    rewardSnowballs: 15,
    xPercent: 50,
    yPercent: 22,
  },
];

export const EXPLORER_RANKS: ExplorerRank[] = [
  {
    id: 'rank-1',
    title: 'Snowshoe Cadet',
    minTreasures: 0,
    badgeText: 'Rank 01',
    perkDescription: 'Equipped with a starter snow net and Base Camp access.',
  },
  {
    id: 'rank-2',
    title: 'Trail Scout',
    minTreasures: 2,
    badgeText: 'Rank 02',
    perkDescription: 'Thaws the lower pine meadows and earns +5 bonus coins per drill.',
  },
  {
    id: 'rank-3',
    title: 'Glacier Ranger',
    minTreasures: 4,
    badgeText: 'Rank 03',
    perkDescription: 'Unlocks golden net trim and +10 bonus coins per completed expedition.',
  },
  {
    id: 'rank-4',
    title: 'Alpine Navigator',
    minTreasures: 7,
    badgeText: 'Rank 04',
    perkDescription: 'Restores the mountain waterfalls and doubles streak snowball rewards.',
  },
  {
    id: 'rank-5',
    title: 'Summit Champion',
    minTreasures: 10,
    badgeText: 'Rank 05',
    perkDescription: 'Lights the Castle beacons and unlocks Master Factor challenges.',
  },
  {
    id: 'rank-6',
    title: 'Grand Master of Treasure Mountain',
    minTreasures: 12,
    badgeText: 'Rank 06',
    perkDescription: 'Breaks the Master of Mischief’s winter spell across the entire peak!',
  },
];

export const TREASURE_VAULT_ITEMS: TreasureItem[] = [
  {
    id: 'tr-compass',
    name: 'Sunstone Compass',
    category: 'Alpine Gear',
    lore: 'Points toward hidden Snowbully caches even in the thickest blizzard.',
    tableFocus: '2× & 3× Mastery',
    costCoins: 40,
    iconName: 'Compass',
    accentColor: 'text-amber-400',
  },
  {
    id: 'tr-lantern',
    name: 'Frostfire Lantern',
    category: 'Alpine Gear',
    lore: 'Burns with a warm golden flame that never freezes in sub-zero winds.',
    tableFocus: '4× Mastery',
    costCoins: 55,
    iconName: 'Flame',
    accentColor: 'text-orange-400',
  },
  {
    id: 'tr-chalice',
    name: 'Sapphire Glacial Goblet',
    category: 'Royal Relic',
    lore: 'Carved from a single ancient glacier crystal for the Mountain King.',
    tableFocus: '5× Mastery',
    costCoins: 70,
    iconName: 'Trophy',
    accentColor: 'text-sky-400',
  },
  {
    id: 'tr-hourglass',
    name: 'Chronos Ice Hourglass',
    category: 'Crystal Artifact',
    lore: 'Kept inside the Time Igloo to measure the length of winter storms.',
    tableFocus: '6× Mastery',
    costCoins: 85,
    iconName: 'Hourglass',
    accentColor: 'text-cyan-400',
  },
  {
    id: 'tr-pick',
    name: 'Gilded Summit Pickaxe',
    category: 'Alpine Gear',
    lore: 'Forged by mountain dwarves to chip through enchanted blue ice.',
    tableFocus: '7× Mastery',
    costCoins: 100,
    iconName: 'Pickaxe',
    accentColor: 'text-amber-300',
  },
  {
    id: 'tr-owl',
    name: 'Silver Snow Owl Automaton',
    category: 'Crystal Artifact',
    lore: 'A clockwork companion that hoots whenever a secret cave is nearby.',
    tableFocus: '8× Mastery',
    costCoins: 115,
    iconName: 'Bird',
    accentColor: 'text-indigo-300',
  },
  {
    id: 'tr-scepter',
    name: 'Starlight Ruby Scepter',
    category: 'Royal Relic',
    lore: 'Used in the Castle Throne Room to summon spring wildflowers.',
    tableFocus: '9× Mastery',
    costCoins: 130,
    iconName: 'Wand2',
    accentColor: 'text-rose-400',
  },
  {
    id: 'tr-shield',
    name: 'Aurora Crest Shield',
    category: 'Royal Relic',
    lore: 'Reflects the northern lights across the snowy valley below.',
    tableFocus: '10× Mastery',
    costCoins: 145,
    iconName: 'Shield',
    accentColor: 'text-emerald-400',
  },
  {
    id: 'tr-bell',
    name: 'Diamond Chime Bell',
    category: 'Crystal Artifact',
    lore: 'One clear ring causes icicles to melt into sparkling mountain streams.',
    tableFocus: '11× Mastery',
    costCoins: 165,
    iconName: 'Bell',
    accentColor: 'text-sky-300',
  },
  {
    id: 'tr-crown',
    name: 'Royal Crown of the Peak',
    category: 'Crown Jewel',
    lore: 'The sovereign crown of Treasure Mountain, rescued from the Master of Mischief.',
    tableFocus: '12× Mastery',
    costCoins: 190,
    iconName: 'Crown',
    accentColor: 'text-amber-400',
  },
  {
    id: 'tr-key',
    name: 'Master Vault Skeleton Key',
    category: 'Royal Relic',
    lore: 'Opens the innermost sanctum of the Golden Castle.',
    tableFocus: 'Missing Factors',
    costCoins: 210,
    iconName: 'KeyRound',
    accentColor: 'text-yellow-300',
  },
  {
    id: 'tr-heart',
    name: 'Heart of Eternal Spring',
    category: 'Crown Jewel',
    lore: 'The legendary gem that keeps Treasure Mountain warm and green forever.',
    tableFocus: 'All Tables 1–12',
    costCoins: 250,
    iconName: 'Gem',
    accentColor: 'text-emerald-300',
  },
];
