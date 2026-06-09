import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, X, ShieldAlert, Loader2, MessageSquare } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Negociacao, addMensagemNegociacao } from '@/lib/firestoreService';
import { hasPhoneNumber } from '@/lib/utils';

interface ChatModalProps {
  negociacao: Negociacao;
  currentUid: string;
  onClose: () => void;
}

export default function ChatModal({ negociacao, currentUid, onClose }: ChatModalProps) {
  const [liveNeg, setLiveNeg] = useState<Negociacao>(negociacao);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const isOwner = liveNeg.proprietarioUid === currentUid;
  const otherPartyName = isOwner ? liveNeg.arrendatarioNome : liveNeg.proprietarioNome;
  const mensagens = liveNeg.mensagens || [];

  // ── Real-time listener ─────────────────────────────
  useEffect(() => {
    if (!negociacao.id) return;
    const unsubscribe = onSnapshot(
      doc(db, 'negociacoes', negociacao.id),
      snap => {
        if (snap.exists()) {
          setLiveNeg({ id: snap.id, ...snap.data() } as Negociacao);
        }
      },
      err => console.warn('[ChatModal] onSnapshot error:', err)
    );
    return unsubscribe;
  }, [negociacao.id]);

  // ── Auto-scroll to bottom when new messages arrive ──
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens.length]);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (hasPhoneNumber(trimmed)) {
      setError('Por segurança, não é permitido partilhar números de telefone no chat.');
      return;
    }

    setError('');
    setSending(true);
    try {
      await addMensagemNegociacao(negociacao.id!, currentUid, trimmed);
      setText('');
    } catch (e) {
      console.error(e);
      setError('Erro ao enviar mensagem. Verifique a sua ligação.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-lg rounded-2xl shadow-xl border border-border flex flex-col h-[600px] max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/50 bg-muted/20 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-white font-black text-sm">
              {otherPartyName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight">{otherPartyName}</h3>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <p className="text-[11px] text-muted-foreground">{liveNeg.propertyNome}</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Security warning */}
        <div className="bg-amber-500/10 p-3 flex items-start gap-2 text-amber-600 dark:text-amber-400 border-b border-amber-500/20 text-[11px]">
          <ShieldAlert className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <p>Segurança: nunca partilhe contactos pessoais antes de fechar acordo nem faça pagamentos sem assinar contrato.</p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" ref={scrollRef}>
          {mensagens.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-50">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Sem mensagens ainda.<br />Comece a conversa!</p>
            </div>
          ) : (
            mensagens.map((msg, i) => {
              const isMe = msg.senderId === currentUid;
              const time = msg.createdAt?.toDate
                ? msg.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'Agora';
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[11px] font-black flex-shrink-0 mt-auto">
                      {otherPartyName.charAt(0)}
                    </div>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted rounded-bl-sm'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'}`}>
                      {time}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4 py-2 bg-destructive/10 text-destructive text-xs flex items-center gap-2 border-t border-destructive/20">
            <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-border/50 bg-muted/10 rounded-b-2xl flex gap-2">
          <textarea
            value={text}
            onChange={e => { setText(e.target.value); setError(''); }}
            placeholder="Escreva a sua mensagem..."
            className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary min-h-[44px] max-h-[120px]"
            rows={1}
            onKeyDown={handleKeyDown}
          />
          <Button
            className="h-[44px] w-[44px] rounded-xl gradient-primary text-white border-0 shadow-soft flex-shrink-0"
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
