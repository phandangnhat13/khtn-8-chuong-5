import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { ImagePlus, Volume2, Speaker, Box } from "lucide-react";
import { ThreeSceneLesson20 } from "@/components/ThreeSceneLesson20";

interface LessonMediaProps {
  title: string;
  summary: string;
  audioText: string;
  ThreeSceneComponent?: React.ComponentType;
}

export function LessonMedia({ title, summary, audioText, ThreeSceneComponent }: LessonMediaProps) {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(audioText);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [audioText]);

  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Minh họa đa phương tiện</p>
          <h2 className="text-lg font-semibold text-foreground mt-2">{title}</h2>
        </div>
        <button
          type="button"
          onClick={speak}
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition"
        >
          <Speaker className="w-4 h-4" />
          {speaking ? "Đang nói..." : "Nghe giải thích"}
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-border/50 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-primary mb-3">
            <Volume2 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Tóm tắt</span>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{summary}</p>
        </div>

        <div className="rounded-3xl border border-border/50 bg-card/80 p-4">
          <div className="flex items-center gap-2 text-accent mb-3">
            <ImagePlus className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-widest">Hình ảnh minh hoạ</span>
          </div>
          <div className="rounded-3xl bg-slate-950/90 p-4 flex items-center justify-center">
            <svg viewBox="0 0 220 140" className="w-full h-auto" aria-hidden="true">
              <rect x="10" y="30" width="80" height="40" rx="12" fill="#1f2937" stroke="#60a5fa" strokeWidth="4" />
              <rect x="130" y="35" width="60" height="30" rx="10" fill="#111827" stroke="#fbbf24" strokeWidth="3" />
              <path d="M90 50 C105 50 115 35 130 35" fill="none" stroke="#93c5fd" strokeWidth="4" strokeLinecap="round" />
              <path d="M90 70 C105 70 115 85 130 85" fill="none" stroke="#fcd34d" strokeWidth="4" strokeLinecap="round" />
              <circle cx="60" cy="50" r="6" fill="#60a5fa" />
              <circle cx="58" cy="60" r="6" fill="#fcd34d" />
              <circle cx="140" cy="50" r="5" fill="#f8fafc" />
              <circle cx="145" cy="70" r="5" fill="#f8fafc" />
              <text x="50%" y="120" textAnchor="middle" fontSize="11" fill="#cbd5e1">Mô phỏng nguồn và dây dẫn</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/80 p-4">
        <div className="flex items-center gap-2 text-success mb-3">
          <Box className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Mô hình 3D</span>
        </div>
        <div className="rounded-3xl bg-slate-950/90 overflow-hidden">
          {ThreeSceneComponent ? <ThreeSceneComponent /> : null}
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Mô hình 3D tương tác dùng Three.js để học sinh quan sát nguồn, dây dẫn và đèn trong không gian ba chiều.
        </p>
      </div>
    </div>
  );
}
