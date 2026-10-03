import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ContextMenuItem } from "@/components/ui/context-menu";
import { getTextosPadroes, getCategorias } from "@/services/textoPadraoService";
import { TextoPadrao, TextoCategoria } from "@/types/textoPadrao";

interface StandardTextListProps {
  onInsert: (text: string) => void;
}

export function StandardTextList({ onInsert }: StandardTextListProps) {
  const [textos, setTextos] = useState<{ item: TextoPadrao, cat: TextoCategoria }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tData, cData] = await Promise.all([getTextosPadroes(), getCategorias()]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Carregando textos...
      </div>
    );
  }

  if (textos.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground text-center">
        Nenhum texto padrão cadastrado.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-6 p-2">
        {Array.from(new Set(textos.map(t => t.cat.nome))).map(catNome => {
          const catTextos = textos.filter(t => t.cat.nome === catNome);
          return (
            <div key={catNome} className="space-y-2">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {catNome}
              </div>
              <div className="flex flex-col gap-1">
                {catTextos.map(({ item }) => (
                  <HoverCard key={item.id} openDelay={150} closeDelay={100}>
                    <HoverCardTrigger asChild>
                        <ContextMenuItem
                          className="h-auto justify-start px-2 py-2 text-left text-xs"
                          onSelect={() => onInsert(item.conteudo)}
                        >
                          <span className="truncate">{item.titulo}</span>
                        </ContextMenuItem>
                    </HoverCardTrigger>
                    <HoverCardContent
                      side="right"
                      align="start"
                      sideOffset={8}
                      className="w-80 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed"
                    >
                      {item.conteudo}
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
