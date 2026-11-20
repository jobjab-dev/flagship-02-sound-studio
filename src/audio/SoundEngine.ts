export type NoiseColor = "white" | "pink" | "brown";

export interface SynthPatchParams {
  masterVolume: number; // 0..1
  masterToneHz: number; // 240..12000
  spatialX: number; // -1..1
  spatialY: number; // 0..1 (reverb / delay feedback & filter shimmer)

  padLevel: number; // 0..1
  padFreqHz: number; // 65..440
  padCutoffHz: number; // 180..4800
  padResonance: number; // 0.5..14
  padPan: number; // -1..1
  padMuted: boolean;

  noiseLevel: number; // 0..1
  noiseColor: NoiseColor;
  noiseCutoffHz: number; // 140..7200
  noiseResonance: number; // 0.5..12
  noisePan: number; // -1..1
  noiseMuted: boolean;

  droneLevel: number; // 0..1
  droneFreqHz: number; // 36..140
  droneCutoffHz: number; // 90..1800
  dronePan: number; // -1..1
  droneMuted: boolean;

  pulseLevel: number; // 0..1
  pulseDensity: number; // 0.1..1
  pulsePan: number; // -1..1
  pulseMuted: boolean;
}

class SpatialSoundEngine {
  private ctx: AudioContext | null = null;
  private isRunning = false;

  private masterGain: GainNode | null = null;
  private masterFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayWet: GainNode | null = null;

  // Ch 1: Ambient Harmonic Pad (3 detuned oscillators -> filter -> pan -> gain)
  private padOscs: OscillatorNode[] = [];
  private padFilter: BiquadFilterNode | null = null;
  private padPanner: StereoPannerNode | null = null;
  private padGain: GainNode | null = null;
  private lfoOsc: OscillatorNode | null = null;
  private lfoDepth: GainNode | null = null;

  // Ch 2: Procedural Atmosphere Noise (Rain / Wind / Surf)
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noisePanner: StereoPannerNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseBuffers: Partial<Record<NoiseColor, AudioBuffer>> = {};
  private currentNoiseColor: NoiseColor = "pink";

  // Ch 3: Sub-Harmonic Drone
  private droneOscSub: OscillatorNode | null = null;
  private droneOscOctave: OscillatorNode | null = null;
  private droneFilter: BiquadFilterNode | null = null;
  private dronePanner: StereoPannerNode | null = null;
  private droneGain: GainNode | null = null;

  // Ch 4: Spatial Pentatonic Pulse
  private pulseGain: GainNode | null = null;
  private pulsePanner: StereoPannerNode | null = null;
  private pulseTimer: ReturnType<typeof setInterval> | null = null;
  private lastParams: SynthPatchParams | null = null;

