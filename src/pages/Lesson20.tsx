import { useState, useRef, useEffect, useCallback } from "react";
import { Zap, BookOpen, MousePointer2, HelpCircle } from "lucide-react";

import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { LessonMedia } from "@/components/LessonMedia";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";
import { useLessonShortcuts } from "@/hooks/useLessonShortcuts";
import { LessonWrapUp } from "@/components/LessonWrapUp";
import { ThreeSceneLesson20 } from "@/components/ThreeSceneLesson20";

interface Scrap {
  x: number;
  y: number;
  vx: number;
  vy: number;
  attached: boolean;
  size: number;
  angle: number;
}

const CHARGE_DECAY_DELAY_MS = 1200;
const CHARGE_DECAY_PER_SECOND = 7;
const PAPER_RELEASE_CHARGE = 12;

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
  const lastMouseY = useRef(0);
  const lastSparkTime = useRef(0);
  const isRubbingRef = useRef(false);
  const lastRubbedAtRef = useRef(0);
  const { play } = useSound();
  const openHelp = () => window.dispatchEvent(new Event("open-help-dialog"));

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
    isRubbingRef.current = false;
    lastRubbedAtRef.current = 0;
    initScraps();
    play("click");
  };

  useLessonShortcuts({
    isRunning,
    onToggleRun: () => {
      setIsRunning((v) => !v);
      play("click");
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
    const intervalId = window.setInterval(() => {
      const shouldDecay = !isRubbingRef.current && Date.now() - lastRubbedAtRef.current > CHARGE_DECAY_DELAY_MS;
      if (!shouldDecay) return;

      setCharge((currentCharge) => {
        if (currentCharge <= 0) return 0;
        const easingDecay = Math.max(CHARGE_DECAY_PER_SECOND / 12, currentCharge * 0.018);
        return Math.max(0, currentCharge - easingDecay);
      });
    }, 100);

    return () => window.clearInterval(intervalId);
  }, []);

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
        if (s.attached && charge < PAPER_RELEASE_CHARGE) {
          s.attached = false;
          s.vx = (Math.random() - 0.5) * 0.8;
          s.vy = 0.4;
        }

        if (charge > 20 && !s.attached) {
          const dx = rx - s.x;
          const dy = ry - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const attractionRadius = (140 + charge * 1.5) * forceMultiplier;
          if (dist < attractionRadius) {
            const force = (charge / 100) * 0.45 * forceMultiplier / Math.max(dist / 100, 0.35);
            if (showParticles) {
              const alpha = Math.min(0.65, (1 - dist / attractionRadius) * (charge / 100));
              const arrowX = s.x + dx * 0.35;
              const arrowY = s.y + dy * 0.35;
              ctx.save();
              ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
              ctx.fillStyle = `rgba(96,165,250,${alpha})`;
              ctx.lineWidth = 1.2;
              ctx.setLineDash([4, 5]);
              ctx.beginPath();
              ctx.moveTo(s.x, s.y);
              ctx.lineTo(arrowX, arrowY);
              ctx.stroke();
              ctx.setLineDash([]);
              const angle = Math.atan2(dy, dx);
              ctx.beginPath();
              ctx.moveTo(arrowX, arrowY);
              ctx.lineTo(arrowX - Math.cos(angle - 0.45) * 7, arrowY - Math.sin(angle - 0.45) * 7);
              ctx.lineTo(arrowX - Math.cos(angle + 0.45) * 7, arrowY - Math.sin(angle + 0.45) * 7);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
            s.vx += dx * force * 0.012;
            s.vy += dy * force * 0.012;
            if (dist < 32 + charge * 0.08) {
              s.attached = true;
              s.x = rx + (s.x - rx) * 0.5;
              s.y = ry + 12;
            }
          }
        }
        if (s.attached) {
          s.x += (rx - s.x) * 0.18;
          s.y += (ry + 12 + Math.sin(Date.now() / 500 + s.angle) * 2 - s.y) * 0.22;
        } else {
          s.vy += 0.05;
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.98;
          s.vy *= 0.98;
          s.angle += s.vx * 0.03;
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
      lastMouseY.current = y;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setRulerPos({ x, y });

    const isOverCloth = x > 40 && x < 160 && y > 90 && y < 170;
    isRubbingRef.current = false;

    if (isOverCloth) {
      const dx = x - lastMouseX.current;
      const dy = y - lastMouseY.current;
      const dragDistance = Math.hypot(dx, dy);
      if (dragDistance > 2) {
        isRubbingRef.current = true;
        lastRubbedAtRef.current = Date.now();
        setRubCount((p) => p + 1);
        setCharge((p) => Math.min(p + Math.min(dragDistance * 0.4, 2), 100));
        const now = Date.now();
        if (now - lastSparkTime.current > 300) {
          play("spark");
          lastSparkTime.current = now;
        }
      }
    }
    lastMouseX.current = x;
    lastMouseY.current = y;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <LessonHeader icon={Zap} title="Bài 20: Nhiễm điện" subtitle="Hiện tượng nhiễm điện do cọ xát">
        <ControlPanel
          isRunning={isRunning}
          onToggleRun={() => { setIsRunning(!isRunning); play("click"); }}
          onReset={reset}
          showParticles={showParticles}
          onToggleParticles={() => { setShowParticles(!showParticles); play("click"); }}
          onOpenHelp={openHelp}
        />
      </LessonHeader>

      <LessonMedia
        mediaVariant="electrostatic"
        title="Nhiễm điện do cọ xát"
        summary="Cọ xát thước nhựa với vải len tạo ra sự dịch chuyển electron và làm thước nhiễm điện, thu hút mẩu giấy nhẹ.
Các học sinh có thể tương tác để thấy lực hút mạnh lên khi điện tích tăng."
        audioText="Trong bài này, bạn sẽ thấy thước nhựa nhiễm điện khi được cọ xát với vải len. Các electron di chuyển từ vải sang thước, tạo ra lực hấp dẫn đến những mẩu giấy."
        ThreeSceneComponent={ThreeSceneLesson20}
      />

      <div className="glass-panel p-4 space-y-2">
        <div className="border border-white/5 rounded-lg overflow-hidden bg-slate-900/50">
          <canvas
            ref={canvasRef}
            width={700}
            height={420}
            className="w-full cursor-grab active:cursor-grabbing"
            style={{ maxHeight: "420px", background: "#0f1420" }}
            role="img"
            aria-label="Mô phỏng nhiễm điện do cọ xát với thước nhựa và mẩu giấy"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={() => {
              setIsDragging(false);
              isRubbingRef.current = false;
            }}
            onMouseLeave={() => {
              setIsDragging(false);
              isRubbingRef.current = false;
            }}
          />
        </div>
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
      <LessonWrapUp
        lessonTitle="Bài 20: Nhiễm điện do cọ xát"
        quizLesson="20"
        points={[

          "Cọ xát làm electron dịch chuyển và tạo điện tích trên vật.",
          "Điện tích càng lớn thì lực hút tĩnh điện lên vật nhẹ càng mạnh.",
          "Môi trường ẩm làm điện tích tiêu tán nhanh hơn.",
        ]}
      />
    </div>
  );
}
