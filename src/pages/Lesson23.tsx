import { useState, useRef, useEffect } from "react";
import { Magnet, Flame, Zap, MousePointer2, Thermometer, BookOpen } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { LessonMedia } from "@/components/LessonMedia";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";
import { useLessonShortcuts } from "@/hooks/useLessonShortcuts";
import { LessonWrapUp } from "@/components/LessonWrapUp";
import { ThreeSceneLesson23 } from "@/components/ThreeSceneLesson23";

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

      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, W, H);

      if (mode === "magnetic") {
        // Coil Setup
        const coilX = 220, coilY = 200;

        // Draw Electromagnet Core (Iron Nail)
        ctx.fillStyle = "#64748b";
        ctx.fillRect(coilX - 10, coilY - 60, 20, 120);
        ctx.beginPath();
        ctx.moveTo(coilX - 10, coilY - 60);
        ctx.lineTo(coilX, coilY - 80);
        ctx.lineTo(coilX + 10, coilY - 60);
        ctx.fill();

        // Draw Coil Wraps
        ctx.strokeStyle = "#fb923c"; // Copper color
        ctx.lineWidth = 4;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.ellipse(coilX, coilY + i * 12 - 40, 25, 10, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("LÕI SẮT & CUỘN DÂY", coilX, coilY + 80);

        // Battery Power Source
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(80, 260, 60, 30, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ef4444"; ctx.fillRect(130, 260, 10, 30); // Positive terminal
        ctx.fillStyle = "#3b82f6"; ctx.fillRect(80, 260, 10, 30);  // Negative terminal
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px 'JetBrains Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`${v}V`, 110, 279);

        // Wires
        ctx.strokeStyle = isRunning ? "#fbbf24" : "#475569";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(140, 275);
        ctx.lineTo(190, 275);
        ctx.lineTo(190, 240);
        ctx.lineTo(coilX - 25, 240); // To coil bottom
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(80, 275);
        ctx.lineTo(40, 275);
        ctx.lineTo(40, 160);
        ctx.lineTo(coilX - 25, 160); // To coil top
        ctx.stroke();

        // Compass Object
        const compassX = 460, compassY = 200;
        ctx.fillStyle = "#0f172a";
        ctx.strokeStyle = "#334155";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(compassX, compassY, 60, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Compass markings
        ctx.fillStyle = "#64748b";
        ctx.font = "bold 12px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("B", compassX, compassY - 45);
        ctx.fillText("N", compassX, compassY + 52);
        ctx.fillText("Đ", compassX + 48, compassY + 4);
        ctx.fillText("T", compassX - 48, compassY + 4);

        // Calculate Needle Rotation (Physics: Deflection depends on current/voltage)
        const maxDeflection = Math.PI / 2.2;
        const targetAngle = isRunning ? maxDeflection * Math.min(vFactor / 3, 1) : 0;
        // Adding slight wobble when running
        const wobble = isRunning ? Math.sin(t * 15) * 0.02 * vFactor : 0;
        const needleAngle = targetAngle + wobble;

        // Draw Compass Needle
        ctx.save();
        ctx.translate(compassX, compassY);
        ctx.rotate(needleAngle);

        // North (Red)
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();

        // South (Blue/White)
        ctx.fillStyle = "#e2e8f0";
        ctx.beginPath();
        ctx.moveTo(0, 40);
        ctx.lineTo(-6, 0);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();

        // Center Pin
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 11px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("KIM LA BÀN", compassX, compassY + 85);

        // Magnetic Field Lines Visualization
        if (isRunning && showParticles) {
          ctx.strokeStyle = `rgba(59, 130, 246, ${0.1 + 0.1 * vFactor})`;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          for (let i = 0; i < 5; i++) {
            const r = 40 + i * 25 + (t * 10) % 25; // Expanding ripples
            ctx.beginPath();
            ctx.ellipse(coilX, coilY - 20, r, r * 1.5, 0, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();
          }
          ctx.setLineDash([]);
        }

        // Angle Readout HUD
        const deg = Math.round((needleAngle / Math.PI) * 180);
        ctx.fillStyle = isRunning ? "#3b82f6" : "#64748b";
        ctx.font = "bold 16px 'JetBrains Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`Góc lệch: ${deg}°`, compassX, compassY - 80);

      } else {
        // Thermal Mode
        const coilX = W / 2, coilY = 220;
        const targetHeat = isRunning ? Math.min(vFactor / 3, 1) : 0;

        // Simulate gradual heating/cooling
        const heatLevel = targetHeat > 0
          ? Math.min(t * 0.5 * targetHeat, targetHeat) // Heating up
          : Math.max(0, 0); // Need external state for proper cooling, using simplified version here

        // Draw Heating Element (Nichrome Wire)
        ctx.lineWidth = 6;
        ctx.lineJoin = "round";
        ctx.beginPath();

        const startX = coilX - 100;
        ctx.moveTo(startX, coilY);

        for (let i = 0; i < 10; i++) {
          const x = startX + i * 20;
          ctx.lineTo(x + 10, coilY - 30);
          ctx.lineTo(x + 20, coilY);
        }

        // Color transition: Gray -> Dark Red -> Bright Orange -> Yellow
        const r = 100 + heatLevel * 155;
        const g = 116 - heatLevel * 116 + (heatLevel > 0.7 ? (heatLevel - 0.7) * 3 * 255 : 0);
        const b = 139 - heatLevel * 139;

        ctx.strokeStyle = `rgb(${r}, ${g}, ${b})`;

        if (heatLevel > 0.1) {
          ctx.shadowColor = `rgba(255, ${g}, 0, ${heatLevel})`;
          ctx.shadowBlur = 10 + heatLevel * 20;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 12px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("DÂY ĐIỆN TRỞ (HỢP KIM)", coilX, coilY + 50);

        // Heat waves & Smoke
        if (heatLevel > 0.2 && showParticles) {
          ctx.strokeStyle = `rgba(255, 100, 0, ${heatLevel * 0.4})`;
          ctx.lineWidth = 2;
          for (let i = 0; i < 7; i++) {
            const ox = coilX - 80 + i * 25;
            // Wavy upward motion
            const waveY = coilY - 50 - t * 40 % 100;
            const waveOffset = Math.sin(t * 3 + i) * 15;

            ctx.beginPath();
            ctx.moveTo(ox, coilY - 40);
            ctx.quadraticCurveTo(ox + waveOffset, waveY + 20, ox - waveOffset, waveY - 20);
            ctx.stroke();
          }
        }

        // Temperature HUD
        const ambientTemp = 25;
        const maxTemp = ambientTemp + vFactor * 300;
        const currentTemp = Math.round(ambientTemp + heatLevel * (maxTemp - ambientTemp));

        ctx.fillStyle = heatLevel > 0.6 ? "#fb923c" : heatLevel > 0.3 ? "#ef4444" : "#94a3b8";
        ctx.font = "bold 32px 'JetBrains Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`${currentTemp}°C`, coilX, coilY - 80);

        // Battery Power Source
        ctx.fillStyle = "#1e293b";
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(coilX - 40, 320, 80, 35, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#ef4444"; ctx.fillRect(coilX + 20, 320, 20, 35);
        ctx.fillStyle = "#3b82f6"; ctx.fillRect(coilX - 40, 320, 20, 35);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 14px 'JetBrains Mono'";
        ctx.textAlign = "center";
        ctx.fillText(`${v}V`, coilX, 343);

        // Connecting Wires
        ctx.strokeStyle = isRunning ? "#fbbf24" : "#475569";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(coilX - 40, 335);
        ctx.lineTo(coilX - 120, 335);
        ctx.lineTo(coilX - 120, coilY);
        ctx.lineTo(startX, coilY);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(coilX + 40, 335);
        ctx.lineTo(coilX + 120, 335);
        ctx.lineTo(coilX + 120, coilY);
        ctx.lineTo(startX + 180, coilY);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [mode, isRunning, showParticles, voltage]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <LessonHeader
        icon={Zap}
        title="Bài 23: Tác dụng của dòng điện"
        subtitle="Khoa học tự nhiên 8 - Chủ đề: Điện"
      >
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
        title="Dòng điện mang năng lượng"
        summary="Dòng điện chạy qua dây dẫn không chỉ truyền tải năng lượng mà còn gây ra các tác dụng vật lý. Hai tác dụng phổ biến nhất là Tác dụng Từ (tạo ra từ trường, ứng dụng làm nam châm điện) và Tác dụng Nhiệt (làm nóng dây dẫn, ứng dụng trong bàn là, nồi cơm điện)."
        audioText="Dòng điện có nhiều tác dụng. Trong mô phỏng này, bạn sẽ quan sát tác dụng từ làm lệch kim la bàn, và tác dụng nhiệt làm nung đỏ dây điện trở. Hãy thử thay đổi điện áp để xem sự khác biệt nhé."
        ThreeSceneComponent={ThreeSceneLesson23}
      />

      <div className="flex flex-wrap gap-3 mb-2">
        <button
          onClick={() => { setMode("magnetic"); reset(); play("click"); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === "magnetic"
            ? "bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border-transparent scale-105"
            : "bg-secondary/40 text-muted-foreground border border-white/10 hover:bg-secondary/60"
            }`}
        >
          <Magnet className="w-4 h-4" /> THÍ NGHIỆM TÁC DỤNG TỪ
        </button>
        <button
          onClick={() => { setMode("thermal"); reset(); play("click"); }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${mode === "thermal"
            ? "bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)] border-transparent scale-105"
            : "bg-secondary/40 text-muted-foreground border border-white/10 hover:bg-secondary/60"
            }`}
        >
          <Flame className="w-4 h-4" /> THÍ NGHIỆM TÁC DỤNG NHIỆT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-3 flex items-start gap-3 bg-slate-800/50">
          <MousePointer2 className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">1. Chọn chế độ</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Chuyển đổi giữa thí nghiệm Từ hoặc Nhiệt ở các nút bên trên.</p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-3 bg-slate-800/50">
          <Zap className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">2. Cấp điện</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Bấm "Chạy mô phỏng" để đóng mạch, cho dòng điện chạy qua hệ thống.</p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-3 bg-slate-800/50">
          <Thermometer className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-200">3. Tăng điện áp</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Kéo thanh trượt U (V) bên dưới để tăng cường độ và quan sát hiện tượng rõ hơn.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-1 bg-slate-900/50 overflow-hidden relative border border-white/5 shadow-lg">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full rounded-lg"
          style={{ maxHeight: "400px" }}
        />

        {/* Overlay HUD hints */}
        {!isRunning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10 text-white/80 text-sm font-medium animate-pulse flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Bấm CHẠY MÔ PHỎNG để bắt đầu
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Phân tích hiện tượng</h3>
            </div>

            {mode === "magnetic" ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <p className="font-bold text-blue-400 mb-1 text-sm uppercase">Hiện tượng:</p>
                  <p className="text-muted-foreground text-sm">Khi đóng mạch, kim la bàn đặt gần cuộn dây bị lệch khỏi hướng Bắc - Nam ban đầu.</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="font-bold text-slate-300 mb-1 text-sm uppercase">Kết luận:</p>
                  <p className="text-muted-foreground text-sm">Cuộn dây dẫn có dòng điện chạy qua có từ tính như một nam châm (gọi là <b>nam châm điện</b>). Dòng điện có <b>tác dụng từ</b>. Khi tăng điện áp, dòng điện mạnh hơn làm từ trường mạnh hơn, góc lệch lớn hơn.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                  <p className="font-bold text-orange-400 mb-1 text-sm uppercase">Hiện tượng:</p>
                  <p className="text-muted-foreground text-sm">Đoạn dây hợp kim nóng dần lên, khi điện áp đủ lớn có thể phát sáng đỏ.</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="font-bold text-slate-300 mb-1 text-sm uppercase">Kết luận:</p>
                  <p className="text-muted-foreground text-sm">Dòng điện đi qua vật dẫn sẽ làm vật dẫn nóng lên. Đây là <b>tác dụng nhiệt</b>. Tác dụng này được ứng dụng rộng rãi để chế tạo bàn là, lò sưởi, nồi cơm điện...</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10">
            <h3 className="text-sm font-bold text-slate-200 mb-4 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Nguồn điện U (Volt)
            </h3>

            <div className="flex items-center justify-center mb-6">
              <div className="text-4xl font-black font-mono text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                {voltage[0]}<span className="text-2xl text-muted-foreground">V</span>
              </div>
            </div>

            <Slider
              value={voltage}
              onValueChange={(v) => { setVoltage(v); if (isRunning) timeRef.current = 0; }}
              min={1}
              max={12}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>MIN (1V)</span>
              <span>MAX (12V)</span>
            </div>
          </div>
        </div>
      </div>

      <LessonWrapUp
        lessonTitle="Bài 23: Tác dụng của dòng điện"
        quizLesson="23"
        points={[
          "Dòng điện có tác dụng nhiệt: Làm vật dẫn điện nóng lên (Ví dụ: bàn là, mỏ hàn, dây tóc bóng đèn).",
          "Dòng điện có tác dụng từ: Cuộn dây có dòng điện chạy qua có khả năng hút sắt thép và làm quay kim la bàn (Nam châm điện).",
          "Cường độ dòng điện càng lớn (tỉ lệ với điện áp nguồn) thì các tác dụng từ, nhiệt diễn ra càng mạnh mẽ."
        ]}
      />
    </div>
  );
}
