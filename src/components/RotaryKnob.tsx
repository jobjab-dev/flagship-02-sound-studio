import { useRef, useState } from "react";

interface RotaryKnobProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue: number;
  unit?: string;
  accent?: "orange" | "cobalt" | "ink";
  size?: number;
  formatValue?: (val: number) => string;
  onChange: (value: number) => void;
}

export function RotaryKnob({
  label,
  value,
  min,
  max,
  step = 0.01,
  defaultValue,
  unit = "",
  accent = "orange",
  size = 62,
  formatValue,
  onChange,
}: RotaryKnobProps) {
  const [dragging, setDragging] = useState(false);
  const dragOriginRef = useRef<{ y: number; startVal: number } | null>(null);

  const ratio = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const angleDeg = -135 + ratio * 270;

  const clampAndSnap = (raw: number) => {
    const clamped = Math.max(min, Math.min(max, raw));
    const snapped = Math.round(clamped / step) * step;
    const decimals = step < 1 ? 2 : 0;
    return Number(snapped.toFixed(decimals));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragOriginRef.current = { y: e.clientY, startVal: value };
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragOriginRef.current) return;
    const dy = dragOriginRef.current.y - e.clientY;
    const sensitivity = e.shiftKey ? 480 : 170;
    const deltaVal = (dy / sensitivity) * (max - min);
    onChange(clampAndSnap(dragOriginRef.current.startVal + deltaVal));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragOriginRef.current = null;
    setDragging(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const delta = (max - min) / (e.shiftKey ? 100 : 25);
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      onChange(clampAndSnap(value + delta));
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      onChange(clampAndSnap(value - delta));
    }
  };

  const accentStroke =
    accent === "orange"
      ? "#F24E1E"
      : accent === "cobalt"
        ? "#1D5BFF"
        : "#1B1C1E";

  const displayText = formatValue
    ? formatValue(value)
    : `${step >= 1 ? Math.round(value) : value.toFixed(2)}${unit}`;

  // Arc math for SVG track (-135deg to +135deg)
  const r = 24;
  const cx = 32;
  const cy = 32;
  const startAngle = (-225 * Math.PI) / 180;
  const endAngle = (45 * Math.PI) / 180;
  const activeAngle = startAngle + ratio * (endAngle - startAngle);

  const arcPath = (a1: number, a2: number) => {
    const x1 = cx + r * Math.cos(a1);
    const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2);
    const y2 = cy + r * Math.sin(a2);
    const largeArc = a2 - a1 > Math.PI ? 1 : 0;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={displayText}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onDoubleClick={() => onChange(defaultValue)}
        onKeyDown={handleKeyDown}
        style={{ width: size, height: size, touchAction: "none" }}
        className={`relative flex items-center justify-center rounded-full cursor-ns-resize transition-transform ${
          dragging ? "scale-[1.03]" : ""
        }`}
        title={`${label}: ${displayText} (Drag vertically · Shift = fine · Double-click = reset)`}
      >
        <svg viewBox="0 0 64 64" className="h-full w-full overflow-visible">
          <path
            d={arcPath(startAngle, endAngle)}
            fill="none"
            stroke="#ABA599"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {ratio > 0.005 && (
            <path
              d={arcPath(startAngle, activeAngle)}
              fill="none"
              stroke={accentStroke}
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}
          {/* Machined knob cap */}
          <circle
            cx={cx}
            cy={cy}
            r="17.5"
            fill="#ECEAE3"
            stroke={dragging ? accentStroke : "#7C776D"}
            strokeWidth="1.5"
          />
          <circle
            cx={cx}
            cy={cy}
            r="13.5"
            fill="#D8D5CD"
            stroke="#BDB7AA"
            strokeWidth="0.75"
          />
          {/* Pointer notch rotated around center */}
          <g transform={`rotate(${angleDeg} ${cx} ${cy})`}>
            <line
              x1={cx}
              y1={cy - 4}
              x2={cx}
              y2={cy - 15.5}
              stroke={accentStroke}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      <span className="mt-1 font-display text-[10px] font-semibold uppercase tracking-[0.09em] text-[#5A5C61]">
        {label}
      </span>
      <span className="font-mono text-[11px] font-medium tabular-nums text-[#1B1C1E]">
        {displayText}
      </span>
    </div>
  );
}
