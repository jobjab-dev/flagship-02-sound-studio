import { useState } from "react";
import { SlidersHorizontal, X, Volume2, Shuffle, Disc3, RotateCcw } from "lucide-react";

interface QaDrawerProps {
  audioState: string;
  powered: boolean;
  onUnlockAndPower: () => void;
  onCyclePreset: () => void;
  onRandomizePatch: () => void;
  onResetStorage: () => void;
}

export function QaDrawer({
  audioState,
  powered,
  onUnlockAndPower,
  onCyclePreset,
  onRandomizePatch,
  onResetStorage,
}: QaDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {open ? (
        <div className="w-[295px] rounded border border-[#9B9588] bg-[#ECEAE3] p-3.5 text-[#1B1C1E] shadow-[0_12px_32px_rgba(27,28,30,0.18)]">
          <div className="flex items-center justify-between border-b border-[#BEB9AE] pb-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em]">
              Showcase / QA Deck
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-[#5A5C61] hover:text-[#1B1C1E]"
              aria-label="Close Showcase / QA drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between rounded bg-[#D8D5CD] px-2.5 py-1.5 font-mono text-[10px]">
            <span>AudioContext: {audioState}</span>
            <span className={powered ? "text-[#F24E1E] font-semibold" : ""}>
              {powered ? "ACTIVE" : "STANDBY"}
            </span>
          </div>

          <div className="mt-2.5 flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onUnlockAndPower}
              className="flex items-center justify-between rounded border border-[#BEB9AE] bg-[#E4E2DC] px-2.5 py-2 text-left text-xs font-medium hover:border-[#F24E1E]"
            >
              <span className="inline-flex items-center gap-2">
                <Volume2 className="h-3.5 w-3.5 text-[#F24E1E]" />
                {powered ? "Mute Synth Output" : "Power On & Resume Audio"}
              </span>
              <span className="font-mono text-[10px] text-[#5A5C61]">DSP</span>
            </button>

            <button
              type="button"
              onClick={onCyclePreset}
              className="flex items-center justify-between rounded border border-[#BEB9AE] bg-[#E4E2DC] px-2.5 py-2 text-left text-xs font-medium hover:border-[#1D5BFF]"
            >
              <span className="inline-flex items-center gap-2">
                <Disc3 className="h-3.5 w-3.5 text-[#1D5BFF]" />
                Cycle Factory Preset
              </span>
              <span className="font-mono text-[10px] text-[#5A5C61]">NEXT</span>
            </button>

            <button
              type="button"
              onClick={onRandomizePatch}
              className="flex items-center justify-between rounded border border-[#BEB9AE] bg-[#E4E2DC] px-2.5 py-2 text-left text-xs font-medium hover:border-[#1D5BFF]"
            >
              <span className="inline-flex items-center gap-2">
                <Shuffle className="h-3.5 w-3.5 text-[#1D5BFF]" />
                Randomize Patch Matrix
              </span>
              <span className="font-mono text-[10px] text-[#5A5C61]">GEN</span>
            </button>

            <button
              type="button"
              onClick={onResetStorage}
              className="flex items-center justify-between rounded border border-[#BEB9AE] bg-[#E4E2DC] px-2.5 py-2 text-left text-xs font-medium hover:border-[#1B1C1E]"
            >
              <span className="inline-flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-[#5A5C61]" />
                Reset Saved Presets
              </span>
              <span className="font-mono text-[10px] text-[#5A5C61]">STORAGE</span>
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-[#9B9588] bg-[#ECEAE3]/95 px-3.5 py-1.5 font-mono text-[11px] font-medium text-[#1B1C1E] shadow-[0_4px_12px_rgba(27,28,30,0.12)] hover:border-[#F24E1E]"
        >
          <SlidersHorizontal className="h-3.5 w-3.5 text-[#F24E1E]" />
          Showcase / QA
        </button>
      )}
    </div>
  );
}
