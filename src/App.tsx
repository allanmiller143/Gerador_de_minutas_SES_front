import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { DraftsProvider } from "@/context/DraftsContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import SeisList from "./pages/SeisList.tsx";
import SeiDetail from "./pages/SeiDetail.tsx";
import Minutador from "./pages/Minutador.tsx";
import Jurisprudencias from "./pages/Jurisprudencias.tsx";
import Relatorios from "./pages/Relatorios.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import MinhasAnalises from "./pages/MinhasAnalises.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DraftsProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/seis" element={<ProtectedRoute><SeisList /></ProtectedRoute>} />
              <Route path="/seis/:id" element={<ProtectedRoute><SeiDetail /></ProtectedRoute>} />
              <Route path="/minutador/:id" element={<ProtectedRoute><Minutador /></ProtectedRoute>} />
              <Route path="/minhas-analises" element={<ProtectedRoute><MinhasAnalises /></ProtectedRoute>} />
              <Route path="/jurisprudencias" element={<ProtectedRoute><Jurisprudencias /></ProtectedRoute>} />
              <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute roles={["administrador"]}><Configuracoes /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </DraftsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
