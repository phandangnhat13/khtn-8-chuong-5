import { useState } from "react";
import { ClipboardCheck, CheckCircle2, XCircle } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import confetti from "canvas-confetti";

interface Question {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

interface LessonQuiz {
  title: string;
  questions: Question[];
}

const QUIZZES: LessonQuiz[] = [
  {
    title: "Bài 20: Nhiễm điện",
    questions: [
      {
        q: "Khi cọ xát thước nhựa vào vải len, thước nhựa bị nhiễm điện do:",
        options: ["Thước nhận thêm proton", "Electron di chuyển từ vải sang thước", "Thước tự sinh ra điện tích", "Vải len bị nóng lên"],
        correct: 1,
        explanation: "Khi cọ xát, electron di chuyển từ vải len sang thước nhựa, làm thước nhiễm điện âm.",
      },
      {
        q: "Vật bị nhiễm điện có khả năng:",
        options: ["Phát sáng", "Hút các vật nhẹ", "Tạo ra âm thanh", "Bay lên cao"],
        correct: 1,
        explanation: "Vật nhiễm điện có khả năng hút các vật nhẹ như mẩu giấy, sợi bông...",
      },
      {
        q: "Có mấy loại điện tích?",
        options: ["1 loại", "2 loại", "3 loại", "4 loại"],
        correct: 1,
        explanation: "Có 2 loại điện tích: điện tích dương (+) và điện tích âm (-).",
      },
    ],
  },
  {
    title: "Bài 21-22: Mạch điện",
    questions: [
      {
        q: "Dòng điện chạy trong mạch khi:",
        options: ["Mạch hở", "Mạch kín", "Không có nguồn điện", "Công tắc mở"],
        correct: 1,
        explanation: "Dòng điện chỉ chạy được trong mạch điện kín - có đường dẫn liên tục.",
      },
      {
        q: "Nguồn điện có vai trò:",
        options: ["Tiêu thụ điện", "Tạo ra và duy trì dòng điện", "Làm đứt mạch", "Đo cường độ"],
        correct: 1,
        explanation: "Nguồn điện tạo ra và duy trì dòng điện chạy trong mạch điện kín.",
      },
      {
        q: "Công tắc trong mạch điện dùng để:",
        options: ["Tăng điện áp", "Đóng/ngắt mạch điện", "Đo dòng điện", "Tạo nhiệt"],
        correct: 1,
        explanation: "Công tắc dùng để đóng hoặc ngắt mạch điện, điều khiển dòng điện.",
      },
    ],
  },
  {
    title: "Bài 23: Tác dụng dòng điện",
    questions: [
      {
        q: "Tác dụng từ của dòng điện thể hiện ở việc:",
        options: ["Làm nóng dây dẫn", "Làm quay kim la bàn", "Làm sáng đèn", "Phân hủy nước"],
        correct: 1,
        explanation: "Dòng điện qua cuộn dây tạo từ trường, có thể làm quay kim la bàn.",
      },
      {
        q: "Bếp điện hoạt động dựa trên tác dụng nào?",
        options: ["Tác dụng từ", "Tác dụng nhiệt", "Tác dụng hóa học", "Tác dụng sinh lý"],
        correct: 1,
        explanation: "Bếp điện hoạt động dựa trên tác dụng nhiệt của dòng điện.",
      },
      {
        q: "Nam châm điện hoạt động dựa trên:",
        options: ["Tác dụng nhiệt", "Tác dụng từ của dòng điện", "Tác dụng hóa học", "Tác dụng ánh sáng"],
        correct: 1,
        explanation: "Nam châm điện hoạt động dựa trên tác dụng từ của dòng điện qua cuộn dây.",
      },
    ],
  },
  {
    title: "Bài 24-25: Đo lường",
    questions: [
      {
        q: "Ampe kế dùng để đo:",
        options: ["Hiệu điện thế", "Cường độ dòng điện", "Điện trở", "Công suất"],
        correct: 1,
        explanation: "Ampe kế đo cường độ dòng điện, đơn vị là Ampe (A).",
      },
      {
        q: "Vôn kế phải được mắc:",
        options: ["Nối tiếp", "Song song với đoạn mạch cần đo", "Trước nguồn điện", "Sau công tắc"],
        correct: 1,
        explanation: "Vôn kế mắc song song với đoạn mạch cần đo hiệu điện thế.",
      },
      {
        q: "Nếu mắc Ampe kế song song sẽ gây ra:",
        options: ["Đo chính xác hơn", "Ngắn mạch", "Tăng hiệu điện thế", "Không có gì"],
        correct: 1,
        explanation: "Ampe kế có điện trở rất nhỏ, mắc song song sẽ gây ngắn mạch nguy hiểm!",
      },
    ],
  },
];

export default function QuizPage() {
  const [selectedQuiz, setSelectedQuiz] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null]);
  const [submitted, setSubmitted] = useState(false);

  const quiz = QUIZZES[selectedQuiz];

  const handleAnswer = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIndex] = optIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const score = quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
    if (score === quiz.questions.length) {
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }
  };

  const handleReset = () => {
    setAnswers([null, null, null]);
    setSubmitted(false);
  };

  const score = submitted ? quiz.questions.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0) : 0;

  return (
    <div className="space-y-4">
      <LessonHeader icon={ClipboardCheck} title="Kiểm tra kiến thức" subtitle="Chọn bài và trả lời câu hỏi" />

      <div className="flex gap-2 flex-wrap">
        {QUIZZES.map((q, i) => (
          <button
            key={i}
            onClick={() => { setSelectedQuiz(i); handleReset(); }}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              selectedQuiz === i
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-secondary/50 text-muted-foreground border border-border/30 hover:bg-secondary"
            }`}
          >
            {q.title}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {quiz.questions.map((q, qi) => (
          <div key={qi} className="glass-panel p-5">
            <p className="text-sm font-semibold text-foreground mb-3">
              Câu {qi + 1}: {q.q}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                const selected = answers[qi] === oi;
                const isCorrect = q.correct === oi;
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
                    {submitted && isCorrect && (
                      <p className="text-xs text-muted-foreground mt-2 ml-6">💡 {q.explanation}</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            disabled={answers.some(a => a === null)}
            className="px-6 py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Nộp bài
          </button>
        ) : (
          <>
            <div className={`px-4 py-2.5 rounded-lg text-sm font-bold ${score === 3 ? "bg-success/20 text-success" : "bg-accent/20 text-accent"}`}>
              Kết quả: {score}/{quiz.questions.length} {score === 3 ? "🎉 Xuất sắc!" : score >= 2 ? "👍 Tốt!" : "📚 Cần ôn lại"}
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2.5 rounded-lg text-sm font-medium bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
            >
              Làm lại
            </button>
          </>
        )}
      </div>
    </div>
  );
}
