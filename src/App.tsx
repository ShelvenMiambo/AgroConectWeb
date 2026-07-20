import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "@/components/theme/theme-provider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/features/auth/context/AuthContext";
import ProtectedRoute from "@/features/auth/components/ProtectedRoute";
import AdminRoute from "@/features/auth/components/AdminRoute";

import ScrollToTop from "@/components/layout/ScrollToTop";
import BottomNav from "@/components/layout/BottomNav";

// Páginas carregadas sob demanda (code-splitting) para reduzir o bundle inicial
const Index = lazy(() => import("@/features/landing/pages/Index"));
const Login = lazy(() => import("@/features/auth/pages/Login"));
const Marketplace = lazy(() => import("@/features/marketplace/pages/Marketplace"));
const AssistenteIA = lazy(() => import("@/features/assistente/pages/AssistenteIA"));
const Producao = lazy(() => import("@/features/producao/pages/Producao"));
const Negociacoes = lazy(() => import("@/features/negociacoes/pages/Negociacoes"));
const Admin = lazy(() => import("@/features/admin/pages/Admin"));
const Perfil = lazy(() => import("@/features/perfil/pages/Perfil"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

// Indicador de carregamento enquanto a página é descarregada
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <AuthProvider>
            <BottomNav />
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />

                {/* Protected Routes — require login */}
                <Route path="/marketplace"   element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
                <Route path="/assistente-ia" element={<ProtectedRoute><AssistenteIA /></ProtectedRoute>} />
                <Route path="/producao"      element={<ProtectedRoute><Producao /></ProtectedRoute>} />
                <Route path="/negociacoes"   element={<ProtectedRoute><Negociacoes /></ProtectedRoute>} />
                <Route path="/perfil"        element={<ProtectedRoute><Perfil /></ProtectedRoute>} />

                {/* Admin Route — require login + admin role */}
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
