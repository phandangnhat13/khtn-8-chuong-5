import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, Clock, Trophy, Users } from "lucide-react";
import { LessonHeader } from "@/components/LessonHeader";
import { Progress } from "@/components/ui/progress";
import { api, QuizAttemptRecord, StatsOverview } from "@/lib/api";

function formatDate(value: string | null) {
  if (!value) return "Chưa có";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function QuizStatsPage() {
  const [overview, setOverview] = useState<StatsOverview | null>(null);
  const [attempts, setAttempts] = useState<QuizAttemptRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const [stats, recentAttempts] = await Promise.all([
          api.getStatsOverview(),
          api.getAttempts(),
        ]);
        if (!mounted) return;
        setOverview(stats);
        setAttempts(recentAttempts);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Không thể tải thống kê quiz");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    loadStats();
    return () => {
      mounted = false;
    };
  }, []);

  const averageScore = useMemo(() => {
    if (!attempts.length) return 0;
    return Math.round(attempts.reduce((sum, item) => sum + item.percentage, 0) / attempts.length);
  }, [attempts]);

  const bestAttempt = useMemo(() => {
    if (!attempts.length) return null;
    return attempts.reduce((best, item) => (item.percentage > best.percentage ? item : best), attempts[0]);
  }, [attempts]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <LessonHeader icon={BarChart3} title="Thống kê quiz" subtitle="Theo dõi kết quả làm bài và tiến độ từng bài học" />

      {error && (
        <div className="glass-panel border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}. Hãy kiểm tra backend và biến môi trường `VITE_API_URL`.
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Lượt làm</span>
          </div>
          <p className="text-3xl font-bold font-mono">{overview?.totalAttempts ?? 0}</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-accent mb-2">
            <Activity className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Điểm TB</span>
          </div>
          <p className="text-3xl font-bold font-mono">{averageScore}%</p>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-2 text-success mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Tốt nhất</span>
          </div>
          <p className="text-3xl font-bold font-mono">{bestAttempt ? `${bestAttempt.percentage}%` : "0%"}</p>
        </div>
      </div>

      <div className="glass-panel p-4">
        <h2 className="font-semibold mb-4">Kết quả theo bài</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Đang tải thống kê...</p>
        ) : (
          <div className="space-y-4">
            {(overview?.byLesson ?? []).map((lesson) => (
              <div key={lesson.lessonId} className="rounded-2xl border border-white/10 bg-slate-950/30 p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium">{lesson.lessonTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {lesson.attempts} lượt làm • gần nhất: {formatDate(lesson.latestAttempt)}
                    </p>
                  </div>
                  <span className="font-mono text-lg font-bold text-primary">{lesson.averagePercentage}%</span>
                </div>
                <Progress value={lesson.averagePercentage} className="mt-3" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-primary" />
          <h2 className="font-semibold">Lượt làm gần đây</h2>
        </div>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Chưa có dữ liệu lượt làm.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground">
                <tr className="border-b border-white/10">
                  <th className="py-2 pr-4">Học sinh</th>
                  <th className="py-2 pr-4">Bài</th>
                  <th className="py-2 pr-4">Điểm</th>
                  <th className="py-2 pr-4">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {attempts.slice(0, 12).map((attempt) => (
                  <tr key={attempt.attemptId} className="border-b border-white/5">
                    <td className="py-2 pr-4">{attempt.studentName}</td>
                    <td className="py-2 pr-4 font-mono">{attempt.lessonId}</td>
                    <td className="py-2 pr-4 font-semibold text-primary">
                      {attempt.score}/{attempt.total} ({attempt.percentage}%)
                    </td>
                    <td className="py-2 pr-4 text-muted-foreground">{formatDate(attempt.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
