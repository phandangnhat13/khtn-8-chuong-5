import { useState, useRef, useEffect } from "react";

import { AlertTriangle, CheckCircle2, CircuitBoard, Gauge, RotateCcw, SlidersHorizontal, Zap } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { ControlPanel } from "@/components/ControlPanel";
import { LessonMedia } from "@/components/LessonMedia";
import { useSound } from "@/hooks/useSound";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { useLessonShortcuts } from "@/hooks/useLessonShortcuts";
import { LessonWrapUp } from "@/components/LessonWrapUp";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

type Connection = "series" | "parallel" | "none";
type MeasurementMode = "current" | "voltage";
type CircuitVariant = "single-bulb" | "series-bulbs";
type FeedbackTone = "success" | "warning" | "idle";

type MeterRange = {
  id: string;
  label: string;
  max: number;
};

type PracticeFeedback = {
  tone: FeedbackTone;
  title: string;
  detail: string;
};

type CircuitConfig = {
  id: CircuitVariant;
  label: string;
  description: string;
  resistance: number;
  measuredVoltageRatio: number;
  voltageTargetLabel: string;
};

const CURRENT_RANGES: MeterRange[] = [
  { id: "current-05", label: "0 - 0.5 A", max: 0.5 },
  { id: "current-1", label: "0 - 1 A", max: 1 },
  { id: "current-3", label: "0 - 3 A", max: 3 },
  { id: "current-10", label: "0 - 10 A", max: 10 },
];

const VOLTAGE_RANGES: MeterRange[] = [
  { id: "voltage-3", label: "0 - 3 V", max: 3 },
  { id: "voltage-6", label: "0 - 6 V", max: 6 },
  { id: "voltage-15", label: "0 - 15 V", max: 15 },
  { id: "voltage-30", label: "0 - 30 V", max: 30 },
];

const CIRCUIT_CONFIGS: CircuitConfig[] = [
  {
    id: "single-bulb",
    label: "Mạch 1 bóng đèn",
    description: "Vôn kế đo hai đầu bóng đèn.",
    resistance: 6,
    measuredVoltageRatio: 1,
    voltageTargetLabel: "bóng đèn",
  },
  {
    id: "series-bulbs",
    label: "Mạch 2 bóng nối tiếp",
    description: "Vôn kế đo riêng bóng đèn thứ hai.",
    resistance: 12,
    measuredVoltageRatio: 0.5,
    voltageTargetLabel: "bóng đèn thứ hai",
  },
];

const formatValue = (value: number, mode: MeasurementMode) =>
  mode === "current" ? value.toFixed(2) : value.toFixed(1);

const recommendedRange = (value: number, ranges: MeterRange[]) =>
  ranges.find((range) => value <= range.max + 0.0001) ?? ranges[ranges.length - 1];

const roundToTenth = (value: number) => Math.round(value * 10) / 10;

