import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTextosPadroes, getCategorias } from "@/services/textoPadraoService";
import { TextoPadrao, TextoCategoria } from "@/types/textoPadrao";
import { Badge } from "@/components/ui/badge";

interface StandardTextPickerProps {
  onInsert: (text: string) => void;
}

export function StandardTextPicker({ onInsert }: StandardTextPickerProps) {
  const [textos, setTextos] = useState<{ item: TextoPadrao, cat: TextoCategoria }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tData, cData] = await Promise.all([getTextosPadroes(), getCategorias()]);

        // Mapeia os textos para suas categorias
        const combined = tData.map(t => ({
          item: t,
          cat: cData.find(c => c.id === t.categoriaId) || { id: 0, nome: "Sem Categoria" }
        }));

        setTextos(combined);
      } catch (error) {
        console.error("Erro ao carregar textos padrões:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return null; // O botão de trigger é renderizado no componente pai

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="p-2 rounded transition-colors text-sm hover:bg-secondary cursor-pointer" title="Inserir Texto Padrão">
          <FileTextIcon className="h-4 w-4" />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2">
        <ScrollArea className="h-80">
          <div className="flex flex-col gap-4">
            {/* Agrupa por categoria para visualização */}
            {Array.from(new Set(textos.map(t => t.cat.nome))).map(catNome => {
              const catTextos = textos.filter(t => t.cat.nome === catNome);
              return (
                <div key={catNome} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {catNome}
                  </div>
                  <div className="flex flex-col gap-1">
                    {catTextos.map(({ item }) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="justify-start text-left text-xs h-auto py-2 px-2 hover:bg-secondary"
                        onClick={() => onInsert(item.conteudo)}
                      >
                        <span className="truncate">{item.titulo}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

function FileTextIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="16" y1="21" x2="8" y2="21" />
    </svg>
  );
}
