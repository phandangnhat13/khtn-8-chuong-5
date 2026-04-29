import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type HelpData = {
  title: string;
  steps: string[];
};

const DEFAULT_HELP: HelpData = {
  title: "Hướng dẫn nhanh",
  steps: [
    "Mở một bài học từ menu bên trái hoặc từ trang chủ.",
    "Nhấn Chạy để bắt đầu mô phỏng, Đặt lại khi cần làm lại.",
    "Theo dõi phần kiến thức ở panel bên phải để nắm lý thuyết.",
    "Hoàn thành bài thực hành và chuyển sang phần Quiz để tự đánh giá.",
  ],
};

const LESSON_HELP: Record<string, HelpData> = {
  "/": {
    title: "Bắt đầu học nhanh",
    steps: [
      "Chọn một bài trong Dashboard theo đúng thứ tự 20 -> 25.",
      "Mỗi bài đều có mô phỏng tương tác để thực hành trực tiếp.",
      "Sau khi xong bài, dùng nút Đi đến Quiz để kiểm tra kiến thức.",
    ],
  },
  "/lesson/20": {
    title: "Bài 20 - Nhiễm điện do cọ xát",
    steps: [
      "Giữ chuột vào thước và kéo qua vùng vải len để cọ xát.",
      "Quan sát điện tích tăng dần, sau đó đưa thước lại gần mẩu giấy.",
      "Dùng thanh trượt để thay đổi lực hút tĩnh điện.",
    ],
  },
  "/lesson/21-22": {
    title: "Bài 21-22 - Mạch điện",
    steps: [
      "Kéo thả linh kiện để sắp xếp lại mạch.",
      "Nhấp vào công tắc để đóng/mở mạch điện.",
      "Nhấn Chạy để kiểm tra mạch kín và quan sát dòng electron.",
    ],
  },
  "/lesson/23": {
    title: "Bài 23 - Tác dụng của dòng điện",
    steps: [
      "Chọn chế độ Tác dụng từ hoặc Tác dụng nhiệt.",
      "Nhấn Chạy để quan sát hiệu ứng trên mô hình.",
      "Điều chỉnh điện áp và so sánh sự thay đổi của kết quả.",
    ],
  },
  "/lesson/24-25": {
    title: "Bài 24-25 - Đo lường điện",
    steps: [
      "Bật Chạy để mô phỏng mạch điện.",
      "Thử đổi cách mắc ampe kế/vôn kế để quan sát đúng - sai.",
      "Theo dõi các chỉ số I, U và cảnh báo ngắn mạch khi mắc sai.",
    ],
  },
  "/quiz": {
    title: "Kiểm tra nhanh",
    steps: [
      "Chọn đúng bộ câu hỏi theo bài bạn vừa học.",
      "Trả lời đủ rồi nhấn Nộp bài để xem kết quả.",
      "Mở Phiếu kết quả để xem câu sai và đáp án đúng.",
    ],
  },
};

const HOTKEYS = [
  { key: "Space", action: "Chạy / Dừng mô phỏng (trong bài học)" },
  { key: "R", action: "Đặt lại mô phỏng" },
  { key: "P", action: "Bật / tắt hạt electron" },
  { key: "?", action: "Mở / đóng trợ giúp" },
  { key: "G H", action: "Đi về trang chủ" },
  { key: "G Q", action: "Đi tới Quiz" },
];

type HelpDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pathname: string;
};

export function HelpDialog({ open, onOpenChange, pathname }: HelpDialogProps) {
  const data = LESSON_HELP[pathname] ?? DEFAULT_HELP;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{data.title}</DialogTitle>
          <DialogDescription>
            Hướng dẫn thao tác nhanh để dạy học mượt hơn trên lớp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
            <p className="text-sm font-semibold text-foreground mb-2">Các bước thực hành</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
              {data.steps.map((step, i) => (
                <li key={`${pathname}-step-${i}`}>{step}</li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
            <p className="text-sm font-semibold text-foreground mb-2">Phím tắt cơ bản</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {HOTKEYS.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-lg border border-border/40 bg-background/70 px-3 py-2"
                >
                  <span className="text-xs text-muted-foreground">{item.action}</span>
                  <kbd className="ml-3 rounded border border-border/60 bg-muted px-2 py-0.5 text-xs font-mono text-foreground">
                    {item.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