export default function Lesson2425() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showParticles, setShowParticles] = useState(true);
  const [ammeterConn, setAmmeterConn] = useState<Connection>("series");
  const [voltmeterConn, setVoltmeterConn] = useState<Connection>("parallel");
  const [warned, setWarned] = useState(false);

  const [batteryVoltage, setBatteryVoltage] = useState([3]);
  const [circuitVariant, setCircuitVariant] = useState<CircuitVariant>("single-bulb");
  const [practiceMode, setPracticeMode] = useState<MeasurementMode>("current");
  const [selectedRangeId, setSelectedRangeId] = useState("");
  const [practiceFeedback, setPracticeFeedback] = useState<PracticeFeedback | null>(null);
  const [targetMode, setTargetMode] = useState<MeasurementMode>("current");
  const [targetValue, setTargetValue] = useState("0.50");
  const [targetFeedback, setTargetFeedback] = useState<PracticeFeedback | null>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const { play } = useSound();
  const openHelp = () => window.dispatchEvent(new Event("open-help-dialog"));

  const reset = () => {
    setIsRunning(false);
    setAmmeterConn("series");
    setVoltmeterConn("parallel");
    setWarned(false);

    setBatteryVoltage([3]);
    setCircuitVariant("single-bulb");
    setPracticeMode("current");
    setSelectedRangeId("");
    setPracticeFeedback(null);
    setTargetMode("current");
    setTargetValue("0.50");
    setTargetFeedback(null);
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

      toast.error("⚠️ Cảnh báo: Ngắn mạch!", {
        description: "Ampe kế mắc song song sẽ gây ngắn mạch! Hãy mắc Ampe kế nối tiếp.",
        duration: 5000,
      });
      setWarned(true);
    }
  }, [isRunning, ammeterConn, warned, play]);


  const bv = batteryVoltage[0];
  const circuitConfig = CIRCUIT_CONFIGS.find((item) => item.id === circuitVariant) ?? CIRCUIT_CONFIGS[0];
  const expectedCurrentVal = +(bv / circuitConfig.resistance).toFixed(2);
  const expectedVoltVal = +(bv * circuitConfig.measuredVoltageRatio).toFixed(1);
  const circuitOk = isRunning && ammeterConn !== "parallel";
  const currentVal = circuitOk && ammeterConn === "series" ? expectedCurrentVal : 0;
  const voltVal = circuitOk && voltmeterConn === "parallel" ? expectedVoltVal : 0;
  const practiceRanges = practiceMode === "current" ? CURRENT_RANGES : VOLTAGE_RANGES;
  const practiceValue = practiceMode === "current" ? expectedCurrentVal : expectedVoltVal;
  const practiceUnit = practiceMode === "current" ? "A" : "V";
  const bestRange = recommendedRange(practiceValue, practiceRanges);
  const selectedRange = practiceRanges.find((range) => range.id === selectedRangeId);
  const isRangeCorrect = selectedRange?.id === bestRange.id;
  const isConnectionCorrect = practiceMode === "current" ? ammeterConn === "series" : voltmeterConn === "parallel";
  const canShowPracticeValue = isRunning && isRangeCorrect && isConnectionCorrect && ammeterConn !== "parallel";
  const currentTargetMin = +(1 / circuitConfig.resistance).toFixed(2);
  const currentTargetMax = +(9 / circuitConfig.resistance).toFixed(2);
  const voltageTargetMin = +(1 * circuitConfig.measuredVoltageRatio).toFixed(1);
  const voltageTargetMax = +(9 * circuitConfig.measuredVoltageRatio).toFixed(1);

  const resetPractice = () => {
    setIsRunning(false);
    setAmmeterConn("series");
    setVoltmeterConn("parallel");
    setWarned(false);
    setSelectedRangeId("");
    setPracticeFeedback(null);
    timeRef.current = 0;
    play("click");
  };

  const changeCircuitVariant = (variant: CircuitVariant) => {
    setCircuitVariant(variant);
    setAmmeterConn("series");
    setVoltmeterConn("parallel");
    setWarned(false);
    setSelectedRangeId("");
    setPracticeFeedback(null);
    setTargetFeedback(null);
    timeRef.current = 0;
    play("click");
  };

  const changePracticeMode = (mode: MeasurementMode) => {
    setPracticeMode(mode);
    setSelectedRangeId("");
    setPracticeFeedback(null);
    setAmmeterConn("series");
    setVoltmeterConn("parallel");
    setWarned(false);
    play("click");
  };

  const handleRangeSelect = (rangeId: string) => {
    const range = practiceRanges.find((item) => item.id === rangeId);
    if (!range) return;

    setSelectedRangeId(rangeId);

    if (range.id === bestRange.id) {
      setPracticeFeedback({
        tone: "success",
        title: "Thang đo phù hợp",
        detail: `Giá trị dự kiến ${formatValue(practiceValue, practiceMode)}${practiceUnit} nằm trong thang ${range.label}.`,
      });
      play("success");
      return;
    }

    setPracticeFeedback({
      tone: "warning",
      title: range.max < practiceValue ? "Thang đo quá nhỏ" : "Thang đo chưa tối ưu",
      detail:
        range.max < practiceValue
          ? `Giá trị cần đo vượt quá ${range.label}; dụng cụ có thể bị quá tải.`
          : `Thang này đo được nhưng kém chính xác hơn. Hãy chọn thang nhỏ nhất vẫn chứa giá trị cần đo.`,
    });
    play("error");
  };

  const handlePracticeConnection = (connection: Connection) => {
    setIsRunning(true);
    setWarned(false);

    if (practiceMode === "current") {
      setAmmeterConn(connection);
      setVoltmeterConn("parallel");

      if (connection === "series") {
        setPracticeFeedback({
          tone: "success",
          title: "Mắc ampe kế đúng",
          detail: "Ampe kế được mắc nối tiếp nên có thể đọc cường độ dòng điện.",
        });
        play("success");
      } else if (connection === "parallel") {
        setPracticeFeedback({
          tone: "warning",
          title: "Cảnh báo ngắn mạch",
          detail: "Ampe kế có điện trở rất nhỏ, mắc song song sẽ gây ngắn mạch.",
        });
        toast.error("Cảnh báo ngắn mạch!", {
          description: "Ampe kế phải mắc nối tiếp trong mạch đo.",
          duration: 4500,
        });
        play("error");
      } else {
        setPracticeFeedback({
          tone: "warning",
          title: "Chưa mắc ampe kế",
          detail: "Không có dụng cụ trong mạch đo nên chưa đọc được giá trị I.",
        });
        play("error");
      }
      return;
    }

    setAmmeterConn("series");
    setVoltmeterConn(connection);

    if (connection === "parallel") {
      setPracticeFeedback({
        tone: "success",
        title: "Mắc vôn kế đúng",
        detail: `Vôn kế được mắc song song với ${circuitConfig.voltageTargetLabel} nên có thể đọc hiệu điện thế.`,
      });
      play("success");
    } else {
      setPracticeFeedback({
        tone: "warning",
        title: connection === "series" ? "Mắc vôn kế sai" : "Chưa mắc vôn kế",
        detail:
          connection === "series"
            ? "Vôn kế phải mắc song song với đoạn mạch cần đo, không mắc nối tiếp trong mạch chính."
            : `Không có vôn kế nối vào hai đầu ${circuitConfig.voltageTargetLabel} nên chưa đọc được giá trị U.`,
      });
      toast.warning("Cách mắc chưa đúng", {
        description: "Vôn kế cần mắc song song với phần tử cần đo.",
        duration: 4000,
      });
      play("error");
    }
  };

  const handleCheckPractice = () => {
    setIsRunning(true);

    if (!selectedRange) {
      setPracticeFeedback({
        tone: "warning",
        title: "Chưa chọn thang đo",
        detail: "Hãy chọn thang đo trước khi đọc giá trị trên dụng cụ.",
      });
      play("error");
      return;
    }

    if (!isRangeCorrect) {
      setPracticeFeedback({
        tone: "warning",
        title: "Cần chọn lại thang đo",
        detail: "Thang đo đúng là thang nhỏ nhất vẫn chứa giá trị dự kiến của phép đo.",
      });
      play("error");
      return;
    }

    if (!isConnectionCorrect || ammeterConn === "parallel") {
      setPracticeFeedback({
        tone: "warning",
        title: "Cần mắc lại dụng cụ",
        detail:
          practiceMode === "current"
            ? "Ampe kế phải mắc nối tiếp để đọc giá trị I."
            : `Vôn kế phải mắc song song với ${circuitConfig.voltageTargetLabel} để đọc giá trị U.`,
      });
      play("error");
      return;
    }

    setPracticeFeedback({
      tone: "success",
      title: "Hoàn thành phép đo",
      detail: `Dụng cụ hiển thị ${formatValue(practiceValue, practiceMode)}${practiceUnit}.`,
    });
    play("success");
  };

  const parseTargetValue = () => {
    const value = Number(targetValue.replace(",", "."));
    return Number.isFinite(value) ? value : null;
  };

  const changeTargetMode = (mode: MeasurementMode) => {
    setTargetMode(mode);
    setTargetValue(mode === "current" ? "0.50" : "3.0");
    setTargetFeedback(null);
    play("click");
  };

  const handleApplyTargetValue = () => {
    const value = parseTargetValue();

    if (value === null || value <= 0) {
      setTargetFeedback({
        tone: "warning",
        title: "Giá trị chưa hợp lệ",
        detail: "Hãy nhập một số dương để đặt vào mô phỏng.",
      });
      play("error");
      return;
    }

    const nextVoltage =
      targetMode === "current"
        ? value * circuitConfig.resistance
        : value / circuitConfig.measuredVoltageRatio;

    if (nextVoltage < 1 || nextVoltage > 9) {
      setTargetFeedback({
        tone: "warning",
        title: "Ngoài giới hạn mô phỏng",
        detail:
          targetMode === "current"
            ? `Với ${circuitConfig.label.toLowerCase()}, I có thể đặt khoảng ${currentTargetMin.toFixed(2)}A đến ${currentTargetMax.toFixed(2)}A.`
            : `Với ${circuitConfig.label.toLowerCase()}, U có thể đặt khoảng ${voltageTargetMin.toFixed(1)}V đến ${voltageTargetMax.toFixed(1)}V.`,
      });
      play("error");
      return;
    }

    const normalizedVoltage = roundToTenth(nextVoltage);
    setBatteryVoltage([normalizedVoltage]);
    setAmmeterConn("series");
    setVoltmeterConn("parallel");
    setIsRunning(true);
    setWarned(false);
    setTargetFeedback({
      tone: "success",
      title: "Đã đặt giá trị vào mạch",
      detail:
        targetMode === "current"
          ? `Nguồn được đặt ${normalizedVoltage.toFixed(1)}V để tạo I xấp xỉ ${(normalizedVoltage / circuitConfig.resistance).toFixed(2)}A.`
          : `Nguồn được đặt ${normalizedVoltage.toFixed(1)}V nên vôn kế đọc ${(normalizedVoltage * circuitConfig.measuredVoltageRatio).toFixed(1)}V.`,
    });
    play("success");
  };

  const handleCheckTargetValue = () => {
    const value = parseTargetValue();

    if (value === null || value <= 0) {
      setTargetFeedback({
        tone: "warning",
        title: "Giá trị chưa hợp lệ",
        detail: "Hãy nhập một giá trị I hoặc U cần kiểm tra.",
      });
      play("error");
      return;
    }

    const actualValue = targetMode === "current" ? currentVal : voltVal;
    const tolerance = targetMode === "current" ? 0.02 : 0.05;

    if (Math.abs(actualValue - value) <= tolerance) {
      setTargetFeedback({
        tone: "success",
        title: "Giá trị đã khớp",
        detail: `Mô phỏng đang đọc ${formatValue(actualValue, targetMode)}${targetMode === "current" ? "A" : "V"}.`,
      });
      play("success");
      return;
    }

    setTargetFeedback({
      tone: "warning",
      title: "Giá trị chưa khớp",
      detail: `Hiện đang đọc ${formatValue(actualValue, targetMode)}${targetMode === "current" ? "A" : "V"}. Hãy điều chỉnh nguồn hoặc dùng nút đặt vào mô phỏng.`,
    });
    play("error");
  };

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

    const drawBulb = (x: number, y: number, label: string, brightness: number) => {
      if (circuitOk) {
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = 14 + brightness * 22;
        ctx.fillStyle = `rgba(251,191,36,${0.45 + brightness * 0.45})`;
      } else {
        ctx.fillStyle = "#374151";
      }
      ctx.beginPath();
      ctx.arc(x, y - 8, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#6b7280";
      ctx.fillRect(x - 12, y + 12, 24, 12);
      ctx.strokeStyle = circuitOk ? "#fff" : "#4b5563";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 6, y + 4);
      ctx.lineTo(x, y - 12);
      ctx.lineTo(x + 6, y + 4);
      ctx.stroke();
      ctx.fillStyle = "#94a3b8";
      ctx.font = "10px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 38);
    };

    const pointOnPath = (path: Array<{ x: number; y: number }>, fraction: number) => {
      const segments = path.slice(1).map((point, index) => {
        const previous = path[index];
        return {
          from: previous,
          to: point,
          length: Math.hypot(point.x - previous.x, point.y - previous.y),
        };
      });
      const total = segments.reduce((sum, segment) => sum + segment.length, 0);
      let target = fraction * total;

      for (const segment of segments) {
        if (target <= segment.length) {
          const t = segment.length === 0 ? 0 : target / segment.length;
          return {
            x: segment.from.x + (segment.to.x - segment.from.x) * t,
            y: segment.from.y + (segment.to.y - segment.from.y) * t,
          };
        }
        target -= segment.length;
      }

      return path[path.length - 1];
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      if (isRunning) timeRef.current += 0.016;
      const t = timeRef.current;


      ctx.fillStyle = "#0f1420";
      ctx.fillRect(0, 0, W, H);

      const isSeriesBulbs = circuitVariant === "series-bulbs";
      const bulbs = isSeriesBulbs
        ? [
            { x: 300, label: "Đèn 1" },
            { x: 455, label: "Đèn 2" },
          ]
        : [{ x: 350, label: "Đèn" }];
      const measuredBulb = bulbs[bulbs.length - 1];
      const terminalOffset = 30;
      const returnX = isSeriesBulbs ? 520 : 390;
      const returnY = 300;
      const brightness = circuitOk ? Math.min((bv / circuitConfig.resistance) / 0.75, 1) : 0;

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

      // Wires
      ctx.strokeStyle = circuitOk ? "#3b82f6" : "#374151";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx + 34, by);
      ctx.lineTo(bulbs[0].x - terminalOffset, by);
      ctx.stroke();

      bulbs.forEach((bulb, index) => {
        const nextBulb = bulbs[index + 1];
        if (!nextBulb) return;
        ctx.beginPath();
        ctx.moveTo(bulb.x + terminalOffset, by);
        ctx.lineTo(nextBulb.x - terminalOffset, by);
        ctx.stroke();
      });

      ctx.beginPath();
      ctx.moveTo(bulbs[bulbs.length - 1].x + terminalOffset, by);
      ctx.lineTo(returnX, by);
      ctx.lineTo(returnX, returnY);
      ctx.lineTo(bx, returnY);
      ctx.lineTo(bx, by + 20);
      ctx.stroke();

      bulbs.forEach((bulb) => drawBulb(bulb.x, by, bulb.label, brightness));

      // Ammeter
      const amX = ammeterConn === "parallel" ? (isSeriesBulbs ? 380 : 350) : 250;
      const amY = ammeterConn === "parallel" ? 100 : 300;
      const needleA = isRunning ? (ammeterConn === "parallel" ? 1.0 : Math.min(currentVal / 1.0, 1)) : 0;
      drawMeter(amX, amY, "A", currentVal.toFixed(2), "A", needleA, "#3b82f6");
      ctx.fillStyle = ammeterConn === "series" ? "#22c55e" : ammeterConn === "parallel" ? "#ef4444" : "#94a3b8";
      ctx.font = "9px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(ammeterConn === "series" ? "Nối tiếp ✓" : ammeterConn === "parallel" ? "Song song ✗" : "Ngắt", amX, amY + 58);

      // Voltmeter
      const vmX = isSeriesBulbs ? 610 : 500, vmY = 200;
      const needleV = isRunning ? voltVal / 10.0 : 0;
      drawMeter(vmX, vmY, "V", voltVal.toFixed(1), "V", needleV, "#22c55e");
      ctx.fillStyle = voltmeterConn === "parallel" ? "#22c55e" : voltmeterConn === "series" ? "#ef4444" : "#94a3b8";
      ctx.font = "9px 'Space Grotesk'";
      ctx.fillText(voltmeterConn === "parallel" ? "Song song ✓" : voltmeterConn === "series" ? "Nối tiếp ✗" : "Ngắt", vmX, vmY + 58);

      // Voltmeter wires
      if (voltmeterConn === "parallel") {
        ctx.strokeStyle = circuitOk ? "#22c55e" : "#374151";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(measuredBulb.x - terminalOffset, by);
        ctx.lineTo(vmX - 45, vmY - 15);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(measuredBulb.x + terminalOffset, by);
        ctx.lineTo(vmX - 45, vmY + 15);
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
        const particlePath = [
          { x: bx + 34, y: by },
          { x: bulbs[0].x - terminalOffset, y: by },
          ...bulbs.flatMap((bulb, index) => {
            const points = [{ x: bulb.x + terminalOffset, y: by }];
            const nextBulb = bulbs[index + 1];
            if (nextBulb) points.push({ x: nextBulb.x - terminalOffset, y: by });
            return points;
          }),
          { x: returnX, y: by },
          { x: returnX, y: returnY },
          { x: bx, y: returnY },
          { x: bx, y: by + 20 },
        ];
        for (let i = 0; i < 6; i++) {
          const frac = (t * speed + i / 6) % 1;
          const point = pointOnPath(particlePath, frac);
          ctx.fillStyle = "#fbbf24";
          ctx.shadowColor = "#fbbf24";
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(point.x, point.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }


      ctx.fillStyle = "#475569";
      ctx.font = "12px 'Space Grotesk'";
      ctx.textAlign = "center";
      ctx.fillText(`${circuitConfig.label} - U đo trên ${circuitConfig.voltageTargetLabel}`, W / 2, H - 15);

      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);

  }, [isRunning, ammeterConn, voltmeterConn, showParticles, bv, circuitOk, currentVal, voltVal, circuitVariant, circuitConfig.label, circuitConfig.resistance, circuitConfig.voltageTargetLabel]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <LessonHeader icon={Gauge} title="Bài 24-25: Cường độ & Hiệu điện thế" subtitle="Đo cường độ dòng điện và hiệu điện thế">
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
        mediaVariant="meters"
        title="Cường độ và hiệu điện thế"
        summary="Bài học giới thiệu cách mắc ampe kế nối tiếp và vôn kế song song để đo cường độ và hiệu điện thế đúng.
