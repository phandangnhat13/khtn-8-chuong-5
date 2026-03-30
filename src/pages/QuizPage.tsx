import { useEffect, useMemo, useState } from "react";
import { ClipboardCheck, CheckCircle2, XCircle } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { LabReportModal } from "@/components/LabReportModal";
import { useSound } from "@/hooks/useSound";
import confetti from "canvas-confetti";
import { useSearchParams } from "react-router-dom";
import { api, LessonId, LessonQuizPayload, QuizSummary, SubmitQuizResult } from "@/lib/api";

export default function QuizPage() {
  const [searchParams] = useSearchParams();
  const [quizList, setQuizList] = useState<QuizSummary[]>([]);
  const [selectedLessonId, setSelectedLessonId] = useState<LessonId>("20");
  const [quizData, setQuizData] = useState<LessonQuizPayload | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitQuizResult | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { play } = useSound();

  const submitted = submitResult !== null;
  const score = submitResult?.score ?? 0;

  useEffect(() => {
    let mounted = true;
    const loadQuizList = async () => {
      try {
        setError(null);
        const list = await api.getQuizzes();
        if (!mounted) return;
        setQuizList(list);
        if (list.length > 0) {
          setSelectedLessonId(list[0].lessonId);
        }
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Không thể tải danh sách quiz");
      }
    };
    loadQuizList();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadQuiz = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getQuizByLesson(selectedLessonId);
        if (!mounted) return;
        setQuizData(data);
        setAnswers(new Array(data.questions.length).fill(null));
        setSubmitResult(null);
        setShowReport(false);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Không thể tải câu hỏi");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadQuiz();
    return () => {
      mounted = false;
    };
  }, [selectedLessonId]);

  const handleAnswer = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
    play("click");
  };

  const handleSubmit = async () => {
    if (!quizData) return;
    if (answers.some((a) => a === null)) return;

    try {
      setIsSubmitting(true);
      setError(null);
      const result = await api.submitQuiz(selectedLessonId, {
        answers: answers.map((a) => a ?? 0),
      });
      setSubmitResult(result);

      if (result.score === result.total) {
        play("success");
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      } else if (result.score >= Math.ceil(result.total * 0.6)) {
        play("success");
      } else {
        play("error");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nộp bài thất bại");
      play("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    if (!quizData) return;
    setAnswers(new Array(quizData.questions.length).fill(null));
    setSubmitResult(null);
    setShowReport(false);
    play("click");
  };

  useEffect(() => {
    const lesson = searchParams.get("lesson") as LessonId | null;
    const allowed: LessonId[] = ["20", "21-22", "23", "24-25"];
    if (lesson && allowed.includes(lesson)) {
      setSelectedLessonId(lesson);
    }
  }, [searchParams]);

  const resultByQuestionId = useMemo(() => {
    const map: Record<string, SubmitQuizResult["details"][number]> = {};
    for (const item of submitResult?.details ?? []) {
      map[item.questionId] = item;
    }
    return map;
  }, [submitResult]);

  const reportAnswers = (quizData?.questions ?? []).map((q) => {
    const detail = resultByQuestionId[q.id];
    const userIndex = detail?.userAnswerIndex ?? null;
    const correctIndex = detail?.correctAnswerIndex ?? 0;
    return {
      question: q.question,
      correct: detail?.correct ?? false,
      userAnswer: userIndex !== null ? q.options[userIndex] : "Chưa trả lời",
      correctAnswer: q.options[correctIndex] ?? "",
    };
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <LessonHeader icon={ClipboardCheck} title="Kiểm tra kiến thức" subtitle="Đang tải câu hỏi từ máy chủ..." />
        <div className="glass-panel p-5 text-sm text-muted-foreground">Đang tải dữ liệu quiz...</div>
      </div>
    );
  }

  if (!quizData) {
    return (
      <div className="space-y-4">
        <LessonHeader icon={ClipboardCheck} title="Kiểm tra kiến thức" subtitle="Không thể tải dữ liệu quiz" />
        <div className="glass-panel p-5 text-sm text-destructive">
          {error ?? "Không có dữ liệu quiz. Hãy kiểm tra backend và thử lại."}
        </div>
      </div>
    );
  }

  const lessonTitle = quizList.find((q) => q.lessonId === selectedLessonId)?.lessonTitle ?? quizData.lessonTitle;

  const accuracy = Math.round((score / quizData.questions.length) * 100);
  const scoreMessage =
    score === quizData.questions.length ? "🎉 Xuất sắc!" : accuracy >= 60 ? "👍 Tốt!" : "📚 Cần ôn lại";

  const handleQuickSelect = (lessonId: LessonId) => {
    setSelectedLessonId(lessonId);
    play("click");
  };

  return (
    <div className="space-y-4">
      <LessonHeader icon={ClipboardCheck} title="Kiểm tra kiến thức" subtitle="Chọn bài và trả lời câu hỏi" />

      <div className="glass-panel p-4">
        <p className="text-sm text-muted-foreground">
          Gợi ý: sau khi hoàn thành mô phỏng ở từng bài, chọn đúng bộ câu hỏi tương ứng để tự đánh giá.
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {quizList.map((q) => (
          <button
            key={q.lessonId}
            onClick={() => handleQuickSelect(q.lessonId)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedLessonId === q.lessonId
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-secondary/50 text-muted-foreground border border-border/30 hover:bg-secondary"
            }`}
          >
            {q.lessonTitle}
          </button>
        ))}
      </div>

      {error && (
        <div className="glass-panel p-4 text-sm text-destructive">
          Lỗi: {error}
        </div>
      )}

      <div className="space-y-4">
        {quizData.questions.map((q, qi) => (
          <div key={q.id} className="glass-panel p-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              Câu {qi + 1}: {q.question}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const detail = resultByQuestionId[q.id];
                const selected = answers[qi] === oi;
                const isCorrect = detail?.correctAnswerIndex === oi;
                let borderColor = "border-border/30";
                let bgColor = "bg-secondary/30";
                if (submitted) {
                  if (isCorrect) { borderColor = "border-success/50"; bgColor = "bg-success/10"; }
                  else if (selected && !isCorrect) { borderColor = "border-destructive/50"; bgColor = "bg-destructive/10"; }
                } else if (selected) {
                  borderColor = "border-primary/50"; bgColor = "bg-primary/10";
                }

                return (
                  <button
                    key={oi}
                    onClick={() => handleAnswer(qi, oi)}
                    className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${borderColor} ${bgColor} ${
                      submitted ? "cursor-default" : "hover:bg-secondary/60 cursor-pointer"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {submitted && isCorrect && <CheckCircle2 className="w-4 h-4 text-success shrink-0" />}
                      {submitted && selected && !isCorrect && <XCircle className="w-4 h-4 text-destructive shrink-0" />}
                      <span className={`${submitted && isCorrect ? "text-success font-medium" : submitted && selected && !isCorrect ? "text-destructive" : "text-foreground"}`}>
                        {String.fromCharCode(65 + oi)}. {opt}
                      </span>
                    </div>
                    {submitted && isCorrect && detail?.explanation && (
                      <p className="text-xs text-muted-foreground mt-2 ml-6">💡 {detail.explanation}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={answers.some(a => a === null) || isSubmitting}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
          >
            {isSubmitting ? "Đang nộp..." : "Nộp bài"}
          </button>
        ) : (
          <>
            <div className={`px-4 py-2.5 rounded-lg text-sm font-bold ${accuracy >= 80 ? "bg-success/20 text-success" : "bg-accent/20 text-accent"}`}>
              Kết quả: {score}/{quizData.questions.length} {scoreMessage}
            </div>
            <button
              onClick={() => setShowReport(true)}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors active:scale-[0.97]"
            >
              📋 Xem phiếu kết quả
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors active:scale-[0.97]"
            >
              Làm lại
            </button>
          </>
        )}
      </div>

      <LabReportModal
        open={showReport}
        onClose={() => setShowReport(false)}
        lessonTitle={lessonTitle}
        score={score}
        total={quizData.questions.length}
        answers={reportAnswers}
      />
    </div>
  );
}
