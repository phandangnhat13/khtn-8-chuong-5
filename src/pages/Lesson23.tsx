import { useState, useRef, useEffect } from "react";

import { Magnet, Flame } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { LessonMedia } from "@/components/LessonMedia";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";
import { useLessonShortcuts } from "@/hooks/useLessonShortcuts";
import { LessonWrapUp } from "@/components/LessonWrapUp";

export default function Lesson23() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [mode, setMode] = useState<"magnetic" | "thermal">("magnetic");
  const [voltage, setVoltage] = useState([3]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const { play } = useSound();
  const openHelp = () => window.dispatchEvent(new Event("open-help-dialog"));

  const reset = () => {
    setIsRunning(false);
    timeRef.current = 0;
    play("click");
  };

  useLessonShortcuts({
    isRunning,
    onToggleRun: () => {
      setIsRunning((v) => !v);
      play("switch");
    },
    onReset: reset,
    showParticles,
    onToggleParticles: () => {
      setShowParticles((v) => !v);
      play("click");
    },
    onOpenHelp: openHelp,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const v = voltage[0];
    const vFactor = v / 3;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (isRunning) timeRef.current += 0.016;
      const t = timeRef.current;


      ctx.fillStyle = "#0f1420";
      ctx.fillRect(0, 0, W, H);

      if (mode === "magnetic") {
        // Coil
        const coilX = 200, coilY = 200;
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        for (let i = 0; i < 6; i++) {
          ctx.beginPath();
          ctx.ellipse(coilX, coilY + i * 8 - 20, 50, 15, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("Cuộn dây", coilX, coilY + 45);

        // Battery
        ctx.fillStyle = "#374151";
        ctx.beginPath();
        ctx.roundRect(80, 260, 50, 25, 4);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "9px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText(`${v}V`, 105, 276);

        // Wires
        ctx.strokeStyle = isRunning ? "#3b82f6" : "#374151";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(105, 260);
        ctx.lineTo(105, 220);
        ctx.lineTo(150, 200);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(130, 275);
        ctx.lineTo(300, 275);
        ctx.lineTo(300, 200);
        ctx.lineTo(250, 200);
        ctx.stroke();

        // Compass
        const compassX = 420, compassY = 200;
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#374151";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(compassX, compassY, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#64748b";
        ctx.font = "10px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("N", compassX, compassY - 36);
        ctx.fillText("S", compassX, compassY + 42);
        ctx.fillText("E", compassX + 38, compassY + 4);
        ctx.fillText("W", compassX - 38, compassY + 4);

        // Needle rotation depends on voltage
        const needleAngle = isRunning ? (Math.PI / 2) * vFactor + Math.sin(t * 0.5) * 0.1 : 0;
        ctx.save();
        ctx.translate(compassX, compassY);
        ctx.rotate(needleAngle);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(0, -35);
        ctx.lineTo(-5, 0);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(0, 35);
        ctx.lineTo(-5, 0);
        ctx.lineTo(5, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = "#6b7280";
        ctx.beginPath();
        ctx.arc(0, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("La bàn", compassX, compassY + 65);

        // Electron particles (speed scales with voltage)
        if (isRunning && showParticles) {
          for (let i = 0; i < 8; i++) {
            const frac = (t * 0.3 * vFactor + i * 0.125) % 1;
            let px: number, py: number;
            if (frac < 0.25) {
              px = 105 + (150 - 105) * (frac / 0.25);
              py = 260 + (200 - 260) * (frac / 0.25);
            } else if (frac < 0.5) {
              px = 150 + (250 - 150) * ((frac - 0.25) / 0.25);
              py = 200;
            } else if (frac < 0.75) {
              px = 250 + (300 - 250) * ((frac - 0.5) / 0.25);
              py = 200 + (275 - 200) * ((frac - 0.5) / 0.25);
            } else {
              px = 300 + (105 - 300) * ((frac - 0.75) / 0.25);
              py = 275;
            }
            ctx.fillStyle = "#fbbf24";
            ctx.shadowColor = "#fbbf24";
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.shadowBlur = 0;
        }

        // Magnetic field lines
        if (isRunning) {
          ctx.strokeStyle = `rgba(59,130,246,${0.15 * vFactor})`;
          ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            const r = 70 + i * 20;
            ctx.beginPath();
            ctx.ellipse(coilX, coilY, r, r * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Angle readout
        if (isRunning) {
          const deg = Math.round((needleAngle / Math.PI) * 180);
          ctx.fillStyle = "#3b82f6";
          ctx.font = "bold 14px 'JetBrains Mono'";
          ctx.textAlign = "center";
          ctx.fillText(`Góc lệch: ${deg}°`, compassX, compassY + 80);
        }

        ctx.fillStyle = "#475569";
        ctx.font = "12px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("Nhấn 'Chạy' để xem tác dụng từ — Thay đổi điện áp bằng thanh trượt", W / 2, H - 15);

      } else {
        // Thermal effect
        const coilX = W / 2, coilY = 200;
        const heatLevel = isRunning ? Math.min(t * vFactor / 5, 1) : 0;

        // Heating coil
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
          const x = coilX - 80 + i * 22;
          const r = heatLevel * 255;
          ctx.strokeStyle = `rgb(${100 + r * 0.6}, ${50 - heatLevel * 30}, ${50 - heatLevel * 30})`;
          if (heatLevel > 0.3) {
            ctx.shadowColor = `rgba(255,${100 - heatLevel * 80},0,${heatLevel * 0.5})`;
            ctx.shadowBlur = 10 + heatLevel * 15;
          }
          ctx.beginPath();
          ctx.moveTo(x, coilY - 20);
          ctx.lineTo(x + 11, coilY + 20);
          ctx.lineTo(x + 22, coilY - 20);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;

        // Temperature (scales with voltage)
        const maxTemp = 25 + vFactor * 475;
        const temp = Math.round(25 + heatLevel * (maxTemp - 25));
        ctx.fillStyle = heatLevel > 0.5 ? "#ef4444" : "#94a3b8";
        ctx.font = "bold 24px 'JetBrains Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`${temp}°C`, coilX, coilY + 70);
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px 'Space Grotesk'";
        ctx.fillText("Dây đốt nóng", coilX, coilY + 90);

        // Heat waves / smoke particles
        if (heatLevel > 0.3 && showParticles) {
          ctx.strokeStyle = `rgba(239,68,68,${heatLevel * 0.3})`;
          ctx.lineWidth = 1;
          for (let i = 0; i < 5; i++) {
            const ox = coilX - 40 + i * 20;
            const waveY = coilY - 30 - Math.sin(t * 2 + i) * 10 - t * 5 % 40;
            ctx.beginPath();
            ctx.moveTo(ox, coilY - 25);
            ctx.quadraticCurveTo(ox + 5, waveY, ox + 10, coilY - 25 - 20);
            ctx.stroke();
          }

          // Smoke particles
          for (let i = 0; i < 8; i++) {
            const smokeX = coilX - 50 + Math.random() * 100;
            const smokeY = coilY - 40 - (t * 20 + i * 15) % 80;
            const alpha = Math.max(0, heatLevel * 0.3 - ((t * 20 + i * 15) % 80) / 300);
            ctx.fillStyle = `rgba(148,163,184,${alpha})`;
            ctx.beginPath();
            ctx.arc(smokeX, smokeY, 3 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Battery + wires
        ctx.fillStyle = "#374151";
        ctx.beginPath();
        ctx.roundRect(coilX - 25, 310, 50, 25, 4);
        ctx.fill();
        ctx.fillStyle = "#e2e8f0";
        ctx.font = "9px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText(`${v}V`, coilX, 326);
        
        ctx.strokeStyle = isRunning ? "#3b82f6" : "#374151";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(coilX - 25, 320);
        ctx.lineTo(coilX - 80, 320);
        ctx.lineTo(coilX - 80, 200);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(coilX + 25, 320);
        ctx.lineTo(coilX + 80, 320);
        ctx.lineTo(coilX + 80, 200);
        ctx.stroke();

        ctx.fillStyle = "#475569";
        ctx.font = "12px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("Nhấn 'Chạy' để xem tác dụng nhiệt — Điều chỉnh điện áp", W / 2, H - 15);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [mode, isRunning, showParticles, voltage]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <LessonHeader icon={Magnet} title="Bài 23: Tác dụng dòng điện" subtitle="Tác dụng từ và tác dụng nhiệt">
        <ControlPanel
          isRunning={isRunning}
          onToggleRun={() => { setIsRunning(!isRunning); play("switch"); }}
          onReset={reset}
          showParticles={showParticles}
          onToggleParticles={() => { setShowParticles(!showParticles); play("click"); }}
          onOpenHelp={openHelp}
        />
      </LessonHeader>

      <LessonMedia
        mediaVariant="motorThermal"
        title="Tác dụng của dòng điện"
        summary="Quan sát tác dụng từ khi cuộn dây cấp điện tạo ra từ trường và tác dụng nhiệt khi dây dẫn nóng lên dưới điện áp.
Bạn có thể chuyển đổi giữa chế độ từ trường và nhiệt để thấy khác biệt." 
        audioText="Trong bài này, dòng điện có thể tạo ra từ trường làm lệch kim la bàn hoặc sinh nhiệt làm dây đốt nóng lên. Hãy thử thay đổi điện áp để thấy hiệu ứng." 
      />

      <div className="flex gap-2 mb-2">
        <button
          onClick={() => { setMode("magnetic"); reset(); play("click"); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "magnetic" ? "bg-primary/20 text-primary border border-primary/30" : "bg-secondary/50 text-muted-foreground border border-border/30"}`}
        >
          🧲 Tác dụng từ
        </button>
        <button
          onClick={() => { setMode("thermal"); reset(); play("click"); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "thermal" ? "bg-destructive/20 text-destructive border border-destructive/30" : "bg-secondary/50 text-muted-foreground border border-border/30"}`}
        >
          🔥 Tác dụng nhiệt
        </button>
      </div>

      <div className="glass-panel p-4 space-y-2">
        <div className="border border-white/5 rounded-lg overflow-hidden bg-slate-900/50">
          <canvas
            ref={canvasRef}
            width={700}
            height={420}
            className="w-full"
            style={{ maxHeight: "420px", background: "#0f1420" }}
            role="img"
            aria-label="Mô phỏng tác dụng từ và tác dụng nhiệt của dòng điện"
          />
        </div>
      </div>

      {/* Voltage slider */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {mode === "magnetic" ? "⚡ Điện áp nguồn" : "🔥 Điện áp nguồn"}
          </span>
          <span className="text-xs font-mono text-primary font-bold">{voltage[0]}V</span>
        </div>
        <Slider
          value={voltage}
          onValueChange={(v) => { setVoltage(v); timeRef.current = 0; }}
          min={1}
          max={9}
          step={0.5}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground/50">1V</span>
          <span className="text-[10px] text-muted-foreground/50">9V</span>
        </div>
      </div>
      <LessonWrapUp
        lessonTitle="Bài 23: Tác dụng của dòng điện"
        quizLesson="23"
        points={[

          "Dòng điện có thể tạo từ trường làm lệch kim nam châm.",
          "Dòng điện cũng gây tỏa nhiệt trên dây dẫn có điện trở.",
          "Điện áp tăng làm hiệu ứng từ và nhiệt rõ hơn.",
        ]}
      />
    </div>
  );
}
