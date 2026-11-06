import React, { useState } from 'react';
import {
  Compass,
  Flame,
  Trophy,
  Hourglass,
  Pickaxe,
  Bird,
  Wand2,
  Shield,
  Bell,
  Crown,
  KeyRound,
  Gem,
  Lock,
  CheckCircle2,
  Coins,
  Sparkles,
} from 'lucide-react';
import {
  EXPLORER_RANKS,
  HERO_IMAGES,
  TREASURE_VAULT_ITEMS,
  TreasureItem,
} from '../data/gameData';
import { sound } from '../utils/sound';

interface CastleVaultViewProps {
  coins: number;
  snowballs: number;
  unlockedIds: string[];
  onUnlockTreasure: (item: TreasureItem) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  Flame,
  Trophy,
  Hourglass,
  Pickaxe,
  Bird,
  Wand2,
  Shield,
  Bell,
  Crown,
  KeyRound,
  Gem,
};

export const CastleVaultView: React.FC<CastleVaultViewProps> = ({
  coins,
  snowballs,
  unlockedIds,
  onUnlockTreasure,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [selectedTreasure, setSelectedTreasure] = useState<TreasureItem | null>(null);

  const unlockedCount = unlockedIds.length;
  const totalCount = TREASURE_VAULT_ITEMS.length;
  const thawPercent = Math.round((unlockedCount / totalCount) * 100);

  // Determine current and next rank
  const currentRank =
    [...EXPLORER_RANKS]
      .reverse()
      .find((r) => unlockedCount >= r.minTreasures) || EXPLORER_RANKS[0];

  const nextRank = EXPLORER_RANKS.find((r) => r.minTreasures > unlockedCount);

  const categories = ['All', 'Alpine Gear', 'Royal Relic', 'Crystal Artifact', 'Crown Jewel'];
  const visibleTreasures =
    filterCategory === 'All'
      ? TREASURE_VAULT_ITEMS
      : TREASURE_VAULT_ITEMS.filter((item) => item.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Top Castle Rank & Mountain Thaw Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <span>{currentRank.badgeText}</span>
              <span aria-hidden="true">·</span>
              <span>Golden Castle Sanctuary</span>
            </div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-white text-balance">
              {currentRank.title}
            </h2>
            <p className="mt-2 text-sm text-slate-300 leading-relaxed">
              {currentRank.perkDescription}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                Mountain Spring Thaw Progress
              </span>
              <span className="font-mono font-bold tabular-nums text-emerald-400">
                {unlockedCount}/{totalCount} Treasures · {thawPercent}% Thawed
              </span>
            </div>
            <div className="mt-2 h-3 w-full rounded-full bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-transform duration-300 origin-left"
                style={{ transform: `scaleX(${Math.max(0.04, unlockedCount / totalCount)})` }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-400">
              {nextRank
                ? `Unlock ${nextRank.minTreasures - unlockedCount} more treasure${
                    nextRank.minTreasures - unlockedCount === 1 ? '' : 's'
                  } to reach ${nextRank.title}!`
                : 'Maximum Rank Achieved! You have broken the Master of Mischief’s spell!'}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 flex items-center gap-4">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden border border-amber-400/30 shrink-0 bg-slate-950">
            <img
              src={HERO_IMAGES.chest}
              alt="Royal Treasure Chest"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-slate-400">Expedition Treasury</div>
            <div className="mt-1 font-mono text-2xl sm:text-3xl font-extrabold text-amber-400 tabular-nums flex items-center gap-1.5">
              <Coins className="h-6 w-6 shrink-0" />
              <span>{coins}</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
              Spend Gold Coins earned from multiplication drills to restore stolen treasures to the Castle Vault. Total Snowballs banked: <span className="font-mono text-sky-400 tabular-nums">{snowballs}</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Category Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 overflow-x-auto max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                sound.playTap();
                setFilterCategory(cat);
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                filterCategory === cat
                  ? 'bg-amber-400 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="text-xs text-slate-400 font-mono tabular-nums">
          Showing {visibleTreasures.length} items
        </div>
      </div>

      {/* Treasure Vault Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleTreasures.map((item) => {
          const isUnlocked = unlockedIds.includes(item.id);
          const canAfford = coins >= item.costCoins;
          const IconComponent = ICON_MAP[item.iconName] || Gem;

          return (
            <div
              key={item.id}
              onClick={() => {
                sound.playTap();
                setSelectedTreasure(item);
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  setSelectedTreasure(item);
                }
              }}
              className={`rounded-2xl p-5 border transition-all text-left flex flex-col justify-between cursor-pointer ${
                isUnlocked
                  ? 'bg-slate-900 border-amber-400/40 hover:border-amber-400'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`h-12 w-12 rounded-2xl flex items-center justify-center border ${
                      isUnlocked
                        ? 'bg-slate-950 border-amber-400/40'
                        : 'bg-slate-950 border-slate-800'
                    }`}
                  >
                    <IconComponent
                      className={`h-6 w-6 ${
                        isUnlocked ? item.accentColor : 'text-slate-500'
                      }`}
                    />
                  </div>

                  <div className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span>{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums text-slate-300">
                      {item.tableFocus}
                    </span>
                  </div>
                </div>

                <h3 className="mt-4 text-base font-bold text-white">
                  {item.name}
                </h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  {item.lore}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                {isUnlocked ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Restored to Vault</span>
                  </span>
                ) : (
                  <span className="font-mono text-xs font-bold tabular-nums text-amber-400 flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5" />
                    {item.costCoins} Gold Coins
                  </span>
                )}

                {!isUnlocked && (
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (canAfford) {
                        sound.playTreasureUnlock();
                        onUnlockTreasure(item);
                      }
                    }}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                      canAfford
                        ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 active:scale-[0.97]'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>Unlock</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        <span>Need {item.costCoins - coins} more</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Treasure Inspector Modal */}
      {selectedTreasure && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedTreasure(null)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const IconComp = ICON_MAP[selectedTreasure.iconName] || Gem;
              const isOwned = unlockedIds.includes(selectedTreasure.id);
              const affordable = coins >= selectedTreasure.costCoins;

              return (
                <>
                  <div className="flex items-center gap-3.5">
                    <div className="h-14 w-14 rounded-2xl bg-slate-950 border border-amber-400/40 flex items-center justify-center shrink-0">
                      <IconComp className={`h-7 w-7 ${selectedTreasure.accentColor}`} />
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">
                        {selectedTreasure.category} · {selectedTreasure.tableFocus}
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedTreasure.name}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                    {selectedTreasure.lore}
                  </p>

                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedTreasure(null)}
                      className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 whitespace-nowrap"
                    >
                      Close
                    </button>
                    {!isOwned && (
                      <button
                        type="button"
                        disabled={!affordable}
                        onClick={() => {
                          if (affordable) {
                            sound.playTreasureUnlock();
                            onUnlockTreasure(selectedTreasure);
                            setSelectedTreasure(null);
                          }
                        }}
                        className="min-h-[44px] px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-xs font-bold text-slate-950 whitespace-nowrap"
                      >
                        Unlock for {selectedTreasure.costCoins} Coins
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};
