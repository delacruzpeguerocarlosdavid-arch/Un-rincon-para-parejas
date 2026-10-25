// Web Audio API Native Synthesizer - Cero dependencias externas, 100% nativo y ultra-ligero

class SoundAtmosphereEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private musicGain: GainNode | null = null;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  // Sonido de latido cálido y profundo (doble pulsación: "lub-dub")
  public playHeartbeat() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    
    // Primer latido (lub)
    this.createBeat(now, 68, 0.22, 0.18);
    // Segundo latido (dub)
    this.createBeat(now + 0.18, 55, 0.18, 0.14);
  }

  private createBeat(time: number, freq: number, duration: number, volume: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(32, time + duration);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Chime mágico de estrellitas / raspar / cuidar lirio
  public playChime(pitchModifier = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const freqs = [523.25, 659.25, 783.99, 1046.50].map(f => f * pitchModifier);
    const now = this.ctx.currentTime;

    freqs.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.08, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.6);
    });
  }

  // Sonido de crujido suave de sello de cera lacrado
  public playWaxCrack() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Ruido blanco filtrado para simular rotura de cera / papel crujiente
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);
    filter.Q.setValueAtTime(3, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  // Mordisco crujiente de comida estilo Pou ("¡Crunch!")
  public playCrunch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.09;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);

    // Pequeño tono bajo de masticado
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    oscGain.gain.setValueAtTime(0.15, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  // Gota de agua / burbuja / onda de río ("¡Plop / Bloop!")
  public playPlop(freq = 600) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.06);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.4, now + 0.14);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // Risitas tiernas de Appa al hacerle cosquillas
  public playGiggle() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [587.33, 783.99, 880.00, 1046.50];
    notes.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.04);
      gain.gain.setValueAtTime(0.08, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.09);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.09);
    });
  }

  // Rebote elástico de pelota / física de malvavisco ("Boing")
  public playBoing() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.07);
    osc.frequency.exponentialRampToValueAtTime(260, now + 0.18);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Papel que se desdobla suavemente
  public playPaperFold() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Música de fondo generativa ultra-suave (caja de música romántica)
  // Toca arpegios relajantes de cuna en escala pentatónica de amor (F, A, C, D, G)
  public toggleMusic(): boolean {
    this.initContext();
    if (this.isMusicPlaying) {
      this.stopMusic();
      return false;
    } else {
      this.startMusic();
      return true;
    }
  }

  public getMusicStatus(): boolean {
    return this.isMusicPlaying;
  }

  private startMusic() {
    if (!this.ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Arpegios suaves en escala pentatónica relajante
    const notes = [
      349.23, // F4
      392.00, // G4
      440.00, // A4
      523.25, // C5
      587.33, // D5
      698.46, // F5
      880.00, // A5
    ];

    let step = 0;
    const playNextNote = () => {
      if (!this.isMusicPlaying || !this.ctx) return;

      const note = notes[step % notes.length];
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Sonido de caja de música cálida (onda senoidal + armónico suave)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.035, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.8);

      // Ritmo fluido no monótono
      const delays = [600, 450, 750, 500, 900, 600];
      const nextDelay = delays[step % delays.length];
      step = (step + 1) % (notes.length * 3);

      this.musicTimer = window.setTimeout(playNextNote, nextDelay);
    };

    playNextNote();
  }

  private activeAmbience: {
    type: 'rain' | 'fireplace' | 'river' | 'piano' | null;
    sourceNodes: (AudioNode | number)[];
    masterGain: GainNode | null;
  } = { type: null, sourceNodes: [], masterGain: null };

  // ==========================================
  // GENERADOR DE PAISAJES SONOROS LO-FI (ASMR)
  // ==========================================
  public startAmbience(type: 'rain' | 'fireplace' | 'river' | 'piano', volume = 0.4) {
    if (this.isMuted) return;
    this.stopAmbience();
    this.initContext();
    if (!this.ctx) return;

    const masterGain = this.ctx.createGain();
    masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    masterGain.connect(this.ctx.destination);
    this.activeAmbience = { type, sourceNodes: [], masterGain };

    if (type === 'rain') {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99 * b0 + white * 0.05;
        b1 = 0.96 * b1 + white * 0.11;
        b2 = 0.86 * b2 + white * 0.25;
        data[i] = (b0 + b1 + b2) * 0.12;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      this.activeAmbience.sourceNodes.push(noise, filter);
    } else if (type === 'fireplace') {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const r = Math.random();
        data[i] = r > 0.998 ? (Math.random() * 2 - 1) * 0.8 : (Math.random() * 2 - 1) * 0.02;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      this.activeAmbience.sourceNodes.push(noise, filter);
    } else if (type === 'river') {
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.08;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(650, this.ctx.currentTime);
      filter.Q.setValueAtTime(2, this.ctx.currentTime);

      noise.connect(filter);
      filter.connect(masterGain);
      noise.start();
      this.activeAmbience.sourceNodes.push(noise, filter);
    } else if (type === 'piano') {
      const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33];
      const timer = window.setInterval(() => {
        if (!this.ctx || this.activeAmbience.type !== 'piano') return;
        const note = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(note, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 2.5);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        osc.stop(this.ctx.currentTime + 2.5);
      }, 1600);
      this.activeAmbience.sourceNodes.push(timer);
    }
  }

  public stopAmbience() {
    if (this.activeAmbience.type === 'piano') {
      this.activeAmbience.sourceNodes.forEach(node => {
        if (typeof node === 'number') clearInterval(node);
      });
    } else {
      this.activeAmbience.sourceNodes.forEach(node => {
        if (typeof node === 'object' && node && 'stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
          try { (node as AudioScheduledSourceNode).stop(); } catch {}
        }
      });
    }
    this.activeAmbience = { type: null, sourceNodes: [], masterGain: null };
  }

  public getActiveAmbience() {
    return this.activeAmbience.type;
  }

  public setAmbienceVolume(volume: number) {
    if (this.activeAmbience.masterGain && this.ctx) {
      this.activeAmbience.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  private stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopMusic();
      this.stopAmbience();
    }
    return this.isMuted;
  }
}

export const soundFx = new SoundAtmosphereEngine();
