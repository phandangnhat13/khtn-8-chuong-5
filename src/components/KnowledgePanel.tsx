import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Lightbulb, AlertTriangle, CheckCircle2,
  Zap, CircuitBoard, Magnet, Gauge, ChevronRight, Atom
} from "lucide-react";

interface KnowledgeItem {
  icon: React.ElementType;
  title: string;
  content: string;
  type: "info" | "tip" | "warning" | "formula";
}

interface LessonKnowledge {
  title: string;
  summary: string;
  items: KnowledgeItem[];
  keyTerms: { term: string; def: string }[];
}

const knowledgeData: Record<string, LessonKnowledge> = {
  "/lesson/20": {
    title: "Nhiễm điện do cọ xát",
    summary: "Tìm hiểu hiện tượng nhiễm điện và lực hút giữa các vật mang điện tích.",
    items: [
      { icon: BookOpen, title: "Nguyên lý", content: "Khi cọ xát hai vật, electron di chuyển từ vật này sang vật kia. Vật nhận thêm electron mang điện âm, vật mất electron mang điện dương.", type: "info" },
      { icon: Lightbulb, title: "Mẹo thí nghiệm", content: "Cọ xát thước càng nhanh và nhiều lần, lượng điện tích tích tụ càng lớn, lực hút càng mạnh.", type: "tip" },
      { icon: AlertTriangle, title: "Lưu ý", content: "Trong môi trường ẩm ướt, điện tích sẽ bị tiêu tán nhanh hơn do hơi nước dẫn điện.", type: "warning" },
    ],
    keyTerms: [
      { term: "Electron", def: "Hạt mang điện âm" },
      { term: "Nhiễm điện", def: "Vật mang điện tích sau cọ xát" },
      { term: "Lực tĩnh điện", def: "Lực hút/đẩy giữa các vật mang điện" },
    ],
  },
  "/lesson/21-22": {
    title: "Mạch điện & Nguồn điện",
    summary: "Xây dựng mạch điện kín và quan sát dòng electron chuyển động.",
    items: [
      { icon: BookOpen, title: "Mạch điện kín", content: "Dòng điện chỉ chạy khi mạch kín — tất cả các thành phần phải được nối liên tục từ cực dương sang cực âm của nguồn.", type: "info" },
      { icon: Lightbulb, title: "Quy ước chiều", content: "Chiều dòng điện quy ước từ cực (+) ra ngoài mạch đến cực (−). Chiều electron ngược lại.", type: "tip" },
      { icon: AlertTriangle, title: "Cảnh báo", content: "Không nối trực tiếp hai cực nguồn điện — sẽ gây ngắn mạch và hỏng nguồn!", type: "warning" },
    ],
    keyTerms: [
      { term: "Mạch kín", def: "Đường dẫn liên tục cho dòng điện" },
      { term: "Nguồn điện", def: "Cung cấp năng lượng cho mạch" },
      { term: "Công tắc", def: "Đóng/mở mạch điện" },
    ],
  },
  "/lesson/23": {
    title: "Tác dụng của dòng điện",
    summary: "Khám phá các tác dụng nhiệt, phát sáng và từ của dòng điện.",
    items: [
      { icon: BookOpen, title: "Tác dụng từ", content: "Dòng điện chạy qua cuộn dây tạo ra từ trường, có thể làm lệch kim nam châm — nguyên lý của nam châm điện.", type: "info" },
      { icon: Lightbulb, title: "Tác dụng nhiệt", content: "Dây dẫn có điện trở lớn sẽ nóng lên khi có dòng điện — ứng dụng trong bàn ủi, bếp điện.", type: "tip" },
      { icon: BookOpen, title: "Tác dụng phát sáng", content: "Dòng điện qua đèn LED hoặc dây tóc đèn sợi đốt làm chúng phát sáng.", type: "info" },
    ],
    keyTerms: [
      { term: "Nam châm điện", def: "Cuộn dây có dòng điện chạy qua" },
      { term: "Điện trở", def: "Cản trở dòng điện, sinh nhiệt" },
      { term: "Từ trường", def: "Vùng không gian có lực từ" },
    ],
  },
  "/lesson/24-25": {
    title: "Cường độ & Hiệu điện thế",
    summary: "Đo lường dòng điện bằng ampe kế và hiệu điện thế bằng vôn kế.",
    items: [
      { icon: BookOpen, title: "Ampe kế", content: "Đo cường độ dòng điện (đơn vị: A). Mắc NỐI TIẾP trong mạch.", type: "info" },
      { icon: BookOpen, title: "Vôn kế", content: "Đo hiệu điện thế (đơn vị: V). Mắc SONG SONG với đoạn mạch cần đo.", type: "info" },
      { icon: AlertTriangle, title: "Sai lầm phổ biến", content: "Mắc ampe kế song song sẽ gây ngắn mạch vì ampe kế có điện trở rất nhỏ!", type: "warning" },
    ],
    keyTerms: [
      { term: "Cường độ (I)", def: "Lượng điện qua tiết diện/giây (A)" },
      { term: "Hiệu điện thế (U)", def: "Chênh lệch điện thế hai đầu (V)" },
      { term: "Nối tiếp", def: "Các phần tử nối liên tiếp nhau" },
    ],
  },
  "/quiz": {
    title: "Kiểm tra kiến thức",
    summary: "Ôn tập toàn bộ Chương 5: Điện qua các câu hỏi trắc nghiệm.",
    items: [
      { icon: Lightbulb, title: "Chiến lược", content: "Đọc kỹ câu hỏi, loại trừ các đáp án sai rõ ràng trước khi chọn.", type: "tip" },
      { icon: CheckCircle2, title: "Mục tiêu", content: "Đạt tối thiểu 80% để nắm vững kiến thức cơ bản về điện học.", type: "info" },
    ],
    keyTerms: [
      { term: "Ôn tập", def: "Xem lại các bài trước khi làm" },
    ],
  },
};

