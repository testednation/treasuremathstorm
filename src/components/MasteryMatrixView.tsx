import React, { useState } from 'react';
import {
  CheckCircle2,
  Play,
  Sparkles,
  RotateCcw,
  Crown,
  Shield,
  Award,
  Lock,
  Timer,
  Target,
} from 'lucide-react';
import {
  TableBadgeInfo,
  TableBadgeTier,
  TablePerformanceStat,
  computeTableBadge,
} from '../data/gameData';
import { sound } from '../utils/sound';

interface MasteryMatrixViewProps {
  factMastery: Record<string, number>; // key: "a-b", value: times answered correctly on first try
  tableStats: Record<number, TablePerformanceStat>;
  totalQuestionsAnswered: number;
  totalFirstTryCorrect: number;
  onStartTargetedDrill: (tableNum: number) => void;
  onResetProgress: () => void;
}

const BADGE_VISUALS: Record<
  TableBadgeTier,
  {
    title: string;
    borderClass: string;
    bgClass: string;
    textClass: string;
    iconBgClass: string;
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  expert: {
    title: 'Expert',
    borderClass: 'border-amber-400/70',
    bgClass: 'bg-slate-900',
    textClass: 'text-amber-300',
    iconBgClass: 'bg-amber-400/20 border-amber-400/50 text-amber-300',
    Icon: Crown,
  },
  proficient: {
    title: 'Proficient',
    borderClass: 'border-sky-400/60',
    bgClass: 'bg-slate-900',
    textClass: 'text-sky-300',
    iconBgClass: 'bg-sky-400/20 border-sky-400/50 text-sky-300',
    Icon: Shield,
  },
  novice: {
    title: 'Novice',
    borderClass: 'border-orange-400/50',
    bgClass: 'bg-slate-900',
    textClass: 'text-orange-300',
    iconBgClass: 'bg-orange-400/20 border-orange-400/40 text-orange-300',
    Icon: Award,
  },
  unranked: {
    title: 'Unranked',
    borderClass: 'border-slate-800',
    bgClass: 'bg-slate-900/60',
    textClass: 'text-slate-400',
    iconBgClass: 'bg-slate-950 border-slate-800 text-slate-500',
    Icon: Lock,
  },
};

