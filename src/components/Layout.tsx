import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { KnowledgePanel } from "@/components/KnowledgePanel";
import { useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

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
    </SidebarProvider>
  );
}
