import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { CircleHelp } from "lucide-react";
import { useEffect, useState } from "react";
import { useAppHotkeys } from "@/hooks/useAppHotkeys";
import { HelpDialog } from "@/components/HelpDialog";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);

  useAppHotkeys({
    onToggleHelp: () => setHelpOpen((v) => !v),
    onGoHome: () => navigate("/"),
    onGoQuiz: () => navigate("/quiz"),
    onGoLesson: (lessonPath) => navigate(lessonPath),
  });

  useEffect(() => {
    const handler = () => setHelpOpen(true);
    window.addEventListener("open-help-dialog", handler);
    return () => window.removeEventListener("open-help-dialog", handler);
  }, []);

  useEffect(() => {
    // Auto-show quick guide once per lesson route
    if (!location.pathname.startsWith("/lesson/")) return;
    const key = `seen-help-${location.pathname}`;
    if (!window.localStorage.getItem(key)) {
      setHelpOpen(true);
      window.localStorage.setItem(key, "1");
    }
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border/50 bg-card/60 backdrop-blur-sm px-4 shrink-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-4 flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">KHTN 8</span>
              <span className="text-muted-foreground/30">|</span>
              <span className="text-xs text-primary font-medium">Chương 5: ĐIỆN</span>
            </div>
            <div className="ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHelpOpen(true)}
                className="h-8 gap-2 border-border/50 bg-card/40"
                aria-label="Mở trợ giúp"
              >
                <CircleHelp className="w-4 h-4" />
                <span className="hidden sm:inline">Trợ giúp</span>
                <kbd className="hidden md:inline rounded border border-border/70 bg-muted px-1.5 py-0.5 text-[10px] font-mono">?</kbd>
              </Button>
            </div>
          </header>
          <div className="flex-1 flex min-h-0">
            <main className="flex-1 overflow-auto p-4 md:p-6">
              <AnimatePresence mode="wait">
                <PageTransition key={location.pathname}>
                  {children}
                </PageTransition>
              </AnimatePresence>
            </main>
            <KnowledgePanel />
          </div>
        </div>
      </div>
      <HelpDialog open={helpOpen} onOpenChange={setHelpOpen} pathname={location.pathname} />
    </SidebarProvider>
  );
}
