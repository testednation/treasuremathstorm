import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Lightbulb,
  CheckCircle2,
  X,
  Delete,
  CornerDownLeft,
  Flame,
  Coins,
  Snowflake,
  Grid,
  Calculator,
  Timer,
} from 'lucide-react';
import { DifficultyTier, HERO_IMAGES, MountainStation } from '../data/gameData';
import { sound } from '../utils/sound';

export interface MathQuestion {
  factorA: number;
  factorB: number;
  product: number;
  missingMode: boolean; // if true, ask factorA × ? = product
  correctAnswer: number;
  choices: number[];
  promptText: string;
  storyContext: string;
}

interface MathDrillModalProps {
  station: MountainStation;
  selectedTables: number[];
  difficulty: DifficultyTier;
  onClose: () => void;
  onCompleteExpedition: (results: {
    stationId: string;
    correctCount: number;
    totalQuestions: number;
    earnedCoins: number;
    earnedSnowballs: number;
    masteredFacts: Array<{ a: number; b: number; correct: boolean; timeMs: number }>;
  }) => void;
}

function generateQuestion(
  station: MountainStation,
  selectedTables: number[],
  difficulty: DifficultyTier
): MathQuestion {
  const pool =
    selectedTables.length > 0
      ? selectedTables
      : difficulty === 'apprentice'
        ? [1, 2, 3, 4, 5]
        : difficulty === 'explorer'
          ? [2, 3, 4, 5, 6, 7, 8, 9]
          : [3, 4, 6, 7, 8, 9, 11, 12];

  const factorA = pool[Math.floor(Math.random() * pool.length)];
  const maxB = difficulty === 'apprentice' ? 6 : difficulty === 'explorer' ? 10 : 12;
  const minB = difficulty === 'apprentice' ? 1 : 2;
  const factorB = Math.floor(Math.random() * (maxB - minB + 1)) + minB;
  const product = factorA * factorB;

  const missingMode =
    (station.type === 'ice_ladder' || difficulty === 'master') && Math.random() > 0.45;

  const correctAnswer = missingMode ? factorB : product;

  // Generate 3 plausible distractors
  const choiceSet = new Set<number>([correctAnswer]);
  const offsets = missingMode
    ? [-2, -1, 1, 2, 3, -3]
    : [factorA, -factorA, factorB, -factorB, 2, -2, 5, -4, 10];

  for (const offset of offsets) {
    if (choiceSet.size >= 4) break;
    const candidate = correctAnswer + offset;
    if (candidate > 0 && candidate !== correctAnswer) {
      choiceSet.add(candidate);
    }
  }
  while (choiceSet.size < 4) {
    const fallback = Math.max(1, correctAnswer + Math.floor(Math.random() * 11) - 5);
    if (fallback !== correctAnswer) choiceSet.add(fallback);
  }

  const choices = Array.from(choiceSet).sort(() => Math.random() - 0.5);

  let storyContext = '';
  if (station.type === 'gold_room') {
    storyContext = `${factorA} wooden crates with ${factorB} gold bars in each crate.`;
  } else if (station.type === 'time_igloo') {
    storyContext = `${factorA} clock gear turns of ${factorB} minutes each.`;
  } else if (station.type === 'crystal_cavern') {
    storyContext = `${factorA} glowing rows with ${factorB} sapphire crystals per row.`;
  } else if (station.type === 'snowbully_patrol') {
    storyContext = `Catch the Snowbully carrying ${factorA} bags of ${factorB} snowballs!`;
  } else {
    storyContext = missingMode
      ? `Each ice step needs ${factorA} blocks to reach ${product} total blocks.`
      : `${factorA} flights of ${factorB} carved ice steps.`;
  }

  const promptText = missingMode
    ? `${factorA} × ? = ${product}`
    : `${factorA} × ${factorB} = ?`;

  return {
    factorA,
    factorB,
    product,
    missingMode,
    correctAnswer,
    choices,
    promptText,
    storyContext,
  };
}

