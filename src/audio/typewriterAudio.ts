// Web Audio API Typewriter Synthesizer
// Provides zero-latency, realistic mechanical keystroke sounds, heavy space/backspace thud,
// and metallic carriage return bell + glide sounds without external audio files.

class TypewriterAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.65;
  private whiteNoiseBuffer: AudioBuffer | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
    const savedMute = localStorage.getItem('enspirewrite_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
    const savedVol = localStorage.getItem('enspirewrite_volume');
    if (savedVol !== null) {
      this.volume = parseFloat(savedVol) || 0.65;
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Pre-generate a 1-second white noise buffer for efficient click/thud synthesis
      const bufferSize = this.ctx.sampleRate;
      this.whiteNoiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.whiteNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('enspirewrite_muted', String(muted));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.01);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('enspirewrite_volume', String(this.volume));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.01);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  /**
   * Crisp, tactile mechanical keystroke sound:
   * Layer 1: High-frequency mechanical strike click (bandpass filtered noise)
   * Layer 2: Platen body resonance thud (pitch dropped rapid sine wave)
   * Layer 3: Subtle spring / key release shimmer
   */
  public playKeyClick() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain || !this.whiteNoiseBuffer) return;

    const t = this.ctx.currentTime;
    // Slight random pitch variation (jitter) so every strike sounds organically varied
    const jitter = (Math.random() - 0.5) * 0.12;
    const centerFreq = (3200 + Math.random() * 800) * (1 + jitter);

    // 1. Strike transient (fast noise pulse)
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.whiteNoiseBuffer;
    // Pick random start inside noise buffer
    const offset = Math.random() * 0.5;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(centerFreq, t);
    noiseFilter.Q.setValueAtTime(4.5, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.7, t + 0.002);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);

    noiseNode.start(t, offset, 0.04);

    // 2. Heavy platen roller body thump
    const platenOsc = this.ctx.createOscillator();
    platenOsc.type = 'triangle';
    const basePlatenFreq = (380 + Math.random() * 40) * (1 + jitter);
    platenOsc.frequency.setValueAtTime(basePlatenFreq, t);
    platenOsc.frequency.exponentialRampToValueAtTime(70, t + 0.032);

    const platenGain = this.ctx.createGain();
    platenGain.gain.setValueAtTime(0.001, t);
    platenGain.gain.linearRampToValueAtTime(0.45, t + 0.002);
    platenGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);

    platenOsc.connect(platenGain);
    platenGain.connect(this.masterGain);

    platenOsc.start(t);
    platenOsc.stop(t + 0.035);

    // 3. Subtle metallic ping
    const pingOsc = this.ctx.createOscillator();
    pingOsc.type = 'sine';
    pingOsc.frequency.setValueAtTime(2400 * (1 + jitter), t);
    const pingGain = this.ctx.createGain();
    pingGain.gain.setValueAtTime(0.08, t);
    pingGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    pingOsc.connect(pingGain);
    pingGain.connect(this.masterGain);
    pingOsc.start(t);
    pingOsc.stop(t + 0.045);
  }

  /**
   * Deeper thud for Space and Backspace:
   * Heavier platen inertia, lower resonance, weightier escapement bar click
   */
  public playHeavyThud() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain || !this.whiteNoiseBuffer) return;

    const t = this.ctx.currentTime;
    const jitter = (Math.random() - 0.5) * 0.08;

    // 1. Lower resonant noise clunk
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = this.whiteNoiseBuffer;
    const offset = Math.random() * 0.5;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(1400 * (1 + jitter), t);
    noiseFilter.Q.setValueAtTime(2.0, t);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.85, t + 0.003);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain);
    noiseNode.start(t, offset, 0.06);

    // 2. Heavy chassis sub-bass thump
    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(180 * (1 + jitter), t);
    subOsc.frequency.exponentialRampToValueAtTime(45, t + 0.05);

    const subGain = this.ctx.createGain();
    subGain.gain.setValueAtTime(0.001, t);
    subGain.gain.linearRampToValueAtTime(0.65, t + 0.004);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.055);

    subOsc.connect(subGain);
    subGain.connect(this.masterGain);
    subOsc.start(t);
    subOsc.stop(t + 0.06);
  }

  /**
   * Return / Enter Key:
   * 1. Clear, crystalline metallic bell chime (harmonic bell resonance)
   * 2. Simultaneous carriage return ratchet / slide sound
   */
  public playCarriageReturn() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.masterGain || !this.whiteNoiseBuffer) return;

    const t = this.ctx.currentTime;

    // --- 1. Iconic Mechanical Typewriter Bell Chime ---
    // Bell fundamental (bright, metallic chime at ~2080Hz)
    const bellFund = this.ctx.createOscillator();
    bellFund.type = 'sine';
    bellFund.frequency.setValueAtTime(2093, t); // C7 bell ring

    const bellFundGain = this.ctx.createGain();
    bellFundGain.gain.setValueAtTime(0.001, t);
    bellFundGain.gain.linearRampToValueAtTime(0.55, t + 0.003);
    bellFundGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

    bellFund.connect(bellFundGain);
    bellFundGain.connect(this.masterGain);
    bellFund.start(t);
    bellFund.stop(t + 0.75);

    // Bell overtone harmonic (metallic shimmer ~4186Hz)
    const bellOvertone = this.ctx.createOscillator();
    bellOvertone.type = 'sine';
    bellOvertone.frequency.setValueAtTime(4186, t);

    const bellOverGain = this.ctx.createGain();
    bellOverGain.gain.setValueAtTime(0.001, t);
    bellOverGain.gain.linearRampToValueAtTime(0.28, t + 0.002);
    bellOverGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);

    bellOvertone.connect(bellOverGain);
    bellOverGain.connect(this.masterGain);
    bellOvertone.start(t);
    bellOvertone.stop(t + 0.5);

    // --- 2. Carriage Return Slide & Ratchet Whir ---
    // Rapid escapement gear ratchet clicks
    const ratchetCount = 6;
    for (let i = 0; i < ratchetCount; i++) {
      const clickTime = t + 0.04 + i * 0.026;
      const rNoise = this.ctx.createBufferSource();
      rNoise.buffer = this.whiteNoiseBuffer;

      const rFilter = this.ctx.createBiquadFilter();
      rFilter.type = 'bandpass';
      rFilter.frequency.setValueAtTime(3600 - i * 150, clickTime);
      rFilter.Q.setValueAtTime(6.0, clickTime);

      const rGain = this.ctx.createGain();
      rGain.gain.setValueAtTime(0.001, clickTime);
      rGain.gain.linearRampToValueAtTime(0.18 - i * 0.015, clickTime + 0.002);
      rGain.gain.exponentialRampToValueAtTime(0.0001, clickTime + 0.02);

      rNoise.connect(rFilter);
      rFilter.connect(rGain);
      rGain.connect(this.masterGain);
      rNoise.start(clickTime, Math.random() * 0.5, 0.025);
    }

    // Carriage glide noise sweep
    const slideNoise = this.ctx.createBufferSource();
    slideNoise.buffer = this.whiteNoiseBuffer;

    const slideFilter = this.ctx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.setValueAtTime(2200, t + 0.03);
    slideFilter.frequency.exponentialRampToValueAtTime(900, t + 0.22);
    slideFilter.Q.setValueAtTime(3.0, t + 0.03);

    const slideGain = this.ctx.createGain();
    slideGain.gain.setValueAtTime(0.001, t + 0.03);
    slideGain.gain.linearRampToValueAtTime(0.22, t + 0.06);
    slideGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.24);

    slideNoise.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(this.masterGain);
    slideNoise.start(t + 0.03, Math.random() * 0.5, 0.23);
  }
}

export const typewriterAudio = new TypewriterAudioEngine();
