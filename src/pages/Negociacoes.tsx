import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Handshake, MessageSquare, Clock,
  CheckCircle, XCircle, MapPin, Calendar, Lock,
  Loader2, RefreshCw, Inbox, Crown, ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { IS_PROMOTION_FREE } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  subscribeToNegociacoes, updateNegociacaoStatus, Negociacao
} from "@/lib/firestoreService";
import ChatModal from "@/components/ChatModal";
import UpgradeModal from "@/components/UpgradeModal";
import { useNavigate } from 'react-router-dom';

/* ── Status helpers ─────────────────────────────────── */
const statusConfig = {
  pendente:  { label: 'Pendente',  color: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30', icon: Clock },
  aceite:    { label: 'Aceite',    color: 'bg-green-500/15 text-green-700  dark:text-green-400  border-green-500/30',  icon: CheckCircle },
  recusada:  { label: 'Recusada', color: 'bg-red-500/15   text-red-600    dark:text-red-400    border-red-500/30',    icon: XCircle },
};

/* ── Negotiation Card ───────────────────────────────── */
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
  const unreadCount = 0; // Could be implemented with read tracking

  return (
    <Card className="border-border/50 shadow-soft rounded-2xl overflow-hidden hover:shadow-medium transition-all hover:-translate-y-0.5">
      <CardContent className="p-0">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border/50">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-bold text-sm line-clamp-1">{n.propertyNome}</span>
          </div>
          <Badge variant="outline" className={`text-[11px] font-bold px-3 rounded-full flex-shrink-0 ${cfg.color}`}>
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
                <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">
                  {n.arrendatarioNome.charAt(0)}
                </div>
                <p className="text-sm font-semibold truncate">{n.arrendatarioNome}</p>
              </div>
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Proprietário</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent text-[10px] font-black flex-shrink-0">
                  {n.proprietarioNome.charAt(0)}
                </div>
                <p className="text-sm font-semibold truncate">{n.proprietarioNome}</p>
              </div>
            </div>
          </div>

          {/* Last message preview */}
          <div className="bg-muted/40 rounded-xl p-3.5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground mb-1">Última Mensagem</p>
            <p className="text-sm leading-relaxed line-clamp-2">
              {n.mensagens && n.mensagens.length > 0
                ? n.mensagens[n.mensagens.length - 1].text
                : n.mensagem}
            </p>
            {n.mensagens && n.mensagens.length > 1 && (
              <p className="text-[10px] text-muted-foreground mt-1">{n.mensagens.length} mensagens no total</p>
            )}
          </div>

          {/* Date */}
          {n.createdAt && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              {(n.createdAt as any)?.toDate
                ? (n.createdAt as any).toDate().toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Data desconhecida'}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1 flex-wrap">
            <Button
              className="flex-1 min-w-[120px] h-10 rounded-xl gradient-primary text-white border-0 font-bold gap-2 shadow-soft hover:-translate-y-0.5 transition-spring"
              onClick={() => onOpenChat(n)}
            >
              <MessageSquare className="h-4 w-4" />
              Conversar
              {unreadCount > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 rounded-full">{unreadCount}</span>
              )}
            </Button>
            {isOwner && isPending && (
              <>
                <Button
                  className="flex-1 min-w-[90px] h-10 rounded-xl bg-green-600 hover:bg-green-700 text-white border-0 font-bold gap-1.5 shadow-soft"
                  disabled={updating === n.id}
                  onClick={() => onAccept(n.id!)}
                >
                  {updating === n.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                  Aceitar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-w-[90px] h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 font-bold gap-1.5"
                  disabled={updating === n.id}
                  onClick={() => onReject(n.id!)}
                >
                  <XCircle className="h-4 w-4" />
                  Recusar
                </Button>
              </>
            )}
          </div>

          {/* Status messages for renter */}
          {!isOwner && n.status === 'aceite' && (
            <div className="flex items-center gap-2 text-sm text-success font-semibold bg-success/10 rounded-xl px-3 py-2">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              Proposta aceite — contacte o proprietário para assinar o contrato.
            </div>
          )}
          {!isOwner && n.status === 'recusada' && (
            <div className="flex items-center gap-2 text-sm text-destructive font-semibold bg-destructive/10 rounded-xl px-3 py-2">
              <XCircle className="h-4 w-4 flex-shrink-0" />
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

/* ── Upgrade Wall ──────────────────────────────────── */
const UpgradeWall = ({ onUpgrade }: { onUpgrade: () => void }) => (
  <div className="min-h-screen bg-background flex flex-col">
    <Header />
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 rounded-full gradient-primary/20 border-2 border-primary/30 flex items-center justify-center mx-auto">
          <Lock className="h-12 w-12 text-primary" />
        </div>
        <div>
          <h2 className="text-3xl font-black font-['Outfit'] mb-3">
            Funcionalidade <span className="text-gradient-primary">Premium</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            As negociações directas com proprietários e agricultores são exclusivas para utilizadores com plano pago.
            Escolha o plano que mais lhe convém — ou continue grátis com acesso básico.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full h-12 rounded-xl gradient-primary text-white font-bold border-0 shadow-soft hover:shadow-md hover:-translate-y-0.5 transition-all gap-2"
            onClick={onUpgrade}
          >
            <Crown className="h-5 w-5" />
            Ver Planos Premium
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Button>
          <p className="text-xs text-muted-foreground">
            Pagamentos via M-Pesa ou eMola · Cancele quando quiser
          </p>
        </div>
      </div>
    </main>
    <Footer />
  </div>
);

/* ── Main Component ─────────────────────────────────── */
const Negociacoes = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [negociacoes, setNegociacoes] = useState<Negociacao[]>([]);
  const [loading, setLoading]         = useState(true);
  const [updating, setUpdating]       = useState<string | null>(null);
  const [tab, setTab]                 = useState<'todas' | 'pendente' | 'aceite' | 'recusada'>('todas');
  const [activeChat, setActiveChat]   = useState<Negociacao | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const isPremium = IS_PROMOTION_FREE || (userData?.plan && userData.plan !== 'gratuito');

  // Real-time subscription
  useEffect(() => {
    if (!currentUser || !isPremium) return;
    setLoading(true);
    const unsubscribe = subscribeToNegociacoes(currentUser.uid, (data) => {
      setNegociacoes(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [currentUser, isPremium]);

  const handleAccept = async (id: string) => {
    setUpdating(id);
    try { await updateNegociacaoStatus(id, 'aceite'); }
    finally { setUpdating(null); }
  };

  const handleReject = async (id: string) => {
    setUpdating(id);
    try { await updateNegociacaoStatus(id, 'recusada'); }
    finally { setUpdating(null); }
  };

  const filtered = tab === 'todas' ? negociacoes : negociacoes.filter(n => n.status === tab);

  const stats = {
    total:    negociacoes.length,
    pendente: negociacoes.filter(n => n.status === 'pendente').length,
    aceite:   negociacoes.filter(n => n.status === 'aceite').length,
    recusada: negociacoes.filter(n => n.status === 'recusada').length,
  };

  // Show upgrade wall for free users when promotion is off
  if (!isPremium) {
    return (
      <>
        <UpgradeWall onUpgrade={() => setShowUpgrade(true)} />
        {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} reason="para gerir negociações" />}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}

      <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
        {IS_PROMOTION_FREE && userData?.plan === 'gratuito' && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 rounded-2xl flex items-center gap-3 mb-8 shadow-soft">
            <Crown className="h-6 w-6 text-amber-500 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Acesso Premium Activo (Promoção de Lançamento!)</p>
              <p className="opacity-90">Todas as negociações estão desbloqueadas gratuitamente durante o período promocional.</p>
            </div>
          </div>
        )}

        {/* Page header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-2">
              Negociações <span className="text-gradient-primary">Seguras</span>
            </h1>
            <p className="text-muted-foreground text-sm">
              Gerencie as propostas de arrendamento · Actualização em tempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-success bg-success/10 px-3 py-1.5 rounded-full border border-success/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Tempo real
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: 'Total',     value: stats.total,    color: 'text-foreground',  bg: 'bg-muted/50' },
            { label: 'Pendentes', value: stats.pendente, color: 'text-yellow-600',  bg: 'bg-yellow-500/10' },
            { label: 'Aceites',   value: stats.aceite,   color: 'text-green-600',   bg: 'bg-green-500/10' },
            { label: 'Recusadas', value: stats.recusada, color: 'text-red-500',     bg: 'bg-red-500/10' },
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
              className={`rounded-xl font-bold capitalize ${tab === t ? 'gradient-primary text-white border-0' : 'text-muted-foreground hover:text-foreground'}`}
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
          />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Negociacoes;