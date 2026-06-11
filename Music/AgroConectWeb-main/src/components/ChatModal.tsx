import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Send, X, ShieldAlert, Loader2 } from "lucide-react";
import { Negociacao, addMensagemNegociacao } from "@/lib/firestoreService";
import { hasPhoneNumber } from "@/lib/utils";

interface ChatModalProps {
  negociacao: Negociacao;
  currentUid: string;
  onClose: () => void;
  onMessageSent: () => void;
}

export default function ChatModal({ negociacao, currentUid, onClose, onMessageSent }: ChatModalProps) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = negociacao.proprietarioUid === currentUid;
  const otherPartyName = isOwner ? negociacao.arrendatarioNome : negociacao.proprietarioNome;

  const mensagens = negociacao.mensagens || [];

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleSend = async () => {
    if (!text.trim()) return;

    if (hasPhoneNumber(text)) {
      alert("Para sua segurança, não é permitido partilhar números de telefone. Por favor, conduza a negociação através do chat da plataforma.");
      return;
    }

    setSending(true);
    try {
      await addMensagemNegociacao(negociacao.id!, currentUid, text.trim());
      setText('');
      onMessageSent(); // Trigger reload
    } catch (e) {
      console.error(e);
      alert('Erro ao enviar mensagem.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-card w-full max-w-lg sm:rounded-2xl rounded-t-2xl shadow-xl border border-border flex flex-col h-[92dvh] sm:h-[600px] sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20">
          <div>
            <h3 className="font-bold text-lg">{otherPartyName}</h3>
            <p className="text-xs text-muted-foreground">{negociacao.propertyNome}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-500/10 p-3 flex items-start gap-2 text-amber-600 dark:text-amber-400 border-b border-amber-500/20 text-xs">
          <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>Mantenha a sua segurança. Nunca faça pagamentos antes de assinar contrato e evite partilhar contactos pessoais antes de fechar acordo.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {mensagens.map((msg, i) => {
            const isMe = msg.senderId === currentUid;
            return (
              <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted rounded-bl-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/70 text-right' : 'text-muted-foreground'}`}>
                    {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Agora'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-muted/10 flex gap-2">
          <textarea 
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Escreva a sua mensagem..."
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary h-[44px]"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button 
            className="h-[44px] w-[44px] rounded-xl gradient-primary text-white border-0 shadow-soft" 
            size="icon"
            onClick={handleSend}
            disabled={sending || !text.trim()}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>

      </div>
    </div>
  );
}
