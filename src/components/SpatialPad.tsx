import { useRef, useState } from "react";

interface SpatialPadProps {
  x: number; // -1..1
  y: number; // 0..1
  onChange: (x: number, y: number) => void;
}

export function SpatialPad({ x, y, onChange }: SpatialPadProps) {
  const padRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);

  const updateFromClient = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ny = 1 - (clientY - rect.top) / rect.height;
    onChange(
      Number(Math.max(-1, Math.min(1, nx)).toFixed(2)),
      Number(Math.max(0, Math.min(1, ny)).toFixed(2))
    );
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    updateFromClient(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromClient(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setDragging(false);
  };

  const leftPct = ((x + 1) / 2) * 100;
  const topPct = (1 - y) * 100;

  return (
    <div className="flex flex-col">
      <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[#5A5C61]">
        <span>XY SPATIAL FIELD</span>
        <span className="tabular-nums text-[#1B1C1E]">
          PAN {x >= 0 ? `+${x.toFixed(2)}` : x.toFixed(2)} · ECHO{" "}
          {Math.round(y * 100)}%
        </span>
      </div>

      <div
        ref={padRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ touchAction: "none" }}
        className="relative h-36 w-full cursor-crosshair overflow-hidden rounded border border-[#42454B] bg-[#16181A]"
        role="application"
        aria-label="2D spatial stereo and reverb depth pad"
      >
        {/* Spatial crosshair grid */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/10" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10" />
          <div className="absolute inset-4 rounded-full border border-dashed border-white/10" />
        </div>

        {/* Crosshair coordinates */}
        <div
          style={{ left: `${leftPct}%` }}
          className="pointer-events-none absolute top-0 bottom-0 w-[1px] bg-[#1D5BFF]/45"
        />
        <div
          style={{ top: `${topPct}%` }}
          className="pointer-events-none absolute left-0 right-0 h-[1px] bg-[#1D5BFF]/45"
        />

        {/* Tactile puck */}
        <div
          style={{
            left: `calc(${leftPct}% - 10px)`,
            top: `calc(${topPct}% - 10px)`,
          }}
          className={`pointer-events-none absolute h-5 w-5 rounded-full border-2 border-[#ECEAE3] transition-transform ${
            dragging ? "scale-110 bg-[#F24E1E]" : "bg-[#1D5BFF]"
          }`}
        />

        <span className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[9px] text-[#7D828A]">
          L
        </span>
        <span className="pointer-events-none absolute bottom-1.5 right-2 font-mono text-[9px] text-[#7D828A]">
          R
        </span>
        <span className="pointer-events-none absolute top-1.5 left-2 font-mono text-[9px] text-[#7D828A]">
          HALL / SHIMMER
        </span>
      </div>
    </div>
  );
}
