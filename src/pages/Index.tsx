import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Zap, CircuitBoard, Magnet, Gauge, ClipboardCheck, ArrowRight, FlaskConical } from "lucide-react";
import { motion } from "framer-motion";

const modules = [
  { icon: Zap, title: "Bài 20: Nhiễm điện", desc: "Cọ xát thước nhựa, hút mẩu giấy", url: "/lesson/20", color: "text-primary" },
  { icon: CircuitBoard, title: "Bài 21-22: Mạch điện", desc: "Lắp mạch điện, bật/tắt công tắc", url: "/lesson/21-22", color: "text-accent" },
  { icon: Magnet, title: "Bài 23: Tác dụng dòng điện", desc: "Từ trường, nhiệt năng", url: "/lesson/23", color: "text-primary" },
  { icon: Gauge, title: "Bài 24-25: Đo lường", desc: "Ampe kế, Vôn kế, cảnh báo ngắn mạch", url: "/lesson/24-25", color: "text-success" },
  { icon: ClipboardCheck, title: "Kiểm tra kiến thức", desc: "Trắc nghiệm theo từng bài", url: "/quiz", color: "text-accent" },
];

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-3"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto electric-glow border border-primary/20">
          <FlaskConical className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground electric-glow-text">
          Phòng Thí Nghiệm Vật Lý
        </h1>
        <p className="text-muted-foreground">
          KHTN 8 • Chương 5: ĐIỆN — Học qua mô phỏng tương tác
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {modules.map((m, i) => (
          <motion.button
            key={m.url}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={() => navigate(m.url)}
            className="glass-panel p-5 text-left hover:border-primary/30 transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0 ${m.color}`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{m.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
