import { ImagePlus, Volume2, Box } from "lucide-react";
import { ThreeScene } from "@/components/ThreeScene";
import { LessonIllustration2D } from "@/components/media/LessonIllustration2D";
import type { LessonMediaVariant } from "@/types/lessonMedia";

interface LessonMediaProps {
  title: string;
  summary: string;
  audioText?: string;
  /** Minh họa 2D (SVG Bézier) + scene 3D theo từng chủ đề bài */
  mediaVariant?: LessonMediaVariant;
}

export function LessonMedia({ title, summary, mediaVariant = "circuit" }: LessonMediaProps) {
  return (
    <div className="glass-panel p-4 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-accent">Minh họa đa phương tiện</p>
          <h2 className="text-lg font-semibold text-foreground mt-2">{title}</h2>
        </div>
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
          <LessonIllustration2D variant={mediaVariant} />
        </div>
      </div>

      <div className="rounded-3xl border border-border/50 bg-card/80 p-4">
        <div className="flex items-center gap-2 text-success mb-3">
          <Box className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-widest">Mô hình 3D</span>
        </div>
        <div className="rounded-3xl bg-slate-900/80 overflow-hidden min-h-[420px] border border-white/10">
          <ThreeScene variant={mediaVariant} />
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {mediaVariant === "electrostatic" &&
            "Chuột trái xoay cảnh (Orbit). Kéo thước trên mặt bàn đến gần vải len để “cọ xát” — hạt electron chạy nhanh hơn khi ma sát."}
          {mediaVariant === "circuit" &&
            "Nhấp pin để ngắt/bật nguồn; kéo bóng đèn trên mặt phẳng. Dòng electron chỉ rõ khi mạch được bật."}
          {mediaVariant === "motorThermal" &&
            "Chọn Tác dụng từ hoặc Tác dụng nhiệt trong bảng thông số 3D, rồi chỉnh điện áp để quan sát kim la bàn lệch hoặc dây dẫn nóng lên."}
          {mediaVariant === "meters" &&
            "Nhấp mặt đồng hồ A hoặc V để đảo chỉ thị (minh hoạ đọc số). Kéo đèn/trắc độ như trong lab."}
        </p>
      </div>
    </div>
  );
}
