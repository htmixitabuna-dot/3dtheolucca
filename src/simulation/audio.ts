/**
 * Procedural Web Audio Sound Generator for Theo Lucca 3D Simulation
 * Zero external MP3 dependencies - 100% synthesized in real time
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private fountainSource: AudioBufferSourceNode | null = null;
  private fountainGain: GainNode | null = null;
  private isFountainRunning: boolean = false;
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private isRainRunning: boolean = false;
  private isScreenPaused: boolean = false;

  private initCtx(): AudioNode | null {
    if (typeof window === 'undefined') return null;

    if (!this.ctx) {
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }

    if (!this.masterGain && this.ctx) {
      try {
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(this.isMuted || this.isScreenPaused ? 0 : 1.0, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }

    if (this.ctx && this.ctx.state === 'suspended' && !this.isScreenPaused) {
      this.ctx.resume().catch(() => {});
    }

    return this.masterGain;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(muted || this.isScreenPaused ? 0 : 1.0, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
    if (this.fountainGain) {
      this.fountainGain.gain.value = muted || this.isScreenPaused ? 0 : 0.12;
    }
    if (this.rainGain) {
      this.rainGain.gain.value = muted || this.isScreenPaused ? 0 : 0.18;
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Pára completamente todo o áudio quando muda de tela, aba ou minimiza
   */
  public pauseAll() {
    this.isScreenPaused = true;
    this.stopFountainAmbient();
    this.stopRainAmbient();
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  /**
   * Retoma o áudio quando volta para a tela do simulador
   */
  public resumeAll() {
    this.isScreenPaused = false;
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 1.0, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }
    if (!this.isMuted) {
      this.startFountainAmbient();
    }
  }

  /**
   * Encerra todos os canais de áudio
   */
  public stopAll() {
    this.pauseAll();
  }

  /**
   * Sound of Theo Lucca footsteps (running on grass/asphalt)
   */
  public playFootstep(isRunning: boolean = false) {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isRunning ? 260 : 180, now);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isRunning ? 95 : 75, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.08);

    gain.gain.setValueAtTime(isRunning ? 0.28 : 0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Jump whoosh sound
   */
  public playJump() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.18);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Star collection sparkle sound (Free Fire collect chime)
   */
  public playStarCollect() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + idx * 0.06;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(outNode);

      osc.start(now);
      osc.stop(now + 0.25);
    });
  }

  /**
   * Mission completion fanfare (Grand victory chime)
   */
  public playMissionComplete() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const notes = [
      { f: 523.25, t: 0.0, d: 0.15 },
      { f: 659.25, t: 0.14, d: 0.15 },
      { f: 783.99, t: 0.28, d: 0.18 },
      { f: 1046.5, t: 0.44, d: 0.45 },
    ];

    notes.forEach(({ f, t, d }) => {
      if (!this.ctx) return;
      const now = this.ctx.currentTime + t;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + d);

      osc.connect(gain);
      gain.connect(outNode);

      osc.start(now);
      osc.stop(now + d + 0.05);
    });
  }

  /**
   * Sound of collecting golden coins on the street ("Plim!")
   */
  public playCoinCollect() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.12); // E6

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.19);
  }

  /**
   * Sound of earning money from jobs ("Cha-ching!" cash register)
   */
  public playCashEarn() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    // Bell chime
    const bell = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bell.type = 'sine';
    bell.frequency.setValueAtTime(1200, now);
    bell.frequency.setValueAtTime(1800, now + 0.08);

    bellGain.gain.setValueAtTime(0.3, now);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    bell.connect(bellGain);
    bellGain.connect(outNode);
    bell.start(now);
    bell.stop(now + 0.36);

    // Coins rattle
    for (let i = 0; i < 3; i++) {
      const coin = this.ctx.createOscillator();
      const cg = this.ctx.createGain();
      coin.type = 'triangle';
      coin.frequency.setValueAtTime(1400 + i * 250, now + 0.06 + i * 0.05);

      cg.gain.setValueAtTime(0.2, now + 0.06 + i * 0.05);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + i * 0.05);

      coin.connect(cg);
      cg.connect(outNode);
      coin.start(now + 0.06 + i * 0.05);
      coin.stop(now + 0.18 + i * 0.05);
    }
  }

  /**
   * Cute friendly car horn ("Bi-bi!")
   */
  public playCuteHorn() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const beeps = [0, 0.12];

    beeps.forEach((offset) => {
      if (!this.ctx) return;
      const t = now + offset;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(440, t); // A4
      osc2.frequency.setValueAtTime(554.37, t); // C#5 (harmonious 3rd)

      gain.gain.setValueAtTime(0.22, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(outNode);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.1);
      osc2.stop(t + 0.1);
    });
  }

  /**
   * Sound of buying an item in shop
   */
  public playPurchase() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, now + 0.15); // A5

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.23);
  }

  /**
   * Sound of friendly greeting / waving ("Oi Theo!")
   */
  public playWaveHello() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.linearRampToValueAtTime(659.25, now + 0.09);
    osc.frequency.linearRampToValueAtTime(783.99, now + 0.18);

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Sound of getting into or out of a vehicle (door click / mount)
   */
  public playCarDoor() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  /**
   * Magical Portal / Teleport Sound (ascending harmonic chord and whoosh)
   */
  public playTeleportSound() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + i * 0.07 + 0.35);

      gain.gain.setValueAtTime(0.001, now + i * 0.07);
      gain.gain.linearRampToValueAtTime(0.18, now + i * 0.07 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.4);

      osc.connect(gain);
      gain.connect(outNode);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.45);
    });
  }

  /**
   * Sparkling Diamond Gemstone Collect Sound (high-pitched crystalline chime)
   */
  public playDiamondCollect() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const freqs = [1046.5, 1318.5, 1567.98, 2093.0];
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.05);

      gain.gain.setValueAtTime(0.25, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.28);

      osc.connect(gain);
      gain.connect(outNode);

      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.3);
    });
  }

  /**
   * Resonant Golden Avaritia Relic Collect Sound (mystical golden chime)
   */
  public playAvaritiaCollect() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const freqs = [392.0, 587.33, 783.99, 1174.66];
    freqs.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.06);

      gain.gain.setValueAtTime(0.3, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.45);

      osc.connect(gain);
      gain.connect(outNode);

      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.5);
    });
  }

  /**
   * Cute bouncy pickup sound for items collected into the backpack along the course
   */
  public playItemPickup() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.16);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.24);
  }

  /**
   * Cute vehicle engine throttle rev
   */
  public playEngineRev(isMoto = false) {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(isMoto ? 420 : 280, now);

    osc.type = isMoto ? 'sawtooth' : 'triangle';
    const baseFreq = isMoto ? 85 : 55;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + 0.22);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, now + 0.35);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.38);
  }

  /**
   * Som de toque fofo e brilhante para seleção de itens na mochila infantil
   */
  public playPopClick() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(540, now);
    osc.frequency.exponentialRampToValueAtTime(1080, now + 0.08);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(outNode);

    osc.start(now);
    osc.stop(now + 0.14);
  }

  /**
   * Ambient fountain water noise
   */
  public startFountainAmbient() {
    if (this.fountainSource || this.isMuted || this.isScreenPaused) return;
    try {
      const outNode = this.initCtx();
      if (!this.ctx || !outNode) return;

      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
      }

      this.fountainSource = this.ctx.createBufferSource();
      this.fountainSource.buffer = noiseBuffer;
      this.fountainSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);
      filter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.fountainGain = this.ctx.createGain();
      this.fountainGain.gain.setValueAtTime(this.isMuted || this.isScreenPaused ? 0 : 0.12, this.ctx.currentTime);

      this.fountainSource.connect(filter);
      filter.connect(this.fountainGain);
      this.fountainGain.connect(outNode);

      this.fountainSource.start();
      this.isFountainRunning = true;
    } catch {
      // Audio autoplay restrictions before user gesture
    }
  }

  /**
   * Para imediatamente o som ambiente da fonte
   */
  public stopFountainAmbient() {
    if (this.fountainSource) {
      try {
        this.fountainSource.stop();
        this.fountainSource.disconnect();
      } catch {
        // ignore if already stopped
      }
      this.fountainSource = null;
    }
    if (this.fountainGain) {
      try {
        this.fountainGain.disconnect();
      } catch {
        // ignore
      }
      this.fountainGain = null;
    }
    this.isFountainRunning = false;
  }

  /**
   * Som de chuva procedural suave (ruído rosa / marrom filtrado contínuo)
   */
  public startRainAmbient() {
    if (this.rainSource || this.isMuted || this.isScreenPaused) return;
    try {
      const outNode = this.initCtx();
      if (!this.ctx || !outNode) return;

      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

      // Algoritmo de ruído rosa suave para textura de chuva realista
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
        b6 = white * 0.115926;
      }

      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = noiseBuffer;
      this.rainSource.loop = true;

      // Filtro passa-baixa com ressonância suave simulando gotas d'água no solo
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(this.isMuted || this.isScreenPaused ? 0 : 0.22, this.ctx.currentTime);

      this.rainSource.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(outNode);

      this.rainSource.start();
      this.isRainRunning = true;
    } catch {
      // Ignora restrições de autoplay antes de gesto do usuário
    }
  }

  /**
   * Para imediatamente o som ambiente de chuva
   */
  public stopRainAmbient() {
    if (this.rainSource) {
      try {
        this.rainSource.stop();
        this.rainSource.disconnect();
      } catch {
        // ignore
      }
      this.rainSource = null;
    }
    if (this.rainGain) {
      try {
        this.rainGain.disconnect();
      } catch {
        // ignore
      }
      this.rainGain = null;
    }
    this.isRainRunning = false;
  }

  /**
   * Trovão procedural distante com reverberação grave suave
   */
  public playThunder() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(160, now);
      filter.frequency.exponentialRampToValueAtTime(55, now + 1.8);

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(65, now);
      osc1.frequency.exponentialRampToValueAtTime(25, now + 1.8);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(45, now);
      osc2.frequency.exponentialRampToValueAtTime(20, now + 2.0);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(outNode);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 2.3);
      osc2.stop(now + 2.3);
    } catch {
      // ignore
    }
  }

  /**
   * Som realista de colisão / batida de carro estilo GTA (impacto metálico, estalo de chassi e raspagem)
   */
  public playCarCrash(intensity: number = 1.0) {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      const clampedInt = Math.max(0.2, Math.min(1.2, intensity));

      // 1. Ruído de impacto metálico e quebra de lataria
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.3);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.07));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(750, now);
      noiseFilter.Q.setValueAtTime(2.2, now);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4 * clampedInt, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(outNode);
      noise.start(now);

      // 2. Pancada grave do chassi (sub-bass thump)
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thud.type = 'triangle';
      thud.frequency.setValueAtTime(160, now);
      thud.frequency.exponentialRampToValueAtTime(36, now + 0.2);
      thudGain.gain.setValueAtTime(0.45 * clampedInt, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      thud.connect(thudGain);
      thudGain.connect(outNode);
      thud.start(now);
      thud.stop(now + 0.21);

      // 3. Raspagem metálica de lataria (metallic screech ring)
      const metal = this.ctx.createOscillator();
      const metalGain = this.ctx.createGain();
      metal.type = 'sawtooth';
      metal.frequency.setValueAtTime(460, now);
      metal.frequency.linearRampToValueAtTime(190, now + 0.16);
      metalGain.gain.setValueAtTime(0.22 * clampedInt, now);
      metalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      metal.connect(metalGain);
      metalGain.connect(outNode);
      metal.start(now);
      metal.stop(now + 0.19);
    } catch {
      // ignore
    }
  }

  /**
   * Som de conserto e polimento de carro na Oficina Theo Lucca
   */
  public playCarRepair() {
    if (this.isMuted || this.isScreenPaused) return;
    const outNode = this.initCtx();
    if (!this.ctx || !outNode || this.ctx.state !== 'running') return;

    try {
      const now = this.ctx.currentTime;
      [330, 440, 554.37, 659.25, 880].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        g.gain.setValueAtTime(0.22, now + idx * 0.07);
        g.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.22);
        osc.connect(g);
        g.connect(outNode!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.24);
      });
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundSynthesizer();
