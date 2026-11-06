import React, { useState, useEffect } from 'react';
import {
  Mountain,
  Sparkles,
  Trophy,
  Grid,
  Play,
  Coins,
  Snowflake,
  Volume2,
  VolumeX,
  CheckCircle2,
  Compass,
  Clock,
  Gem,
  Shield,
  ChevronRight,
  Sliders,
} from 'lucide-react';
import {
  DifficultyTier,
  EXPLORER_RANKS,
  HERO_IMAGES,
  MOUNTAIN_STATIONS,
  MountainStation,
  TREASURE_VAULT_ITEMS,
  TreasureItem,
  TablePerformanceStat,
} from './data/gameData';
import { MathDrillModal } from './components/MathDrillModal';
import { SnowbullyArenaView } from './components/SnowbullyArenaView';
import { CastleVaultView } from './components/CastleVaultView';
import { MasteryMatrixView } from './components/MasteryMatrixView';
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { sound } from './utils/sound';

type ActiveTab = 'mountain' | 'blitz' | 'vault' | 'matrix';

interface SavedExplorerState {
  coins: number;
  snowballs: number;
  unlockedTreasures: string[];
  clearedStations: string[];
  selectedTables: number[];
  difficulty: DifficultyTier;
  factMastery: Record<string, number>;
  tableStats: Record<number, TablePerformanceStat>;
  totalQuestionsAnswered: number;
  totalFirstTryCorrect: number;
  musicVolume: number; // 0 to 100
  sfxVolume: number; // 0 to 100
  mutedAll: boolean;
}

const STORAGE_KEY = 'treasure_mathstorm_mobile_save_v1';

