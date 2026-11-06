import React from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  X,
  Sliders,
  Play,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface AudioSettingsModalProps {
  musicVolume: number; // 0 to 100
  sfxVolume: number; // 0 to 100
  mutedAll: boolean;
  onChangeMusicVolume: (val: number) => void;
  onChangeSfxVolume: (val: number) => void;
  onToggleMuteAll: () => void;
  onClose: () => void;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  musicVolume,
  sfxVolume,
  mutedAll,
  onChangeMusicVolume,
  onChangeSfxVolume,
  onToggleMuteAll,
  onClose,
}) => {
  const effectiveMusic = mutedAll ? 0 : musicVolume;
  const effectiveSfx = mutedAll ? 0 : sfxVolume;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-slate-900 border-t sm:border border-slate-800 p-5 sm:p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Expedition Preferences</p>
              <h2 className="text-lg font-bold text-white">Audio & Volume Settings</h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Master Mute All Button */}
        <div className="mt-5">
          <button
            type="button"
            onClick={onToggleMuteAll}
            className={`w-full min-h-[52px] rounded-2xl px-4 py-3 border font-bold text-sm transition-all flex items-center justify-between gap-3 ${
              mutedAll
                ? 'bg-rose-500/15 border-rose-500/50 text-rose-300 hover:bg-rose-500/20'
                : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
            }`}
          >
            <span className="flex items-center gap-2.5">
              {mutedAll ? (
                <VolumeX className="h-5 w-5 text-rose-400 shrink-0" />
              ) : (
                <Volume2 className="h-5 w-5 text-emerald-400 shrink-0" />
              )}
              <span>Mute All</span>
            </span>
            <span className="font-mono text-xs tabular-nums">
              {mutedAll ? 'All Audio Muted · Tap to Unmute' : 'Active · Tap to Silence All'}
            </span>
          </button>
        </div>

        {/* Independent Volume Sliders */}
        <div className="mt-5 space-y-5">
          {/* Music Volume Control */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="music-volume-slider"
                className="text-sm font-semibold text-white flex items-center gap-2"
              >
                <Music className="h-4 w-4 text-sky-400" />
                <span>Music Volume</span>
              </label>
              <span className="font-mono text-sm font-bold tabular-nums text-sky-400">
                {effectiveMusic}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Controls the ambient Alpine Castle background melody.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <input
                id="music-volume-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={effectiveMusic}
                onChange={(e) => onChangeMusicVolume(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-sky-400"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                {[0, 25, 50, 75, 100].map((preset) => (
                  <button
                    key={`music-${preset}`}
                    type="button"
                    onClick={() => onChangeMusicVolume(preset)}
                    className={`min-h-[32px] px-2.5 rounded-lg font-mono text-xs tabular-nums transition-colors ${
                      effectiveMusic === preset
                        ? 'bg-sky-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Sound Effects (SFX) Volume Control */}
          <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="sfx-volume-slider"
                className="text-sm font-semibold text-white flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4 text-amber-400" />
                <span>Sound Effects Volume</span>
              </label>
              <span className="font-mono text-sm font-bold tabular-nums text-amber-400">
                {effectiveSfx}%
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Controls chimes for multiplication answers, net catches, and treasure unlocks.
            </p>

            <div className="mt-3 flex items-center gap-3">
              <input
                id="sfx-volume-slider"
                type="range"
                min={0}
                max={100}
                step={5}
                value={effectiveSfx}
                onChange={(e) => onChangeSfxVolume(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-amber-400"
              />
            </div>

            <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                {[0, 25, 50, 75, 100].map((preset) => (
                  <button
                    key={`sfx-${preset}`}
                    type="button"
                    onClick={() => onChangeSfxVolume(preset)}
                    className={`min-h-[32px] px-2.5 rounded-lg font-mono text-xs tabular-nums transition-colors ${
                      effectiveSfx === preset
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={mutedAll || sfxVolume === 0}
                onClick={() => sound.playCorrect()}
                className="min-h-[32px] px-3 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700 text-xs font-medium text-amber-300 flex items-center gap-1 whitespace-nowrap"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Test Chime</span>
              </button>
            </div>
          </div>
        </div>

        {/* Done Button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full min-h-[46px] rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm transition-colors whitespace-nowrap"
        >
          Done
        </button>
      </div>
    </div>
  );
};
