import { useState, useRef, useEffect, useCallback } from "react";
import { CircuitBoard, MousePointer2, HelpCircle, Zap, BookOpen } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { useSound } from "@/hooks/useSound";
import { LessonMedia } from "@/components/LessonMedia";
import { LessonWrapUp } from "@/components/LessonWrapUp";
import { ThreeSceneLesson23 } from "@/components/ThreeSceneLesson23";

type CompType = "battery" | "switch" | "bulb" | "ammeter";

interface Component {
  id: string;
  type: CompType;
  x: number;
  y: number;
  label: string;
  voltage?: number;
  closed?: boolean;
}

interface Wire {
  from: string;
  to: string;
}

interface Terminal {
  id: string;
  compId: string;
  cx: number;
  cy: number;
}

const W = 700;
const H = 420;

const TERMINAL_RADIUS = 5;
const SNAP_RADIUS = 16;

const COMPONENTS_PALETTE: Omit<Component, "x" | "y" | "id">[] = [
  { type: "battery", label: "Pin 1.5V", voltage: 1.5 },
  { type: "battery", label: "Pin 3V", voltage: 3 },
  { type: "switch", label: "Công tắc", closed: false },
  { type: "bulb", label: "Bóng đèn" },
  { type: "ammeter", label: "Ampe kế" },
];

const DEFAULT_COMPONENTS: Component[] = [
  { id: "bat1", type: "battery", x: 175, y: 110, label: "Pin 3V", voltage: 3 },
  { id: "sw1", type: "switch", x: 490, y: 110, label: "Công tắc", closed: false },
  { id: "bulb1", type: "bulb", x: 490, y: 310, label: "Bóng đèn" },
  { id: "amm1", type: "ammeter", x: 175, y: 310, label: "Ampe kế" },
];

let _idCounter = 100;
const genId = () => "c" + _idCounter++;

function getTerminals(c: Component): Terminal[] {
  const hw = c.type === "ammeter" ? 22 : 40;
  return [
    { id: `${c.id}-L`, compId: c.id, cx: c.x - hw, cy: c.y },
    { id: `${c.id}-R`, compId: c.id, cx: c.x + hw, cy: c.y },
  ];
}

function allTerminals(comps: Component[]): Terminal[] {
  return comps.flatMap(getTerminals);
}

function termById(id: string, comps: Component[]): Terminal | undefined {
  return allTerminals(comps).find((t) => t.id === id);
}

function nearTerminal(mx: number, my: number, comps: Component[], radius = SNAP_RADIUS): Terminal | undefined {
  return allTerminals(comps).find((t) => Math.hypot(mx - t.cx, my - t.cy) < radius);
}

function hitComp(mx: number, my: number, comps: Component[]): Component | undefined {
  for (let i = comps.length - 1; i >= 0; i--) {
    const c = comps[i];
    if (Math.abs(mx - c.x) < 45 && Math.abs(my - c.y) < 30) return c;
  }
  return undefined;
}

function nearWireIndex(mx: number, my: number, wires: Wire[], comps: Component[], thresh = 8): number {
  for (let i = wires.length - 1; i >= 0; i--) {
    const a = termById(wires[i].from, comps);
    const b = termById(wires[i].to, comps);
    if (!a || !b) continue;
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) continue;
    const t = Math.max(0, Math.min(1, ((mx - a.cx) * dx + (my - a.cy) * dy) / len2));
    if (Math.hypot(mx - (a.cx + t * dx), my - (a.cy + t * dy)) < thresh) return i;
  }
  return -1;
}