Bạn có thể thay đổi điện áp, đổi đoạn mạch và thử nghiệm kết nối khác nhau." 
        audioText="Hãy quan sát cách mắc ampe kế và vôn kế. Ampe kế phải nối tiếp để đo đúng cường độ, còn vôn kế phải song song với đoạn mạch để đo hiệu điện thế." 
      />

      <div className="glass-panel p-4 space-y-2">
        <div className="border border-white/5 rounded-lg overflow-hidden bg-slate-900/50">
          <canvas
            ref={canvasRef}
            width={700}
            height={420}
            className="w-full"
            style={{ maxHeight: "420px", background: "#0f1420" }}
            role="img"
            aria-label="Mô phỏng đo cường độ dòng điện và hiệu điện thế bằng ampe kế và vôn kế"
          />
        </div>
      </div>

      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Đoạn mạch mô phỏng</p>
            <p className="text-sm text-foreground">{circuitConfig.description}</p>
          </div>
          <Badge variant="outline" className="border-accent/40 text-accent">
            R tương đương: {circuitConfig.resistance} Ω
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {CIRCUIT_CONFIGS.map((config) => (
            <Button
              key={config.id}
              type="button"
              variant={circuitVariant === config.id ? "default" : "outline"}
              className="h-auto min-h-10 whitespace-normal justify-start"
              onClick={() => changeCircuitVariant(config.id)}
            >
              <CircuitBoard className="h-4 w-4" />
              {config.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Điện áp nguồn (U)</span>
          <span className="text-xs font-mono text-primary font-bold">{bv.toFixed(1)}V</span>
        </div>
        <Slider
          value={batteryVoltage}
          onValueChange={setBatteryVoltage}
          min={1}
          max={9}
          step={0.1}
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
              : ammeterConn === "parallel"
              ? "bg-destructive/20 text-destructive border border-destructive/30"
              : "bg-secondary/50 text-muted-foreground border border-border/30"
          }`}
        >
          Ampe kế: {ammeterConn === "series" ? "Nối tiếp ✓" : ammeterConn === "parallel" ? "Song song ✗" : "Ngắt"}
        </button>
        <button
          onClick={() => { setVoltmeterConn(voltmeterConn === "parallel" ? "none" : "parallel"); play("switch"); }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            voltmeterConn === "parallel"
              ? "bg-success/20 text-success border border-success/30"
              : voltmeterConn === "series"
              ? "bg-destructive/20 text-destructive border border-destructive/30"
              : "bg-secondary/50 text-muted-foreground border border-border/30"
          }`}
        >
          Vôn kế: {voltmeterConn === "parallel" ? "Song song ✓" : voltmeterConn === "series" ? "Nối tiếp ✗" : "Ngắt"}
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

      <div className="glass-panel p-4 space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tình huống thực hành</p>
            <h2 className="text-lg font-semibold text-foreground">Chọn thang đo và cách mắc dụng cụ</h2>
          </div>
          <Badge
            variant="outline"
            className={practiceMode === "current" ? "border-primary/40 text-primary" : "border-success/40 text-success"}
          >
            {practiceMode === "current" ? "Đo I bằng ampe kế" : "Đo U bằng vôn kế"}
          </Badge>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Chọn đại lượng cần đo</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={practiceMode === "current" ? "default" : "outline"}
                className="h-auto min-h-10 whitespace-normal justify-start"
                onClick={() => changePracticeMode("current")}
              >
                <Gauge className="h-4 w-4" />
                Cường độ dòng điện I
              </Button>
              <Button
                type="button"
                variant={practiceMode === "voltage" ? "default" : "outline"}
                className="h-auto min-h-10 whitespace-normal justify-start"
                onClick={() => changePracticeMode("voltage")}
              >
                <Zap className="h-4 w-4" />
                Hiệu điện thế U
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/50 bg-secondary/30 p-3">
            <p className="text-xs text-muted-foreground">Giá trị dự kiến</p>
            <p className={practiceMode === "current" ? "font-mono text-3xl font-bold text-primary" : "font-mono text-3xl font-bold text-success"}>
              {formatValue(practiceValue, practiceMode)}
              <span className="ml-1 text-base">{practiceUnit}</span>
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Chọn thang đo</p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {practiceRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                onClick={() => handleRangeSelect(range.id)}
                className={`rounded-lg border px-3 py-3 text-left text-sm font-medium transition-colors ${
                  selectedRangeId === range.id
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border/50 bg-secondary/30 text-foreground hover:bg-secondary/60"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              {practiceMode === "current" ? "Thử cách mắc ampe kế" : "Thử cách mắc vôn kế"}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                type="button"
                variant={
                  (practiceMode === "current" ? ammeterConn : voltmeterConn) === "series" ? "default" : "outline"
                }
                className="h-auto min-h-10 whitespace-normal"
                onClick={() => handlePracticeConnection("series")}
              >
                Nối tiếp
              </Button>
              <Button
                type="button"
                variant={
                  (practiceMode === "current" ? ammeterConn : voltmeterConn) === "parallel" ? "default" : "outline"
                }
                className="h-auto min-h-10 whitespace-normal"
                onClick={() => handlePracticeConnection("parallel")}
              >
                Song song
              </Button>
              <Button
                type="button"
                variant={(practiceMode === "current" ? ammeterConn : voltmeterConn) === "none" ? "default" : "outline"}
                className="h-auto min-h-10 whitespace-normal"
                onClick={() => handlePracticeConnection("none")}
              >
                Ngắt
              </Button>
            </div>
          </div>

          <div
            className={`rounded-lg border p-3 ${
              practiceFeedback?.tone === "success"
                ? "border-success/30 bg-success/10"
                : practiceFeedback?.tone === "warning"
                ? "border-destructive/30 bg-destructive/10"
                : "border-border/50 bg-secondary/30"
            }`}
          >
            <div className="flex items-start gap-2">
              {practiceFeedback?.tone === "success" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
              ) : practiceFeedback?.tone === "warning" ? (
                <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
              ) : (
                <SlidersHorizontal className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {practiceFeedback?.title ?? "Chờ thao tác"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {practiceFeedback?.detail ?? "Chọn thang đo, sau đó thử cách mắc dụng cụ để xem phản hồi."}
                </p>
              </div>
            </div>
          </div>
        </div>


        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleCheckPractice}>
            <CheckCircle2 className="h-4 w-4" />
            Kiểm tra phép đo
          </Button>
          <Button type="button" variant="outline" onClick={resetPractice}>
            <RotateCcw className="h-4 w-4" />
            Làm lại tình huống
          </Button>
        </div>

        {canShowPracticeValue && (
          <div className="rounded-lg border border-success/30 bg-success/10 p-4">
            <p className="text-xs text-muted-foreground">Kết quả hiển thị trên dụng cụ</p>
            <p className="font-mono text-2xl font-bold text-success">
              {formatValue(practiceValue, practiceMode)}
              <span className="ml-1 text-base">{practiceUnit}</span>
            </p>
          </div>
        )}
      </div>

      <div className="glass-panel p-4 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Bài tập đặt giá trị</p>
          <h2 className="text-lg font-semibold text-foreground">Tự đặt một giá trị I hoặc U</h2>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Chọn đại lượng và nhập giá trị mong muốn</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Button
                type="button"
                variant={targetMode === "current" ? "default" : "outline"}
                className="h-auto min-h-10 whitespace-normal justify-start"
                onClick={() => changeTargetMode("current")}
              >
                <Gauge className="h-4 w-4" />
                Đặt I
              </Button>
              <Button
                type="button"
                variant={targetMode === "voltage" ? "default" : "outline"}
                className="h-auto min-h-10 whitespace-normal justify-start"
                onClick={() => changeTargetMode("voltage")}
              >
                <Zap className="h-4 w-4" />
                Đặt U
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Giá trị {targetMode === "current" ? "I (A)" : "U (V)"}
            </p>
            <Input
              type="number"
              min={targetMode === "current" ? currentTargetMin.toFixed(2) : voltageTargetMin.toFixed(1)}
              max={targetMode === "current" ? currentTargetMax.toFixed(2) : voltageTargetMax.toFixed(1)}
              step={targetMode === "current" ? "0.01" : "0.1"}
              value={targetValue}
              onChange={(event) => setTargetValue(event.target.value)}
              className="font-mono"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleApplyTargetValue}>
            <SlidersHorizontal className="h-4 w-4" />
            Đặt vào mô phỏng
          </Button>
          <Button type="button" variant="outline" onClick={handleCheckTargetValue}>
            <CheckCircle2 className="h-4 w-4" />
            Kiểm tra giá trị hiện tại
          </Button>
        </div>

        <div
          className={`rounded-lg border p-3 ${
            targetFeedback?.tone === "success"
              ? "border-success/30 bg-success/10"
              : targetFeedback?.tone === "warning"
              ? "border-destructive/30 bg-destructive/10"
              : "border-border/50 bg-secondary/30"
          }`}
        >
          <div className="flex items-start gap-2">
            {targetFeedback?.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" />
            ) : targetFeedback?.tone === "warning" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 text-destructive" />
            ) : (
              <Zap className="mt-0.5 h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <p className="text-sm font-semibold">{targetFeedback?.title ?? "Sẵn sàng đặt giá trị"}</p>
              <p className="text-xs text-muted-foreground">
                {targetFeedback?.detail ??
                  `Có thể nhập I từ ${currentTargetMin.toFixed(2)}A đến ${currentTargetMax.toFixed(2)}A hoặc U từ ${voltageTargetMin.toFixed(1)}V đến ${voltageTargetMax.toFixed(1)}V trong giới hạn nguồn mô phỏng.`}
              </p>
            </div>
          </div>
        </div>
      </div>
      <LessonWrapUp
        lessonTitle="Bài 24-25: Cường độ dòng điện và hiệu điện thế"
        quizLesson="24-25"
        points={[

          "Ampe kế mắc nối tiếp để đo cường độ dòng điện I.",
          "Vôn kế mắc song song để đo hiệu điện thế U.",
          "Mắc sai ampe kế song song có thể gây ngắn mạch nguy hiểm.",
        ]}
      />
    </div>
  );
}
