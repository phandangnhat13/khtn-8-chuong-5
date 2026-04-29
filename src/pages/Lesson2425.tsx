import { useState, useRef, useEffect } from "react";
import { Gauge, Zap, AlertTriangle, BookOpen, Activity } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { LessonMedia } from "@/components/LessonMedia";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useLessonShortcuts } from "@/hooks/useLessonShortcuts";
import { LessonWrapUp } from "@/components/LessonWrapUp";

type Connection = "series" | "parallel" | "none";

export default function Lesson2425() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [ammeterConn, setAmmeterConn] = useState<Connection>("series");
  const [voltmeterConn, setVoltmeterConn] = useState<Connection>("parallel");
  const [warned, setWarned] = useState(false);
  const [batteryVoltage, setBatteryVoltage] = useState([6]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const { play } = useSound();
  const openHelp = () => window.dispatchEvent(new Event("open-help-dialog"));

  const reset = () => {
    setIsRunning(false);
    setAmmeterConn("series");
    setVoltmeterConn("parallel");
    setWarned(false);
    setBatteryVoltage([6]);
    timeRef.current = 0;
    play("click");
  };

  useLessonShortcuts({
    isRunning,
    onToggleRun: () => {
      setIsRunning((v) => !v);
      setWarned(false);
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
    if (isRunning && ammeterConn === "parallel" && !warned) {
      play("error");
      toast.error("⚠️ CẢNH BÁO: NGẮN MẠCH!", {
        description: "Ampe kế có điện trở rất nhỏ. Nếu mắc song song với bóng đèn sẽ gây hiện tượng đoản mạch (ngắn mạch), làm hỏng thiết bị!",
        duration: 5000,
      });
      setWarned(true);
    }
  }, [isRunning, ammeterConn, warned, play]);

  // Physics Logic
  const bv = batteryVoltage[0];
  const R_bulb = 12; // Resistance of bulb (Ohms)
  
  // Calculate circuit state
  const isShortCircuit = ammeterConn === "parallel";
  const circuitOk = isRunning && !isShortCircuit;
  
  // I = U / R. If short circuit, current goes to max (danger)
  const currentVal = isRunning 
    ? (isShortCircuit ? 9.99 : +(bv / R_bulb).toFixed(2)) 
    : 0;
    
  // Voltage drop across the bulb. If short circuit, voltage across bulb is ~0
  const voltVal = isRunning && voltmeterConn === "parallel" 
    ? (isShortCircuit ? 0 : bv) 
    : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const drawMeter = (x: number, y: number, label: string, value: string, unit: string, needleAngle: number, color: string, maxVal: number) => {
      // Meter housing
      ctx.fillStyle = "#0f172a";
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(x - 55, y - 55, 110, 110, 12);
      ctx.fill();
      ctx.stroke();

      // Screen background
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(x - 45, y - 45, 90, 60, 6);
      ctx.fill();

      // Scale arc
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 5, 35, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();

      // Tick marks
      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * 1.15 + (i / 10) * Math.PI * 0.7;
        const inner = i % 5 === 0 ? 28 : 31;
        const outer = 35;
        ctx.strokeStyle = i % 5 === 0 ? "#94a3b8" : "#4b5563";
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * inner, y + 5 + Math.sin(a) * inner);
        ctx.lineTo(x + Math.cos(a) * outer, y + 5 + Math.sin(a) * outer);
        ctx.stroke();
      }

      // Needle (Adding wobble for realism)
      const wobble = isRunning ? Math.sin(timeRef.current * 20) * 0.02 : 0;
      const normalizedVal = Math.min(parseFloat(value) / maxVal, 1.1); // Cap needle at 110%
      const needleA = Math.PI * 1.15 + normalizedVal * Math.PI * 0.7 + wobble;
      
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      ctx.lineTo(x + Math.cos(needleA) * 38, y + 5 + Math.sin(needleA) * 38);
      ctx.stroke();

      // Pin
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(x, y + 5, 4, 0, Math.PI * 2);
      ctx.fill();

      // Labels
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 14px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y - 25);
      
      // Digital readout
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(x - 30, y + 20, 60, 24, 4);
      ctx.fill();
      ctx.fillStyle = color;
      ctx.font = "bold 14px 'JetBrains Mono'";
      ctx.fillText(value + unit, x, y + 37);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (isRunning) timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.fillStyle = "#0a0f1a";
      ctx.fillRect(0, 0, W, H);

      // Warning flash (Short circuit)
      if (isRunning && ammeterConn === "parallel") {
        const flash = Math.sin(t * 15) > 0;
        if (flash) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.1)";
          ctx.fillRect(0, 0, W, H);
        }
      }

      // --- WIRING AND COMPONENTS ---
      const bx = 120, by = 220; // Battery pos
      const lx = 400, ly = 220; // Lamp pos
      const amX = ammeterConn === "series" ? 260 : 400; // Ammeter pos
      const amY = ammeterConn === "series" ? 320 : 100;
      const vmX = 580, vmY = 220; // Voltmeter pos

      // Main circuit wires
      ctx.strokeStyle = circuitOk || isRunning ? (isShortCircuit ? "#ef4444" : "#3b82f6") : "#334155";
      ctx.lineWidth = isShortCircuit ? 4 : 3;
      ctx.lineJoin = "round";
      
      // Positive path (Battery -> Lamp)
      ctx.beginPath();
      ctx.moveTo(bx + 40, by);
      ctx.lineTo(lx - 25, by);
      ctx.stroke();

      // Negative path (Lamp -> Ammeter -> Battery)
      ctx.beginPath();
      ctx.moveTo(lx, ly + 25);
      ctx.lineTo(lx, 320);
      if (ammeterConn === "series") {
        ctx.lineTo(amX + 55, 320); // to ammeter
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(amX - 55, 320); // from ammeter
      } else {
        ctx.lineTo(bx, 320);
      }
      ctx.lineTo(bx, 320);
      ctx.lineTo(bx, by + 25);
      ctx.stroke();

      // Short circuit wire (Ammeter parallel)
      if (ammeterConn === "parallel") {
        ctx.strokeStyle = isRunning ? "#ef4444" : "#334155";
        ctx.lineWidth = isRunning ? 5 : 2;
        ctx.beginPath();
        ctx.moveTo(lx - 25, by);
        ctx.lineTo(lx - 25, amY + 55);
        ctx.lineTo(amX, amY + 55);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx, ly + 25);
        ctx.lineTo(lx + 25, ly + 25);
        ctx.lineTo(lx + 25, amY);
        ctx.lineTo(amX + 55, amY);
        ctx.stroke();
      }

      // Voltmeter wires (parallel to bulb)
      if (voltmeterConn === "parallel") {
        ctx.strokeStyle = circuitOk ? "#22c55e" : "#334155";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(lx + 25, ly - 10);
        ctx.lineTo(vmX - 55, ly - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx, ly + 25);
        ctx.lineTo(lx + 50, ly + 40);
        ctx.lineTo(vmX - 55, vmY + 30);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // --- DRAW COMPONENTS ---
      
      // Battery
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = "#475569";
      ctx.beginPath();
      ctx.roundRect(bx - 40, by - 25, 80, 50, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ef4444"; ctx.fillRect(bx + 30, by - 12, 10, 24); // +
      ctx.fillStyle = "#3b82f6"; ctx.fillRect(bx - 40, by - 12, 10, 24); // -
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px 'JetBrains Mono'";
      ctx.textAlign = "center";
      ctx.fillText(`${bv}V`, bx, by + 5);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px 'Space Grotesk'";
      ctx.fillText("NGUỒN ĐIỆN", bx, by + 38);

      // Bulb
      const brightness = circuitOk ? Math.min(bv / 12, 1) : 0;
      if (circuitOk) {
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 20 + brightness * 30;
        ctx.fillStyle = `rgba(251,191,36,${0.6 + brightness * 0.4})`;
      } else {
        ctx.fillStyle = "#1e293b";
        ctx.shadowBlur = 0;
      }
      ctx.beginPath();
      ctx.arc(lx, ly - 10, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Bulb base
      ctx.fillStyle = "#64748b";
      ctx.beginPath(); ctx.roundRect(lx - 12, ly + 12, 24, 15, 2); ctx.fill();
      ctx.fillStyle = "#475569";
      ctx.fillRect(lx - 8, ly + 27, 16, 5);
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 11px 'Space Grotesk'";
      ctx.fillText("BÓNG ĐÈN", lx, ly + 45);

      // Draw Meters
      drawMeter(amX, amY, "AMPE KẾ (A)", currentVal.toFixed(2), "A", 0, isShortCircuit ? "#ef4444" : "#3b82f6", 2); // Max 2A scale
      drawMeter(vmX, vmY, "VÔN KẾ (V)", voltVal.toFixed(1), "V", 0, "#22c55e", 15); // Max 15V scale

      // Particles (Electrons)
      if (isRunning && showParticles) {
        const speed = isShortCircuit ? 1.5 : 0.2 + (bv / 12) * 0.4;
        const particleColor = isShortCircuit ? "#ef4444" : "#fbbf24";
        
        // Draw particles on main loop
        for (let i = 0; i < 8; i++) {
          const frac = (t * speed + i / 8) % 1;
          let px = 0, py = 0;
          
          if (!isShortCircuit) {
            // Normal path
            if (frac < 0.3) {
              px = bx + 40 + (lx - 25 - bx - 40) * (frac / 0.3);
              py = by;
            } else if (frac < 0.6) {
              const f = (frac - 0.3) / 0.3;
              px = lx;
              py = ly + 25 + (320 - ly - 25) * f;
            } else {
              const f = (frac - 0.6) / 0.4;
              px = lx - (lx - bx) * f;
              py = 320;
            }
          } else {
            // Short circuit path
            if (frac < 0.4) {
              px = bx + 40 + (lx - 25 - bx - 40) * (frac / 0.4);
              py = by;
            } else if (frac < 0.7) {
              px = lx - 25;
              py = by - (by - amY - 55) * ((frac - 0.4)/0.3);
            } else {
              px = lx - 25 - (lx - 25 - bx)* ((frac - 0.7)/0.3);
              py = 320; // Simplified short return path visualization
            }
          }

          if (px !== 0) {
            ctx.fillStyle = particleColor;
            ctx.shadowColor = particleColor;
            ctx.shadowBlur = isShortCircuit ? 10 : 5;
            ctx.beginPath();
            ctx.arc(px, py, isShortCircuit ? 3.5 : 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.shadowBlur = 0;
      }

      // Warning text on canvas
      if (isShortCircuit && isRunning) {
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 24px 'Space Grotesk'";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ CẢNH BÁO: NGẮN MẠCH!", W / 2, 40);
        ctx.font = "14px 'Space Grotesk'";
        ctx.fillStyle = "#fca5a5";
        ctx.fillText("Dòng điện quá lớn sẽ làm cháy Ampe kế!", W / 2, 65);
      }

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, ammeterConn, voltmeterConn, showParticles, bv, circuitOk, currentVal, voltVal, isShortCircuit]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <LessonHeader 
        icon={Gauge} 
        title="Bài 24-25: Cường độ dòng điện & Hiệu điện thế" 
        subtitle="Khoa học tự nhiên 8 - Chủ đề: Điện"
      >
        <ControlPanel
          isRunning={isRunning}
          onToggleRun={() => { setIsRunning(!isRunning); setWarned(false); play("switch"); }}
          onReset={reset}
          showParticles={showParticles}
          onToggleParticles={() => { setShowParticles(!showParticles); play("click"); }}
          onOpenHelp={openHelp}
        />
      </LessonHeader>

      <LessonMedia
        title="Đo lường trong mạch điện"
        summary="Cường độ dòng điện (I) cho biết mức độ mạnh/yếu của dòng điện, được đo bằng Ampe kế (A). Hiệu điện thế (U) là sự chênh lệch điện thế giữa hai điểm, được đo bằng Vôn kế (V). Việc mắc đúng thiết bị đo là cực kỳ quan trọng để đảm bảo an toàn." 
        audioText="Để đo dòng điện, ta dùng Ampe kế mắc nối tiếp. Để đo hiệu điện thế, ta dùng Vôn kế mắc song song. Tuyệt đối không mắc Ampe kế song song vì sẽ gây đoản mạch, gây cháy nổ." 
      />

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 flex gap-4 bg-blue-500/5 border-blue-500/20">
          <Activity className="w-8 h-8 text-blue-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-blue-100 uppercase mb-1">Đo cường độ (I)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dùng <b>Ampe kế</b>. Phải mắc <b>NỐI TIẾP</b> với thiết bị cần đo để toàn bộ dòng điện chạy qua nó. (Ampe kế có điện trở rất nhỏ ≈ 0).
            </p>
          </div>
        </div>
        <div className="glass-panel p-4 flex gap-4 bg-emerald-500/5 border-emerald-500/20">
          <Gauge className="w-8 h-8 text-emerald-400 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-100 uppercase mb-1">Đo hiệu điện thế (U)</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dùng <b>Vôn kế</b>. Phải mắc <b>SONG SONG</b> với hai đầu thiết bị cần đo. (Vôn kế có điện trở rất lớn nên không làm thay đổi dòng điện nhánh chính).
            </p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-1 bg-slate-900/50 overflow-hidden relative shadow-lg border border-white/5">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full rounded-lg"
          style={{ maxHeight: "400px" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5">
             <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Bảng điều khiển kết nối</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="mb-3 sm:mb-0">
                  <p className="font-bold text-blue-400 text-sm">Kết nối Ampe kế (A)</p>
                  <p className="text-xs text-muted-foreground">Đang nối: {ammeterConn === "series" ? "Nối tiếp dòng chính" : "Song song (NGUY HIỂM)"}</p>
                </div>
                <button
                  onClick={() => { setAmmeterConn(ammeterConn === "series" ? "parallel" : "series"); play("switch"); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md ${
                    ammeterConn === "series"
                      ? "bg-blue-600 hover:bg-blue-500 text-white"
                      : "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                  }`}
                >
                  {ammeterConn === "series" ? "✅ Đã mắc nối tiếp" : "❌ Mắc song song (Lỗi)"}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                <div className="mb-3 sm:mb-0">
                  <p className="font-bold text-emerald-400 text-sm">Kết nối Vôn kế (V)</p>
                  <p className="text-xs text-muted-foreground">Đang nối: {voltmeterConn === "parallel" ? "Hai đầu bóng đèn" : "Đã tháo dây"}</p>
                </div>
                <button
                  onClick={() => { setVoltmeterConn(voltmeterConn === "parallel" ? "none" : "parallel"); play("switch"); }}
                  className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-md ${
                    voltmeterConn === "parallel"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  {voltmeterConn === "parallel" ? "✅ Đã mắc song song" : "Thêm Vôn kế"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-5 border-t-4 border-amber-500 bg-slate-900">
            <h3 className="text-sm font-bold text-amber-500 mb-4 uppercase flex items-center gap-2">
              <Zap className="w-4 h-4" /> Điện áp nguồn (U)
            </h3>
            
            <div className="text-center mb-6">
              <span className="text-4xl font-black font-mono text-white drop-shadow-md">
                {bv}
              </span>
              <span className="text-xl text-muted-foreground ml-1">V</span>
            </div>

            <Slider
              value={batteryVoltage}
              onValueChange={setBatteryVoltage}
              min={1}
              max={15}
              step={1}
              className="mb-2"
            />
            <div className="flex justify-between text-xs font-bold text-slate-500">
              <span>MIN (1V)</span>
              <span>MAX (15V)</span>
            </div>
          </div>
          
          {ammeterConn === "parallel" && (
             <div className="glass-panel p-4 bg-red-950/30 border border-red-500/30 animate-pulse">
                <div className="flex items-center gap-2 text-red-500 font-bold text-sm mb-1">
                  <AlertTriangle className="w-4 h-4" /> Cảnh báo ngắn mạch
                </div>
                <p className="text-xs text-red-200/70">Mạch đang bị đoản mạch do Ampe kế mắc sai. Dòng điện sẽ rất lớn, đèn không sáng. Hãy sửa lại kết nối Ampe kế.</p>
             </div>
          )}
        </div>
      </div>

      <LessonWrapUp
        lessonTitle="Bài 24-25: Cường độ dòng điện và hiệu điện thế"
        quizLesson="24-25"
        points={[
          "Cường độ dòng điện (I) đo bằng Ampe kế (Ký hiệu: A). Mắc nối tiếp vào đoạn mạch.",
          "Hiệu điện thế (U) đo bằng Vôn kế (Ký hiệu: V). Mắc song song với hai đầu đoạn mạch cần đo.",
          "TUYỆT ĐỐI KHÔNG mắc Ampe kế song song với nguồn điện hoặc thiết bị, vì điện trở của Ampe kế rất nhỏ sẽ gây đoản mạch (chập mạch)."
        ]}
      />
    </div>
  );
}