function checkCircuit(comps: Component[], wires: Wire[]): boolean {
  const batteries = comps.filter((c) => c.type === "battery");
  const bulbs = comps.filter((c) => c.type === "bulb");
  if (batteries.length === 0 || bulbs.length === 0) return false;

  const adj: Record<string, string[]> = {};
  const addEdge = (a: string, b: string) => {
    (adj[a] ??= []).push(b);
    (adj[b] ??= []).push(a);
  };

  comps.forEach((c) => {
    if (c.type === "battery") return;
    if (c.type === "switch" && !c.closed) return;
    addEdge(`${c.id}-L`, `${c.id}-R`);
  });

  wires.forEach((w) => addEdge(w.from, w.to));

  const ownerType = (tid: string): CompType | undefined =>
    comps.find((c) => tid === `${c.id}-L` || tid === `${c.id}-R`)?.type;

  for (const bat of batteries) {
    const startId = `${bat.id}-R`;
    const endId = `${bat.id}-L`;

    const visited = new Map<string, boolean>();
    visited.set(startId, ownerType(startId) === "bulb");
    const queue: Array<{ id: string; hasBulb: boolean }> = [
      { id: startId, hasBulb: visited.get(startId)! },
    ];

    while (queue.length > 0) {
      const { id: cur, hasBulb: hb } = queue.shift()!;

      if (cur === endId && hb) return true;

      for (const nb of adj[cur] ?? []) {
        const nbHasBulb = hb || ownerType(nb) === "bulb";
        const prev = visited.get(nb);
        if (prev === undefined || (!prev && nbHasBulb)) {
          visited.set(nb, nbHasBulb);
          queue.push({ id: nb, hasBulb: nbHasBulb });
        }
      }
    }
  }
  return false;
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#1a2035";
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
}

