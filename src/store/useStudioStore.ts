import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { NoiseColor, SynthPatchParams } from "../audio/SoundEngine";

export type VisualizerMode = "waveform" | "spectrum" | "dual";

export interface SoundPreset {
  id: string;
  name: string;
  category: "factory" | "user";
  params: SynthPatchParams;
  createdAt: number;
}

export const FACTORY_PRESETS: SoundPreset[] = [
  {
    id: "factory-alpine-rain",
    name: "Alpine Rain",
    category: "factory",
    createdAt: 1,
    params: {
      masterVolume: 0.72,
      masterToneHz: 4800,
      spatialX: 0.08,
      spatialY: 0.45,
      padLevel: 0.56,
      padFreqHz: 110,
      padCutoffHz: 940,
      padResonance: 2.4,
      padPan: -0.15,
      padMuted: false,
      noiseLevel: 0.62,
      noiseColor: "pink",
      noiseCutoffHz: 1320,
      noiseResonance: 1.6,
      noisePan: 0.1,
      noiseMuted: false,
      droneLevel: 0.42,
      droneFreqHz: 55,
      droneCutoffHz: 240,
      dronePan: 0,
      droneMuted: false,
      pulseLevel: 0.48,
      pulseDensity: 0.52,
      pulsePan: 0.25,
      pulseMuted: false,
    },
  },
  {
    id: "factory-tape-hall",
    name: "Tape Hall",
    category: "factory",
    createdAt: 2,
    params: {
      masterVolume: 0.74,
      masterToneHz: 3200,
      spatialX: -0.22,
      spatialY: 0.72,
      padLevel: 0.78,
      padFreqHz: 146.83,
      padCutoffHz: 1450,
      padResonance: 4.2,
      padPan: -0.25,
      padMuted: false,
      noiseLevel: 0.28,
      noiseColor: "brown",
      noiseCutoffHz: 520,
      noiseResonance: 1.2,
      noisePan: 0.2,
      noiseMuted: false,
      droneLevel: 0.55,
      droneFreqHz: 73.42,
      droneCutoffHz: 310,
      dronePan: 0.05,
      droneMuted: false,
      pulseLevel: 0.62,
      pulseDensity: 0.68,
      pulsePan: -0.15,
      pulseMuted: false,
    },
  },
  {
    id: "factory-midnight-drift",
    name: "Midnight Drift",
    category: "factory",
    createdAt: 3,
    params: {
      masterVolume: 0.7,
      masterToneHz: 2400,
      spatialX: 0.35,
      spatialY: 0.84,
      padLevel: 0.68,
      padFreqHz: 98,
      padCutoffHz: 680,
      padResonance: 5.5,
      padPan: 0.18,
      padMuted: false,
      noiseLevel: 0.45,
      noiseColor: "brown",
      noiseCutoffHz: 340,
      noiseResonance: 2.8,
      noisePan: -0.35,
      noiseMuted: false,
      droneLevel: 0.72,
      droneFreqHz: 49,
      droneCutoffHz: 185,
      dronePan: 0,
      droneMuted: false,
      pulseLevel: 0.35,
      pulseDensity: 0.34,
      pulsePan: 0.4,
      pulseMuted: false,
    },
  },
  {
    id: "factory-suborbital",
    name: "Suborbital",
    category: "factory",
    createdAt: 4,
    params: {
      masterVolume: 0.75,
      masterToneHz: 6400,
      spatialX: -0.45,
      spatialY: 0.6,
      padLevel: 0.64,
      padFreqHz: 164.81,
      padCutoffHz: 2200,
      padResonance: 6.4,
      padPan: -0.3,
      padMuted: false,
      noiseLevel: 0.32,
      noiseColor: "white",
      noiseCutoffHz: 2800,
      noiseResonance: 4.1,
      noisePan: 0.38,
      noiseMuted: false,
      droneLevel: 0.65,
      droneFreqHz: 41.2,
      droneCutoffHz: 420,
      dronePan: 0,
      droneMuted: false,
      pulseLevel: 0.74,
      pulseDensity: 0.82,
      pulsePan: 0.12,
      pulseMuted: false,
    },
  },
  {
    id: "factory-glass-courtyard",
    name: "Glass Courtyard",
    category: "factory",
    createdAt: 5,
    params: {
      masterVolume: 0.68,
      masterToneHz: 7600,
      spatialX: 0.0,
      spatialY: 0.56,
      padLevel: 0.44,
      padFreqHz: 196,
      padCutoffHz: 1900,
      padResonance: 1.8,
      padPan: 0.12,
      padMuted: false,
      noiseLevel: 0.5,
      noiseColor: "pink",
      noiseCutoffHz: 1750,
      noiseResonance: 1.1,
      noisePan: -0.18,
      noiseMuted: false,
      droneLevel: 0.28,
      droneFreqHz: 65.41,
      droneCutoffHz: 220,
      dronePan: 0,
      droneMuted: false,
      pulseLevel: 0.82,
      pulseDensity: 0.76,
      pulsePan: 0,
      pulseMuted: false,
    },
  },
];

