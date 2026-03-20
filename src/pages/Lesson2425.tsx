import { useState, useRef, useEffect } from "react";
import { Gauge } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

type Connection = "series" | "parallel" | "none";

export default function Lesson2425() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [ammeterConn, setAmmeterConn] = useState<Connection>("series");
  const [voltmeterConn, setVoltmeterConn] = useState<Connection>("parallel");
  const [warned, setWarned] = useState(false);
  const [batteryVoltage, setBatteryVoltage] = useState([3]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const { play } = useSound();

  const reset = () => {
    setIsRunning(false);
    setAmmeterConn("series");
    setVoltmeterConn("parallel");
    setWarned(false);
    setBatteryVoltage([3]);
    timeRef.current = 0;
    play("click");
  };

  useEffect(() => {
    if (isRunning && ammeterConn === "parallel" && !warned) {
      play("error");
      toast.error("⚠️ Cảnh báo: Ngắn mạch!", {
        description: "Ampe kế mắc song song sẽ gây ngắn mạch! Hãy mắc Ampe kế nối tiếp.",
        duration: 5000,
      });
      setWarned(true);
    }
  }, [isRunning, ammeterConn, warned, play]);

  const bv = batteryVoltage[0];
  const circuitOk = isRunning && ammeterConn !== "parallel";
  const currentVal = circuitOk && ammeterConn === "series" ? +(bv / 6).toFixed(2) : 0;
  const voltVal = circuitOk && voltmeterConn === "parallel" ? bv : 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const drawMeter = (x: number, y: number, label: string, value: string, unit: string, needleAngle: number, color: string) => {
      ctx.fillStyle = "#1e293b";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 45, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = "#374151";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, 35, Math.PI * 1.25, Math.PI * 1.75);
      ctx.stroke();

      for (let i = 0; i <= 10; i++) {
        const a = Math.PI * 1.25 + (i / 10) * Math.PI * 0.5;
        const inner = 30, outer = 35;
        ctx.strokeStyle = "#4b5563";
        ctx.lineWidth = i % 5 === 0 ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * inner, y + Math.sin(a) * inner);
        ctx.lineTo(x + Math.cos(a) * outer, y + Math.sin(a) * outer);
        ctx.stroke();
      }

      const needleA = Math.PI * 1.25 + needleAngle * Math.PI * 0.5;
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(needleA) * 30, y + Math.sin(needleA) * 30);
      ctx.stroke();

      ctx.fillStyle = "#6b7280";
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#e2e8f0";
      ctx.font = "bold 16px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y - 10);
      ctx.fillStyle = color;
      ctx.font = "bold 14px 'JetBrains Mono'";
      ctx.fillText(value + unit, x, y + 20);
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (isRunning) timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.fillStyle = "#0f1420";
      ctx.fillRect(0, 0, W, H);

      // Battery
      const bx = 150, by = 200;
      ctx.fillStyle = "#374151";
      ctx.beginPath();
      ctx.roundRect(bx - 30, by - 20, 60, 40, 6);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(bx + 24, by - 10, 10, 20);
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(bx - 34, by - 8, 8, 16);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "10px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(`${bv}V`, bx, by + 4);

      // Bulb
      const lx = 350, ly = 200;
      const brightness = circuitOk ? Math.min(bv / 6, 1) : 0;
      if (circuitOk) {
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 15 + brightness * 20;
        ctx.fillStyle = `rgba(251,191,36,${0.5 + brightness * 0.5})`;
      } else {
        ctx.fillStyle = "#374151";
      }
      ctx.beginPath();
      ctx.arc(lx, ly - 8, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#6b7280";
      ctx.fillRect(lx - 12, ly + 12, 24, 12);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px 'Space Grotesk'";
      ctx.fillText("Đèn", lx, ly + 38);

      // Wires
      ctx.strokeStyle = circuitOk ? "#3b82f6" : "#374151";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx + 34, by);
      ctx.lineTo(lx - 25, by);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(lx, ly + 24);
      ctx.lineTo(lx, 300);
      ctx.lineTo(bx, 300);
      ctx.lineTo(bx, by + 20);
      ctx.stroke();

      // Ammeter
      const amX = ammeterConn === "series" ? 250 : 350;
      const amY = ammeterConn === "series" ? 300 : 100;
      const needleA = isRunning ? (ammeterConn === "parallel" ? 1.0 : currentVal / 1.0) : 0;
      drawMeter(amX, amY, "A", currentVal.toFixed(2), "A", needleA, "#3b82f6");
      ctx.fillStyle = ammeterConn === "series" ? "#22c55e" : "#ef4444";
      ctx.font = "9px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(ammeterConn === "series" ? "Nối tiếp ✓" : "Song song ✗", amX, amY + 58);

      // Voltmeter
      const vmX = 500, vmY = 200;
      const needleV = isRunning ? voltVal / 10.0 : 0;
      drawMeter(vmX, vmY, "V", voltVal.toFixed(1), "V", needleV, "#22c55e");
      ctx.fillStyle = voltmeterConn === "parallel" ? "#22c55e" : "#ef4444";
      ctx.font = "9px 'Space Grotesk'";
      ctx.fillText(voltmeterConn === "parallel" ? "Song song ✓" : "Ngắt", vmX, vmY + 58);

      // Voltmeter wires
      if (voltmeterConn === "parallel") {
        ctx.strokeStyle = circuitOk ? "#22c55e" : "#374151";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(lx + 20, ly - 8);
        ctx.lineTo(vmX - 45, ly - 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(lx, ly + 24);
        ctx.lineTo(lx + 60, ly + 40);
        ctx.lineTo(vmX - 45, vmY + 10);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Warning flash
      if (isRunning && ammeterConn === "parallel") {
        const flash = Math.sin(t * 10) > 0;
        if (flash) {
          ctx.fillStyle = "rgba(239,68,68,0.15)";
          ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 18px 'Space Grotesk'";
          ctx.textAlign = "center";
          ctx.fillText("⚠️ NGẮN MẠCH!", W / 2, 40);
        }
      }

      // Particles
      if (circuitOk && showParticles) {
        const speed = 0.2 + (bv / 9) * 0.3;
        for (let i = 0; i < 6; i++) {
          const frac = (t * speed + i / 6) % 1;
          let px: number, py: number;
          if (frac < 0.33) {
            px = bx + 34 + (lx - 25 - bx - 34) * (frac / 0.33);
            py = by;
          } else if (frac < 0.66) {
            const f = (frac - 0.33) / 0.33;
            px = lx;
            py = ly + 24 + (300 - ly - 24) * f;
          } else {
            const f = (frac - 0.66) / 0.34;
            px = lx + (bx - lx) * f;
            py = 300;
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

      ctx.fillStyle = "#475569";
      ctx.font = "12px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText("Thay đổi điện áp nguồn bằng thanh trượt bên dưới", W / 2, H - 15);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [isRunning, ammeterConn, voltmeterConn, showParticles, bv, circuitOk, currentVal, voltVal]);

  return (
    <div className="space-y-4">
      <LessonHeader icon={Gauge} title="Bài 24-25: Cường độ & Hiệu điện thế" subtitle="Đo cường độ dòng điện và hiệu điện thế">
        <ControlPanel
          isRunning={isRunning}
          onToggleRun={() => { setIsRunning(!isRunning); setWarned(false); play("switch"); }}
          onReset={reset}
          showParticles={showParticles}
          onToggleParticles={() => { setShowParticles(!showParticles); play("click"); }}
        />
      </LessonHeader>

      <div className="glass-panel p-4">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="w-full rounded-lg"
          style={{ maxHeight: "400px", background: "#0f1420" }}
        />
      </div>

      {/* Voltage slider */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">⚡ Điện áp nguồn (U)</span>
          <span className="text-xs font-mono text-primary font-bold">{bv}V</span>
        </div>
        <Slider
          value={batteryVoltage}
          onValueChange={setBatteryVoltage}
          min={1}
          max={9}
          step={0.5}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground/50">1V</span>
          <span className="text-[10px] text-muted-foreground/50">9V</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setAmmeterConn(ammeterConn === "series" ? "parallel" : "series"); play("switch"); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            ammeterConn === "series"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "bg-destructive/20 text-destructive border border-destructive/30"
          }`}
        >
          Ampe kế: {ammeterConn === "series" ? "Nối tiếp ✓" : "Song song ✗"}
        </button>
        <button
          onClick={() => { setVoltmeterConn(voltmeterConn === "parallel" ? "none" : "parallel"); play("switch"); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            voltmeterConn === "parallel"
              ? "bg-success/20 text-success border border-success/30"
              : "bg-secondary/50 text-muted-foreground border border-border/30"
          }`}
        >
          Vôn kế: {voltmeterConn === "parallel" ? "Song song ✓" : "Ngắt"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground mb-1">Cường độ dòng điện (I)</p>
          <p className="text-3xl font-bold font-mono text-primary">
            {currentVal.toFixed(2)}<span className="text-lg ml-1">A</span>
          </p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground mb-1">Hiệu điện thế (U)</p>
          <p className="text-3xl font-bold font-mono text-success">
            {voltVal.toFixed(1)}<span className="text-lg ml-1">V</span>
          </p>
        </div>
      </div>
    </div>
  );
}
