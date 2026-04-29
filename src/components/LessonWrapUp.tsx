import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type LessonWrapUpProps = {
  lessonTitle: string;
  quizLesson: "20" | "21-22" | "23" | "24-25";
  points: string[];
};

export function LessonWrapUp({ lessonTitle, quizLesson, points }: LessonWrapUpProps) {
  return (
    <section className="glass-panel p-4 sm:p-5 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Tổng kết nhanh</p>
        <h3 className="text-base sm:text-lg font-semibold text-foreground mt-1">{lessonTitle}</h3>
      </div>

      <div className="grid gap-2">
        {points.map((p, i) => (
          <div key={`${lessonTitle}-${i}`} className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="w-4 h-4 mt-0.5 text-success shrink-0" />
            <span>{p}</span>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Link
          to={`/quiz?lesson=${quizLesson}`}
          className="inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold hover:bg-primary/85 transition-colors"
        >
          Đi đến Quiz bài này
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/40 px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/70 transition-colors"
        >
          Về Dashboard
        </Link>
      </div>
    </section>
  );
}

