import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Star, BookOpen, AlertCircle, Download } from "lucide-react";

interface LabReportProps {
  open: boolean;
  onClose: () => void;
  lessonTitle: string;
  score: number;
  total: number;
  answers: { question: string; correct: boolean; userAnswer: string; correctAnswer: string }[];
}

export function LabReportModal({ open, onClose, lessonTitle, score, total, answers }: LabReportProps) {
  const pct = Math.round((score / total) * 100);
  const grade = pct === 100 ? "Xuất sắc" : pct >= 80 ? "Giỏi" : pct >= 60 ? "Khá" : pct >= 40 ? "Trung bình" : "Cần cố gắng";
  const gradeColor = pct >= 80 ? "text-success" : pct >= 60 ? "text-accent" : "text-destructive";
  const stars = Math.ceil((pct / 100) * 5);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg glass-panel p-0 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-accent/10 p-6 border-b border-border/30">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Trophy className={`w-5 h-5 ${gradeColor}`} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">Phiếu kết quả thí nghiệm</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{lessonTitle}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary/50">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Score */}
            <div className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-5 h-5 ${i <= stars ? "text-accent fill-accent" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
                <div className={`text-4xl font-bold font-mono ${gradeColor}`}>
                  {score}/{total}
                </div>
                <div className={`text-sm font-semibold ${gradeColor}`}>{grade}</div>
                <div className="text-xs text-muted-foreground">Tỷ lệ đúng: {pct}%</div>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`h-full rounded-full ${pct >= 80 ? "bg-success" : pct >= 60 ? "bg-accent" : "bg-destructive"}`}
                />
              </div>

              {/* Answer details */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {answers.map((a, i) => (
                  <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg text-xs ${a.correct ? "bg-success/5 border border-success/20" : "bg-destructive/5 border border-destructive/20"}`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${a.correct ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>
                      {a.correct ? "✓" : "✗"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground leading-relaxed">{a.question}</p>
                      {!a.correct && (
                        <p className="text-muted-foreground mt-1">
                          Đáp án đúng: <span className="text-success font-medium">{a.correctAnswer}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Remark */}
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <BookOpen className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pct === 100
                    ? "Tuyệt vời! Em đã nắm vững toàn bộ kiến thức của bài học này. Hãy tiếp tục với bài tiếp theo!"
                    : pct >= 60
                    ? "Khá tốt! Em cần ôn lại một số khái niệm. Hãy xem lại phần kiến thức ở bảng bên phải."
                    : "Em cần ôn lại bài học kỹ hơn. Hãy thực hành lại thí nghiệm và đọc kỹ phần kiến thức nhé!"}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
