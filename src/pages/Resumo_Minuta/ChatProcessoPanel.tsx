import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { api, ApiError } from "@/lib/api";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatResponse {
  resposta: string;
  conversa: ChatMessage[];
}

interface ChatProcessoPanelProps {
  processoId: string | number;
}

export const ChatProcessoPanel = ({ processoId }: ChatProcessoPanelProps) => {
  const [conversa, setConversa] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [conversa, isSending]);

  const enviarMensagem = async () => {
    const mensagem = input.trim();
    if (!mensagem || isSending) return;

    setError(null);
    setIsSending(true);
    setInput("");

    const historicoOtimista: ChatMessage[] = [
      ...conversa,
      { role: "user", content: mensagem },
    ];
    setConversa(historicoOtimista);

    try {
      const data = await api<ChatResponse>(`/processos/${processoId}/chat`, {
        method: "POST",
        body: {
          messages: conversa,
          message: mensagem,
        },
      });
      setConversa(data.conversa);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível enviar a mensagem."
      );
      setConversa(conversa);
      setInput(mensagem);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      enviarMensagem();
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Chat do processo</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Tire dúvidas sobre este processo diretamente com o assistente.
      </p>

      <div
        ref={scrollRef}
        className="max-h-72 min-h-32 space-y-2 overflow-y-auto rounded-lg border border-border bg-secondary/10 p-3 mb-3"
      >
        {conversa.length === 0 && !isSending && (
          <p className="text-xs text-muted-foreground">
            Pergunte algo sobre este processo para começar.
          </p>
        )}

        {conversa.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-background border border-border/50"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Consultando...
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive mb-2">{error}</p>}

      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua pergunta..."
          rows={1}
          disabled={isSending}
          className="focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-border "
        />
        <Button
          onClick={enviarMensagem}
          disabled={isSending || !input.trim()}
          size="icon"
          className="shrink-0"
        >
          {isSending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};