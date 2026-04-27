import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
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
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/seis" element={<SeisList />} />
          <Route path="/seis/:id" element={<SeiDetail />} />
          <Route path="/minutador/:id" element={<Minutador />} />
          <Route path="/minhas-analises" element={<MinhasAnalises />} />
          <Route path="/jurisprudencias" element={<Jurisprudencias />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