const DEFAULT_SAVE: SavedExplorerState = {
  coins: 45,
  snowballs: 12,
  unlockedTreasures: ['tr-compass'],
  clearedStations: [],
  selectedTables: [2, 3, 4, 5, 6, 7, 8, 9],
  difficulty: 'explorer',
  factMastery: {
    '2-3': 2,
    '3-4': 1,
    '4-5': 2,
    '5-5': 3,
    '6-7': 1,
  },
  tableStats: {
    2: { attempts: 9, correctFirstTry: 9, totalResponseTimeMs: 28800 }, // Expert (100%, 3.2s)
    5: { attempts: 6, correctFirstTry: 5, totalResponseTimeMs: 31200 }, // Proficient (83%, 5.2s)
    3: { attempts: 4, correctFirstTry: 3, totalResponseTimeMs: 24800 }, // Novice (75%, 6.2s)
    4: { attempts: 3, correctFirstTry: 2, totalResponseTimeMs: 21900 }, // Novice (67%, 7.3s)
  },
  totalQuestionsAnswered: 12,
  totalFirstTryCorrect: 11,
  musicVolume: 45,
  sfxVolume: 80,
  mutedAll: false,
};

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mountain');
  const [saveState, setSaveState] = useState<SavedExplorerState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SAVE,
          ...parsed,
          tableStats: {
            ...DEFAULT_SAVE.tableStats,
            ...(parsed.tableStats || {}),
          },
        };
      }
    } catch {
      // ignore storage error
    }
    return DEFAULT_SAVE;
  });

  const [activeStation, setActiveStation] = useState<MountainStation | null>(null);
  const [isAudioSettingsOpen, setIsAudioSettingsOpen] = useState(false);
  const [selectedLevelFilter, setSelectedLevelFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    sound.syncSettings({
      musicVolume: saveState.musicVolume / 100,
      sfxVolume: saveState.sfxVolume / 100,
      mutedAll: saveState.mutedAll,
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saveState));
    } catch {
      // ignore storage error
    }
  }, [saveState]);

  const currentRank =
    [...EXPLORER_RANKS]
      .reverse()
      .find((r) => saveState.unlockedTreasures.length >= r.minTreasures) ||
    EXPLORER_RANKS[0];

  const handleToggleMuteAll = () => {
    setSaveState((prev) => {
      const nextMuted = !prev.mutedAll;
      sound.syncSettings({
        musicVolume: prev.musicVolume / 100,
        sfxVolume: prev.sfxVolume / 100,
        mutedAll: nextMuted,
      });
      if (!nextMuted) {
        sound.playTap();
      }
      return { ...prev, mutedAll: nextMuted };
    });
  };

  const handleChangeMusicVolume = (val: number) => {
    setSaveState((prev) => {
      const nextMuted = val > 0 ? false : prev.mutedAll;
      sound.syncSettings({
        musicVolume: val / 100,
        sfxVolume: prev.sfxVolume / 100,
        mutedAll: nextMuted,
      });
      if (val > 0) {
        sound.ensureMusicStarted();
      }
      return {
        ...prev,
        musicVolume: val,
        mutedAll: nextMuted,
      };
    });
  };

  const handleChangeSfxVolume = (val: number) => {
    setSaveState((prev) => {
      const nextMuted = val > 0 ? false : prev.mutedAll;
      sound.syncSettings({
        musicVolume: prev.musicVolume / 100,
        sfxVolume: val / 100,
        mutedAll: nextMuted,
      });
      return {
        ...prev,
        sfxVolume: val,
        mutedAll: nextMuted,
      };
    });
  };

  const handleStartQuickDrill = () => {
    sound.playTap();
    // Pick the first uncleared station or random station
    const nextStation =
      MOUNTAIN_STATIONS.find((s) => !saveState.clearedStations.includes(s.id)) ||
      MOUNTAIN_STATIONS[0];
    setActiveStation(nextStation);
  };

  const handleCompleteExpedition = (results: {
    stationId: string;
    correctCount: number;
    totalQuestions: number;
    earnedCoins: number;
    earnedSnowballs: number;
    masteredFacts: Array<{ a: number; b: number; correct: boolean; timeMs: number }>;
  }) => {
    setSaveState((prev) => {
      const nextMastery = { ...prev.factMastery };
      const nextTableStats: Record<number, TablePerformanceStat> = {
        ...prev.tableStats,
      };

      results.masteredFacts.forEach((f) => {
        if (f.correct) {
          const k = `${f.a}-${f.b}`;
          nextMastery[k] = (nextMastery[k] || 0) + 1;
        }
        const prevStat = nextTableStats[f.a] || {
          attempts: 0,
          correctFirstTry: 0,
          totalResponseTimeMs: 0,
        };
        nextTableStats[f.a] = {
          attempts: prevStat.attempts + 1,
          correctFirstTry: prevStat.correctFirstTry + (f.correct ? 1 : 0),
          totalResponseTimeMs: prevStat.totalResponseTimeMs + f.timeMs,
        };
      });

      const nextCleared = prev.clearedStations.includes(results.stationId)
        ? prev.clearedStations
        : [...prev.clearedStations, results.stationId];

      return {
        ...prev,
        coins: prev.coins + results.earnedCoins,
        snowballs: prev.snowballs + results.earnedSnowballs,
        clearedStations: nextCleared,
        factMastery: nextMastery,
        tableStats: nextTableStats,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + results.totalQuestions,
        totalFirstTryCorrect: prev.totalFirstTryCorrect + results.correctCount,
      };
    });
    setActiveStation(null);
  };

  const handleToggleTable = (tableNum: number) => {
    setSaveState((prev) => {
      const exists = prev.selectedTables.includes(tableNum);
      if (exists && prev.selectedTables.length <= 1) {
        return prev; // Keep at least 1 table active
      }
      const nextTables = exists
        ? prev.selectedTables.filter((t) => t !== tableNum)
        : [...prev.selectedTables, tableNum];
      return { ...prev, selectedTables: nextTables };
    });
  };

  const handleSelectPresetTables = (tables: number[]) => {
    setSaveState((prev) => ({
      ...prev,
      selectedTables: tables,
    }));
  };

  const handleCompleteBlitz = (
    coinsEarned: number,
    snowballsEarned: number,
    caughtCount: number,
    factResults: Array<{ a: number; b: number; correct: boolean; timeMs: number }>
  ) => {
    setSaveState((prev) => {
      const nextMastery = { ...prev.factMastery };
      const nextTableStats: Record<number, TablePerformanceStat> = {
        ...prev.tableStats,
      };

      factResults.forEach((f) => {
        if (f.correct) {
          const k = `${f.a}-${f.b}`;
          nextMastery[k] = (nextMastery[k] || 0) + 1;
        }
        const prevStat = nextTableStats[f.a] || {
          attempts: 0,
          correctFirstTry: 0,
          totalResponseTimeMs: 0,
        };
        nextTableStats[f.a] = {
          attempts: prevStat.attempts + 1,
          correctFirstTry: prevStat.correctFirstTry + (f.correct ? 1 : 0),
          totalResponseTimeMs: prevStat.totalResponseTimeMs + f.timeMs,
        };
      });

      return {
        ...prev,
        coins: prev.coins + coinsEarned,
        snowballs: prev.snowballs + snowballsEarned,
        factMastery: nextMastery,
        tableStats: nextTableStats,
        totalQuestionsAnswered: prev.totalQuestionsAnswered + factResults.length,
        totalFirstTryCorrect: prev.totalFirstTryCorrect + caughtCount,
      };
    });
  };

  const handleUnlockTreasure = (item: TreasureItem) => {
    setSaveState((prev) => {
      if (
        prev.unlockedTreasures.includes(item.id) ||
        prev.coins < item.costCoins
      ) {
        return prev;
      }
      return {
        ...prev,
        coins: prev.coins - item.costCoins,
        unlockedTreasures: [...prev.unlockedTreasures, item.id],
      };
    });
  };

  const handleStartTargetedDrill = (tableNum: number) => {
    setSaveState((prev) => ({
      ...prev,
      selectedTables: [tableNum],
    }));
    setActiveStation(MOUNTAIN_STATIONS[0]);
  };

  const handleResetProgress = () => {
    sound.playTap();
    setSaveState(DEFAULT_SAVE);
  };

  const visibleStations =
    selectedLevelFilter === 'all'
      ? MOUNTAIN_STATIONS
      : MOUNTAIN_STATIONS.filter((s) => s.level === selectedLevelFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24 md:pb-12 flex flex-col">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-14 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            sound.playTap();
            setActiveTab('mountain');
          }}
          className="font-display text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          Treasure MathStorm!
        </a>

        {/* Zone 2: 4 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setActiveTab('mountain');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white hover:underline underline-offset-8 ${
              activeTab === 'mountain' ? 'text-amber-400 underline' : ''
            }`}
          >
            Mountain Trail
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setActiveTab('blitz');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white hover:underline underline-offset-8 ${
              activeTab === 'blitz' ? 'text-amber-400 underline' : ''
            }`}
          >
            Snowbully Blitz
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setActiveTab('vault');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white hover:underline underline-offset-8 ${
              activeTab === 'vault' ? 'text-amber-400 underline' : ''
            }`}
          >
            Castle Vault
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setActiveTab('matrix');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-white hover:underline underline-offset-8 ${
              activeTab === 'matrix' ? 'text-amber-400 underline' : ''
            }`}
          >
            Times Matrix
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleStartQuickDrill}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors whitespace-nowrap shrink-0"
          >
            Quick Drill
          </button>
        </div>
      </header>

      {/* Main Content Container (Expands cleanly from 375px mobile to max-w-7xl desktop) */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 flex-1 space-y-6">
        {/* Explorer HUD Strip & Difficulty / Audio Controls */}
        <section className="rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-12 w-12 rounded-xl overflow-hidden border border-amber-400/40 shrink-0 bg-slate-950">
              <img
                src={HERO_IMAGES.explorer}
                alt="Elara Explorer"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="text-amber-400 font-semibold">
                  {currentRank.title}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {saveState.unlockedTreasures.length}/{TREASURE_VAULT_ITEMS.length} Treasures
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono tabular-nums">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Coins className="h-4 w-4" />
                  {saveState.coins} Coins
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-sky-400 font-bold">
                  <Snowflake className="h-4 w-4" />
                  {saveState.snowballs} Snowballs
                </span>
                <span aria-hidden="true" className="text-slate-600 hidden sm:inline">·</span>
                <span className="hidden sm:inline text-slate-300">
                  {saveState.clearedStations.length}/{MOUNTAIN_STATIONS.length} Outposts Thawed
                </span>
              </div>
            </div>
          </div>

          {/* Difficulty Mode & Sound Toggle */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
              {(
                [
                  { id: 'apprentice', label: 'Apprentice (1–5×)' },
                  { id: 'explorer', label: 'Explorer (2–9×)' },
                  { id: 'master', label: 'Master (1–12×)' },
                ] as const
              ).map((tier) => (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setSaveState((prev) => ({ ...prev, difficulty: tier.id }));
                  }}
                  className={`min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    saveState.difficulty === tier.id
                      ? 'bg-slate-800 text-amber-300 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tier.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleToggleMuteAll}
              aria-label={saveState.mutedAll ? 'Unmute All Audio' : 'Mute All Audio'}
              title={saveState.mutedAll ? 'Unmute All Audio' : 'Mute All Audio'}
              className="min-h-[42px] min-w-[42px] rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
            >
              {saveState.mutedAll ? (
                <VolumeX className="h-4 w-4 text-rose-400" />
              ) : (
                <Volume2 className="h-4 w-4 text-emerald-400" />
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setIsAudioSettingsOpen(true);
              }}
              className="min-h-[42px] px-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-xs font-medium text-slate-200 hover:text-white flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Sliders className="h-4 w-4 text-amber-400" />
              <span>Audio</span>
            </button>
          </div>
        </section>

        {/* Active View Content */}
        {activeTab === 'mountain' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Interactive Visual Mountain Map Canvas */}
            <div className="lg:col-span-7 relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 min-h-[380px] sm:min-h-[480px] flex flex-col justify-between">
              <img
                src={HERO_IMAGES.mountain}
                alt="Frozen Treasure Mountain Trail Map"
                referrerPolicy="no-referrer"
                className="absolute inset-0 h-full w-full object-cover"
              />
              {/* Measured Gradient Scrim for Legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-slate-950/60" />

              {/* Top Overlay Header */}
              <div className="relative z-10 p-4 sm:p-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-amber-300">
                    Interactive Expedition Map · Tap Any Outpost Pin
                  </p>
                  <h1 className="mt-0.5 text-2xl sm:text-3xl font-extrabold text-white text-balance">
                    Climb to the Golden Castle
                  </h1>
                </div>
              </div>

              {/* Interactive Outpost Pins on the Mountain */}
              <div className="relative z-10 flex-1 min-h-[240px]">
                {MOUNTAIN_STATIONS.map((st, idx) => {
                  const isCleared = saveState.clearedStations.includes(st.id);
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setActiveStation(st);
                      }}
                      style={{
                        left: `${st.xPercent}%`,
                        top: `${st.yPercent}%`,
                      }}
                      className=" -translate-x-1/2 -translate-y-1/2 absolute group focus:outline-none"
                    >
                      <div
                        className={`min-h-[44px] px-3 py-1.5 rounded-2xl border shadow-lg backdrop-blur-md transition-transform group-hover:scale-105 group-active:scale-95 flex items-center gap-2 whitespace-nowrap ${
                          isCleared
                            ? 'bg-emerald-950/90 border-emerald-400 text-emerald-200'
                            : 'bg-slate-950/90 border-amber-400 text-white'
                        }`}
                      >
                        <span
                          className={`h-6 w-6 rounded-lg font-mono text-xs font-bold flex items-center justify-center ${
                            isCleared
                              ? 'bg-emerald-400 text-slate-950'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-bold">
                          {st.name.split(' ').slice(-2).join(' ')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Map Legend & Action Bar */}
              <div className="relative z-10 p-4 sm:p-6 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-200">
                  Solve 5 multiplication waves at each outpost to earn Gold Coins and Snowballs.
                </div>
                <button
                  type="button"
                  onClick={handleStartQuickDrill}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all whitespace-nowrap shrink-0"
                >
                  <Play className="h-4 w-4 fill-current" />
                  <span>Climb Next Outpost</span>
                </button>
              </div>
            </div>

            {/* Right Column: Mountain Outposts List & Level Filter */}
            <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-slate-400">3-Tier Ascent</p>
                    <h2 className="text-lg font-bold text-white">
                      Mountain Outposts
                    </h2>
                  </div>

                  {/* Level Filter Tabs */}
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
                    {(
                      [
                        { val: 'all', label: 'All' },
                        { val: 1, label: 'Lv 1' },
                        { val: 2, label: 'Lv 2' },
                        { val: 3, label: 'Lv 3' },
                      ] as const
                    ).map((f) => (
                      <button
                        key={String(f.val)}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setSelectedLevelFilter(f.val);
                        }}
                        className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          selectedLevelFilter === f.val
                            ? 'bg-slate-800 text-white'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tap List Rows for Each Station */}
                <div className="mt-4 divide-y divide-slate-800/80">
                  {visibleStations.map((station) => {
                    const isCleared = saveState.clearedStations.includes(station.id);
                    const StationIcon =
                      station.type === 'gold_room'
                        ? Compass
                        : station.type === 'time_igloo'
                          ? Clock
                          : station.type === 'crystal_cavern'
                            ? Gem
                            : station.type === 'snowbully_patrol'
                              ? Shield
                              : Trophy;

                    return (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => {
                          sound.playTap();
                          setActiveStation(station);
                        }}
                        className="w-full py-3.5 first:pt-1 last:pb-1 text-left flex items-center justify-between gap-3.5 group hover:bg-slate-800/40 rounded-xl px-2 -mx-2 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div
                            className={`h-11 w-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                              isCleared
                                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                : 'bg-slate-950 border-slate-800 text-amber-400'
                            }`}
                          >
                            {isCleared ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : (
                              <StationIcon className="h-5 w-5" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span>{station.subtitle}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono tabular-nums text-amber-400">
                                +{station.rewardCoins} Coins
                              </span>
                            </div>
                            <div className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                              {station.name}
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-1">
                              {station.description}
                            </p>
                          </div>
                        </div>

                        <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white shrink-0 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Vault Shortcut */}
              <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-400">
                  Ready to trade coins for Royal Treasures?
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setActiveTab('vault');
                  }}
                  className="min-h-[40px] px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-amber-300 flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Open Castle Vault</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'blitz' && (
          <SnowbullyArenaView
            selectedTables={saveState.selectedTables}
            difficulty={saveState.difficulty}
            onToggleTable={handleToggleTable}
            onSelectPreset={handleSelectPresetTables}
            onCompleteBlitz={handleCompleteBlitz}
          />
        )}

        {activeTab === 'vault' && (
          <CastleVaultView
            coins={saveState.coins}
            snowballs={saveState.snowballs}
            unlockedIds={saveState.unlockedTreasures}
            onUnlockTreasure={handleUnlockTreasure}
          />
        )}

        {activeTab === 'matrix' && (
          <MasteryMatrixView
            factMastery={saveState.factMastery}
            tableStats={saveState.tableStats}
            totalQuestionsAnswered={saveState.totalQuestionsAnswered}
            totalFirstTryCorrect={saveState.totalFirstTryCorrect}
            onStartTargetedDrill={handleStartTargetedDrill}
            onResetProgress={handleResetProgress}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Navigation Tab Bar (Ergonomic Thumb Zone) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 items-center px-2"
      >
        <button
          type="button"
          onClick={() => {
            sound.playTap();
            setActiveTab('mountain');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'mountain' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Mountain className="h-5 w-5" />
          <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
            Mountain
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playTap();
            setActiveTab('blitz');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'blitz' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Sparkles className="h-5 w-5" />
          <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
            Net Blitz
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playTap();
            setActiveTab('vault');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'vault' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Trophy className="h-5 w-5" />
          <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
            Vault ({saveState.unlockedTreasures.length})
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playTap();
            setActiveTab('matrix');
          }}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-xl transition-colors ${
            activeTab === 'matrix' ? 'text-amber-400' : 'text-slate-400'
          }`}
        >
          <Grid className="h-5 w-5" />
          <span className="text-[11px] font-medium tracking-tight mt-0.5 whitespace-nowrap">
            12×12 Log
          </span>
        </button>
      </nav>

      {/* Active Multiplication Outpost Drill Modal */}
      {activeStation && (
        <MathDrillModal
          station={activeStation}
          selectedTables={saveState.selectedTables}
          difficulty={saveState.difficulty}
          onClose={() => setActiveStation(null)}
          onCompleteExpedition={handleCompleteExpedition}
        />
      )}

      {/* Audio & Volume Settings Modal */}
      {isAudioSettingsOpen && (
        <AudioSettingsModal
          musicVolume={saveState.musicVolume}
          sfxVolume={saveState.sfxVolume}
          mutedAll={saveState.mutedAll}
          onChangeMusicVolume={handleChangeMusicVolume}
          onChangeSfxVolume={handleChangeSfxVolume}
          onToggleMuteAll={handleToggleMuteAll}
          onClose={() => setIsAudioSettingsOpen(false)}
        />
      )}
    </div>
  );
}
