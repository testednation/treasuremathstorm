import React, { useState, useCallback } from 'react';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  CheckCircle2,
  Coins,
  Snowflake,
  ShieldAlert,
} from 'lucide-react';
import { DifficultyTier, HERO_IMAGES } from '../data/gameData';
import { sound } from '../utils/sound';

interface SnowbullyTarget {
  id: string;
  value: number;
  lane: string;
  isCorrect: boolean;
}

interface SnowbullyArenaViewProps {
  selectedTables: number[];
  difficulty: DifficultyTier;
  onToggleTable: (table: number) => void;
  onSelectPreset: (tables: number[]) => void;
  onCompleteBlitz: (
    coinsEarned: number,
    snowballsEarned: number,
    caughtCount: number,
    factResults: Array<{ a: number; b: number; correct: boolean; timeMs: number }>
  ) => void;
}

function buildBlitzWave(selectedTables: number[], difficulty: DifficultyTier) {
  const pool = selectedTables.length > 0 ? selectedTables : [2, 3, 4, 5, 6, 7, 8, 9];
  const a = pool[Math.floor(Math.random() * pool.length)];
  const maxB = difficulty === 'apprentice' ? 6 : difficulty === 'explorer' ? 10 : 12;
  const b = Math.floor(Math.random() * (maxB - 1)) + 2;
  const product = a * b;

  const lanes = [
    'Frost Pine Ridge',
    'Icicle Bridge',
    'Misty Boulder',
    'Glacier Arch',
  ];

  const wrongSet = new Set<number>();
  const deltas = [a, -a, b, -b, 3, -3, 6, -4, 8];
  for (const d of deltas) {
    if (wrongSet.size >= 3) break;
    const candidate = product + d;
    if (candidate > 1 && candidate !== product) {
      wrongSet.add(candidate);
    }
  }
  while (wrongSet.size < 3) {
    const c = Math.max(2, product + Math.floor(Math.random() * 15) - 7);
    if (c !== product) wrongSet.add(c);
  }

  const values = [product, ...Array.from(wrongSet)].sort(() => Math.random() - 0.5);
  const targets: SnowbullyTarget[] = values.map((val, idx) => ({
    id: `bully-${idx}-${val}`,
    value: val,
    lane: lanes[idx],
    isCorrect: val === product,
  }));

  return {
    factorA: a,
    factorB: b,
    product,
    targets,
  };
}

