import { Zap, CircuitBoard, Magnet, Gauge, ClipboardCheck, FlaskConical, BarChart3 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";

const lessons = [
  { title: "Bài 20: Nhiễm điện", url: "/lesson/20", icon: Zap },
  { title: "Bài 21-22: Mạch điện & Nguồn", url: "/lesson/21-22", icon: CircuitBoard },
  { title: "Bài 23: Tác dụng dòng điện", url: "/lesson/23", icon: Magnet },
  { title: "Bài 24-25: Cường độ & Hiệu điện thế", url: "/lesson/24-25", icon: Gauge },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarHeader className="p-4">
        {!collapsed && (
          <NavLink
            to="/"
            className="flex items-center gap-3 rounded-xl transition-colors hover:bg-secondary/60"
          >
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center electric-glow">
              <FlaskConical className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground tracking-tight">Phòng TN Vật Lý</h2>
              <p className="text-xs text-muted-foreground">KHTN 8 • Chương 5</p>
            </div>
          </NavLink>
        )}
        {collapsed && (
          <NavLink to="/" className="flex justify-center rounded-lg p-1 transition-colors hover:bg-secondary/60">
            <FlaskConical className="w-5 h-5 text-primary" />
          </NavLink>
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {!collapsed && "Bài học"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {lessons.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className="hover:bg-secondary/80 transition-colors rounded-lg px-3 py-2.5"
                      activeClassName="bg-primary/15 text-primary font-semibold electric-glow"
                    >
                      <item.icon className="mr-3 h-4 w-4 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-widest text-muted-foreground/60">
            {!collapsed && "Kiểm tra"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/quiz"
                    className="hover:bg-secondary/80 transition-colors rounded-lg px-3 py-2.5"
                    activeClassName="bg-accent/15 text-accent font-semibold warm-glow"
                  >
                    <ClipboardCheck className="mr-3 h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Kiểm tra kiến thức</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink
                    to="/quiz/stats"
                    className="hover:bg-secondary/80 transition-colors rounded-lg px-3 py-2.5"
                    activeClassName="bg-accent/15 text-accent font-semibold warm-glow"
                  >
                    <BarChart3 className="mr-3 h-4 w-4 shrink-0" />
                    {!collapsed && <span className="text-sm">Thống kê quiz</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
