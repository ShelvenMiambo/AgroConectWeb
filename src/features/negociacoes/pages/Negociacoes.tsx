import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Handshake, FileText, MessageSquare, Plus, Clock,
  CheckCircle, XCircle, MapPin, User, Calendar, Lock,
  Loader2, ArrowLeft, Bell, RefreshCw, Inbox, Crown, Star
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { usePlanConfig } from "@/hooks/usePlanConfig";
import { useNavigate } from 'react-router-dom';
import { useAuth } from "@/features/auth/context/AuthContext";
import { getNegociacoes, updateNegociacaoStatus } from "@/features/negociacoes/services/negociacoes";
import { getNegociacoesAvaliadas } from "@/features/negociacoes/services/avaliacoes";
import type { Negociacao } from "@/types";
import ChatModal from "@/features/negociacoes/components/ChatModal";
import AvaliarModal from "@/features/negociacoes/components/AvaliarModal";

/* ── Status helpers ─────────────────────────────────── */
const statusConfig = {
  pendente:  { label: 'Pendente',  color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30', icon: Clock },
  aceite:    { label: 'Aceite',    color: 'bg-green-500/15 text-green-700  dark:text-green-400  border-green-500/30',  icon: CheckCircle },
  recusada:  { label: 'Recusada', color: 'bg-red-500/15   text-red-600    dark:text-red-400    border-red-500/30',    icon: XCircle },
};

/* ── Card ───────────────────────────────────────────── */
// Formata a data (aceita string ISO do Supabase ou Timestamp antigo do Firestore).
const fmtData = (v: any): string => {
  if (!v) return '';
  try {
    const d = v?.toDate ? v.toDate() : new Date(v);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('pt-MZ', { day: '2-digit', month: 'short' });
  } catch { return ''; }
};

const NegociacaoCard = ({
  n, currentUid, onAccept, onReject, updating, onOpenChat, jaAvaliou, onAvaliar
}: {
  n: Negociacao; currentUid: string;
  onAccept: (id: string) => void; onReject: (id: string) => void;
  updating: string | null;
  onOpenChat: (n: Negociacao) => void;
  jaAvaliou: boolean;
  onAvaliar: (n: Negociacao) => void;
}) => {
  const cfg   = statusConfig[n.status];
  const isOwner  = n.proprietarioUid === currentUid;
  const isPending = n.status === 'pendente';
  const outroNome = isOwner ? n.arrendatarioNome : n.proprietarioNome;
  const ultima = (n.mensagens && n.mensagens.length > 0)
    ? n.mensagens[n.mensagens.length - 1].text
    : n.mensagem;

  return (
    <div className="hover:bg-muted/30 transition-colors">
      {/* Linha principal (toca para abrir o chat) */}
      <button onClick={() => onOpenChat(n)} className="w-full flex items-center gap-3 px-3 sm:px-4 py-3 text-left">
        <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-black text-base flex-shrink-0">
          {(outroNome || '?').charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-bold text-sm truncate">{outroNome}</p>
            <span className="text-[11px] text-muted-foreground flex-shrink-0">{fmtData(n.createdAt)}</span>
          </div>
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-sm text-muted-foreground truncate">{ultima || 'Sem mensagens ainda'}</p>
            <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
          </div>
          <p className="text-[11px] text-muted-foreground/70 truncate mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 flex-shrink-0" /> {n.propertyNome}
          </p>
        </div>
      </button>

      {/* Ações que precisam de estar à vista */}
      {isOwner && isPending && (
        <div className="flex gap-2 pb-3 pl-[3.75rem] pr-3 sm:pr-4">
          <Button size="sm" className="h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white border-0 font-bold gap-1.5 text-xs" disabled={updating === n.id} onClick={() => onAccept(n.id!)}>
            {updating === n.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />} Aceitar
          </Button>
          <Button size="sm" variant="outline" className="h-8 rounded-lg border-destructive/30 text-destructive hover:bg-destructive/5 font-bold gap-1.5 text-xs" disabled={updating === n.id} onClick={() => onReject(n.id!)}>
            <XCircle className="h-3.5 w-3.5" /> Recusar
          </Button>
        </div>
      )}
      {n.status === 'aceite' && !jaAvaliou && (
        <div className="pb-3 pl-[3.75rem] pr-3 sm:pr-4">
          <Button size="sm" variant="outline" className="h-8 rounded-lg border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold gap-1.5 text-xs" onClick={() => onAvaliar(n)}>
            <Star className="h-3.5 w-3.5" /> Avaliar {outroNome}
          </Button>
        </div>
      )}
    </div>
  );
};

/* ── Empty state ───────────────────────────────────── */
const EmptyState = ({ onIr }: { onIr: () => void }) => (
  <div className="text-center py-20 col-span-full">
    <div className="w-20 h-20 rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center mx-auto mb-5">
      <Inbox className="h-10 w-10 text-muted-foreground/40" />
    </div>
    <h3 className="text-lg font-bold mb-2">Ainda não tem negociações</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-5">
      No Marketplace, encontre um terreno ou produto e toque em{' '}
      <span className="text-primary font-semibold">Contactar</span> para iniciar uma negociação por chat.
    </p>
    <Button onClick={onIr} className="rounded-xl bg-primary text-white border-0 gap-2 font-semibold">
      <MapPin className="h-4 w-4" /> Ir para o Marketplace
    </Button>
  </div>
);

/* ── Main Component ─────────────────────────────────── */
const Negociacoes = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const { config } = usePlanConfig();
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [tab, setTab]                 = useState<'todas' | 'pendente' | 'aceite' | 'recusada'>('todas');
  const [activeChat, setActiveChat]   = useState<Negociacao | null>(null);
  const [avaliadas, setAvaliadas]     = useState<Set<string>>(new Set());
  const [avaliar, setAvaliar]         = useState<Negociacao | null>(null);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [negs, feitas] = await Promise.all([
        getNegociacoes(currentUser.uid),
        getNegociacoesAvaliadas(currentUser.uid),
      ]);
      setNegociacoes(negs);
      setAvaliadas(feitas);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [currentUser]);

  const handleAccept = async (id: string) => {
    setUpdating(id);
    try {
      await updateNegociacaoStatus(id, 'aceite');
      await load();
    } finally { setUpdating(null); }
  };

  const handleReject = async (id: string) => {
    setUpdating(id);
    try {
      await updateNegociacaoStatus(id, 'recusada');
      await load();
    } finally { setUpdating(null); }
  };

  const filtered = tab === 'todas' ? negociacoes : negociacoes.filter(n => n.status === tab);

  const stats = {
    total:    negociacoes.length,
    pendente: negociacoes.filter(n => n.status === 'pendente').length,
    aceite:   negociacoes.filter(n => n.status === 'aceite').length,
    recusada: negociacoes.filter(n => n.status === 'recusada').length,
  };

  if (userData?.plan === 'gratuito' && !config.isPromotionActive) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black font-['Poppins'] mb-4">Acesso Premium Necessário</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            A gestão de negociações e o contacto direto com proprietários/agricultores são funcionalidades exclusivas para utilizadores premium. Atualize o seu plano para desbloquear as negociações reais.
          </p>
          <div className="w-full max-w-md space-y-3">
             <Button onClick={() => navigate('/perfil')} className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-soft">Desbloquear Mensal: {config.prices.mensal} MT</Button>
             <Button onClick={() => navigate('/perfil')} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-soft">Desbloquear Trimestral: {config.prices.trimestral} MT (Poupa 10%)</Button>
             <Button onClick={() => navigate('/perfil')} className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-soft">Desbloquear Anual: {config.prices.anual} MT (Melhor Valor)</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">

        {/* Page header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black font-['Poppins'] mb-2">
              Negociações <span className="text-primary">Seguras</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              Faça a gestão das suas propostas e converse com a outra parte por chat, num só lugar.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={load}
            disabled={loading}
            className="rounded-xl gap-2 font-semibold border-border/60 hover:border-primary/40"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['todas', 'pendente', 'aceite', 'recusada'] as const).map(t => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "default" : "ghost"}
              onClick={() => setTab(t)}
              className={`rounded-xl font-bold capitalize ${tab === t ? 'bg-primary text-white border-0' : 'text-muted-foreground'}`}
            >
              {t === 'todas' ? 'Todas' : t.charAt(0).toUpperCase() + t.slice(1)}
              {t !== 'todas' && stats[t] > 0 && (
                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${tab === t ? 'bg-white/20' : 'bg-muted'}`}>
                  {stats[t]}
                </span>
              )}
            </Button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse">A carregar negociações...</p>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onIr={() => navigate('/marketplace')} />
        ) : (
          <div className="bg-card border border-border/60 rounded-lg overflow-hidden shadow-soft divide-y divide-border/50">
            {filtered.map(n => (
              <NegociacaoCard
                key={n.id}
                n={n}
                currentUid={currentUser!.uid}
                onAccept={handleAccept}
                onReject={handleReject}
                updating={updating}
                onOpenChat={setActiveChat}
                jaAvaliou={!!n.id && avaliadas.has(n.id)}
                onAvaliar={setAvaliar}
              />
            ))}
          </div>
        )}

        {activeChat && currentUser && (
          <ChatModal
            negociacao={negociacoes.find(n => n.id === activeChat.id) || activeChat}
            currentUid={currentUser.uid}
            onClose={() => setActiveChat(null)}
            onMessageSent={() => load()}
          />
        )}

        {avaliar && currentUser && (() => {
          const souDono = avaliar.proprietarioUid === currentUser.uid;
          const alvoUid = souDono ? avaliar.arrendatarioUid : avaliar.proprietarioUid;
          const alvoNome = souDono ? avaliar.arrendatarioNome : avaliar.proprietarioNome;
          return (
            <AvaliarModal
              negociacaoId={avaliar.id!}
              autorUid={currentUser.uid}
              alvoUid={alvoUid}
              alvoNome={alvoNome}
              onClose={() => setAvaliar(null)}
              onDone={() => { setAvaliar(null); load(); }}
            />
          );
        })()}
      </main>
      <Footer />
    </div>
  );
};

export default Negociacoes;