export const MasteryMatrixView: React.FC<MasteryMatrixViewProps> = ({
  factMastery,
  tableStats,
  totalQuestionsAnswered,
  totalFirstTryCorrect,
  onStartTargetedDrill,
  onResetProgress,
}) => {
  const [selectedCell, setSelectedCell] = useState<{ a: number; b: number }>({
    a: 5,
    b: 6,
  });
  const [badgeFilter, setBadgeFilter] = useState<'all' | TableBadgeTier>('all');
  const [confirmReset, setConfirmReset] = useState(false);

  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const badgeByTable: Record<number, TableBadgeInfo> = {};
  numbers.forEach((n) => {
    badgeByTable[n] = computeTableBadge(tableStats[n]);
  });

  const expertCount = numbers.filter((n) => badgeByTable[n].tier === 'expert').length;
  const proficientCount = numbers.filter(
    (n) => badgeByTable[n].tier === 'proficient'
  ).length;
  const noviceCount = numbers.filter((n) => badgeByTable[n].tier === 'novice').length;

  const getMasteryCount = (a: number, b: number) => {
    const key1 = `${a}-${b}`;
    const key2 = `${b}-${a}`;
    return (factMastery[key1] || 0) + (a !== b ? factMastery[key2] || 0 : 0);
  };

  const masteredCellsCount = numbers.reduce((acc, a) => {
    return acc + numbers.filter((b) => getMasteryCount(a, b) > 0).length;
  }, 0);

  const accuracyPercent =
    totalQuestionsAnswered > 0
      ? Math.round((totalFirstTryCorrect / totalQuestionsAnswered) * 100)
      : 100;

  const currentCount = getMasteryCount(selectedCell.a, selectedCell.b);
  const selectedTableBadge = badgeByTable[selectedCell.a];
  const selectedVisual = BADGE_VISUALS[selectedTableBadge.tier];
  const SelectedBadgeIcon = selectedVisual.Icon;

  const filteredTables =
    badgeFilter === 'all'
      ? numbers
      : numbers.filter((n) => badgeByTable[n].tier === badgeFilter);

  return (
    <div className="space-y-6">
      {/* Section 1: Visual Table Mastery Badges Showcase */}
      <section className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Speed & Accuracy Honors</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-amber-300">
                {expertCount} Expert
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-sky-300">
                {proficientCount} Proficient
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-orange-300">
                {noviceCount} Novice
              </span>
            </div>
            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white">
              Multiplication Table Mastery Badges
            </h2>
            <p className="mt-1 text-xs text-slate-400 max-w-2xl">
              Earn Novice (3+ solves, ≥50% accuracy), Proficient (5+ solves, ≥75% accuracy, ≤7.0s speed), and Expert (8+ solves, ≥90% accuracy, ≤4.5s speed) badges for each multiplication table.
            </p>
          </div>

          {/* Interactive Tier Filter Buttons */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto max-w-full">
            {(
              [
                { id: 'all', label: 'All (12)' },
                { id: 'expert', label: `Expert (${expertCount})` },
                { id: 'proficient', label: `Proficient (${proficientCount})` },
                { id: 'novice', label: `Novice (${noviceCount})` },
                { id: 'unranked', label: 'Unranked' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  sound.playTap();
                  setBadgeFilter(tab.id);
                }}
                className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  badgeFilter === tab.id
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 12-Table Badge Cards Grid */}
        {filteredTables.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No multiplication tables in this badge tier yet. Select a table below and start a drill to earn your badge!
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredTables.map((tableNum) => {
              const info = badgeByTable[tableNum];
              const vis = BADGE_VISUALS[info.tier];
              const BadgeIcon = vis.Icon;
              const isSelectedRow = selectedCell.a === tableNum;

              return (
                <div
                  key={tableNum}
                  onClick={() => {
                    sound.playTap();
                    setSelectedCell((prev) => ({ a: tableNum, b: prev.b }));
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedCell((prev) => ({ a: tableNum, b: prev.b }));
                    }
                  }}
                  className={`rounded-2xl p-3.5 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelectedRow
                      ? 'bg-slate-950 border-amber-400 shadow-md'
                      : `bg-slate-950/70 hover:bg-slate-950 ${vis.borderClass}`
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-mono text-lg font-extrabold text-white tabular-nums">
                        {tableNum}× Table
                      </span>
                      <div
                        className={`h-8 w-8 rounded-xl border flex items-center justify-center shrink-0 ${vis.iconBgClass}`}
                      >
                        <BadgeIcon className="h-4 w-4" />
                      </div>
                    </div>

                    <div className={`mt-2 text-xs font-bold ${vis.textClass}`}>
                      {info.label} Badge
                    </div>

                    <div className="mt-1.5 flex items-center gap-1.5 text-[11px] font-mono tabular-nums text-slate-400">
                      <span>{info.attempts > 0 ? `${info.accuracyPercent}%` : '—%'}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {info.avgTimeSeconds !== null ? `${info.avgTimeSeconds}s` : '—s'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playTap();
                      onStartTargetedDrill(tableNum);
                    }}
                    className="mt-3 w-full min-h-[34px] rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-slate-200 hover:text-amber-300 transition-colors flex items-center justify-center gap-1 whitespace-nowrap"
                  >
                    <Play className="h-3 w-3 fill-current" />
                    <span>Drill {tableNum}×</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Section 2: Selected Table Badge Inspector + 12×12 Crystal Multiplication Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Selected Table Badge Progression & Fact Inspector */}
        <div className="lg:col-span-4 space-y-4">
          {/* Active Table Badge Progression Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">
                  {selectedCell.a}× Table Badge Status
                </div>
                <h3 className="mt-0.5 text-xl font-bold text-white flex items-center gap-2">
                  <span>{selectedCell.a}× {selectedTableBadge.label}</span>
                </h3>
              </div>
              <div
                className={`h-12 w-12 rounded-2xl border flex items-center justify-center shrink-0 ${selectedVisual.iconBgClass}`}
              >
                <SelectedBadgeIcon className="h-6 w-6" />
              </div>
            </div>

            {/* Speed & Accuracy Metrics for Selected Table */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-950 border border-slate-800 p-3 text-center">
              <div>
                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Target className="h-3 w-3 text-emerald-400" />
                  <span>Accuracy</span>
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold text-emerald-400 tabular-nums">
                  {selectedTableBadge.attempts > 0
                    ? `${selectedTableBadge.accuracyPercent}%`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
                  <Timer className="h-3 w-3 text-cyan-300" />
                  <span>Avg Speed</span>
                </div>
                <div className="mt-0.5 font-mono text-sm font-bold text-cyan-300 tabular-nums">
                  {selectedTableBadge.avgTimeSeconds !== null
                    ? `${selectedTableBadge.avgTimeSeconds}s`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-slate-400">Solves</div>
                <div className="mt-0.5 font-mono text-sm font-bold text-amber-300 tabular-nums">
                  {selectedTableBadge.attempts}
                </div>
              </div>
            </div>

            {/* 3-Tier Badge Ladder */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-orange-300" />
                  <span>Novice</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  3+ solves · ≥50% acc
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-sky-300" />
                  <span>Proficient</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  5+ solves · ≥75% · ≤7.0s
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Crown className="h-3.5 w-3.5 text-amber-300" />
                  <span>Expert</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                  8+ solves · ≥90% · ≤4.5s
                </span>
              </div>
            </div>

            <p className="mt-3 pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed">
              {selectedTableBadge.nextRequirementText}
            </p>

            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onStartTargetedDrill(selectedCell.a);
              }}
              className="mt-4 w-full min-h-[46px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>
                {selectedTableBadge.nextTierLabel
                  ? `Train ${selectedCell.a}× for ${selectedTableBadge.nextTierLabel} Badge`
                  : `Practice ${selectedCell.a}× Expert Table`}
              </span>
            </button>
          </div>

          {/* Selected Cell Inspector */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
            <p className="text-xs text-slate-400">Selected Matrix Cell</p>
            <div className="mt-1 font-display font-mono text-3xl font-extrabold text-amber-400 tabular-nums">
              {selectedCell.a} × {selectedCell.b} = {selectedCell.a * selectedCell.b}
            </div>

            <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
              <span>
                {selectedCell.a} groups of {selectedCell.b}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-emerald-400">
                {currentCount > 0 ? `Solved ${currentCount}×` : 'Not practiced yet'}
              </span>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Skip-counting trail for {selectedCell.a} × {selectedCell.b}:
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-xs tabular-nums text-sky-300">
                {Array.from({ length: selectedCell.a }).map((_, idx) => {
                  const stepVal = (idx + 1) * selectedCell.b;
                  const isLast = idx === selectedCell.a - 1;
                  return (
                    <React.Fragment key={idx}>
                      <span className={isLast ? 'font-bold text-amber-300 underline' : ''}>
                        {stepVal}
                      </span>
                      {!isLast && <span className="text-slate-600">·</span>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Overall Logbook Summary */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Expedition Telemetry</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
                <div className="text-xs text-slate-400">Grid Facts Thawed</div>
                <div className="mt-1 font-mono text-xl font-bold text-emerald-400 tabular-nums">
                  {masteredCellsCount}/144
                </div>
              </div>
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
                <div className="text-xs text-slate-400">Overall Accuracy</div>
                <div className="mt-1 font-mono text-xl font-bold text-sky-400 tabular-nums">
                  {accuracyPercent}%
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="min-h-[40px] text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Explorer Save Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full justify-between">
                  <span className="text-xs text-rose-400">Reset all progress?</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmReset(false)}
                      className="min-h-[36px] px-3 rounded-lg bg-slate-800 text-xs text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onResetProgress();
                        setConfirmReset(false);
                      }}
                      className="min-h-[36px] px-3 rounded-lg bg-rose-500 text-xs font-bold text-white"
                    >
                      Confirm Reset
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right / Main Column: 12×12 Interactive Multiplication Chart with Row Badge Indicators */}
        <div className="lg:col-span-8 rounded-3xl bg-slate-900 border border-slate-800 p-4 sm:p-6 overflow-x-auto">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                12×12 Crystal Multiplication Matrix
              </h2>
              <p className="text-xs text-slate-400">
                Row headers display each table’s current badge emblem. Tap any cell to inspect its factors and speed stats.
              </p>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 shrink-0">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Thawed Fact</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                <span>Selected</span>
              </span>
            </div>
          </div>

          <div className="min-w-[540px]">
            <div className="grid grid-cols-13 gap-1 font-mono text-xs tabular-nums">
              {/* Top-left corner header */}
              <div className="h-9 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center font-bold text-amber-400">
                ×
              </div>
              {numbers.map((col) => (
                <div
                  key={`col-${col}`}
                  className={`h-9 rounded-lg border flex items-center justify-center font-bold ${
                    selectedCell.b === col
                      ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {col}
                </div>
              ))}

              {/* Matrix Rows with Table Badge Emblem Indicator */}
              {numbers.map((row) => {
                const rowBadge = badgeByTable[row];
                const RowBadgeIcon = BADGE_VISUALS[rowBadge.tier].Icon;

                return (
                  <React.Fragment key={`row-${row}`}>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setSelectedCell((prev) => ({ a: row, b: prev.b }));
                      }}
                      title={`${row}× Table: ${rowBadge.label}`}
                      className={`h-9 rounded-lg border flex items-center justify-center gap-0.5 font-bold transition-colors ${
                        selectedCell.a === row
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span>{row}</span>
                      {rowBadge.tier !== 'unranked' && (
                        <RowBadgeIcon
                          className={`h-3 w-3 shrink-0 ${BADGE_VISUALS[rowBadge.tier].textClass}`}
                        />
                      )}
                    </button>

                    {numbers.map((col) => {
                      const prod = row * col;
                      const count = getMasteryCount(row, col);
                      const isSelected =
                        selectedCell.a === row && selectedCell.b === col;
                      const isAxisHighlight =
                        selectedCell.a === row || selectedCell.b === col;

                      return (
                        <button
                          key={`${row}-${col}`}
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            setSelectedCell({ a: row, b: col });
                          }}
                          className={`h-9 rounded-lg border font-mono text-xs tabular-nums transition-all flex items-center justify-center ${
                            isSelected
                              ? 'bg-amber-400 text-slate-950 font-extrabold border-amber-300 scale-105 z-10'
                              : count > 0
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold hover:border-emerald-400'
                                : isAxisHighlight
                                  ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                                  : 'bg-slate-950/70 border-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          {prod}
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
