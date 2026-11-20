import { useEffect, useState } from "react";
import {
  Power,
  Save,
  Trash2,
  Volume2,
  VolumeX,
  Waves,
  Sliders,
} from "lucide-react";
import { soundEngine, type NoiseColor } from "./audio/SoundEngine";
import { FACTORY_PRESETS, useStudioStore } from "./store/useStudioStore";
import { RotaryKnob } from "./components/RotaryKnob";
import { HardwareFader } from "./components/HardwareFader";
import { AudioVisualizer } from "./components/AudioVisualizer";
import { SpatialPad } from "./components/SpatialPad";
import { QaDrawer } from "./components/QaDrawer";

export function App() {
  const {
    params,
    activePresetId,
    userPresets,
    visualizerMode,
    updateParam,
    setNoiseColor,
    setVisualizerMode,
    loadPreset,
    saveUserPreset,
    deleteUserPreset,
    randomizePatch,
    resetStorage,
  } = useStudioStore();

  const [powered, setPowered] = useState(false);
  const [audioState, setAudioState] = useState<string>("uninitialized");
  const [presetInput, setPresetInput] = useState("");
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  // Sync every store parameter change straight into live Web Audio nodes
  useEffect(() => {
    soundEngine.applyParams(params);
  }, [params]);

  const handleTogglePower = async () => {
    const nextPower = !powered;
    const state = await soundEngine.setPower(nextPower, params);
    setPowered(nextPower);
    setAudioState(state);
  };

  // Auto-wake AudioContext cleanly when user touches any preset or knob if desired
  const ensurePoweredOnPreset = async () => {
    if (!powered) {
      const state = await soundEngine.setPower(true, params);
      setPowered(true);
      setAudioState(state);
    }
  };

  const handleSavePreset = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = saveUserPreset(presetInput);
    setPresetInput("");
    setSaveFeedback(`Saved "${saved.name}"`);
    setTimeout(() => setSaveFeedback(null), 2600);
  };

  const handleCycleFactoryPreset = async () => {
    const idx = FACTORY_PRESETS.findIndex((p) => p.id === activePresetId);
    const next = FACTORY_PRESETS[(idx + 1) % FACTORY_PRESETS.length];
    loadPreset(next);
    await ensurePoweredOnPreset();
  };

  const allPresets = [...userPresets, ...FACTORY_PRESETS];
  const currentPresetName =
    allPresets.find((p) => p.id === activePresetId)?.name ?? "Modified Patch";

  return (
    <div className="min-h-screen flex flex-col bg-[#E4E2DC] text-[#1B1C1E]">
      {/* Machined Hardware Top Deck */}
      <header className="border-b border-[#ABA599] chassis-brushed">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-[#6F6A60] bg-[#16181A] text-[#F24E1E]">
              <Waves className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight uppercase leading-none">
                KINETON M-4
              </h1>
              <p className="mt-0.5 font-mono text-[11px] text-[#5A5C61]">
                4-CHANNEL SPATIAL SYNTHESIZER · PURE WEB AUDIO DSP
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded border border-[#ABA599] bg-[#ECEAE3] px-3 py-1.5 font-mono text-[11px]">
              <span className="text-[#5A5C61]">PATCH:</span>
              <span className="font-semibold text-[#1B1C1E]">
                {currentPresetName}
              </span>
            </div>

            <button
              type="button"
              onClick={handleTogglePower}
              className={`inline-flex items-center gap-2 rounded border px-4 py-2 font-display text-xs font-bold uppercase tracking-wider transition-colors ${
                powered
                  ? "border-[#B8320D] bg-[#F24E1E] text-white"
                  : "border-[#42454B] bg-[#16181A] text-[#E4E2DC] hover:border-[#F24E1E]"
              }`}
            >
              <Power className="h-3.5 w-3.5" />
              {powered ? "DSP ON · LIVE" : "POWER ON AUDIO"}
            </button>
          </div>
        </div>
      </header>

      {/* Main Synthesizer Console Chassis */}
      <main className="mx-auto w-full max-w-[1380px] flex-1 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left & Center Oscilloscope + 4 Synthesis Channels (9 cols) */}
          <div className="flex flex-col gap-5 lg:col-span-9">
            {/* Oscilloscope & Spatial XY Deck */}
            <div className="grid grid-cols-1 gap-4 rounded border border-[#ABA599] chassis-brushed p-4 md:grid-cols-12">
              <div className="md:col-span-8">
                <AudioVisualizer
                  powered={powered}
                  mode={visualizerMode}
                  onModeChange={setVisualizerMode}
                />
              </div>
              <div className="flex flex-col justify-between gap-3 md:col-span-4">
                <SpatialPad
                  x={params.spatialX}
                  y={params.spatialY}
                  onChange={(nx, ny) => {
                    updateParam("spatialX", nx);
                    updateParam("spatialY", ny);
                  }}
                />
                <div className="flex items-center justify-around rounded border border-[#BEB9AE] bg-[#ECEAE3] py-2 px-2">
                  <RotaryKnob
                    label="Master Gain"
                    value={params.masterVolume}
                    min={0}
                    max={1}
                    step={0.01}
                    defaultValue={0.72}
                    size={54}
                    accent="orange"
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    onChange={(v) => updateParam("masterVolume", v)}
                  />
                  <RotaryKnob
                    label="Master Tone"
                    value={params.masterToneHz}
                    min={300}
                    max={12000}
                    step={50}
                    defaultValue={4800}
                    size={54}
                    accent="cobalt"
                    formatValue={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}Hz`
                    }
                    onChange={(v) => updateParam("masterToneHz", v)}
                  />
                </div>
              </div>
            </div>

            {/* 4 Modular Hardware Channel Strips */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {/* CH 1: AMBIENT HARMONIC PAD */}
              <section className="flex flex-col justify-between rounded border border-[#ABA599] bg-[#ECEAE3] p-4">
                <div className="flex items-center justify-between border-b border-[#CCC7BA] pb-2.5">
                  <div>
                    <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                      CH 1 · Ambient Pad
                    </h2>
                    <p className="font-mono text-[10px] text-[#5A5C61]">
                      3x Detuned Osc + LFO
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateParam("padMuted", !params.padMuted)}
                    aria-label={params.padMuted ? "Unmute Pad" : "Mute Pad"}
                    className={`rounded border p-1.5 transition-colors ${
                      params.padMuted
                        ? "border-[#B8320D] bg-[#F24E1E] text-white"
                        : "border-[#ABA599] bg-[#D8D5CD] text-[#1B1C1E]"
                    }`}
                  >
                    {params.padMuted ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="my-4 grid grid-cols-2 gap-y-4 gap-x-2">
                  <RotaryKnob
                    label="Pitch"
                    value={params.padFreqHz}
                    min={65}
                    max={330}
                    step={1}
                    defaultValue={110}
                    unit=" Hz"
                    accent="orange"
                    onChange={(v) => updateParam("padFreqHz", v)}
                  />
                  <RotaryKnob
                    label="Cutoff"
                    value={params.padCutoffHz}
                    min={180}
                    max={4800}
                    step={20}
                    defaultValue={940}
                    formatValue={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}Hz`
                    }
                    accent="cobalt"
                    onChange={(v) => updateParam("padCutoffHz", v)}
                  />
                  <RotaryKnob
                    label="Res Q"
                    value={params.padResonance}
                    min={0.5}
                    max={14}
                    step={0.1}
                    defaultValue={2.4}
                    accent="ink"
                    onChange={(v) => updateParam("padResonance", v)}
                  />
                  <RotaryKnob
                    label="Pan"
                    value={params.padPan}
                    min={-1}
                    max={1}
                    step={0.05}
                    defaultValue={-0.15}
                    formatValue={(v) =>
                      Math.abs(v) < 0.05
                        ? "C"
                        : v < 0
                          ? `L${Math.round(Math.abs(v) * 100)}`
                          : `R${Math.round(v * 100)}`
                    }
                    accent="ink"
                    onChange={(v) => updateParam("padPan", v)}
                  />
                </div>

                <div className="flex justify-center border-t border-[#CCC7BA] pt-3">
                  <HardwareFader
                    label="Pad Gain"
                    value={params.padLevel}
                    defaultValue={0.56}
                    muted={params.padMuted}
                    accent="orange"
                    onChange={(v) => updateParam("padLevel", v)}
                  />
                </div>
              </section>

              {/* CH 2: ATMOSPHERE NOISE GENERATOR */}
              <section className="flex flex-col justify-between rounded border border-[#ABA599] bg-[#ECEAE3] p-4">
                <div className="flex items-center justify-between border-b border-[#CCC7BA] pb-2.5">
                  <div>
                    <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                      CH 2 · Rain / Surf
                    </h2>
                    <p className="font-mono text-[10px] text-[#5A5C61]">
                      DSP Buffer Noise + BP
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateParam("noiseMuted", !params.noiseMuted)}
                    aria-label={params.noiseMuted ? "Unmute Noise" : "Mute Noise"}
                    className={`rounded border p-1.5 transition-colors ${
                      params.noiseMuted
                        ? "border-[#B8320D] bg-[#F24E1E] text-white"
                        : "border-[#ABA599] bg-[#D8D5CD] text-[#1B1C1E]"
                    }`}
                  >
                    {params.noiseMuted ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="mt-3 flex border border-[#ABA599] bg-[#D8D5CD] p-0.5">
                  {(["white", "pink", "brown"] as NoiseColor[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNoiseColor(c)}
                      className={`flex-1 py-1 font-mono text-[10px] uppercase transition-colors ${
                        params.noiseColor === c
                          ? "bg-[#16181A] text-[#F24E1E] font-semibold"
                          : "text-[#5A5C61] hover:text-[#1B1C1E]"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <div className="my-4 grid grid-cols-2 gap-y-4 gap-x-2">
                  <RotaryKnob
                    label="Filter Hz"
                    value={params.noiseCutoffHz}
                    min={140}
                    max={7200}
                    step={20}
                    defaultValue={1320}
                    formatValue={(v) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}Hz`
                    }
                    accent="cobalt"
                    onChange={(v) => updateParam("noiseCutoffHz", v)}
                  />
                  <RotaryKnob
                    label="Band Q"
                    value={params.noiseResonance}
                    min={0.5}
                    max={12}
                    step={0.1}
                    defaultValue={1.6}
                    accent="orange"
                    onChange={(v) => updateParam("noiseResonance", v)}
                  />
                  <div className="col-span-2 flex justify-center">
                    <RotaryKnob
                      label="Stereo Pan"
                      value={params.noisePan}
                      min={-1}
                      max={1}
                      step={0.05}
                      defaultValue={0.1}
                      formatValue={(v) =>
                        Math.abs(v) < 0.05
                          ? "C"
                          : v < 0
                            ? `L${Math.round(Math.abs(v) * 100)}`
                            : `R${Math.round(v * 100)}`
                      }
                      accent="ink"
                      onChange={(v) => updateParam("noisePan", v)}
                    />
                  </div>
                </div>

                <div className="flex justify-center border-t border-[#CCC7BA] pt-3">
                  <HardwareFader
                    label="Noise Gain"
                    value={params.noiseLevel}
                    defaultValue={0.62}
                    muted={params.noiseMuted}
                    accent="cobalt"
                    onChange={(v) => updateParam("noiseLevel", v)}
                  />
                </div>
              </section>

              {/* CH 3: SUB-HARMONIC DRONE */}
              <section className="flex flex-col justify-between rounded border border-[#ABA599] bg-[#ECEAE3] p-4">
                <div className="flex items-center justify-between border-b border-[#CCC7BA] pb-2.5">
                  <div>
                    <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                      CH 3 · Sub Drone
                    </h2>
                    <p className="font-mono text-[10px] text-[#5A5C61]">
                      Sine + Sub Triangle
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateParam("droneMuted", !params.droneMuted)}
                    aria-label={params.droneMuted ? "Unmute Drone" : "Mute Drone"}
                    className={`rounded border p-1.5 transition-colors ${
                      params.droneMuted
                        ? "border-[#B8320D] bg-[#F24E1E] text-white"
                        : "border-[#ABA599] bg-[#D8D5CD] text-[#1B1C1E]"
                    }`}
                  >
                    {params.droneMuted ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="my-4 grid grid-cols-2 gap-y-4 gap-x-2">
                  <RotaryKnob
                    label="Sub Freq"
                    value={params.droneFreqHz}
                    min={36}
                    max={140}
                    step={0.5}
                    defaultValue={55}
                    unit="Hz"
                    accent="orange"
                    onChange={(v) => updateParam("droneFreqHz", v)}
                  />
                  <RotaryKnob
                    label="Warmth LP"
                    value={params.droneCutoffHz}
                    min={90}
                    max={1800}
                    step={10}
                    defaultValue={240}
                    unit="Hz"
                    accent="cobalt"
                    onChange={(v) => updateParam("droneCutoffHz", v)}
                  />
                  <div className="col-span-2 flex justify-center">
                    <RotaryKnob
                      label="Stereo Pan"
                      value={params.dronePan}
                      min={-1}
                      max={1}
                      step={0.05}
                      defaultValue={0}
                      formatValue={(v) =>
                        Math.abs(v) < 0.05
                          ? "C"
                          : v < 0
                            ? `L${Math.round(Math.abs(v) * 100)}`
                            : `R${Math.round(v * 100)}`
                      }
                      accent="ink"
                      onChange={(v) => updateParam("dronePan", v)}
                    />
                  </div>
                </div>

                <div className="flex justify-center border-t border-[#CCC7BA] pt-3">
                  <HardwareFader
                    label="Drone Gain"
                    value={params.droneLevel}
                    defaultValue={0.42}
                    muted={params.droneMuted}
                    accent="orange"
                    onChange={(v) => updateParam("droneLevel", v)}
                  />
                </div>
              </section>

              {/* CH 4: SPATIAL PENTATONIC PULSE */}
              <section className="flex flex-col justify-between rounded border border-[#ABA599] bg-[#ECEAE3] p-4">
                <div className="flex items-center justify-between border-b border-[#CCC7BA] pb-2.5">
                  <div>
                    <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                      CH 4 · Spatial Pulse
                    </h2>
                    <p className="font-mono text-[10px] text-[#5A5C61]">
                      Generative Bell Echo
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateParam("pulseMuted", !params.pulseMuted)}
                    aria-label={params.pulseMuted ? "Unmute Pulse" : "Mute Pulse"}
                    className={`rounded border p-1.5 transition-colors ${
                      params.pulseMuted
                        ? "border-[#B8320D] bg-[#F24E1E] text-white"
                        : "border-[#ABA599] bg-[#D8D5CD] text-[#1B1C1E]"
                    }`}
                  >
                    {params.pulseMuted ? (
                      <VolumeX className="h-3.5 w-3.5" />
                    ) : (
                      <Volume2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="my-4 grid grid-cols-2 gap-y-4 gap-x-2">
                  <RotaryKnob
                    label="Density"
                    value={params.pulseDensity}
                    min={0.1}
                    max={1}
                    step={0.02}
                    defaultValue={0.52}
                    formatValue={(v) => `${Math.round(v * 100)}%`}
                    accent="cobalt"
                    onChange={(v) => updateParam("pulseDensity", v)}
                  />
                  <RotaryKnob
                    label="Spread Pan"
                    value={params.pulsePan}
                    min={-1}
                    max={1}
                    step={0.05}
                    defaultValue={0.25}
                    formatValue={(v) =>
                      Math.abs(v) < 0.05
                        ? "C"
                        : v < 0
                          ? `L${Math.round(Math.abs(v) * 100)}`
                          : `R${Math.round(v * 100)}`
                    }
                    accent="ink"
                    onChange={(v) => updateParam("pulsePan", v)}
                  />
                </div>

                <div className="mb-3 rounded border border-[#CCC7BA] bg-[#E4E2DC] px-2.5 py-2 font-mono text-[10px] text-[#5A5C61]">
                  Harmonic Root locked to CH 1 ({Math.round(params.padFreqHz)} Hz)
                </div>

                <div className="flex justify-center border-t border-[#CCC7BA] pt-3">
                  <HardwareFader
                    label="Pulse Gain"
                    value={params.pulseLevel}
                    defaultValue={0.48}
                    muted={params.pulseMuted}
                    accent="cobalt"
                    onChange={(v) => updateParam("pulseLevel", v)}
                  />
                </div>
              </section>
            </div>
          </div>

          {/* Right Preset Memory & Persist Bank (3 cols) */}
          <aside className="flex flex-col justify-between rounded border border-[#ABA599] chassis-brushed p-4 lg:col-span-3">
            <div>
              <div className="flex items-center justify-between border-b border-[#ABA599] pb-2.5">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-[#1D5BFF]" />
                  <h2 className="font-display text-sm font-bold uppercase tracking-wide">
                    Memory Banks
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-[#5A5C61]">
                  LOCALSTORAGE
                </span>
              </div>

              <form onSubmit={handleSavePreset} className="mt-3 flex gap-1.5">
                <input
                  type="text"
                  value={presetInput}
                  onChange={(e) => setPresetInput(e.target.value)}
                  placeholder="Preset name..."
                  aria-label="New preset name"
                  className="min-w-0 flex-1 rounded border border-[#9B9588] bg-[#ECEAE3] px-2.5 py-1.5 font-mono text-xs text-[#1B1C1E] placeholder:text-[#6F6A60] focus:border-[#1D5BFF] focus:outline-none"
                />
                <button
                  type="submit"
                  className="inline-flex shrink-0 items-center gap-1 rounded border border-[#113DC0] bg-[#1D5BFF] px-3 py-1.5 font-mono text-xs font-medium text-white hover:bg-[#174CD6]"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save
                </button>
              </form>

              {saveFeedback && (
                <p className="mt-1.5 font-mono text-[11px] font-medium text-[#1D5BFF]">
                  {saveFeedback}
                </p>
              )}

              {/* User Saved Presets */}
              <div className="mt-4">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#5A5C61]">
                  User Saved ({userPresets.length})
                </h3>
                {userPresets.length === 0 ? (
                  <p className="mt-1.5 rounded border border-dashed border-[#ABA599] px-3 py-2.5 font-mono text-[11px] text-[#5A5C61]">
                    Dial knobs &amp; click Save to persist patches to localStorage.
                  </p>
                ) : (
                  <ul className="mt-1.5 flex flex-col gap-1.5">
                    {userPresets.map((preset) => {
                      const active = activePresetId === preset.id;
                      return (
                        <li key={preset.id} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              loadPreset(preset);
                              ensurePoweredOnPreset();
                            }}
                            className={`flex flex-1 items-center justify-between rounded border px-2.5 py-2 text-left text-xs transition-colors ${
                              active
                                ? "border-[#F24E1E] bg-[#16181A] text-white"
                                : "border-[#ABA599] bg-[#ECEAE3] text-[#1B1C1E] hover:border-[#1B1C1E]"
                            }`}
                          >
                            <span className="truncate font-medium">
                              {preset.name}
                            </span>
                            <span className="font-mono text-[10px] opacity-70">
                              USER
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteUserPreset(preset.id)}
                            aria-label={`Delete preset ${preset.name}`}
                            className="rounded border border-[#ABA599] bg-[#ECEAE3] p-2 text-[#5A5C61] hover:border-[#F24E1E] hover:text-[#F24E1E]"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Factory Sound Banks */}
              <div className="mt-5">
                <h3 className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#5A5C61]">
                  Factory Soundscapes
                </h3>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {FACTORY_PRESETS.map((preset, idx) => {
                    const active = activePresetId === preset.id;
                    return (
                      <li key={preset.id}>
                        <button
                          type="button"
                          onClick={() => {
                            loadPreset(preset);
                            ensurePoweredOnPreset();
                          }}
                          className={`flex w-full items-center justify-between rounded border px-2.5 py-2 text-left text-xs transition-colors ${
                            active
                              ? "border-[#F24E1E] bg-[#16181A] text-white"
                              : "border-[#ABA599] bg-[#ECEAE3] text-[#1B1C1E] hover:border-[#1B1C1E]"
                          }`}
                        >
                          <span className="font-medium">{preset.name}</span>
                          <span
                            className={`font-mono text-[10px] ${
                              active ? "text-[#F24E1E]" : "text-[#5A5C61]"
                            }`}
                          >
                            F0{idx + 1}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            <div className="mt-5 border-t border-[#ABA599] pt-3 font-mono text-[10px] leading-relaxed text-[#5A5C61]">
              Drag rotary dials &amp; faders vertically. Hold{" "}
              <strong className="text-[#1B1C1E]">Shift</strong> for fine step
              precision, or double-click any control to reset.
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-[#ABA599] bg-[#ECEAE3] px-5 py-3 sm:px-8">
        <div className="mx-auto flex max-w-[1380px] flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#5A5C61]">
          <span>
            KINETON M-4 · WEB AUDIO API + POINTER CAPTURE + ZUSTAND PERSIST
          </span>
          <span>
            Crafted by{" "}
            <a
              href="https://github.com/jobjab-dev"
              target="_blank"
              rel="noreferrer"
              className="text-[#1D5BFF] underline underline-offset-4 hover:text-[#1B1C1E]"
            >
              jobjab-dev
            </a>
          </span>
        </div>
      </footer>

      <QaDrawer
        audioState={audioState}
        powered={powered}
        onUnlockAndPower={handleTogglePower}
        onCyclePreset={handleCycleFactoryPreset}
        onRandomizePatch={() => {
          randomizePatch();
          ensurePoweredOnPreset();
        }}
        onResetStorage={resetStorage}
      />
    </div>
  );
}

export default App;
