import { useState, useRef, useEffect, useCallback } from "react";
<<<<<<< HEAD
import { Zap } from "lucide-react";
=======
import { Zap, BookOpen, MousePointer2, HelpCircle } from "lucide-react";
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { LessonMedia } from "@/components/LessonMedia";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";
import { useLessonShortcuts } from "@/hooks/useLessonShortcuts";
import { LessonWrapUp } from "@/components/LessonWrapUp";

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
<<<<<<< HEAD
  const [attractionForce, setAttractionForce] = useState([50]);
=======
  const [attractionForce, setAttractionForce] = useState([60]);
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
  const scrapsRef = useRef<Scrap[]>([]);
  const animRef = useRef<number>(0);
  const lastMouseX = useRef(0);
  const lastSparkTime = useRef(0);
  const { play } = useSound();
  const openHelp = () => window.dispatchEvent(new Event("open-help-dialog"));

  const initScraps = useCallback(() => {
    const scraps: Scrap[] = [];
<<<<<<< HEAD
    for (let i = 0; i < 12; i++) {
      scraps.push({
        x: 150 + Math.random() * 400,
        y: 340 + Math.random() * 40,
        vx: 0, vy: 0,
        attached: false,
        size: 3 + Math.random() * 4,
=======
    for (let i = 0; i < 15; i++) {
      scraps.push({
        x: 100 + Math.random() * 500,
        y: 340 + Math.random() * 40,
        vx: 0, vy: 0,
        attached: false,
        size: 3 + Math.random() * 5,
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
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
<<<<<<< HEAD
      ctx.roundRect(clothX, clothY, 100, 60, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#a0896a";
      ctx.font = "11px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText("Vải len", clothX + 50, clothY + 35);
=======
      ctx.roundRect(clothX, clothY, 120, 70, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText("VẢI LEN", clothX + 60, clothY + 40);
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019

      // Ruler
      const rx = rulerPos.x, ry = rulerPos.y;
      const gradient = ctx.createLinearGradient(rx - 80, ry, rx + 80, ry);
      gradient.addColorStop(0, "#3b82f6");
      gradient.addColorStop(1, "#1d4ed8");
      ctx.fillStyle = gradient;
      ctx.beginPath();
<<<<<<< HEAD
      ctx.roundRect(rx - 80, ry - 10, 160, 20, 4);
      ctx.fill();

      // Charge glow
      if (charge > 0) {
        ctx.shadowColor = `rgba(59,130,246,${Math.min(charge / 100, 0.8)})`;
        ctx.shadowBlur = 15 + charge / 5;
        ctx.fillStyle = `rgba(59,130,246,${charge / 200})`;
        ctx.beginPath();
        ctx.roundRect(rx - 80, ry - 10, 160, 20, 4);
=======
      ctx.roundRect(rx - 80, ry - 12, 160, 24, 6);
      ctx.fill();

      // Charge glow and sparks
      if (charge > 0) {
        ctx.shadowColor = `rgba(59,130,246,${Math.min(charge / 80, 0.9)})`;
        ctx.shadowBlur = 10 + charge / 4;
        ctx.fillStyle = `rgba(147, 197, 253, ${charge / 300})`;
        ctx.beginPath();
        ctx.roundRect(rx - 80, ry - 12, 160, 24, 6);
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";

<<<<<<< HEAD
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
=======
        if (showParticles) {
          // Inner static electrons
          for (let i = 0; i < Math.min(charge / 5, 15); i++) {
            const px = rx - 75 + Math.random() * 150;
            const py = ry - 8 + Math.random() * 16;
            ctx.fillStyle = "#ffffff";
            ctx.beginPath();
            ctx.arc(px, py, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }

          // External spark arcs
          if (charge > 70) {
            ctx.strokeStyle = `rgba(191, 219, 254, ${(charge - 70) / 30})`;
            ctx.lineWidth = 1.5;
            for (let i = 0; i < 2; i++) {
              const sx = rx - 60 + Math.random() * 120;
              const sy = ry + 12;
              ctx.beginPath();
              ctx.moveTo(sx, sy);
              ctx.lineTo(sx + (Math.random() - 0.5) * 30, sy + 15 + Math.random() * 20);
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
              ctx.stroke();
            }
          }
        }
      }

<<<<<<< HEAD
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
=======
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText("THƯỚC NHỰA", rx, ry + 5);

      // Physics logic for paper scraps
      const scraps = scrapsRef.current;
      scraps.forEach(s => {
        if (charge > 20 && !s.attached) {
          const dx = rx - s.x;
          const dy = ry - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const influenceRange = (150 + charge) * forceMultiplier;
          
          if (dist < influenceRange) {
            const forceStrength = (charge / 100) * 0.45 * forceMultiplier / Math.max(dist / 80, 0.4);
            s.vx += dx * forceStrength * 0.015;
            s.vy += dy * forceStrength * 0.015;
            
            // Interaction: Snap to ruler
            if (dist < 28) {
              s.attached = true;
              s.x = rx + (Math.random() - 0.5) * 140;
              s.y = ry + 14;
              play("spark");
            }
          }
        }

        if (s.attached) {
          // Stay attached to ruler with slight wobble
          s.x = rx + (s.x - rx) * 0.95;
          s.y = ry + 14 + Math.sin(Date.now() / 400 + s.angle) * 1.5;
        } else {
          // Gravity and air resistance
          s.vy += 0.12;
          s.x += s.vx;
          s.y += s.vy;
          s.vx *= 0.96;
          s.vy *= 0.96;
          if (s.y > 360) { 
            s.y = 360; 
            s.vy = 0; 
            s.vx *= 0.8;
          }
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
        }

        ctx.save();
        ctx.translate(s.x, s.y);
<<<<<<< HEAD
        ctx.rotate(s.angle + (s.attached ? Math.sin(Date.now() / 300) * 0.1 : 0));
        ctx.fillStyle = s.attached ? "#fbbf24" : "#e2e8f0";
=======
        ctx.rotate(s.angle + (s.attached ? Math.sin(Date.now() / 250) * 0.15 : 0));
        ctx.fillStyle = s.attached ? "#60a5fa" : "#f8fafc";
        ctx.shadowBlur = s.attached ? 5 : 0;
        ctx.shadowColor = "#3b82f6";
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
        ctx.fillRect(-s.size / 2, -s.size / 2, s.size, s.size);
        ctx.restore();
      });

<<<<<<< HEAD
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
=======
      // HUD: Instructions
      ctx.fillStyle = "#94a3b8";
      ctx.font = "italic 13px 'Space Grotesk'";
      ctx.textAlign = "center";
      if (charge < 40) {
        ctx.fillText("☝️ Kéo thước chà sát mạnh vào miếng vải len để tích điện", W / 2, H - 25);
      } else {
        ctx.fillText("✨ Thước đã nhiễm điện! Đưa lại gần giấy vụn để xem lực hút", W / 2, H - 25);
      }

      // Charge bar UI
      const barW = 120, barH = 14;
      const barX = W - barW - 20, barY = 25;
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 4);
      ctx.fill();
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.roundRect(barX + 2, barY + 2, Math.max(0, (charge / 100) * (barW - 4)), barH - 4, 2);
      ctx.fill();
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "bold 10px 'JetBrains Mono'";
      ctx.textAlign = "right";
      ctx.fillText(`${Math.round(charge)}%`, barX - 5, barY + 11);
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
<<<<<<< HEAD
  }, [charge, rulerPos, showParticles, attractionForce]);
=======
  }, [charge, rulerPos, showParticles, attractionForce, play]);
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
<<<<<<< HEAD
    if (Math.abs(x - rulerPos.x) < 80 && Math.abs(y - rulerPos.y) < 15) {
=======
    if (Math.abs(x - rulerPos.x) < 90 && Math.abs(y - rulerPos.y) < 20) {
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
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

<<<<<<< HEAD
    if (x > 50 && x < 150 && y > 100 && y < 160) {
      const dx = Math.abs(x - lastMouseX.current);
      if (dx > 3) {
        setRubCount(p => p + 1);
        setCharge(p => Math.min(p + 0.8, 100));
        const now = Date.now();
        if (now - lastSparkTime.current > 300) {
=======
    // Detection of rubbing action
    if (x > 50 && x < 170 && y > 100 && y < 170) {
      const dx = Math.abs(x - lastMouseX.current);
      if (dx > 4) {
        setRubCount(p => p + 1);
        setCharge(p => Math.min(p + 0.95, 100));
        const now = Date.now();
        if (now - lastSparkTime.current > 250) {
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
          play("spark");
          lastSparkTime.current = now;
        }
      }
    }
    lastMouseX.current = x;
  };

  return (
<<<<<<< HEAD
    <div className="space-y-4">
      <LessonHeader icon={Zap} title="Bài 20: Nhiễm điện" subtitle="Hiện tượng nhiễm điện do cọ xát">
=======
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <LessonHeader 
        icon={Zap} 
        title="Bài 20: Nhiễm điện do cọ xát" 
        subtitle="Khoa học tự nhiên 8 - Chủ đề: Điện"
      >
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
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
<<<<<<< HEAD
        title="Nhiễm điện do cọ xát"
        summary="Cọ xát thước nhựa với vải len tạo ra sự dịch chuyển electron và làm thước nhiễm điện, thu hút mẩu giấy nhẹ.
Các học sinh có thể tương tác để thấy lực hút mạnh lên khi điện tích tăng." 
        audioText="Trong bài này, bạn sẽ thấy thước nhựa nhiễm điện khi được cọ xát với vải len. Các electron di chuyển từ vải sang thước, tạo ra lực hấp dẫn đến những mẩu giấy." 
      />

      <div className="glass-panel p-4">
        <canvas
          ref={canvasRef}
          width={700}
          height={400}
          className="w-full rounded-lg cursor-grab active:cursor-grabbing"
          style={{ maxHeight: "400px", background: "#0f1420" }}
          role="img"
          aria-label="Mô phỏng nhiễm điện do cọ xát với thước nhựa và mẩu giấy"
=======
        title="Thí nghiệm mô phỏng"
        summary="Khi cọ xát thước nhựa với vải len, các electron dịch chuyển từ vải sang thước. Thước nhựa trở nên nhiễm điện âm và có khả năng hút các vật nhẹ như giấy vụn thông qua hiện tượng phân cực điện môi." 
        audioText="Hãy thực hiện cọ xát thước nhựa vào vải len. Bạn sẽ thấy thước tích điện và hút các mẩu giấy. Đây chính là minh chứng cho sự dịch chuyển electron." 
      />

      // Guide Cards
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-3 flex items-start gap-3 bg-blue-500/5">
          <MousePointer2 className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-blue-100">B1: Cọ xát</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Nhấn giữ thước và di chuyển nhanh qua lại trên miếng vải len.</p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-3 bg-amber-500/5">
          <Zap className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-100">B2: Tích điện</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Quan sát thanh năng lượng đạt trên 50% để tạo lực hút đủ mạnh.</p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-3 bg-emerald-500/5">
          <HelpCircle className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-100">B3: Thử nghiệm</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Đưa thước lại gần các mẩu giấy ở phía dưới để quan sát hiện tượng.</p>
          </div>
        </div>
      </div>

      <div className="glass-panel p-1 bg-slate-900/50 overflow-hidden relative group">
        <canvas
          ref={canvasRef}
          width={800}
          height={400}
          className="w-full rounded-lg cursor-grab active:cursor-grabbing transition-colors duration-300"
          style={{ maxHeight: "400px", background: "#0a0f1a" }}
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        />
      </div>

<<<<<<< HEAD
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
=======
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-panel p-5">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Kiến thức bổ trợ</h3>
            </div>
            <div className="space-y-4 text-sm leading-relaxed">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="font-semibold text-primary mb-1">Cơ chế Electron:</p>
                <p className="text-muted-foreground">Khi hai vật cọ xát, các electron từ vải len bị bứt ra và bám vào thước nhựa. Thước nhựa lúc này có dư electron nên mang <b>điện tích âm</b>.</p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                <p className="font-semibold text-secondary mb-1">Tại sao hút được giấy?</p>
                <p className="text-muted-foreground">Thước nhiễm điện đưa lại gần mẩu giấy trung hòa sẽ làm các điện tích trong giấy tái sắp xếp (phân cực), tạo ra lực hút tĩnh điện giữa thước và phần mặt giấy gần nó.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Zap className="w-3 h-3" /> Cường độ lực tĩnh điện
            </p>
            <Slider
              value={attractionForce}
              onValueChange={setAttractionForce}
              min={20}
              max={150}
              step={1}
              className="mb-4"
            />
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Cọ xát</p>
                <p className="text-xl font-bold font-mono text-primary">{rubCount}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">Giấy dính</p>
                <p className="text-xl font-bold font-mono text-emerald-400">
                  {scrapsRef.current.filter(s => s.attached).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
      <LessonWrapUp
        lessonTitle="Bài 20: Nhiễm điện do cọ xát"
        quizLesson="20"
        points={[
<<<<<<< HEAD
          "Cọ xát làm electron dịch chuyển và tạo điện tích trên vật.",
          "Điện tích càng lớn thì lực hút tĩnh điện lên vật nhẹ càng mạnh.",
          "Môi trường ẩm làm điện tích tiêu tán nhanh hơn.",
=======
          "Nhiều vật bị nhiễm điện khi được cọ xát với các vật khác.",
          "Vật nhiễm điện có khả năng hút các vật nhẹ (giấy, tóc, sợi bông).",
          "Sự nhiễm điện thực chất là quá trình dịch chuyển electron giữa các bề mặt vật liệu.",
          "Điện tích càng lớn, khoảng cách càng gần thì lực hút tĩnh điện càng mạnh."
>>>>>>> 3d586985fdb027b6a46b86c12df364896fb00019
        ]}
      />
    </div>
  );
}
