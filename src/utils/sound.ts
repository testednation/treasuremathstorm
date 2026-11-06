// Web Audio API Synthesizer & Background Music Engine for Treasure MathStorm! Mobile
// Provides zero-latency sound effects, ambient alpine melody loop, and independent Music & SFX volume controls

class SoundManager {
  private ctx: AudioContext | null = null;
  private musicGainNode: GainNode | null = null;
  private musicIntervalId: number | null = null;
  private isMusicPlaying: boolean = false;
  private noteStep: number = 0;

  public mutedAll: boolean = false;
  public sfxVolume: number = 0.8; // 0.0 to 1.0
  public musicVolume: number = 0.45; // 0.0 to 1.0

  // Whimsical Alpine Castle melody notes (frequencies in Hz - C Major / Lydian winter chime feel)
  private readonly melodyNotes: number[] = [
    523.25, // C5
    659.25, // E5
    783.99, // G5
    740.0,  // F#5
    659.25, // E5
    587.33, // D5
    523.25, // C5
    392.0,  // G4
    440.0,  // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    587.33, // D5
    493.88, // B4
    392.0,  // G4
    523.25, // C5
  ];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public syncSettings(settings: {
    sfxVolume: number;
    musicVolume: number;
    mutedAll: boolean;
  }) {
    this.sfxVolume = Math.max(0, Math.min(1, settings.sfxVolume));
    this.musicVolume = Math.max(0, Math.min(1, settings.musicVolume));
    this.mutedAll = settings.mutedAll;

    if (this.musicGainNode && this.ctx) {
      const targetGain = this.mutedAll ? 0 : this.musicVolume * 0.09;
      this.musicGainNode.gain.setTargetAtTime(targetGain, this.ctx.currentTime, 0.05);
    }

    if (this.mutedAll || this.musicVolume <= 0.001) {
      this.stopMusicLoop();
    }
  }

  public ensureMusicStarted() {
    if (this.mutedAll || this.musicVolume <= 0.001) return;
    if (this.isMusicPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;

    if (!this.musicGainNode) {
      this.musicGainNode = ctx.createGain();
      this.musicGainNode.gain.setValueAtTime(
        this.mutedAll ? 0 : this.musicVolume * 0.09,
        ctx.currentTime
      );
      this.musicGainNode.connect(ctx.destination);
    }

    this.isMusicPlaying = true;
    this.scheduleNextMusicNote();
    this.musicIntervalId = window.setInterval(() => {
      this.scheduleNextMusicNote();
    }, 480);
  }

  public stopMusicLoop() {
    if (this.musicIntervalId !== null) {
      window.clearInterval(this.musicIntervalId);
      this.musicIntervalId = null;
    }
    this.isMusicPlaying = false;
  }

  private scheduleNextMusicNote() {
    if (this.mutedAll || this.musicVolume <= 0.001) return;
    const ctx = this.getContext();
    if (!ctx || !this.musicGainNode) return;

    const freq = this.melodyNotes[this.noteStep % this.melodyNotes.length];
    this.noteStep += 1;

    const osc = ctx.createOscillator();
    const noteGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    const effectiveMusicGain = this.mutedAll ? 0 : this.musicVolume * 0.075;
    noteGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    noteGain.gain.linearRampToValueAtTime(effectiveMusicGain, ctx.currentTime + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.42);

    osc.connect(noteGain);
    noteGain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.44);
  }

  private getEffectiveSfxGain(baseGain: number): number {
    if (this.mutedAll || this.sfxVolume <= 0.001) return 0;
    return baseGain * this.sfxVolume;
  }

  playTap() {
    this.ensureMusicStarted();
    const peakGain = this.getEffectiveSfxGain(0.11);
    if (peakGain <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(680, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(peakGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  playCorrect() {
    this.ensureMusicStarted();
    const peakGain = this.getEffectiveSfxGain(0.18);
    if (peakGain <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = ctx.currentTime + idx * 0.065;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(peakGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  playHintOrMiss() {
    this.ensureMusicStarted();
    const peakGain = this.getEffectiveSfxGain(0.11);
    if (peakGain <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.18);
    gain.gain.setValueAtTime(peakGain, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.18);
  }

  playNetCatch() {
    this.ensureMusicStarted();
    const peakGain = this.getEffectiveSfxGain(0.16);
    if (peakGain <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [392.0, 587.33, 783.99]; // G4, D5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const startTime = ctx.currentTime + idx * 0.05;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(peakGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.16);
    });
  }

  playTreasureUnlock() {
    this.ensureMusicStarted();
    const peakGain = this.getEffectiveSfxGain(0.2);
    if (peakGain <= 0) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const startTime = ctx.currentTime + idx * 0.08;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(peakGain, startTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.35);
    });
  }
}

export const sound = new SoundManager();