interface StudioState {
  params: SynthPatchParams;
  activePresetId: string;
  userPresets: SoundPreset[];
  visualizerMode: VisualizerMode;
  updateParam: <K extends keyof SynthPatchParams>(
    key: K,
    value: SynthPatchParams[K]
  ) => void;
  setNoiseColor: (color: NoiseColor) => void;
  setVisualizerMode: (mode: VisualizerMode) => void;
  loadPreset: (preset: SoundPreset) => void;
  saveUserPreset: (name: string) => SoundPreset;
  deleteUserPreset: (id: string) => void;
  randomizePatch: () => void;
  resetStorage: () => void;
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      params: FACTORY_PRESETS[0].params,
      activePresetId: FACTORY_PRESETS[0].id,
      userPresets: [],
      visualizerMode: "dual",

      updateParam: (key, value) =>
        set((state) => ({
          activePresetId: "custom-modified",
          params: {
            ...state.params,
            [key]: value,
          },
        })),

      setNoiseColor: (color) =>
        set((state) => ({
          activePresetId: "custom-modified",
          params: {
            ...state.params,
            noiseColor: color,
          },
        })),

      setVisualizerMode: (mode) => set({ visualizerMode: mode }),

      loadPreset: (preset) =>
        set({
          params: { ...preset.params },
          activePresetId: preset.id,
        }),

      saveUserPreset: (rawName) => {
        const cleanName = rawName.trim() || `User Patch ${get().userPresets.length + 1}`;
        const preset: SoundPreset = {
          id: `user-${Date.now()}`,
          name: cleanName,
          category: "user",
          createdAt: Date.now(),
          params: { ...get().params },
        };
        set((state) => ({
          userPresets: [preset, ...state.userPresets],
          activePresetId: preset.id,
        }));
        return preset;
      },

      deleteUserPreset: (id) =>
        set((state) => ({
          userPresets: state.userPresets.filter((p) => p.id !== id),
          activePresetId:
            state.activePresetId === id ? "custom-modified" : state.activePresetId,
        })),

      randomizePatch: () => {
        const colors: NoiseColor[] = ["white", "pink", "brown"];
        const roots = [82.41, 98, 110, 130.81, 146.83, 164.81, 196];
        const root = roots[Math.floor(Math.random() * roots.length)];
        set({
          activePresetId: "custom-modified",
          params: {
            masterVolume: 0.72,
            masterToneHz: Math.round(1800 + Math.random() * 6800),
            spatialX: Number(((Math.random() - 0.5) * 1.4).toFixed(2)),
            spatialY: Number((0.2 + Math.random() * 0.75).toFixed(2)),
            padLevel: Number((0.35 + Math.random() * 0.55).toFixed(2)),
            padFreqHz: root,
            padCutoffHz: Math.round(450 + Math.random() * 2600),
            padResonance: Number((1 + Math.random() * 8).toFixed(1)),
            padPan: Number(((Math.random() - 0.5) * 1.2).toFixed(2)),
            padMuted: false,
            noiseLevel: Number((0.18 + Math.random() * 0.6).toFixed(2)),
            noiseColor: colors[Math.floor(Math.random() * colors.length)],
            noiseCutoffHz: Math.round(280 + Math.random() * 2800),
            noiseResonance: Number((0.8 + Math.random() * 5).toFixed(1)),
            noisePan: Number(((Math.random() - 0.5) * 1.2).toFixed(2)),
            noiseMuted: false,
            droneLevel: Number((0.25 + Math.random() * 0.6).toFixed(2)),
            droneFreqHz: Number((root / 2).toFixed(2)),
            droneCutoffHz: Math.round(140 + Math.random() * 650),
            dronePan: Number(((Math.random() - 0.5) * 0.4).toFixed(2)),
            droneMuted: false,
            pulseLevel: Number((0.25 + Math.random() * 0.65).toFixed(2)),
            pulseDensity: Number((0.2 + Math.random() * 0.75).toFixed(2)),
            pulsePan: Number(((Math.random() - 0.5) * 1.2).toFixed(2)),
            pulseMuted: false,
          },
        });
      },

      resetStorage: () =>
        set({
          params: FACTORY_PRESETS[0].params,
          activePresetId: FACTORY_PRESETS[0].id,
          userPresets: [],
          visualizerMode: "dual",
        }),
    }),
    {
      name: "kineton-m4-studio-v1",
      partialize: (state) => ({
        params: state.params,
        activePresetId: state.activePresetId,
        userPresets: state.userPresets,
        visualizerMode: state.visualizerMode,
      }),
    }
  )
);
