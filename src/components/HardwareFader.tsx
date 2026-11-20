import { useRef, useState } from "react";

interface HardwareFaderProps {
  label: string;
  value: number; // 0..1
  defaultValue?: number;
  muted?: boolean;
  accent?: "orange" | "cobalt";
  onChange: (value: number) => void;
}

export function HardwareFader({
  label,
  value,
  defaultValue = 0.5,
  muted = false,
  accent = "orange",
  onChange,
}: HardwareFaderProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const computeFromPointer = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 12;
    const usableHeight = Math.max(1, rect.height - pad * 2);
    const rel = 1 - (clientY - (rect.top + pad)) / usableHeight;
    const clamped = Math.max(0, Math.min(1, rel));
    onChange(Number(clamped.toFixed(2)));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    computeFromPointer(e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    computeFromPointer(e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.01 : 0.05;
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(Number(Math.min(1, value + step).toFixed(2)));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(Number(Math.max(0, value - step).toFixed(2)));
    }
  };

  const dbDisplay =
    value <= 0.01
      ? "-∞ dB"
      : `${(20 * Math.log10(value)).toFixed(1)} dB`;

  const pct = Math.round(value * 100);

  return (
    <div className="flex flex-col items-center select-none">
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={`${label} Level`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={dbDisplay}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() => onChange(defaultValue)}
        onKeyDown={handleKeyDown}
        style={{ touchAction: "none" }}
        className="relative flex h-36 w-11 items-center justify-center rounded border border-[#A59F93] bg-[#C9C4BA] cursor-ns-resize"
      >
        {/* Recessed calibration hash marks */}
        <div className="pointer-events-none absolute inset-y-3 inset-x-1.5 flex flex-col justify-between">
          {[0, 1, 2, 3, 4, 5, 6].map((tick) => (
            <div key={tick} className="flex justify-between">
              <span className="h-[1px] w-1.5 bg-[#847E72]" />
              <span className="h-[1px] w-1.5 bg-[#847E72]" />
            </div>
          ))}
        </div>

        {/* Center fader slot */}
        <div className="h-28 w-1.5 rounded-full bg-[#16181A]" />

        {/* Active fill gauge */}
        <div
          style={{ height: `${Math.round(value * 108)}px` }}
          className={`pointer-events-none absolute bottom-3.5 w-1 rounded-full transition-colors ${
            muted
              ? "bg-[#6D6A62]"
              : accent === "orange"
                ? "bg-[#F24E1E]"
                : "bg-[#1D5BFF]"
          }`}
        />

        {/* Machined fader cap */}
        <div
          style={{ bottom: `calc(${value * 100}% - ${value * 22}px)` }}
          className={`pointer-events-none absolute left-1 right-1 h-5 rounded-sm border bg-[#ECEAE3] shadow-[0_2px_4px_rgba(27,28,30,0.28)] flex items-center justify-center ${
            dragging ? "border-[#1D5BFF]" : "border-[#6F6A60]"
          }`}
        >
          <span
            className={`h-[2px] w-6 ${
              muted
                ? "bg-[#8D8980]"
                : accent === "orange"
                  ? "bg-[#F24E1E]"
                  : "bg-[#1D5BFF]"
            }`}
          />
        </div>
      </div>

      <span className="mt-1.5 font-display text-[10px] font-semibold uppercase tracking-[0.09em] text-[#5A5C61]">
        {label}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-[#1B1C1E]">
        {muted ? "MUTED" : dbDisplay}
      </span>
    </div>
  );
}
