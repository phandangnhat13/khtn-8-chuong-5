import { useState, useRef, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";

interface Scrap {
  x: number;
  y: number;
  vx: number;
  vy: number;
  attached: boolean;
  size: number;
  angle: number;
}

export default function Lesson20() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [charge, setCharge] = useState(0);
  const [rulerPos, setRulerPos] = useState({ x: 300, y: 150 });
  const [isDragging, setIsDragging] = useState(false);
  const [rubCount, setRubCount] = useState(0);
  const [attractionForce, setAttractionForce] = useState([50]);
  const scrapsRef = useRef<Scrap[]>([]);
  const animRef = useRef<number>(0);
  const lastMouseX = useRef(0);
  const lastSparkTime = useRef(0);
  const { play } = useSound();

  const initScraps = useCallback(() => {
    const scraps: Scrap[] = [];
    for (let i = 0; i < 12; i++) {
      scraps.push({
        x: 150 + Math.random() * 400,
        y: 340 + Math.random() * 40,
        vx: 0, vy: 0,
        attached: false,
        size: 3 + Math.random() * 4,
        angle: Math.random() * Math.PI * 2,
      });
    }
    scrapsRef.current = scraps;
  }, []);

  useEffect(() => { initScraps(); }, [initScraps]);

  const reset = () => {
    setCharge(0);
    setRubCount(0);
    setRulerPos({ x: 300, y: 150 });
    setIsRunning(false);
    initScraps();
    play("click");
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    const forceMultiplier = attractionForce[0] / 50;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Table surface
      ctx.fillStyle = "#1a1f2e";
      ctx.fillRect(0, 320, W, H - 320);
      ctx.strokeStyle = "#2a3040";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 320);
      ctx.lineTo(W, 320);
      ctx.stroke();

      // Wool cloth
      ctx.fillStyle = "#8B4513";
      ctx.strokeStyle = "#6B3410";
      ctx.lineWidth = 2;
      const clothX = 50, clothY = 100;
      ctx.beginPath();
      ctx.roundRect(clothX, clothY, 100, 60, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#a0896a";
      ctx.font = "11px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText("Vải len", clothX + 50, clothY + 35);

      // Ruler
      const rx = rulerPos.x, ry = rulerPos.y;
      const gradient = ctx.createLinearGradient(rx - 80, ry, rx + 80, ry);
      gradient.addColorStop(0, "#3b82f6");
      gradient.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(rx - 80, ry - 10, 160, 20, 4);
      ctx.fill();

      // Charge glow
      if (charge > 0) {
        ctx.shadowColor = `rgba(59,130,246,${Math.min(charge / 100, 0.8)})`;
        ctx.shadowBlur = 15 + charge / 5;
        ctx.fillStyle = `rgba(59,130,246,${charge / 200})`;
        ctx.beginPath();
        ctx.roundRect(rx - 80, ry - 10, 160, 20, 4);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";

        // Spark particles on ruler
        if (showParticles) {
          for (let i = 0; i < Math.min(charge / 10, 8); i++) {
            const px = rx - 70 + Math.random() * 140;
            const py = ry - 5 + Math.random() * 10;
            ctx.fillStyle = "#60a5fa";
            ctx.beginPath();
            ctx.arc(px, py, 1.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Spark lines when charge is high
          if (charge > 60) {
            ctx.strokeStyle = `rgba(96,165,250,${(charge - 60) / 80})`;
            ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) {
              const sx = rx - 60 + Math.random() * 120;
              const sy = ry + 10;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx + (Math.random() - 0.5) * 20, sy + 10 + Math.random() * 15);
              ctx.lineTo(sx + (Math.random() - 0.5) * 25, sy + 25 + Math.random() * 10);
              ctx.stroke();
            }
          }
        }
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText("Thước nhựa", rx, ry + 4);

      // Paper scraps with attraction physics
      const scraps = scrapsRef.current;
      scraps.forEach(s => {
        if (charge > 30 && !s.attached) {
          const dx = rx - s.x;
          const dy = ry - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < (120 + charge) * forceMultiplier) {
            const force = (charge / 100) * 0.3 * forceMultiplier / Math.max(dist / 100, 0.5);
            s.vx += dx * force * 0.01;
            s.vy += dy * force * 0.01;
            if (dist < 25) {
              s.attached = true;
              s.x = rx + (s.x - rx) * 0.5;
              s.y = ry + 12;
            }
          }
        }
        if (s.attached) {
          s.x = rx + (s.x - rx) * 0.98;
          s.y = ry + 12 + Math.sin(Date.now() / 500 + s.angle) * 2;
        } else {
          s.vy += 0.05;
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.98;
          s.vy *= 0.98;
          if (s.y > 360) { s.y = 360; s.vy = 0; }
        }

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle + (s.attached ? Math.sin(Date.now() / 300) * 0.1 : 0));
        ctx.fillStyle = s.attached ? "#fbbf24" : "#e2e8f0";
        ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
        ctx.restore();
      });

      // Instructions
      ctx.fillStyle = "#64748b";
      ctx.font = "12px 'Space Grotesk'";
      ctx.textAlign = "center";
      if (charge < 30) {
        ctx.fillText("🧲 Kéo thước qua vải len để tích điện!", W / 2, H - 20);
      } else {
        ctx.fillText("⚡ Đưa thước lại gần các mẩu giấy!", W / 2, H - 20);
      }

      // Charge meter
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(W - 120, 15, 100, 30, 6);
      ctx.fill();
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.roundRect(W - 116, 19, Math.min(charge, 100) * 0.92, 22, 4);
      ctx.fill();
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "10px 'JetBrains Mono'";
      ctx.textAlign = "center";
      ctx.fillText(`Điện tích: ${Math.round(charge)}%`, W - 70, 34);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [charge, rulerPos, showParticles, attractionForce]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (Math.abs(x - rulerPos.x) < 80 && Math.abs(y - rulerPos.y) < 15) {
      setIsDragging(true);
      lastMouseX.current = x;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRulerPos({ x, y });

    if (x > 50 && x < 150 && y > 100 && y < 160) {
      const dx = Math.abs(x - lastMouseX.current);
      if (dx > 3) {
        setRubCount(p => p + 1);
        setCharge(p => Math.min(p + 0.8, 100));
        const now = Date.now();
        if (now - lastSparkTime.current > 300) {
          play("spark");
          lastSparkTime.current = now;
        }
      }
    }
    lastMouseX.current = x;
  };

  return (
    <div className="space-y-4">
      <LessonHeader icon={Zap} title="Bài 20: Nhiễm điện" subtitle="Hiện tượng nhiễm điện do cọ xát">
        <ControlPanel
          isRunning={isRunning}
          onToggleRun={() => { setIsRunning(!isRunning); play("click"); }}
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
          className="w-full rounded-lg cursor-grab active:cursor-grabbing"
          style={{ maxHeight: "400px", background: "#0f1420" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        />
      </div>

      {/* Slider for attraction force */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Lực hút tĩnh điện</span>
          <span className="text-xs font-mono text-primary">{attractionForce[0]}%</span>
        </div>
        <Slider
          value={attractionForce}
          onValueChange={setAttractionForce}
          min={10}
          max={100}
          step={5}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground mb-1">Số lần cọ xát</p>
          <p className="text-2xl font-bold font-mono text-primary">{rubCount}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground mb-1">Điện tích</p>
          <p className="text-2xl font-bold font-mono text-accent">{Math.round(charge)}%</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-xs text-muted-foreground mb-1">Giấy bị hút</p>
          <p className="text-2xl font-bold font-mono text-success">{scrapsRef.current.filter(s => s.attached).length}/12</p>
        </div>
      </div>
    </div>
  );
}