function drawTerminal(
  ctx: CanvasRenderingContext2D,
  t: Terminal,
  isHover: boolean,
  isConnected: boolean,
) {
  ctx.beginPath();
  ctx.arc(t.cx, t.cy, TERMINAL_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = isHover ? "#fbbf24" : isConnected ? "#22c55e" : "#475569";
  ctx.fill();
  ctx.strokeStyle = "#0f1420";
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawWire(
  ctx: CanvasRenderingContext2D,
  w: Wire,
  idx: number,
  comps: Component[],
  circuitClosed: boolean,
  deleteMode: boolean,
  hoverWireIdx: number,
  showParticles: boolean,
  phase: number,
) {
  const a = termById(w.from, comps);
  const b = termById(w.to, comps);
  if (!a || !b) return;

  const isHovered = deleteMode && hoverWireIdx === idx;
  ctx.strokeStyle = isHovered ? "#ef4444" : circuitClosed ? "#3b82f6" : "#374151";
  ctx.lineWidth = isHovered ? 3.5 : 2.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(a.cx, a.cy);
  ctx.lineTo(b.cx, b.cy);
  ctx.stroke();

  if (circuitClosed && showParticles && !deleteMode) {
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    const dist = Math.hypot(dx, dy);
    const count = Math.max(2, Math.floor(dist / 60));
    ctx.shadowColor = "#fbbf24";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#fbbf24";
    for (let p = 0; p < count; p++) {
      const f = ((phase * 0.4 + p / count) % 1);
      const px = a.cx + dx * f, py = a.cy + dy * f;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }
}

function drawComponent(ctx: CanvasRenderingContext2D, c: Component, circuitClosed: boolean) {
  ctx.save();
  ctx.translate(c.x, c.y);

  if (c.type === "battery") {
    ctx.fillStyle = "#374151";
    ctx.beginPath();
    (ctx as any).roundRect(-30, -18, 60, 36, 6);
    ctx.fill();
    ctx.fillStyle = "#ef4444"; ctx.fillRect(24, -8, 10, 16);
    ctx.fillStyle = "#3b82f6"; ctx.fillRect(-34, -6, 8, 12);
    ctx.fillStyle = "#e2e8f0"; ctx.font = "10px 'Space Grotesk'"; ctx.textAlign = "center";
    ctx.fillText(c.label, 0, 4);
    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 12px sans-serif";
    ctx.fillText("+", 28, -12);
    ctx.fillText("−", -30, -10);
  }

  if (c.type === "switch") {
    ctx.strokeStyle = c.closed ? "#22c55e" : "#ef4444";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(-20, 0, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(20, 0, 4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-16, 0);
    if (c.closed) ctx.lineTo(16, 0); else ctx.lineTo(10, -18);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px 'Space Grotesk'"; ctx.textAlign = "center";
    ctx.fillText(c.closed ? "Đóng" : "Mở", 0, 24);
  }

  if (c.type === "bulb") {
    if (circuitClosed) {
      ctx.shadowColor = "#fbbf24"; ctx.shadowBlur = 30; ctx.fillStyle = "#fbbf24";
    } else {
      ctx.fillStyle = "#374151";
    }
    ctx.beginPath(); ctx.arc(0, -5, 18, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#6b7280"; ctx.fillRect(-10, 13, 20, 10);
    ctx.strokeStyle = circuitClosed ? "#fff" : "#4b5563"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, 5); ctx.lineTo(0, -10); ctx.lineTo(5, 5); ctx.stroke();
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px 'Space Grotesk'"; ctx.textAlign = "center";
    ctx.fillText("Đèn", 0, 36);
  }

  if (c.type === "ammeter") {
    ctx.fillStyle = "#1e293b"; ctx.strokeStyle = "#3b82f6"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#e2e8f0"; ctx.font = "bold 14px 'Space Grotesk'"; ctx.textAlign = "center";
    ctx.fillText("A", 0, 5);
    if (circuitClosed) {
      ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -10); ctx.stroke();
      ctx.fillStyle = "#94a3b8"; ctx.font = "9px 'JetBrains Mono'";
      ctx.fillText("0.5A", 0, 18);
    }
    ctx.fillStyle = "#94a3b8"; ctx.font = "10px 'Space Grotesk'"; ctx.textAlign = "center";
    ctx.fillText("Ampe kế", 0, 36);
  }

  ctx.restore();
}

export default function Lesson2122() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const phaseRef = useRef(0);

  const stateRef = useRef({
    comps: DEFAULT_COMPONENTS.map((c) => ({ ...c })) as Component[],
    wires: [] as Wire[],
    dragging: null as Component | null,
    dragOffX: 0,
    dragOffY: 0,
    wiringFrom: null as string | null,
    mouseX: 0,
    mouseY: 0,
    isRunning: false,
    showParticles: true,
    deleteMode: false,
    hoverWire: -1,
  });

  const [isRunning, setIsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [deleteMode, setDeleteMode] = useState(false);
  const [statusCircuit, setStatusCircuit] = useState(false);
  const [statusCurrent, setStatusCurrent] = useState("0A");
  const [statusBulb, setStatusBulb] = useState(false);

  const { play } = useSound();
  const openHelp = () => window.dispatchEvent(new Event("open-help-dialog"));

  useEffect(() => { stateRef.current.isRunning = isRunning; }, [isRunning]);
  useEffect(() => { stateRef.current.showParticles = showParticles; }, [showParticles]);
  useEffect(() => { stateRef.current.deleteMode = deleteMode; }, [deleteMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const loop = () => {
      phaseRef.current += 0.03;
      const phase = phaseRef.current;
      const s = stateRef.current;

      const circuitClosed = s.isRunning && checkCircuit(s.comps, s.wires);

      if (s.deleteMode) s.hoverWire = nearWireIndex(s.mouseX, s.mouseY, s.wires, s.comps);
      else s.hoverWire = -1;

      ctx.clearRect(0, 0, W, H);
      drawGrid(ctx);

      s.wires.forEach((w, i) =>
        drawWire(ctx, w, i, s.comps, circuitClosed, s.deleteMode, s.hoverWire, s.showParticles, phase)
      );

      if (s.wiringFrom) {
        const a = termById(s.wiringFrom, s.comps);
        if (a) {
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.beginPath();
          ctx.moveTo(a.cx, a.cy);
          ctx.lineTo(s.mouseX, s.mouseY);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      }

      s.comps.forEach((c) => drawComponent(ctx, c, circuitClosed));

      const hovTerm = nearTerminal(s.mouseX, s.mouseY, s.comps);
      s.comps.forEach((c) => {
        getTerminals(c).forEach((t) => {
          const connected = s.wires.some((w) => w.from === t.id || w.to === t.id);
          drawTerminal(ctx, t, hovTerm?.id === t.id, connected);
        });
      });

      ctx.fillStyle = "#475569";
      ctx.font = "11px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(
        s.deleteMode
          ? "Chế độ xóa dây — nhấp vào dây để xóa • Chuột phải để xóa linh kiện"
          : "Kéo chốt ○ để nối dây • Nhấp công tắc để đóng/mở • Chuột phải để xóa linh kiện",
        W / 2, H - 12,
      );

      const bat = s.comps.find((c) => c.type === "battery");
      setStatusCircuit(circuitClosed);
      setStatusCurrent(circuitClosed ? `${((bat?.voltage ?? 3) / 6).toFixed(2)}A` : "0A");
      setStatusBulb(circuitClosed);

      animRef.current = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const toCanvas = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return {
      mx: (e.clientX - r.left) * (W / r.width),
      my: (e.clientY - r.top) * (H / r.height),
    };
  }, []);

  const refreshCursor = useCallback((mx: number, my: number) => {
    const s = stateRef.current;
    const cv = canvasRef.current!;
    if (s.wiringFrom) cv.style.cursor = "crosshair";
    else if (s.deleteMode) cv.style.cursor = "not-allowed";
    else if (nearTerminal(mx, my, s.comps)) cv.style.cursor = "crosshair";
    else if (hitComp(mx, my, s.comps)) cv.style.cursor = "grab";
    else cv.style.cursor = "default";
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    const { mx, my } = toCanvas(e);
    const s = stateRef.current;

    if (s.deleteMode) {
      const wi = nearWireIndex(mx, my, s.wires, s.comps);
      if (wi >= 0) { s.wires.splice(wi, 1); }
      return;
    }

    const c = hitComp(mx, my, s.comps);
    if (c?.type === "switch") {
      c.closed = !c.closed;
      play("switch");
      return;
    }

    const t = nearTerminal(mx, my, s.comps);
    if (t) { s.wiringFrom = t.id; return; }

    if (c) {
      s.dragging = c;
      s.dragOffX = mx - c.x;
      s.dragOffY = my - c.y;
    }
  }, [toCanvas, play]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const { mx, my } = toCanvas(e);
    const s = stateRef.current;
    s.mouseX = mx;
    s.mouseY = my;

    if (s.dragging) {
      s.dragging.x = Math.max(50, Math.min(W - 50, mx - s.dragOffX));
      s.dragging.y = Math.max(50, Math.min(H - 50, my - s.dragOffY));
    }
    refreshCursor(mx, my);
  }, [toCanvas, refreshCursor]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const s = stateRef.current;
    if (s.dragging) { s.dragging = null; return; }
    if (!s.wiringFrom) return;

    const { mx, my } = toCanvas(e);
    const t = nearTerminal(mx, my, s.comps, SNAP_RADIUS + 4);
    if (t && t.id !== s.wiringFrom) {
      const dup = s.wires.some(
        (w) =>
          (w.from === s.wiringFrom && w.to === t.id) ||
          (w.from === t.id && w.to === s.wiringFrom),
      );
      if (!dup) {
        s.wires.push({ from: s.wiringFrom!, to: t.id });
        play("switch");
      }
    }
    s.wiringFrom = null;
  }, [toCanvas, play]);

  const handleMouseLeave = useCallback(() => {
    const s = stateRef.current;
    s.dragging = null;
    s.wiringFrom = null;
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const { mx, my } = toCanvas(e);
    const s = stateRef.current;
    const c = hitComp(mx, my, s.comps);
    if (c) {
      s.wires = s.wires.filter((w) => !w.from.startsWith(c.id) && !w.to.startsWith(c.id));
      s.comps = s.comps.filter((x) => x.id !== c.id);
      play("click");
    }
  }, [toCanvas, play]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const r = canvasRef.current!.getBoundingClientRect();
    const mx = (e.clientX - r.left) * (W / r.width);
    const my = (e.clientY - r.top) * (H / r.height);

    const type = e.dataTransfer.getData("compType") as CompType;
    const label = e.dataTransfer.getData("compLabel");
    const voltage = e.dataTransfer.getData("compVoltage");
    if (!type) return;

    const nc: Component = {
      id: genId(), type,
      x: Math.max(55, Math.min(W - 55, mx)),
      y: Math.max(50, Math.min(H - 55, my)),
      label,
    };
    if (voltage) nc.voltage = parseFloat(voltage);
    if (type === "switch") nc.closed = false;

    stateRef.current.comps.push(nc);
    play("click");
  }, [play]);

  const reset = useCallback(() => {
    const s = stateRef.current;
    s.comps = DEFAULT_COMPONENTS.map((c) => ({ ...c }));
    s.wires = [];
    s.wiringFrom = null;
    s.dragging = null;
    setIsRunning(false);
    setDeleteMode(false);
    stateRef.current.isRunning = false;
    stateRef.current.deleteMode = false;
    play("click");
  }, [play]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <LessonHeader
        icon={CircuitBoard}
        title="Bài 21-22: Mạch điện"
        subtitle="Khoa học tự nhiên 8 - Chủ đề: Điện"
      >
        <ControlPanel
          isRunning={isRunning}
          onToggleRun={() => {
            const next = !isRunning;
            setIsRunning(next);
            stateRef.current.isRunning = next;
            play("switch");
          }}
          onReset={reset}
          showParticles={showParticles}
          onToggleParticles={() => {
            const next = !showParticles;
            setShowParticles(next);
            stateRef.current.showParticles = next;
            play("click");
          }}
          onOpenHelp={openHelp}
        />
      </LessonHeader>

      <LessonMedia
        mediaVariant="circuit"
        title="Thiết kế và lắp ráp mạch điện"
        summary="Mạch điện kín được tạo ra khi có nguồn điện, dây dẫn và các thiết bị tiêu thụ điện được kết nối liên tục với nhau. Mũi tên (hạt vàng) biểu diễn chiều dòng điện chạy từ cực dương (+) qua cực âm (-) của nguồn điện."
        audioText="Hãy thử nối các chốt của linh kiện để tạo thành một vòng khép kín. Sau đó, nhấn chạy mô phỏng và đóng công tắc. Nếu đèn sáng, bạn đã ráp đúng một mạch điện kín."
        ThreeSceneComponent={ThreeSceneLesson23}
      />

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-3 flex items-start gap-3 bg-blue-500/5">
          <MousePointer2 className="w-5 h-5 text-blue-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-blue-100">B1: Ráp mạch</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Kéo thả linh kiện từ cột bên phải. Nối các chốt tròn với nhau bằng dây điện.</p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-3 bg-amber-500/5">
          <Zap className="w-5 h-5 text-amber-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-100">B2: Cấp điện</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Bấm nút "Chạy mô phỏng" (Play) trên thanh công cụ để bắt đầu thử nghiệm mạch.</p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-3 bg-emerald-500/5">
          <CircuitBoard className="w-5 h-5 text-emerald-400 mt-1 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-emerald-100">B3: Thử nghiệm</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Đóng/mở công tắc để xem dòng điện chạy và kiểm tra xem bóng đèn có sáng không.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 glass-panel p-4 space-y-2 relative">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => {
                const next = !deleteMode;
                setDeleteMode(next);
                stateRef.current.deleteMode = next;
                play("click");
              }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${deleteMode
                ? "bg-destructive/20 border-destructive text-destructive"
                : "bg-secondary/40 border-border/30 text-muted-foreground hover:bg-secondary/70"
                }`}
            >
              ✂️ {deleteMode ? "Đang xóa dây (Bấm lại để tắt)" : "Chế độ xóa dây"}
            </button>
            <span className="text-xs text-muted-foreground ml-2">
              {deleteMode
                ? "Click vào dây muốn xóa"
                : "Kéo thả từ cột phải hoặc click chuột phải để xóa linh kiện"}
            </span>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="border border-white/5 rounded-lg overflow-hidden bg-slate-900/50"
          >
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              className="w-full"
              style={{ maxHeight: `${H}px`, background: "#0a0f1a" }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseLeave}
              onContextMenu={handleContextMenu}
            />
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-sm">Góc kiến thức</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <p className="font-semibold text-primary mb-1 text-xs uppercase">Mạch kín là gì?</p>
                <p className="text-muted-foreground text-xs leading-relaxed">Là mạch có các bộ phận dẫn điện được nối liền với nhau tạo thành một vòng khép kín. Lúc này dòng điện mới có thể chạy qua.</p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="font-semibold text-amber-500 mb-1 text-xs uppercase">Chiều dòng điện</p>
                <p className="text-muted-foreground text-xs leading-relaxed">Theo quy ước, chiều dòng điện là chiều từ cực dương (+), qua dây dẫn và thiết bị điện tới cực âm (-) của nguồn điện.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel p-4 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
            <h3 className="text-sm font-bold text-primary mb-3 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4" /> Bảng đo liệu
            </h3>
            <div className="space-y-3 text-sm bg-slate-950/50 p-3 rounded-lg border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Trạng thái mạch:</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusCircuit ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                  {statusCircuit ? "KÍN KẾT NỐI" : "HỞ (CHƯA NỐI)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Dòng điện (I):</span>
                <span className="text-lg font-mono font-bold text-blue-400">{statusCurrent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Bóng đèn:</span>
                <span className={`text-sm font-bold ${statusBulb ? "text-amber-400 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" : "text-slate-500"}`}>
                  {statusBulb ? "SÁNG 💡" : "TẮT"}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4">
            <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <CircuitBoard className="w-4 h-4" /> Hộp linh kiện
            </h3>
            <p className="text-[10px] text-muted-foreground mb-3 uppercase tracking-wider">Kéo thả vào bảng mạch bên trái</p>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              {COMPONENTS_PALETTE.map((c, i) => (
                <div
                  key={i}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("compType", c.type);
                    e.dataTransfer.setData("compLabel", c.label);
                    e.dataTransfer.setData("compVoltage", String(c.voltage ?? ""));
                  }}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/30 border border-white/10 text-sm text-foreground cursor-grab active:cursor-grabbing select-none hover:bg-secondary/70 hover:border-primary/50 transition-all shadow-sm"
                >
                  <span className="text-xl bg-slate-900 p-1.5 rounded-md">
                    {c.type === "battery" ? "🔋"
                      : c.type === "switch" ? "🔌"
                        : c.type === "bulb" ? "💡"
                          : "📊"}
                  </span>
                  <span className="font-medium text-xs">{c.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <LessonWrapUp
        lessonTitle="Bài 21-22: Mạch điện"
        quizLesson="21-22"
        points={[
          "Mạch điện đơn giản gồm: nguồn điện, dây dẫn, công tắc và thiết bị tiêu thụ điện.",
          "Dòng điện chỉ chạy trong mạch điện kín.",
          "Theo quy ước: Chiều dòng điện đi từ cực dương qua dây dẫn tới cực âm của nguồn.",
          "Ampe kế dùng để đo cường độ dòng điện (I) trong mạch."
        ]}
      />
    </div>
  );
}
