import { RotateCcw, Play, Pause, Sparkles, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ControlPanelProps {
  isRunning: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  showParticles: boolean;
  onToggleParticles: () => void;
  onOpenHelp?: () => void;
}

export function ControlPanel({
  isRunning,
  onToggleRun,
  onReset,
  showParticles,
  onToggleParticles,
  onOpenHelp,
}: ControlPanelProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        className="gap-2 border-border/50 bg-card/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
      >
        <RotateCcw className="w-4 h-4" />
        Đặt lại
      </Button>
      <Button
        size="sm"
        onClick={onToggleRun}
        className={`gap-2 ${isRunning ? 'bg-destructive hover:bg-destructive/80 text-destructive-foreground' : 'bg-primary hover:bg-primary/80 text-primary-foreground'}`}
      >
        {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isRunning ? "Dừng" : "Chạy"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onToggleParticles}
        className={`gap-2 border-border/50 ${showParticles ? 'bg-accent/20 text-accent border-accent/30' : 'bg-card/50 text-muted-foreground hover:text-foreground'}`}
      >
        <Sparkles className="w-4 h-4" />
        Dòng electron
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenHelp}
        className="gap-2 border-border/50 bg-card/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
      >
        <CircleHelp className="w-4 h-4" />
        Trợ giúp
      </Button>
    </div>
  );
}
