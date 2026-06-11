import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Handshake, FileText, MessageSquare, Plus, Clock,
  CheckCircle, XCircle, MapPin, User, Calendar, Lock,
  Loader2, ArrowLeft, Bell, RefreshCw, Inbox, Crown
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { IS_PROMOTION_FREE } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNegociacoes, updateNegociacaoStatus, Negociacao
} from "@/lib/firestoreService";
import ChatModal from "@/components/ChatModal";

/* ── Status helpers ─────────────────────────────────── */
const statusConfig = {
  pendente:  { label: 'Pendente',  color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30', icon: Clock },
  aceite:    { label: 'Aceite',    color: 'bg-green-500/15 text-green-700  dark:text-green-400  border-green-500/30',  icon: CheckCircle },
  recusada:  { label: 'Recusada', color: 'bg-red-500/15   text-red-600    dark:text-red-400    border-red-500/30',    icon: XCircle },
};

/* ── Card ───────────────────────────────────────────── */
const NegociacaoCard = ({
  n, currentUid, onAccept, onReject, updating, onOpenChat
}: {
  n: Negociacao; currentUid: string;
  onAccept: (id: string) => void; onReject: (id: string) => void;
  updating: string | null;
  onOpenChat: (n: Negociacao) => void;
}) => {
  const cfg   = statusConfig[n.status];
  const Icon  = cfg.icon;
  const isOwner  = n.proprietarioUid === currentUid;
  const isPending = n.status === 'pendente';

  return (
    <Card className="border-border/50 shadow-soft rounded-2xl overflow-hidden hover:shadow-medium transition-spring">
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm">{n.propertyNome}</span>
          </div>
          <Badge variant="outline" className={`text-[11px] font-bold px-3 rounded-full ${cfg.color}`}>
            <Icon className="h-3 w-3 mr-1" />{cfg.label}
          </Badge>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Arrendatário</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-black">
                  {n.arrendatarioNome.charAt(0)}
                </div>
                <p className="text-sm font-semibold">{n.arrendatarioNome}</p>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Proprietário</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-black">
                  {n.proprietarioNome.charAt(0)}
                </div>
                <p className="text-sm font-semibold">{n.proprietarioNome}</p>
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-muted/40 rounded-xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Última Mensagem</p>
            <p className="text-sm leading-relaxed line-clamp-2">
              {n.mensagens && n.mensagens.length > 0 
                ? n.mensagens[n.mensagens.length - 1].text 
                : n.mensagem}
            </p>
          </div>

          {/* Date */}
          {n.createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {n.createdAt?.toDate
                ? n.createdAt.toDate().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Data desconhecida'}
            </div>
          )}

          {/* Actions: only owner can accept/reject pending requests */}
          <div className="flex gap-3 pt-1 flex-wrap">
            <Button
              className="flex-1 min-w-[120px] h-10 rounded-xl gradient-primary text-white border-0 font-bold gap-2 shadow-soft hover:-translate-y-0.5 transition-spring"
              onClick={() => onOpenChat(n)}
            >
              <MessageSquare className="h-4 w-4" />
              Conversar
            </Button>
            {isOwner && isPending && (
              <>
                <Button
                  className="flex-1 min-w-[100px] h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white border-0 font-bold gap-2 shadow-soft"
                  disabled={updating === n.id}
                  onClick={() => onAccept(n.id!)}
                >
                  {updating === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Aceitar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[100px] h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 font-bold gap-2"
                  disabled={updating === n.id}
                  onClick={() => onReject(n.id!)}
                >
                  <XCircle className="h-4 w-4" />
                  Recusar
                </Button>
              </>
            )}
          </div>

          {/* Renter label when accepted */}
          {!isOwner && n.status === 'aceite' && (
            <div className="flex items-center gap-2 text-sm text-success font-semibold">
              <CheckCircle className="h-4 w-4" />
              Proposta aceite — contacte o proprietário para assinar o contrato.
            </div>
          )}
          {!isOwner && n.status === 'recusada' && (
            <div className="flex items-center gap-2 text-sm text-destructive font-semibold">
              <XCircle className="h-4 w-4" />
              Proposta recusada pelo proprietário.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/* ── Empty state ───────────────────────────────────── */
const EmptyState = () => (
  <div className="text-center py-20 col-span-full">
    <div className="w-20 h-20 rounded-2xl bg-muted/50 border border-dashed border-border flex items-center justify-center mx-auto mb-5">
      <Inbox className="h-10 w-10 text-muted-foreground/40" />
    </div>
    <h3 className="text-lg font-bold mb-2">Sem negociações ainda</h3>
    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
      Navegue até ao <span className="text-primary font-semibold">Marketplace</span>, encontre uma propriedade
      e clique em <em>"Contactar via Negociações"</em> para iniciar o processo.
    </p>
  </div>
);

/* ── Main Component ─────────────────────────────────── */
const Negociacoes = () => {
  const { currentUser, userData } = useAuth();
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [tab, setTab]                 = useState<'todas' | 'pendente' | 'aceite' | 'recusada'>('todas');
  const [activeChat, setActiveChat]   = useState<Negociacao | null>(null);

  const load = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      setNegociacoes(await getNegociacoes(currentUser.uid));
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

  if (userData?.plan === 'gratuito' && !IS_PROMOTION_FREE) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-3xl font-black font-['Outfit'] mb-4">Acesso Premium Necessário</h2>
          <p className="text-muted-foreground max-w-md mx-auto mb-8">
            A gestão de negociações e o contacto direto com proprietários/agricultores são funcionalidades exclusivas para utilizadores premium. Atualize o seu plano para desbloquear as negociações reais.
          </p>
          <div className="w-full max-w-md space-y-3">
             <Button className="w-full h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-soft">Desbloquear Mensal — 200 MT</Button>
             <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold shadow-soft">Desbloquear Trimestral — 580 MT (Poupa 10%)</Button>
             <Button className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-soft">Desbloquear Anual — 2000 MT (Melhor Valor)</Button>
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
        {IS_PROMOTION_FREE && userData?.plan === 'gratuito' && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-xl flex items-center gap-3 mb-8 animate-pulse shadow-soft">
            <Crown className="h-6 w-6 text-amber-500 flex-shrink-0 animate-bounce" />
            <div className="text-xs">
              <p className="font-bold">Acesso Premium Ativo (Lançamento Gratuito - 5 Meses!)</p>
              <p className="opacity-95">Todas as propostas, negociações e ferramentas de contacto com proprietários estão 100% gratuitas e desbloqueadas.</p>
            </div>
          </div>
        )}

        {/* Page header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-2">
              Negociações <span className="text-gradient-primary">Seguras</span>
            </h1>
            <p className="text-muted-foreground text-sm max-w-lg">
              Gerencie as propostas de arrendamento entre agricultores e proprietários de terrenos.
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

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',    value: stats.total,    color: 'text-foreground',   bg: 'bg-muted/50' },
            { label: 'Pendentes', value: stats.pendente, color: 'text-yellow-600',   bg: 'bg-yellow-500/10' },
            { label: 'Aceites',  value: stats.aceite,   color: 'text-green-600',    bg: 'bg-green-500/10' },
            { label: 'Recusadas',value: stats.recusada,  color: 'text-red-500',      bg: 'bg-red-500/10' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl border border-border/50 ${s.bg} p-4 text-center`}>
              <p className={`text-2xl font-black font-['Outfit'] ${s.color}`}>{s.value}</p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(['todas', 'pendente', 'aceite', 'recusada'] as const).map(t => (
            <Button
              key={t}
              size="sm"
              variant={tab === t ? "default" : "ghost"}
              onClick={() => setTab(t)}
              className={`rounded-xl font-bold capitalize ${tab === t ? 'gradient-primary text-white border-0' : 'text-muted-foreground'}`}
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
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filtered.length === 0 ? <EmptyState /> : filtered.map(n => (
              <NegociacaoCard
                key={n.id}
                n={n}
                currentUid={currentUser!.uid}
                onAccept={handleAccept}
                onReject={handleReject}
                updating={updating}
                onOpenChat={setActiveChat}
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
      </main>
      <Footer />
    </div>
  );
};

export default Negociacoes;