export const SnowbullyArenaView: React.FC<SnowbullyArenaViewProps> = ({
  selectedTables,
  difficulty,
  onToggleTable,
  onSelectPreset,
  onCompleteBlitz,
}) => {
  const [waveIndex, setWaveIndex] = useState(1);
  const TOTAL_WAVES = 6;
  const [wave, setWave] = useState(() => buildBlitzWave(selectedTables, difficulty));
  const [waveStartTime, setWaveStartTime] = useState<number>(() => Date.now());
  const [caughtCount, setCaughtCount] = useState(0);
  const [sessionCoins, setSessionCoins] = useState(0);
  const [sessionSnowballs, setSessionSnowballs] = useState(0);
  const [wrongTargetIds, setWrongTargetIds] = useState<string[]>([]);
  const [caughtTargetId, setCaughtTargetId] = useState<string | null>(null);
  const [factLog, setFactLog] = useState<
    Array<{ a: number; b: number; correct: boolean; timeMs: number }>
  >([]);
  const [completed, setCompleted] = useState(false);

  const startFreshBlitz = useCallback(() => {
    sound.playTap();
    setWaveIndex(1);
    setCaughtCount(0);
    setSessionCoins(0);
    setSessionSnowballs(0);
    setWrongTargetIds([]);
    setCaughtTargetId(null);
    setFactLog([]);
    setCompleted(false);
    setWave(buildBlitzWave(selectedTables, difficulty));
    setWaveStartTime(Date.now());
  }, [selectedTables, difficulty]);

  const handleSwingNet = (target: SnowbullyTarget) => {
    if (caughtTargetId) return;

    if (target.isCorrect) {
      sound.playNetCatch();
      setCaughtTargetId(target.id);
      const responseTimeMs = Math.min(30000, Math.max(300, Date.now() - waveStartTime));
      const firstAttempt = wrongTargetIds.length === 0;
      const coinAdd = firstAttempt ? 12 : 6;
      const snowAdd = firstAttempt ? 3 : 1;
      const nextCaught = caughtCount + (firstAttempt ? 1 : 0);
      const nextCoins = sessionCoins + coinAdd;
      const nextSnow = sessionSnowballs + snowAdd;
      const nextLog = [
        ...factLog,
        {
          a: wave.factorA,
          b: wave.factorB,
          correct: firstAttempt,
          timeMs: responseTimeMs,
        },
      ];

      setCaughtCount(nextCaught);
      setSessionCoins(nextCoins);
      setSessionSnowballs(nextSnow);
      setFactLog(nextLog);

      setTimeout(() => {
        if (waveIndex >= TOTAL_WAVES) {
          sound.playTreasureUnlock();
          setCompleted(true);
          onCompleteBlitz(nextCoins, nextSnow, nextCaught, nextLog);
        } else {
          setWaveIndex((w) => w + 1);
          setWrongTargetIds([]);
          setCaughtTargetId(null);
          setWave(buildBlitzWave(selectedTables, difficulty));
          setWaveStartTime(Date.now());
        }
      }, 550);
    } else {
      sound.playHintOrMiss();
      if (!wrongTargetIds.includes(target.id)) {
        setWrongTargetIds((prev) => [...prev, target.id]);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left / Top Column: Multiplication Table Selector */}
      <div className="lg:col-span-5 rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-slate-400">Custom Drill Deck</p>
            <h2 className="text-lg font-bold text-white">Active Times Tables</h2>
          </div>
          <div className="flex items-center gap-1 rounded-lg bg-slate-950 p-1 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onSelectPreset([2, 3, 4, 5]);
              }}
              className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              2×–5×
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onSelectPreset([6, 7, 8, 9]);
              }}
              className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              6×–9×
            </button>
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                onSelectPreset([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
              }}
              className="min-h-[36px] px-2.5 py-1 text-xs font-medium text-amber-300 hover:text-amber-200 rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              All 1–12
            </button>
          </div>
        </div>

        <p className="mt-2 text-xs text-slate-400">
          Tap any multiplier below to customize which tables appear in your mountain drills and Snowbully catches.
        </p>

        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((tableNum) => {
            const active = selectedTables.includes(tableNum);
            return (
              <button
                key={tableNum}
                type="button"
                onClick={() => {
                  sound.playTap();
                  onToggleTable(tableNum);
                }}
                className={`min-h-[48px] rounded-xl font-mono text-sm font-bold tabular-nums transition-all border ${
                  active
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                {tableNum}×
              </button>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Selected Tables</span>
          <span className="font-mono text-slate-200 tabular-nums">
            {selectedTables.slice().sort((a, b) => a - b).join(', ')}×
          </span>
        </div>
      </div>

      {/* Right / Main Column: Snowbully Net-Catch Arena */}
      <div className="lg:col-span-7 rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Snowbully Net-Catch Blitz</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-sky-400">
                Patrol {waveIndex}/{TOTAL_WAVES}
              </span>
            </div>
            <h2 className="mt-0.5 text-xl font-bold text-white">
              Swing Your Golden Net!
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
            <span className="flex items-center gap-1 text-amber-400">
              <Coins className="h-4 w-4" />
              +{sessionCoins}
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 text-sky-400">
              <Snowflake className="h-4 w-4" />
              +{sessionSnowballs}
            </span>
          </div>
        </div>

        {completed ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-2xl overflow-hidden border border-sky-400/40 bg-slate-800">
              <img
                src={HERO_IMAGES.snowbully}
                alt="Snowbully Caught"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-white">
              Patrol Complete! {caughtCount} Snowbullies Caught!
            </h3>
            <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
              Your golden net cleared the trail and added +{sessionCoins} Gold Coins and +{sessionSnowballs} Snowballs to your pack!
            </p>
            <button
              type="button"
              onClick={startFreshBlitz}
              className="mt-6 min-h-[48px] px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm inline-flex items-center gap-2 active:scale-[0.98] transition-all whitespace-nowrap"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Start New Net Patrol</span>
            </button>
          </div>
        ) : (
          <>
            {/* Target Equation Banner */}
            <div className="mt-4 rounded-2xl bg-slate-950 border border-slate-800 p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-xs text-slate-400">
                  Catch the Snowbully holding the product of:
                </div>
                <div className="mt-1 font-display font-mono text-3xl sm:text-4xl font-extrabold text-amber-400 tabular-nums">
                  {wave.factorA} × {wave.factorB} = ?
                </div>
              </div>
              <div className="h-16 w-16 rounded-2xl overflow-hidden border border-slate-800 shrink-0 bg-slate-900">
                <img
                  src={HERO_IMAGES.explorer}
                  alt="Explorer with Net"
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>

            {/* 4 Snowbully Target Cards */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              {wave.targets.map((target) => {
                const isMissed = wrongTargetIds.includes(target.id);
                const isCaught = caughtTargetId === target.id;

                return (
                  <button
                    key={target.id}
                    type="button"
                    disabled={isMissed || Boolean(caughtTargetId)}
                    onClick={() => handleSwingNet(target)}
                    className={`min-h-[104px] rounded-2xl p-3.5 text-left border transition-all flex flex-col justify-between ${
                      isCaught
                        ? 'bg-emerald-500/20 border-emerald-400 scale-[1.02]'
                        : isMissed
                          ? 'bg-slate-950/50 border-slate-800/60 opacity-45 cursor-not-allowed'
                          : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 hover:border-sky-400/50 active:scale-[0.98]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="text-xs text-slate-400 truncate">
                        {target.lane}
                      </span>
                      <div className="h-8 w-8 rounded-lg overflow-hidden border border-slate-700 shrink-0">
                        <img
                          src={HERO_IMAGES.snowbully}
                          alt="Snowbully"
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between w-full">
                      <span className="font-mono text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
                        {target.value}
                      </span>
                      {isCaught && (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          Caught!
                        </span>
                      )}
                      {isMissed && (
                        <span className="text-xs text-rose-400 flex items-center gap-1">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Decoy
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