const defaultKnowledge: LessonKnowledge = {
  title: "Chương 5: ĐIỆN",
  summary: "Chọn một bài học từ menu bên trái để bắt đầu thí nghiệm.",
  items: [
    { icon: Atom, title: "Tổng quan", content: "Chương này tìm hiểu về hiện tượng điện, mạch điện, tác dụng của dòng điện và cách đo lường các đại lượng điện.", type: "info" },
  ],
  keyTerms: [],
};

const typeStyles: Record<string, { bg: string; border: string; icon: string }> = {
  info: { bg: "bg-primary/5", border: "border-primary/20", icon: "text-primary" },
  tip: { bg: "bg-accent/5", border: "border-accent/20", icon: "text-accent" },
  warning: { bg: "bg-destructive/5", border: "border-destructive/20", icon: "text-destructive" },
  formula: { bg: "bg-success/5", border: "border-success/20", icon: "text-success" },
};

export function KnowledgePanel() {
  const location = useLocation();
  const data = knowledgeData[location.pathname] || defaultKnowledge;

  return (
    <div className="w-[300px] xl:w-[340px] shrink-0 hidden lg:flex flex-col border-l border-border/50 bg-card/40 backdrop-blur-sm overflow-y-auto">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="p-5 space-y-5"
        >
          {/* Header */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary">
              <BookOpen className="w-4 h-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Kiến thức</span>
            </div>
            <h3 className="text-base font-bold text-foreground leading-tight">{data.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">{data.summary}</p>
          </div>

          {/* Knowledge cards */}
          <div className="space-y-3">
            {data.items.map((item, i) => {
              const style = typeStyles[item.type];
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-lg border p-3.5 ${style.bg} ${style.border}`}
                >
                  <div className="flex items-start gap-2.5">
                    <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${style.icon}`} />
                    <div className="space-y-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{item.content}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Key Terms */}
          {data.keyTerms.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-accent">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-xs font-medium uppercase tracking-wider">Thuật ngữ</span>
              </div>
              <div className="space-y-1.5">
                {data.keyTerms.map((t, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-start gap-2 text-xs"
                  >
                    <ChevronRight className="w-3 h-3 mt-0.5 text-muted-foreground/50 shrink-0" />
                    <span>
                      <span className="font-semibold text-foreground">{t.term}</span>
                      <span className="text-muted-foreground"> — {t.def}</span>
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
