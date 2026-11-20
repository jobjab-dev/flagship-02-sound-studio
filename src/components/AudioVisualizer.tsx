import { useEffect, useRef, useState } from "react";
import { soundEngine } from "../audio/SoundEngine";
import type { VisualizerMode } from "../store/useStudioStore";

interface AudioVisualizerProps {
  powered: boolean;
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
}

export function AudioVisualizer({
  powered,
  mode,
  onModeChange,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rmsDb, setRmsDb] = useState<string>("-∞ dB");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let frameTick = 0;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(100, Math.floor(rect.width));
      const height = Math.max(80, Math.floor(rect.height));

      if (
        canvas.width !== Math.floor(width * dpr) ||
        canvas.height !== Math.floor(height * dpr)
      ) {
        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // Recessed oscilloscope charcoal glass background
      ctx.fillStyle = "#121417";
      ctx.fillRect(0, 0, width, height);

      // Subtle calibration graticule
      ctx.strokeStyle = "rgba(255, 255, 255, 0.055)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 48) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 36) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center zero line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.14)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      const analyser = soundEngine.getAnalyser();

      if (analyser && powered) {
        const bufferLength = analyser.frequencyBinCount;
        const timeData = new Uint8Array(bufferLength);
        const freqData = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(timeData);
        analyser.getByteFrequencyData(freqData);

        // Compute live RMS dB every ~8 frames
        frameTick += 1;
        if (frameTick % 8 === 0) {
          let sumSq = 0;
          for (let i = 0; i < timeData.length; i++) {
            const norm = (timeData[i] - 128) / 128;
            sumSq += norm * norm;
          }
          const rms = Math.sqrt(sumSq / timeData.length);
          const db = rms > 0.0005 ? 20 * Math.log10(rms) : -60;
          setRmsDb(`${db.toFixed(1)} dB`);
        }

        // Draw FFT harmonic bars when spectrum or dual
        if (mode === "spectrum" || mode === "dual") {
          const barCount = 52;
          const barGap = 2;
          const barWidth = Math.max(2, (width - 24) / barCount - barGap);
          for (let i = 0; i < barCount; i++) {
            // Logarithmic-ish bin spacing for musical frequency visual
            const binIdx = Math.min(
              bufferLength - 1,
              Math.floor(Math.pow(i / barCount, 1.45) * (bufferLength * 0.45))
            );
            const val = freqData[binIdx] / 255;
            const barHeight = val * (height * (mode === "spectrum" ? 0.82 : 0.56));
            const x = 12 + i * (barWidth + barGap);
            const y = height - barHeight;

            ctx.fillStyle =
              val > 0.72
                ? "rgba(242, 78, 30, 0.78)"
                : "rgba(29, 91, 255, 0.45)";
            ctx.fillRect(x, y, barWidth, barHeight);
          }
        }

        // Draw live time-domain oscilloscope waveform
        if (mode === "waveform" || mode === "dual") {
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.strokeStyle = "#F24E1E";
          const sliceWidth = width / timeData.length;
          let x = 0;
          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * height) / 2;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        }
      } else {
        if (frameTick !== 0) {
          frameTick = 0;
          setRmsDb("STANDBY");
        }
        // Subtle calm baseline trace when powered off
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = "rgba(242, 78, 30, 0.32)";
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
      }

      ctx.restore();
      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [powered, mode]);

  return (
    <div className="rounded border border-[#42454B] bg-[#16181A] p-3 text-[#E4E2DC]">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`h-2 w-2 rounded-full ${
              powered ? "bg-[#F24E1E]" : "bg-[#4F535B]"
            }`}
          />
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[#B9BCC2]">
            ANALYSER-2048 · 60FPS SCOPE
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-mono text-[11px] tabular-nums text-[#F24E1E]">
            RMS {powered ? rmsDb : "STANDBY"}
          </span>
          <div className="flex border border-[#32363C] bg-[#0F1113] p-0.5">
            {(["dual", "waveform", "spectrum"] as VisualizerMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onModeChange(m)}
                className={`px-2 py-0.5 font-mono text-[10px] uppercase transition-colors ${
                  mode === m
                    ? "bg-[#1D5BFF] text-white"
                    : "text-[#8F949E] hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="relative h-44 w-full overflow-hidden rounded-sm border border-[#2A2D32]">
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          aria-label="Real-time Web Audio oscilloscope and FFT spectrum visualizer"
        />
      </div>
    </div>
  );
}