  private buildNoiseBuffer(
    ctx: AudioContext,
    color: NoiseColor
  ): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 4; // 4-second seamless noise buffer
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let b0 = 0;
      let b1 = 0;
      let b2 = 0;
      let b3 = 0;
      let b4 = 0;
      let b5 = 0;
      let b6 = 0;
      let lastOut = 0;

      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        if (color === "white") {
          data[i] = white * 0.28;
        } else if (color === "pink") {
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          const pink = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
          b6 = white * 0.115926;
          data[i] = pink * 0.085;
        } else {
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 1.9;
        }
      }
    }
    return buffer;
  }

  private ensureGraph(): AudioContext {
    if (this.ctx) return this.ctx;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    this.ctx = ctx;

    // Master chain
    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0;

    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = "lowpass";
    this.masterFilter.frequency.value = 5400;
    this.masterFilter.Q.value = 0.8;

    // Spatial Echo / Delay loop
    this.delayNode = ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.38;
    this.delayFeedback = ctx.createGain();
    this.delayFeedback.gain.value = 0.34;
    this.delayWet = ctx.createGain();
    this.delayWet.gain.value = 0.28;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -16;
    this.compressor.knee.value = 12;
    this.compressor.ratio.value = 3.5;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;

    // Routing: masterFilter -> masterGain -> compressor -> analyser -> destination
    // Plus parallel delay loop off masterFilter
    this.masterFilter.connect(this.masterGain);
    this.masterFilter.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayWet);
    this.delayWet.connect(this.masterGain);

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(ctx.destination);

    // Pre-generate procedural noise buffers
    this.noiseBuffers.white = this.buildNoiseBuffer(ctx, "white");
    this.noiseBuffers.pink = this.buildNoiseBuffer(ctx, "pink");
    this.noiseBuffers.brown = this.buildNoiseBuffer(ctx, "brown");

    // Ch 1: Ambient Harmonic Pad
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = "lowpass";
    this.padFilter.frequency.value = 1100;
    this.padFilter.Q.value = 2.2;

    this.padPanner = ctx.createStereoPanner();
    this.padGain = ctx.createGain();
    this.padGain.gain.value = 0.35;

    this.padFilter.connect(this.padPanner);
    this.padPanner.connect(this.padGain);
    this.padGain.connect(this.masterFilter);

    const ratios = [1, 1.498, 2.006]; // Fundamental, fifth, shimmering octave
    const types: OscillatorType[] = ["sawtooth", "triangle", "sine"];
    this.padOscs = ratios.map((ratio, idx) => {
      const osc = ctx.createOscillator();
      osc.type = types[idx];
      osc.frequency.value = 110 * ratio;
      osc.detune.value = (idx - 1) * 5.5;
      osc.connect(this.padFilter!);
      osc.start();
      return osc;
    });

    this.lfoOsc = ctx.createOscillator();
    this.lfoOsc.type = "sine";
    this.lfoOsc.frequency.value = 0.14;
    this.lfoDepth = ctx.createGain();
    this.lfoDepth.gain.value = 240;
    this.lfoOsc.connect(this.lfoDepth);
    this.lfoDepth.connect(this.padFilter.frequency);
    this.lfoOsc.start();

    // Ch 2: Atmosphere Noise
    this.noiseFilter = ctx.createBiquadFilter();
    this.noiseFilter.type = "bandpass";
    this.noiseFilter.frequency.value = 920;
    this.noiseFilter.Q.value = 1.4;
    this.noisePanner = ctx.createStereoPanner();
    this.noiseGain = ctx.createGain();
    this.noiseGain.gain.value = 0.25;

    this.noiseFilter.connect(this.noisePanner);
    this.noisePanner.connect(this.noiseGain);
    this.noiseGain.connect(this.masterFilter);

    this.startNoiseSource("pink");

    // Ch 3: Sub-Harmonic Drone
    this.droneFilter = ctx.createBiquadFilter();
    this.droneFilter.type = "lowpass";
    this.droneFilter.frequency.value = 260;
    this.dronePanner = ctx.createStereoPanner();
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0.3;

    this.droneFilter.connect(this.dronePanner);
    this.dronePanner.connect(this.droneGain);
    this.droneGain.connect(this.masterFilter);

    this.droneOscSub = ctx.createOscillator();
    this.droneOscSub.type = "sine";
    this.droneOscSub.frequency.value = 55;
    this.droneOscSub.connect(this.droneFilter);
    this.droneOscSub.start();

    this.droneOscOctave = ctx.createOscillator();
    this.droneOscOctave.type = "triangle";
    this.droneOscOctave.frequency.value = 110;
    const octTrim = ctx.createGain();
    octTrim.gain.value = 0.32;
    this.droneOscOctave.connect(octTrim);
    octTrim.connect(this.droneFilter);
    this.droneOscOctave.start();

    // Ch 4: Spatial Pentatonic Pulse
    this.pulsePanner = ctx.createStereoPanner();
    this.pulseGain = ctx.createGain();
    this.pulseGain.gain.value = 0.3;
    this.pulsePanner.connect(this.pulseGain);
    this.pulseGain.connect(this.masterFilter);

    this.startPulseScheduler();

    return ctx;
  }

  private startNoiseSource(color: NoiseColor) {
    if (!this.ctx || !this.noiseFilter) return;
    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // Already stopped
      }
    }
    const source = this.ctx.createBufferSource();
    source.buffer =
      this.noiseBuffers[color] ?? this.buildNoiseBuffer(this.ctx, color);
    source.loop = true;
    source.connect(this.noiseFilter);
    source.start();
    this.noiseSource = source;
    this.currentNoiseColor = color;
  }

  private startPulseScheduler() {
    if (this.pulseTimer) clearInterval(this.pulseTimer);
    const pentatonic = [1, 1.125, 1.25, 1.5, 1.667, 2.0, 2.25];
    let step = 0;

    this.pulseTimer = setInterval(() => {
      if (!this.ctx || !this.isRunning || !this.pulsePanner || !this.lastParams) {
        return;
      }
      if (this.lastParams.pulseMuted || this.lastParams.pulseLevel <= 0.01) {
        return;
      }
      if (Math.random() > 0.25 + this.lastParams.pulseDensity * 0.72) {
        return;
      }

      const now = this.ctx.currentTime;
      const ratio = pentatonic[step % pentatonic.length];
      step += 1 + Math.floor(Math.random() * 2);

      const osc = this.ctx.createOscillator();
      const env = this.ctx.createGain();
      const notePan = this.ctx.createStereoPanner();

      osc.type = "sine";
      osc.frequency.setValueAtTime(
        this.lastParams.padFreqHz * 2 * ratio,
        now
      );
      notePan.pan.setValueAtTime(
        Math.max(-1, Math.min(1, this.lastParams.pulsePan + (Math.random() - 0.5) * 0.7)),
        now
      );

      env.gain.setValueAtTime(0.0001, now);
      env.gain.exponentialRampToValueAtTime(0.18, now + 0.045);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);

      osc.connect(env);
      env.connect(notePan);
      notePan.connect(this.pulsePanner);

      osc.start(now);
      osc.stop(now + 1.55);
    }, 680);
  }

  async setPower(on: boolean, params: SynthPatchParams): Promise<AudioContextState> {
    this.lastParams = params;
    const ctx = this.ensureGraph();
    if (on) {
      if (ctx.state === "suspended") {
        await ctx.resume();
      }
      this.isRunning = true;
      this.applyParams(params);
    } else {
      this.isRunning = false;
      if (this.masterGain) {
        this.masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.045);
      }
    }
    return ctx.state;
  }

  applyParams(params: SynthPatchParams) {
    this.lastParams = params;
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const ramp = 0.035;

    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(
        this.isRunning ? params.masterVolume * 0.85 : 0,
        now,
        ramp
      );
    }

    if (this.masterFilter) {
      const shimmerBoost = params.spatialY * 3200;
      this.masterFilter.frequency.setTargetAtTime(
        Math.min(14000, params.masterToneHz + shimmerBoost),
        now,
        ramp
      );
    }

    if (this.delayFeedback && this.delayWet && this.delayNode) {
      this.delayFeedback.gain.setTargetAtTime(
        0.15 + params.spatialY * 0.48,
        now,
        ramp
      );
      this.delayWet.gain.setTargetAtTime(0.12 + params.spatialY * 0.42, now, ramp);
      this.delayNode.delayTime.setTargetAtTime(
        0.24 + Math.abs(params.spatialX) * 0.24,
        now,
        0.08
      );
    }

    // Ch 1 Pad
    const ratios = [1, 1.498, 2.006];
    this.padOscs.forEach((osc, i) => {
      osc.frequency.setTargetAtTime(params.padFreqHz * ratios[i], now, ramp);
    });
    this.padFilter?.frequency.setTargetAtTime(params.padCutoffHz, now, ramp);
    this.padFilter?.Q.setTargetAtTime(params.padResonance, now, ramp);
    this.padPanner?.pan.setTargetAtTime(
      clampPan(params.padPan + params.spatialX * 0.35),
      now,
      ramp
    );
    this.padGain?.gain.setTargetAtTime(
      params.padMuted ? 0 : params.padLevel * 0.42,
      now,
      ramp
    );

    // Ch 2 Noise
    if (params.noiseColor !== this.currentNoiseColor) {
      this.startNoiseSource(params.noiseColor);
    }
    this.noiseFilter?.frequency.setTargetAtTime(params.noiseCutoffHz, now, ramp);
    this.noiseFilter?.Q.setTargetAtTime(params.noiseResonance, now, ramp);
    this.noisePanner?.pan.setTargetAtTime(
      clampPan(params.noisePan - params.spatialX * 0.25),
      now,
      ramp
    );
    this.noiseGain?.gain.setTargetAtTime(
      params.noiseMuted ? 0 : params.noiseLevel * 0.65,
      now,
      ramp
    );

    // Ch 3 Drone
    this.droneOscSub?.frequency.setTargetAtTime(params.droneFreqHz, now, ramp);
    this.droneOscOctave?.frequency.setTargetAtTime(
      params.droneFreqHz * 2,
      now,
      ramp
    );
    this.droneFilter?.frequency.setTargetAtTime(params.droneCutoffHz, now, ramp);
    this.dronePanner?.pan.setTargetAtTime(
      clampPan(params.dronePan + params.spatialX * 0.2),
      now,
      ramp
    );
    this.droneGain?.gain.setTargetAtTime(
      params.droneMuted ? 0 : params.droneLevel * 0.48,
      now,
      ramp
    );

    // Ch 4 Pulse
    this.pulsePanner?.pan.setTargetAtTime(
      clampPan(params.pulsePan + params.spatialX * 0.3),
      now,
      ramp
    );
    this.pulseGain?.gain.setTargetAtTime(
      params.pulseMuted ? 0 : params.pulseLevel * 0.55,
      now,
      ramp
    );
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getState(): AudioContextState | "uninitialized" {
    return this.ctx ? this.ctx.state : "uninitialized";
  }

  getActivePower(): boolean {
    return this.isRunning;
  }
}

function clampPan(val: number): number {
  return Math.max(-1, Math.min(1, val));
}

export const soundEngine = new SpatialSoundEngine();
