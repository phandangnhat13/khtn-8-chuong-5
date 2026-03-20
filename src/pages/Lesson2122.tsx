import { useState, useRef, useEffect, useCallback } from "react";
import { CircuitBoard } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { useSound } from "@/hooks/useSound";

interface Component {
  id: string;
  type: "battery" | "switch" | "bulb" | "ammeter" | "wire";
  x: number;
  y: number;
  label: string;
  voltage?: number;
  closed?: boolean;
}

const COMPONENTS_PALETTE: Omit<Component, "x" | "y" | "id">[] = [
  { type: "battery", label: "Pin 1.5V", voltage: 1.5 },
  { type: "battery", label: "Pin 3V", voltage: 3 },
  { type: "switch", label: "Công tắc", closed: false },
  { type: "bulb", label: "Bóng đèn" },
  { type: "ammeter", label: "Ampe kế" },
];

export default function Lesson2122() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [components, setComponents] = useState<Component[]>([
    { id: "bat1", type: "battery", x: 200, y: 100, label: "Pin 3V", voltage: 3 },
    { id: "sw1", type: "switch", x: 450, y: 100, label: "Công tắc", closed: false },
    { id: "bulb1", type: "bulb", x: 450, y: 300, label: "Bóng đèn" },
    { id: "amm1", type: "ammeter", x: 200, y: 300, label: "Ampe kế" },
  ]);
  const [dragId, setDragId] = useState<string | null>(null);
  const [circuitClosed, setCircuitClosed] = useState(false);
  const animRef = useRef<number>(0);
  const particlePhase = useRef(0);

  const checkCircuit = useCallback((comps: Component[]) => {
    const hasBattery = comps.some(c => c.type === "battery");
    const hasBulb = comps.some(c => c.type === "bulb");
    const switchComp = comps.find(c => c.type === "switch");
    const switchOk = !switchComp || switchComp.closed;
    return hasBattery && hasBulb && switchOk && comps.length >= 3;
  }, []);

  useEffect(() => {
    setCircuitClosed(isRunning && checkCircuit(components));
  }, [isRunning, components, checkCircuit]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particlePhase.current += 0.02;

      // Grid background
      ctx.strokeStyle = "#1a2035";
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // Draw wires connecting components in order
      if (components.length > 1) {
        ctx.strokeStyle = circuitClosed ? "#3b82f6" : "#374151";
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < components.length; i++) {
          const c = components[i];
          const next = components[(i + 1) % components.length];
          ctx.moveTo(c.x + 30, c.y);
          // Wire path: right from current, then to next
          if (i < components.length - 1) {
            ctx.lineTo(next.x - 30, next.y);
          } else {
            ctx.lineTo(components[0].x - 30, components[0].y);
          }
        }
        ctx.stroke();

        // Wire corners
        ctx.strokeStyle = circuitClosed ? "#3b82f6" : "#374151";
        ctx.lineWidth = 3;
        // Draw circuit path
        const path: { x: number; y: number }[] = [];
        components.forEach((c, i) => {
          path.push({ x: c.x, y: c.y });
          const next = components[(i + 1) % components.length];
          path.push({ x: next.x, y: next.y });
        });

        // Draw electron particles along wires
        if (circuitClosed && showParticles) {
          const t = particlePhase.current;
          for (let i = 0; i < components.length; i++) {
            const c = components[i];
            const next = components[(i + 1) % components.length];
            for (let p = 0; p < 5; p++) {
              const frac = ((t * 0.5 + p * 0.2) % 1);
              const px = c.x + (next.x - c.x) * frac;
              const py = c.y + (next.y - c.y) * frac;
              ctx.fillStyle = "#fbbf24";
              ctx.shadowColor = "#fbbf24";
              ctx.shadowBlur = 8;
              ctx.beginPath();
              ctx.arc(px, py, 3, 0, Math.PI * 2);
              ctx.fill();
            }
          }
          ctx.shadowBlur = 0;
        }
      }

      // Draw components
      components.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);

        if (c.type === "battery") {
          // Battery body
          ctx.fillStyle = "#374151";
          ctx.beginPath();
          ctx.roundRect(-30, -18, 60, 36, 6);
          ctx.fill();
          // Terminals
          ctx.fillStyle = "#ef4444";
          ctx.fillRect(24, -8, 10, 16);
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(-34, -6, 8, 12);
          // Label
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "10px 'Space Grotesk'";
          ctx.textAlign = "center";
          ctx.fillText(c.label, 0, 4);
          // + -
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 12px sans-serif";
          ctx.fillText("+", 28, -12);
          ctx.fillText("−", -30, -10);
        }

        if (c.type === "switch") {
          ctx.strokeStyle = c.closed ? "#22c55e" : "#ef4444";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(-20, 0, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(20, 0, 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(-16, 0);
          if (c.closed) {
            ctx.lineTo(16, 0);
          } else {
            ctx.lineTo(10, -18);
          }
          ctx.stroke();
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px 'Space Grotesk'";
          ctx.textAlign = "center";
          ctx.fillText(c.closed ? "Đóng" : "Mở", 0, 24);
        }

        if (c.type === "bulb") {
          // Bulb
          if (circuitClosed) {
            ctx.shadowColor = "#fbbf24";
            ctx.shadowBlur = 30;
            ctx.fillStyle = "#fbbf24";
          } else {
            ctx.fillStyle = "#374151";
          }
          ctx.beginPath();
          ctx.arc(0, -5, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
          // Base
          ctx.fillStyle = "#6b7280";
          ctx.fillRect(-10, 13, 20, 10);
          // Filament
          ctx.strokeStyle = circuitClosed ? "#fff" : "#4b5563";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-5, 5);
          ctx.lineTo(0, -10);
          ctx.lineTo(5, 5);
          ctx.stroke();
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px 'Space Grotesk'";
          ctx.textAlign = "center";
          ctx.fillText("Đèn", 0, 36);
        }

        if (c.type === "ammeter") {
          ctx.fillStyle = "#1e293b";
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(0, 0, 22, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = "#e2e8f0";
          ctx.font = "bold 14px 'Space Grotesk'";
          ctx.textAlign = "center";
          ctx.fillText("A", 0, 5);
          if (circuitClosed) {
            // Needle
            ctx.strokeStyle = "#ef4444";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(12, -10);
            ctx.stroke();
            ctx.fillStyle = "#94a3b8";
            ctx.font = "9px 'JetBrains Mono'";
            ctx.fillText("0.5A", 0, 18);
          }
          ctx.fillStyle = "#94a3b8";
          ctx.font = "10px 'Space Grotesk'";
          ctx.fillText("Ampe kế", 0, 36);
        }

        ctx.restore();
      });

      // Instructions
      ctx.fillStyle = "#475569";
      ctx.font = "12px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText("Kéo thả các linh kiện • Nhấp công tắc để đóng/mở • Nhấn Chạy để thử mạch", W / 2, H - 15);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [components, circuitClosed, showParticles]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (700 / rect.width);
    const my = (e.clientY - rect.top) * (420 / rect.height);

    for (const c of components) {
      if (Math.abs(mx - c.x) < 35 && Math.abs(my - c.y) < 25) {
        // Click on switch to toggle
        if (c.type === "switch") {
          setComponents(prev => prev.map(p => p.id === c.id ? { ...p, closed: !p.closed } : p));
          return;
        }
        setDragId(c.id);
        return;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragId) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (700 / rect.width);
    const my = (e.clientY - rect.top) * (420 / rect.height);
    setComponents(prev => prev.map(c => c.id === dragId ? { ...c, x: mx, y: my } : c));
  };

  const reset = () => {
    setIsRunning(false);
    setComponents([
      { id: "bat1", type: "battery", x: 200, y: 100, label: "Pin 3V", voltage: 3 },
      { id: "sw1", type: "switch", x: 450, y: 100, label: "Công tắc", closed: false },
      { id: "bulb1", type: "bulb", x: 450, y: 300, label: "Bóng đèn" },
      { id: "amm1", type: "ammeter", x: 200, y: 300, label: "Ampe kế" },
    ]);
  };

  return (
    <div className="space-y-4">
      <LessonHeader icon={CircuitBoard} title="Bài 21-22: Mạch điện" subtitle="Xây dựng và kiểm tra mạch điện">
        <ControlPanel
          isRunning={isRunning}
          onToggleRun={() => setIsRunning(!isRunning)}
          onReset={reset}
          showParticles={showParticles}
          onToggleParticles={() => setShowParticles(!showParticles)}
        />
      </LessonHeader>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 glass-panel p-4">
          <canvas
            ref={canvasRef}
            width={700}
            height={420}
            className="w-full rounded-lg cursor-grab active:cursor-grabbing"
            style={{ maxHeight: "420px", background: "#0f1420" }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => setDragId(null)}
            onMouseLeave={() => setDragId(null)}
          />
        </div>

        <div className="space-y-3">
          <div className="glass-panel p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">🔧 Linh kiện</h3>
            <div className="space-y-2">
              {COMPONENTS_PALETTE.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 border border-border/30 text-sm text-muted-foreground cursor-default"
                >
                  <span className="text-lg">
                    {c.type === "battery" ? "🔋" : c.type === "switch" ? "🔌" : c.type === "bulb" ? "💡" : "📊"}
                  </span>
                  {c.label}
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">📊 Trạng thái</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mạch:</span>
                <span className={circuitClosed ? "text-success font-medium" : "text-destructive font-medium"}>
                  {circuitClosed ? "Kín ✓" : "Hở ✗"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dòng điện:</span>
                <span className="text-primary font-mono">{circuitClosed ? "0.5A" : "0A"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Đèn:</span>
                <span className={circuitClosed ? "text-accent" : "text-muted-foreground"}>
                  {circuitClosed ? "Sáng 💡" : "Tắt"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
