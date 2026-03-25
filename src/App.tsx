import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Index from "./pages/Index";
import Login from "./pages/Login";
import Marketplace from "./pages/Marketplace";
import AssistenteIA from "./pages/AssistenteIA";
import Producao from "./pages/Producao";
import Negociacoes from "./pages/Negociacoes";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />

              {/* Protected Routes — require login */}
              <Route path="/marketplace"   element={<ProtectedRoute><Marketplace /></ProtectedRoute>} />
              <Route path="/assistente-ia" element={<ProtectedRoute><AssistenteIA /></ProtectedRoute>} />
              <Route path="/producao"      element={<ProtectedRoute><Producao /></ProtectedRoute>} />
              <Route path="/negociacoes"   element={<ProtectedRoute><Negociacoes /></ProtectedRoute>} />

              {/* Admin Route — require login + admin role */}
              <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