export const MathDrillModal: React.FC<MathDrillModalProps> = ({
  station,
  selectedTables,
  difficulty,
  onClose,
  onCompleteExpedition,
}) => {
  const TOTAL_ROUNDS = 5;
  const [round, setRound] = useState(1);
  const [question, setQuestion] = useState<MathQuestion>(() =>
    generateQuestion(station, selectedTables, difficulty)
  );
  const [questionStartTime, setQuestionStartTime] = useState<number>(() => Date.now());
  const [elapsedTenths, setElapsedTenths] = useState<number>(0);
  const [inputMode, setInputMode] = useState<'choices' | 'keypad'>('choices');
  const [keypadValue, setKeypadValue] = useState<string>('');
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<'idle' | 'correct' | 'retry'>('idle');
  const [selectedWrong, setSelectedWrong] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [correctFirstTryCount, setCorrectFirstTryCount] = useState(0);
  const [earnedCoins, setEarnedCoins] = useState(0);
  const [earnedSnowballs, setEarnedSnowballs] = useState(0);
  const [factLog, setFactLog] = useState<
    Array<{ a: number; b: number; correct: boolean; timeMs: number }>
  >([]);
  const [isSummary, setIsSummary] = useState(false);

  // Live gentle stopwatch for response speed badge telemetry
  useEffect(() => {
    if (isSummary || feedback === 'correct') return;
    const interval = window.setInterval(() => {
      setElapsedTenths(Math.floor((Date.now() - questionStartTime) / 100));
    }, 100);
    return () => window.clearInterval(interval);
  }, [questionStartTime, isSummary, feedback]);

  const nextRoundOrFinish = useCallback(
    (
      updatedCorrect: number,
      updatedCoins: number,
      updatedSnowballs: number,
      updatedLog: Array<{ a: number; b: number; correct: boolean; timeMs: number }>
    ) => {
      if (round >= TOTAL_ROUNDS) {
        sound.playTreasureUnlock();
        setIsSummary(true);
        return;
      }
      setRound((r) => r + 1);
      setQuestion(generateQuestion(station, selectedTables, difficulty));
      setQuestionStartTime(Date.now());
      setElapsedTenths(0);
      setShowHint(false);
      setFeedback('idle');
      setSelectedWrong([]);
      setKeypadValue('');
    },
    [round, station, selectedTables, difficulty]
  );

  const handleAnswer = useCallback(
    (value: number) => {
      if (feedback === 'correct') return;

      if (value === question.correctAnswer) {
        sound.playCorrect();
        const responseTimeMs = Math.min(30000, Math.max(300, Date.now() - questionStartTime));
        const firstTry = selectedWrong.length === 0;
        const newStreak = firstTry ? streak + 1 : 1;
        setStreak(newStreak);

        const speedBonus = firstTry && responseTimeMs <= 4500 ? 3 : 0;
        const coinGain = (firstTry ? 8 + Math.min(newStreak * 2, 10) : 4) + speedBonus;
        const snowGain = firstTry ? 2 : 1;

        const nextCorrectCount = firstTry ? correctFirstTryCount + 1 : correctFirstTryCount;
        const nextCoins = earnedCoins + coinGain;
        const nextSnow = earnedSnowballs + snowGain;
        const nextLog = [
          ...factLog,
          {
            a: question.factorA,
            b: question.factorB,
            correct: firstTry,
            timeMs: responseTimeMs,
          },
        ];

        setCorrectFirstTryCount(nextCorrectCount);
        setEarnedCoins(nextCoins);
        setEarnedSnowballs(nextSnow);
        setFactLog(nextLog);
        setFeedback('correct');

        setTimeout(() => {
          nextRoundOrFinish(nextCorrectCount, nextCoins, nextSnow, nextLog);
        }, 650);
      } else {
        sound.playHintOrMiss();
        setStreak(0);
        setFeedback('retry');
        setShowHint(true);
        if (!selectedWrong.includes(value)) {
          setSelectedWrong((prev) => [...prev, value]);
        }
        setKeypadValue('');
      }
    },
    [
      feedback,
      question,
      questionStartTime,
      selectedWrong,
      streak,
      correctFirstTryCount,
      earnedCoins,
      earnedSnowballs,
      factLog,
      nextRoundOrFinish,
    ]
  );

  // Keyboard support for desktop players
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isSummary) return;
      if (e.key >= '0' && e.key <= '9') {
        if (inputMode === 'keypad') {
          setKeypadValue((prev) => (prev.length < 3 ? prev + e.key : prev));
        }
      } else if (e.key === 'Backspace' && inputMode === 'keypad') {
        setKeypadValue((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter' && inputMode === 'keypad' && keypadValue.length > 0) {
        handleAnswer(parseInt(keypadValue, 10));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isSummary, inputMode, keypadValue, handleAnswer]);

  // Build skip-counting sequence for visual hint
  const skipSequence = Array.from(
    { length: question.factorA },
    (_, idx) => (idx + 1) * question.factorB
  );

  if (isSummary) {
    const totalStationCoins = earnedCoins + station.rewardCoins;
    const totalStationSnowballs = earnedSnowballs + station.rewardSnowballs;
    const avgTimeSec =
      factLog.length > 0
        ? (
            factLog.reduce((sum, item) => sum + item.timeMs, 0) /
            factLog.length /
            1000
          ).toFixed(1)
        : '0.0';

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-center">
          <div className="mx-auto mb-4 h-20 w-20 rounded-2xl overflow-hidden border border-amber-400/40 bg-slate-800">
            <img
              src={HERO_IMAGES.chest}
              alt="Expedition Reward Chest"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          </div>

          <p className="text-xs font-medium text-amber-400">
            {station.subtitle} · Outpost Cleared
          </p>
          <h2 className="mt-1 text-2xl font-bold text-white text-balance">
            {station.name} Thawed!
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            You solved all {TOTAL_ROUNDS} multiplication challenges and updated your Table Badge telemetry!
          </p>

          <div className="mt-6 grid grid-cols-4 gap-2 border-y border-slate-800 py-4">
            <div>
              <div className="text-[11px] text-slate-400">Accuracy</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-emerald-400">
                {Math.round((correctFirstTryCount / TOTAL_ROUNDS) * 100)}%
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Avg Speed</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-cyan-300">
                {avgTimeSec}s
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Coins</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-amber-400">
                +{totalStationCoins}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Snowballs</div>
              <div className="mt-1 font-mono text-lg font-bold tabular-nums text-sky-400">
                +{totalStationSnowballs}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onCompleteExpedition({
                stationId: station.id,
                correctCount: correctFirstTryCount,
                totalQuestions: TOTAL_ROUNDS,
                earnedCoins: totalStationCoins,
                earnedSnowballs: totalStationSnowballs,
                masteredFacts: factLog,
              })
            }
            className="mt-6 w-full min-h-[48px] rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-amber-300 active:scale-[0.98] transition-all flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Collect Rewards & Return to Mountain</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-slate-900 border-t sm:border border-slate-800 p-5 sm:p-6 shadow-2xl max-h-[94vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>{station.name}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-amber-400">
                Wave {round}/{TOTAL_ROUNDS}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs font-mono tabular-nums text-slate-300">
              <span className="flex items-center gap-1 text-cyan-300">
                <Timer className="h-3.5 w-3.5" />
                {(elapsedTenths / 10).toFixed(1)}s
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-400">
                <Coins className="h-3.5 w-3.5" />
                {earnedCoins}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-sky-400">
                <Snowflake className="h-3.5 w-3.5" />
                {earnedSnowballs}
              </span>
              {streak >= 2 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 text-orange-400">
                    <Flame className="h-3.5 w-3.5" />
                    {streak}x
                  </span>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Leave Outpost"
              className="min-h-[44px] min-w-[44px] -mr-2 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3 h-2 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-transform duration-200 origin-left"
            style={{ transform: `scaleX(${round / TOTAL_ROUNDS})` }}
          />
        </div>

        {/* Character / Station Prompt Stage */}
        <div className="mt-4 rounded-2xl bg-slate-950/90 border border-slate-800 p-4">
          <div className="flex items-center gap-3.5">
            <div className="h-14 w-14 shrink-0 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800">
              <img
                src={
                  station.type === 'snowbully_patrol'
                    ? HERO_IMAGES.snowbully
                    : HERO_IMAGES.explorer
                }
                alt={station.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 leading-relaxed">{question.storyContext}</p>
              <div className="mt-1 font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-mono tabular-nums">
                {question.promptText}
              </div>
            </div>
          </div>

          {/* Interactive Visual Array / Grouping Helper */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                sound.playTap();
                setShowHint((h) => !h);
              }}
              className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-medium text-amber-300 hover:bg-slate-800 transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              <span>{showHint ? 'Hide Visual Array' : 'Show Visual Array Hint'}</span>
            </button>

            <div className="flex items-center gap-1 rounded-lg bg-slate-900 p-1 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setInputMode('choices');
                }}
                className={`min-h-[36px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                  inputMode === 'choices'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Grid className="h-3.5 w-3.5" />
                <span>4 Choices</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setInputMode('keypad');
                }}
                className={`min-h-[36px] px-2.5 py-1 rounded-md text-xs font-medium transition-colors flex items-center gap-1 whitespace-nowrap ${
                  inputMode === 'keypad'
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>Number Pad</span>
              </button>
            </div>
          </div>

          {/* Visual Array & Skip-Count Hint Drawer */}
          {showHint && (
            <div className="mt-3 rounded-xl bg-slate-900/90 border border-slate-800 p-3">
              <div className="text-xs font-medium text-slate-300">
                Skip-Count by {question.factorB} ({question.factorA} times):
              </div>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5 font-mono text-xs tabular-nums">
                {skipSequence.map((val, idx) => {
                  const isLast = idx === skipSequence.length - 1;
                  return (
                    <React.Fragment key={idx}>
                      <span
                        className={
                          isLast && !question.missingMode
                            ? 'text-amber-300 font-bold underline underline-offset-4'
                            : 'text-sky-300'
                        }
                      >
                        {isLast && !question.missingMode ? '?' : val}
                      </span>
                      {idx < skipSequence.length - 1 && (
                        <span className="text-slate-600">→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Mini Visual Dot Grid (capped cleanly for legibility) */}
              {question.factorA <= 10 && question.factorB <= 10 && (
                <div className="mt-3 space-y-1">
                  {Array.from({ length: question.factorA }).map((_, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-1.5">
                      <span className="w-5 font-mono text-[10px] text-slate-500 tabular-nums">
                        R{rIdx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: question.factorB }).map((__, cIdx) => (
                          <span
                            key={cIdx}
                            className="h-2.5 w-2.5 rounded-sm bg-sky-400/80 inline-block"
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback Banner */}
        <div className="mt-3 min-h-[28px] flex items-center justify-center">
          {feedback === 'correct' && (
            <div className="flex items-center gap-1.5 text-sm font-semibold text-emerald-400">
              <Sparkles className="h-4 w-4" />
              <span>Spot on! Snowbully net charged!</span>
            </div>
          )}
          {feedback === 'retry' && (
            <div className="text-xs font-medium text-amber-300">
              Not quite — check the skip-counting trail above and try another answer!
            </div>
          )}
          {feedback === 'idle' && (
            <div className="text-xs text-slate-400">
              Tap the correct answer below to power your expedition gear.
            </div>
          )}
        </div>

        {/* Answer Input Zone (Thumb-Zone Optimized) */}
        {inputMode === 'choices' ? (
          <div className="mt-2 grid grid-cols-2 gap-3">
            {question.choices.map((choice) => {
              const isWrong = selectedWrong.includes(choice);
              const isRight =
                feedback === 'correct' && choice === question.correctAnswer;

              return (
                <button
                  key={choice}
                  type="button"
                  disabled={isWrong || feedback === 'correct'}
                  onClick={() => handleAnswer(choice)}
                  className={`min-h-[64px] rounded-2xl font-mono text-2xl font-bold tabular-nums transition-all flex items-center justify-center border ${
                    isRight
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 scale-[1.02]'
                      : isWrong
                        ? 'bg-slate-900/40 text-slate-600 border-slate-800 line-through cursor-not-allowed'
                        : 'bg-slate-800/90 hover:bg-slate-800 text-white border-slate-700 active:scale-[0.97]'
                  }`}
                >
                  {choice}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="mt-2">
            <div className="mb-3 flex items-center justify-between rounded-xl bg-slate-950 border border-slate-800 px-4 py-2.5">
              <span className="text-xs text-slate-400">Your Answer:</span>
              <span className="font-mono text-2xl font-bold tabular-nums text-amber-400">
                {keypadValue || '—'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setKeypadValue((v) => (v.length < 3 ? v + String(num) : v));
                  }}
                  className="min-h-[50px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xl font-bold tabular-nums active:scale-[0.97] transition-transform"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setKeypadValue((v) => v.slice(0, -1));
                }}
                aria-label="Backspace"
                className="min-h-[50px] rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-300 flex items-center justify-center active:scale-[0.97]"
              >
                <Delete className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  sound.playTap();
                  setKeypadValue((v) => (v.length < 3 ? v + '0' : v));
                }}
                className="min-h-[50px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-mono text-xl font-bold tabular-nums active:scale-[0.97]"
              >
                0
              </button>
              <button
                type="button"
                disabled={!keypadValue}
                onClick={() => {
                  if (keypadValue) handleAnswer(parseInt(keypadValue, 10));
                }}
                className="min-h-[50px] rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-bold text-sm flex items-center justify-center gap-1 active:scale-[0.97]"
              >
                <span>Go</span>
                <CornerDownLeft className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
