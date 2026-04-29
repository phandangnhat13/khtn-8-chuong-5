import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import { Layout } from "./components/Layout.tsx";
import { lazy, Suspense } from "react";

const Lesson20 = lazy(() => import("./pages/Lesson20.tsx"));
const Lesson2122 = lazy(() => import("./pages/Lesson2122.tsx"));
const Lesson23 = lazy(() => import("./pages/Lesson23.tsx"));
const Lesson2425 = lazy(() => import("./pages/Lesson2425.tsx"));
const QuizPage = lazy(() => import("./pages/QuizPage.tsx"));

const queryClient = new QueryClient();

function LessonLayout({ children }: { children: React.ReactNode }) {
  return (
    <Layout>
      <Suspense fallback={<div className="flex items-center justify-center h-64 text-muted-foreground">Đang tải...</div>}>
        {children}
      </Suspense>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/lesson/20" element={<LessonLayout><Lesson20 /></LessonLayout>} />
          <Route path="/lesson/21-22" element={<LessonLayout><Lesson2122 /></LessonLayout>} />
          <Route path="/lesson/23" element={<LessonLayout><Lesson23 /></LessonLayout>} />
          <Route path="/lesson/24-25" element={<LessonLayout><Lesson2425 /></LessonLayout>} />
          <Route path="/quiz" element={<LessonLayout><QuizPage /></LessonLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
