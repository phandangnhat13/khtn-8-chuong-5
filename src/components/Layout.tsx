import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 px-4 glass-panel">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-4 flex items-center gap-2">
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">KHTN 8</span>
              <span className="text-muted-foreground/30">|</span>
              <span className="text-xs text-primary font-medium">Chương 5: ĐIỆN</span>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
