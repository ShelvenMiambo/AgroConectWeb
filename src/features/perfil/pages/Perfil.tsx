import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, Mail, Phone, Leaf, Shield, CheckCircle,
  Crown, Handshake, MapPin, LogOut, Edit3, Save,
  Loader2, Sprout, Star, Zap, X, AlertCircle, Calendar, Trash2, Package, Trash, Home, Camera, RotateCw
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getProperties, deleteProperty } from '@/features/marketplace/services/properties';
import { getUserListings, deleteListing } from '@/features/marketplace/services/listings';
import { deleteUserAccountData } from '@/features/perfil/services/account';
import { uploadAvatar } from '@/lib/services/storage';
import AvatarCropper from '@/features/perfil/components/AvatarCropper';
import VerifiedBadge from '@/components/VerifiedBadge';
import Stars from '@/components/Stars';
import ProcessingAnimation from '@/components/ProcessingAnimation';
import { getResumoAvaliacoes, type ResumoAvaliacoes } from '@/features/negociacoes/services/avaliacoes';
import type { Property, Listing } from '@/types';
import { supabase } from '@/lib/supabase';
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  initiatePayment, checkPaymentStatus,
  isValidPhone, formatPhone, type PlanId
} from '@/lib/paysuiteService';
import { usePlanConfig } from '@/hooks/usePlanConfig';

/* ─── Plan Config ──────────────────────────────────── */
const plans = [
  {
    id: 'gratuito',
    label: 'Gratuito',
    price: 0,
    period: '',
    icon: Leaf,
    color: 'text-muted-foreground',
    bg: 'bg-muted/40',
    border: 'border-border/50',
    features: ['Acesso ao Marketplace', 'Assistente IA (limitado)', '1 Plano de Produção'],
    cta: null,
    badge: null,
  },
  {
    id: 'mensal',
    label: 'Mensal',
    price: 1,
    period: 'mês',
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-500/8',
    border: 'border-orange-500/30',
    features: ['Tudo no Gratuito', 'Contactos premium desbloqueados', 'Negociações ilimitadas', 'Alertas de produção'],
    cta: { label: 'Subscrever Mensal', classes: 'bg-orange-500 hover:bg-orange-600 text-white' },
    badge: null,
  },
  {
    id: 'trimestral',
    label: 'Trimestral',
    price: 1,
    period: 'trimestre',
    icon: Star,
    color: 'text-primary',
    bg: 'bg-primary/8',
    border: 'border-primary/30',
    features: ['Tudo no Mensal', 'Poupa 10% (vs mensal)', 'Suporte prioritário', 'Análise de mercado'],
    cta: { label: 'Subscrever Trimestral', classes: 'bg-primary text-white border-0' },
    badge: 'Popular',
  },
  {
    id: 'anual',
    label: 'Anual',
    price: 1,
    period: 'ano',
    icon: Crown,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/30',
    features: ['Tudo no Trimestral', 'Poupa 17% (melhor valor)', 'Acesso beta a novas funcionalidades', 'Relatórios avançados'],
    cta: { label: 'Subscrever Anual', classes: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
    badge: 'Melhor Valor',
  },
];

const userTypeLabel: Record<string, string> = {
  agricultor:   'Agricultor',
  proprietario: 'Dono de Terreno',
  vendedor:     'Vendedor Agrícola',
  comprador:    'Comprador / Fornecedor',
  pendente:     'Perfil Incompleto',
};

/* ─── Cartão de plano estilo "cartão premium" (vira ao clicar) ───────── */
const cardFinish: Record<string, { bg: string; ink: string; sub: string; chip: string; accent: string; leaf: string; ring?: boolean }> = {
  mensal:     { bg: 'linear-gradient(135deg,#b98a41,#7c5220)', ink: '#f4efe4', sub: 'rgba(244,239,228,.65)', chip: '#e9cd85', accent: '#f4efe4', leaf: '#a8e0a0' },
  trimestral: { bg: 'linear-gradient(135deg,#2e7d32,#164016)', ink: '#f4efe4', sub: 'rgba(244,239,228,.65)', chip: '#e9cd85', accent: '#f4efe4', leaf: '#a8e0a0', ring: true },
  anual:      { bg: 'linear-gradient(135deg,#1e2b23,#0b140f)', ink: '#e7dcc2', sub: 'rgba(231,220,194,.55)', chip: '#d9b45b', accent: '#d9b45b', leaf: '#8fbf6a' },
};

const CardLogo = ({ color, leaf }: { color: string; leaf: string }) => (
  <svg width="26" height="26" viewBox="0 0 48 48" aria-hidden="true">
    <rect width="48" height="48" rx="13" fill="rgba(255,255,255,.14)" />
    <path d="M11 33 H37" stroke={color} strokeWidth="2.6" strokeLinecap="round" />
    <path d="M24 33 V18" stroke={color} strokeWidth="2.4" strokeLinecap="round" />
    <path d="M23.5 21C23.5 14.5 19 11 12 11 12 17.5 17 21 23.5 21Z" fill={leaf} />
    <path d="M25 19C25 12.5 30 9 37 9 37 15.5 32 19 25 19Z" fill={color} />
  </svg>
);

const PlanoCard = ({ plan, isActive, onSubscribe }: { plan: typeof plans[0]; isActive: boolean; onSubscribe: () => void }) => {
  const [flipped, setFlipped] = useState(false);
  const f = cardFinish[plan.id] || cardFinish.mensal;
  return (
    <div className="[perspective:1200px] w-full cursor-pointer select-none" style={{ aspectRatio: '1.7 / 1' }}
      onClick={() => setFlipped(v => !v)}>
      <div className="relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]"
        style={{ transform: flipped ? 'rotateY(180deg)' : 'none' }}>

        {/* Frente — cartão premium */}
        <div className="absolute inset-0 rounded-2xl p-4 flex flex-col justify-between [backface-visibility:hidden] overflow-hidden"
          style={{ background: f.bg, color: f.ink, boxShadow: f.ring ? '0 0 0 2px hsl(var(--primary))' : undefined }}>
          {plan.badge && <span className="absolute top-3 right-3 text-[10px] font-bold rounded-md px-2 py-0.5" style={{ background: '#f4efe4', color: '#164016' }}>{plan.badge}</span>}
          {isActive && <span className="absolute top-3 right-3 text-[10px] font-bold rounded-md px-2 py-0.5 bg-success text-white">Ativo</span>}
          <div className="flex items-center gap-2">
            <CardLogo color={f.accent} leaf={f.leaf} />
            <span className="font-semibold tracking-wide text-sm">AgroConecta</span>
          </div>
          <div className="flex items-center gap-3">
            <svg width="34" height="26" viewBox="0 0 36 27" aria-hidden="true"><rect width="36" height="27" rx="5" fill={f.chip}/><rect x="4" y="4" width="28" height="19" rx="3" fill="none" stroke="#a9832c" strokeWidth="1"/><path d="M4 13.5h28M18 4v19" stroke="#a9832c" strokeWidth="1"/></svg>
            <svg width="18" height="20" viewBox="0 0 24 24" fill="none" stroke={f.ink} strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><path d="M6 8a8 8 0 0 1 0 8"/><path d="M10 6a12 12 0 0 1 0 12"/><path d="M14 4.5a15 15 0 0 1 0 15"/></svg>
            <span className="ml-auto text-[10px] flex items-center gap-1" style={{ color: f.sub }}><RotateCw className="h-3 w-3" /> ver benefícios</span>
          </div>
          <div className="font-mono tracking-[0.2em] text-sm">•••• •••• •••• {plan.price} MT</div>
          <div className="flex items-end justify-between">
            <div><div className="text-[9px] uppercase tracking-wider" style={{ color: f.sub }}>Plano</div><div className="text-sm font-semibold">{plan.label}</div></div>
            <div className="text-right"><div className="text-[9px] uppercase tracking-wider" style={{ color: f.sub }}>{plan.period ? 'por ' + plan.period : ''}</div><div className="text-sm font-semibold">{plan.price} MT</div></div>
          </div>
        </div>

        {/* Traseira — benefícios */}
        <div className="absolute inset-0 rounded-2xl p-4 flex flex-col [backface-visibility:hidden] bg-card border border-border/60"
          style={{ transform: 'rotateY(180deg)' }}>
          <p className="font-black text-sm font-['Poppins'] mb-2">Plano {plan.label}</p>
          <ul className="space-y-1 flex-1 overflow-hidden">
            {plan.features.map(ft => (
              <li key={ft} className="flex items-start gap-1.5 text-[11px] text-foreground/80"><CheckCircle className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />{ft}</li>
            ))}
          </ul>
          {isActive ? (
            <p className="text-center text-xs text-success font-semibold">Plano atual</p>
          ) : (
            <Button size="sm" className="w-full h-8 rounded-lg font-bold text-[11px] bg-primary hover:bg-primary/90 text-white border-0"
              onClick={(e) => { e.stopPropagation(); onSubscribe(); }}>
              Subscrever · {plan.price} MT
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Payment Modal (M-Pesa / eMola) ───────────────── */
const PaymentModal = ({ plan, onClose }: { plan: typeof plans[0]; onClose: () => void }) => {
  const { currentUser } = useAuth();
  const [step, setStep]         = useState<'form' | 'waiting' | 'success' | 'error'>('form');
  const [phone, setPhone]       = useState('');
  const [processing, setProcessing]   = useState(false);
  const [errorMsg, setErrorMsg]       = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cancelRef = useRef(false);

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  // Sair da animação de espera (não trava o pagamento no telemóvel, se já foi enviado).
  const cancelar = () => {
    cancelRef.current = true;
    if (pollRef.current) clearInterval(pollRef.current);
    onClose();
  };

  const concluir = (ok: boolean, msg?: string) => {
    if (cancelRef.current) return;
    setProcessing(false);
    if (ok) { setStep('success'); }
    else { setErrorMsg(msg || 'Pagamento não confirmado. Verifique o telemóvel e tente novamente.'); setStep('error'); }
  };

  const handlePayment = async () => {
    if (!currentUser || !isValidPhone(phone)) return;
    cancelRef.current = false;
    setProcessing(true);
    setStep('waiting');

    const result = await initiatePayment({
      uid: currentUser.uid,
      plan: plan.id as PlanId,
      phone: formatPhone(phone),
      method: 'mpesa',
    });

    // M-Pesa é síncrono: normalmente já vem 'success' (plano ativado no servidor)
    // ou falha. O plano NÃO é ativado no cliente (o trigger só deixa admins).
    if (result.status === 'success' && result.activated !== false) { concluir(true); return; }
    if (result.status === 'success' && result.activated === false) { concluir(false, result.error); return; }
    if (!result.success && result.status !== 'pending') { concluir(false, result.error); return; }

    // Raro: ficou 'pending' → consulta o estado até ~2 min.
    const pid = result.paymentId;
    if (!pid) { concluir(false, result.error); return; }
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      const status = await checkPaymentStatus(pid);
      if (status === 'success') { clearInterval(pollRef.current!); concluir(true); }
      else if (status === 'failed' || attempts > 30) { clearInterval(pollRef.current!); concluir(false); }
    }, 4000);
  };

  // Espera em ecrã inteiro (a animação enquanto o M-Pesa/USSD é confirmado).
  if (step === 'waiting') {
    return (
      <ProcessingAnimation
        fullscreen
        message="A conectar M‑Pesa…"
        submessage={`Enviámos um pedido para ${formatPhone(phone)}. Confirme com o seu PIN no telemóvel.`}
        onCancel={cancelar}
        cancelLabel="Cancelar"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === 'success' ? undefined : onClose} />
      <div className="relative w-full max-w-md bg-card rounded-lg shadow-strong border border-border/60 fade-in-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border/60 bg-muted/30">
          <div>
            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Pagamento M-Pesa</p>
            <h3 className="font-black text-xl font-['Poppins']">Plano {plan.label}</h3>
          </div>
          {step !== 'success' && step !== 'waiting' && <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="h-4 w-4" /></button>}
        </div>

        <div className="p-6 space-y-5">
          {step === 'success' ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 rounded-full bg-success/15 flex items-center justify-center mx-auto">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              <h3 className="text-2xl font-black font-['Poppins']">Subscrição Ativa!</h3>
              <p className="text-muted-foreground text-sm">O seu plano <strong>{plan.label}</strong> foi ativado com sucesso. Bem-vindo ao Premium!</p>
              <Button className="w-full h-12 rounded-xl bg-primary text-white border-0 font-bold" onClick={() => { onClose(); window.location.reload(); }}>
                <CheckCircle className="h-4 w-4 mr-2" /> Continuar para o AgroConecta
              </Button>
            </div>
          ) : step === 'error' ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="h-10 w-10 text-destructive" />
              </div>
              <h3 className="text-xl font-black font-['Poppins']">Pagamento não concluído</h3>
              <p className="text-sm text-muted-foreground">{errorMsg}</p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Fechar</Button>
                <Button className="flex-1 rounded-xl bg-primary text-white border-0" onClick={() => setStep('form')}>
                  Tentar Novamente
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/40 border border-border/50">
                <span className="text-muted-foreground text-sm">Total a pagar</span>
                <span className="text-2xl font-black text-primary font-['Poppins']">{plan.price} MT</span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50">
                <img src="/images/M-Pesa.png" alt="M-Pesa" className="h-10 w-auto rounded-lg flex-shrink-0" />
                <div><p className="font-bold text-sm">Pagar com M-Pesa</p><p className="text-xs text-muted-foreground">Vodacom Moçambique</p></div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Número M-Pesa</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+258 84 XXX XXXX"
                    inputMode="tel"
                    className="pl-10 h-12 rounded-xl border-border/70"
                  />
                </div>
                {phone.length >= 9 && !isValidPhone(phone) && (
                  <p className="text-xs text-destructive">Número inválido. Use um número M-Pesa (84/85).</p>
                )}
              </div>
              <div className="bg-muted/40 rounded-xl p-3 text-xs text-muted-foreground space-y-1">
                <p>1. Introduza o seu número M-Pesa.</p>
                <p>2. Receberá um pedido no telemóvel — confirme com o seu PIN.</p>
                <p>3. O plano é ativado automaticamente.</p>
              </div>
              <Button
                onClick={handlePayment}
                disabled={!isValidPhone(phone) || processing}
                className="w-full h-12 rounded-xl font-bold gap-2 text-white border-0 bg-primary"
              >
                Pagar {plan.price} MT via M-Pesa
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Profile Page ─────────────────────────────── */
const Perfil = () => {
  const { currentUser, userData, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [name, setName]       = useState(userData?.name || '');
  const [phone, setPhone]     = useState(userData?.phone || '');
  const [userTypes, setUserTypes] = useState<string[]>(userData?.userTypes || (userData?.userType ? [userData.userType] : []));
  const navigate = useNavigate();
  const { config } = usePlanConfig();
  const activePlans = plans.map(p =>
    p.id === 'gratuito' ? p : { ...p, price: config.prices[p.id as keyof typeof config.prices] ?? p.price }
  );
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null);

  const [reputacao, setReputacao] = useState<ResumoAvaliacoes>({ media: 0, total: 0 });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);   // foto escolhida, a aguardar recorte
  const [viewPhoto, setViewPhoto] = useState(false);             // ver a foto em grande
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (userData) {
      setName(userData.name || '');
      setPhone(userData.phone || '');
      setUserTypes(userData.userTypes || (userData.userType ? [userData.userType] : []));
    }
  }, [userData]);

  useEffect(() => {
    if (currentUser?.uid) getResumoAvaliacoes(currentUser.uid).then(setReputacao).catch(() => {});
  }, [currentUser?.uid]);

  useEffect(() => {
    const loadContent = async () => {
      if (!currentUser) return;
      setLoadingData(true);
      try {
        const [allProps, lsts] = await Promise.all([getProperties(), getUserListings(currentUser.uid)]);
        setUserProperties(allProps.filter(p => p.donoUid === currentUser.uid));
        setUserListings(lsts);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingData(false);
      }
    };
    loadContent();
  }, [currentUser]);

  const handleDeleteProperty = async (p: Property) => {
    if (!confirm('Eliminar esta propriedade?')) return;
    setDeletingId(p.id!);
    try {
      await deleteProperty(p.id!, p.imageUrls ?? []);
      setUserProperties(prev => prev.filter(x => x.id !== p.id));
    } catch { alert('Erro ao eliminar.'); }
    finally { setDeletingId(null); }
  };

  const handleDeleteListing = async (l: Listing) => {
    if (!confirm('Eliminar esta publicação?')) return;
    setDeletingId(l.id!);
    try {
      await deleteListing(l.id!);
      setUserListings(prev => prev.filter(x => x.id !== l.id));
    } catch { alert('Erro ao eliminar.'); }
    finally { setDeletingId(null); }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    const confirmDelete = confirm('ATENÇÃO: Tem a certeza que deseja apagar a sua conta permanentemente? Esta ação é irreversível e irá apagar todos os seus dados e publicações.');
    if (!confirmDelete) return;
    
    setDeletingAccount(true);
    try {
      await deleteUserAccountData(currentUser.uid);
      await supabase.auth.signOut();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      {
        alert('Erro ao apagar conta. Tente novamente.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  // Passo 1: escolher o ficheiro → abre o recortador
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite reenviar o mesmo ficheiro
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Escolha um ficheiro de imagem.'); return; }
    setCropFile(file);
  };

  // Passo 2: guardar o recorte → comprime, envia, grava no perfil
  const handleCropSave = async (blob: Blob) => {
    if (!currentUser) return;
    setUploadingPhoto(true);
    try {
      const file = new File([blob], 'avatar.webp', { type: 'image/webp' });
      const url = await uploadAvatar(currentUser.uid, file);
      await supabase.from('profiles').update({ photo_url: url }).eq('id', currentUser.uid);
      window.location.reload();
    } catch (err: any) {
      alert(err?.message || 'Erro ao enviar a foto. Tente novamente.');
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const primaryType = userTypes[0] || 'pendente';
      await supabase.from('profiles').update({
        name,
        phone,
        user_type: primaryType,
        user_types: userTypes,
      }).eq('id', currentUser.uid);
      setEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.location.reload();
    } catch (e) {
      alert('Erro ao guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const currentPlan = activePlans.find(p => p.id === (userData?.plan || 'gratuito')) || activePlans[0];
  const isPremium   = userData?.plan && userData.plan !== 'gratuito';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {selectedPlan && <PaymentModal plan={selectedPlan} onClose={() => setSelectedPlan(null)} />}

      {/* Recortar a foto de perfil escolhida */}
      {cropFile && (
        <AvatarCropper
          file={cropFile}
          saving={uploadingPhoto}
          onCancel={() => setCropFile(null)}
          onSave={handleCropSave}
        />
      )}

      {/* Ver a foto de perfil em grande */}
      {viewPhoto && userData?.photoURL && (
        <div
          className="fixed inset-0 z-[70] bg-background/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewPhoto(false)}
        >
          <button aria-label="Fechar" className="absolute top-4 right-4 h-10 w-10 rounded-full bg-card border border-border flex items-center justify-center" onClick={() => setViewPhoto(false)}>
            <X className="h-5 w-5" />
          </button>
          <img
            src={userData.photoURL}
            alt={userData?.name || 'Foto de perfil'}
            className="max-w-[90vw] max-h-[85vh] rounded-2xl object-contain shadow-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}

      <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl pb-24 md:pb-10">
        <h1 className="text-3xl md:text-4xl font-black font-['Poppins'] mb-8">
          O Meu <span className="text-primary">Perfil</span>
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/50 shadow-soft rounded-lg overflow-hidden">
              <div className="h-20 bg-primary" />
              <CardContent className="px-6 pb-6 pt-0">
                <div className="flex -mt-12 mb-3">
                  <div className="relative">
                    {userData?.photoURL ? (
                      <button
                        type="button"
                        onClick={() => setViewPhoto(true)}
                        aria-label="Ver foto de perfil"
                        className="block rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <img
                          src={userData.photoURL}
                          alt={userData?.name || 'Foto de perfil'}
                          className="w-24 h-24 rounded-full object-cover shadow-md border-4 border-background bg-muted cursor-zoom-in"
                        />
                      </button>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-4xl font-black shadow-md border-4 border-background">
                        {(userData?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                    {/* Botão de foto */}
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      aria-label="Alterar foto de perfil"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center border-2 border-background shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-70"
                    >
                      {uploadingPhoto ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </button>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                  </div>
                </div>
                <h2 className="text-xl font-black font-['Poppins'] leading-tight flex items-center gap-1.5">
                  {userData?.name || 'Utilizador'}
                  {userData?.verificado && <VerifiedBadge size="md" />}
                </h2>
                {reputacao.total > 0 && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <Stars valor={reputacao.media} />
                    <span className="text-xs text-muted-foreground">{reputacao.media} ({reputacao.total} avaliaç{reputacao.total === 1 ? 'ão' : 'ões'})</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground mb-3 break-all">{currentUser?.email}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs font-bold rounded-full px-3 ${
                      userData?.userType === 'pendente'
                        ? 'text-yellow-600 border-yellow-500/40 bg-yellow-500/10'
                        : 'text-primary border-primary/40 bg-primary/10'
                    }`}>
                      <Sprout className="h-3 w-3 mr-1" />
                      {userTypeLabel[userData?.userType || 'pendente']}
                    </Badge>
                  </div>
                  {config.isPromotionActive && (!userData?.plan || userData.plan === 'gratuito') ? (
                    <Badge variant="outline" className="text-xs font-bold rounded-full px-3 text-amber-600 dark:text-amber-400 border-amber-500/40 bg-amber-500/10 shadow-soft">
                      <Crown className="h-3 w-3 mr-1 text-amber-500 animate-pulse fill-amber-500" />
                      Acesso Premium Gratuito (Promoção)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={`text-xs font-bold rounded-full px-3 ${
                      isPremium
                        ? 'text-emerald-600 border-emerald-500/40 bg-emerald-500/10'
                        : 'text-muted-foreground border-border'
                    }`}>
                      <Crown className="h-3 w-3 mr-1" />
                      Plano {currentPlan.label}
                    </Badge>
                  )}
                  {userData?.planExpiraEm && isPremium && (
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      Expira em {new Date(userData.planExpiraEm).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick links */}
            <Card className="border-border/50 shadow-soft rounded-lg">
              <CardContent className="p-4 space-y-1">
                {[
                  { icon: MapPin, label: 'Marketplace', href: '/marketplace' },
                  { icon: Handshake, label: 'Negociações', href: '/negociacoes' },
                  { icon: Sprout, label: 'Produção', href: '/producao' },
                ].map(({ icon: Ic, label, href }) => (
                  <a key={href} href={href} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium group">
                    <Ic className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    {label}
                  </a>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-destructive/5 text-destructive transition-colors text-sm font-medium w-full mt-1 border-t border-border/50 pt-3"
                >
                  <LogOut className="h-4 w-4" /> Terminar Sessão
                </button>
              </CardContent>
            </Card>
          </div>

          {/* Right: Details + Plans */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Details */}
            <Card className="border-border/50 shadow-soft rounded-lg">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
                <CardTitle className="text-lg font-black font-['Poppins']">Dados da Conta</CardTitle>
                {!editing ? (
                  <Button size="sm" variant="ghost" className="gap-2 rounded-xl" onClick={() => { setEditing(true); setName(userData?.name || ''); setPhone(userData?.phone || ''); }}>
                    <Edit3 className="h-4 w-4" /> Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                    <Button size="sm" className="gap-2 rounded-xl bg-primary text-white border-0" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                    {editing ? (
                      <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11" />
                    ) : (
                      <p className="font-semibold text-base break-words">{userData?.name || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Telefone</Label>
                    {editing ? (
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+258 8X XXX XXXX" className="rounded-xl h-11" />
                    ) : (
                      <p className="font-semibold text-base">{userData?.phone || 'Não definido'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/20 p-3.5">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <p className="font-semibold text-base flex items-center gap-2 break-all">
                      {currentUser?.email}
                      {currentUser?.email && <CheckCircle className="h-4 w-4 text-success flex-shrink-0" />}
                    </p>
                  </div>
                  <div className={`space-y-1.5 ${editing ? 'mt-1' : 'rounded-xl border border-border/60 bg-muted/20 p-3.5'}`}>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {editing ? 'Perfis de Utilizador (Pode selecionar vários)' : 'Tipo de Conta'}
                    </Label>
                    {editing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                        {[
                          { value: 'proprietario', label: 'Dono de Terreno', icon: Home },
                          { value: 'agricultor',   label: 'Agricultor', icon: Sprout },
                          { value: 'vendedor',     label: 'Vendedor Agrícola', icon: Package },
                          { value: 'comprador',    label: 'Comprador / Fornecedor', icon: Package },
                        ].map(opt => {
                          const selected = userTypes.includes(opt.value);
                          return (
                            <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'}`}>
                              <input
                                type="checkbox"
                                className="hidden"
                                checked={selected}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...userTypes, opt.value]
                                    : userTypes.filter(t => t !== opt.value);
                                  setUserTypes(updated);
                                }}
                              />
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                <opt.icon className="h-4 w-4" />
                              </div>
                              <span className={`flex-1 text-sm font-semibold ${selected ? 'text-primary' : ''}`}>{opt.label}</span>
                              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${selected ? 'border-primary bg-primary text-white' : 'border-border'}`}>
                                {selected && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {userData?.userTypes && userData.userTypes.length > 0 ? (
                          userData.userTypes.map(t => (
                            <Badge key={t} variant="secondary" className="font-semibold px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20">
                              {userTypeLabel[t] || t}
                            </Badge>
                          ))
                        ) : (
                          <p className="font-semibold">{userTypeLabel[userData?.userType || 'pendente']}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Plans — shown first so user sees upgrade options immediately */}
            {config.isPromotionActive && (
              <div className="bg-gradient-to-r from-amber-500/10 via-primary/5 to-emerald-500/10 border border-primary/20 text-foreground p-4 rounded-lg flex items-start gap-3 shadow-soft">
                <Crown className="h-5 w-5 text-amber-500 animate-pulse mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <h4 className="font-black text-sm font-['Poppins'] flex items-center gap-2">
                    Promoção de Lançamento: 5 Meses 100% Grátis!
                    <Badge className="bg-primary text-white border-0 font-bold text-[9px] px-2 animate-bounce">Ativa</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Todos os recursos premium estão <strong>totalmente gratuitos</strong> para todos os utilizadores durante o lançamento.
                  </p>
                </div>
              </div>
            )}

            <Card className="border-border/50 shadow-soft rounded-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-black font-['Poppins'] flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" /> Planos de Subscrição
                </CardTitle>
                <p className="text-sm text-muted-foreground">Desbloqueie funcionalidades premium e contacte proprietários diretamente.</p>
                <div className="flex items-center gap-2.5 mt-3">
                  <span className="text-xs text-muted-foreground">Pagamento por</span>
                  <img src="/images/M-Pesa.png" alt="M-Pesa" className="h-7 w-7 rounded object-cover" />
                  <img src="/images/Emola.png" alt="e-Mola" className="h-7 w-7 rounded object-cover" />
                </div>
              </CardHeader>
              <CardContent>
                {/* Plano ativo em destaque no topo */}
                {(() => {
                  const activePlan = activePlans.find(p => userData?.plan === p.id || (p.id === 'gratuito' && !userData?.plan));
                  if (activePlan && activePlan.id !== 'gratuito') return (
                    <div className="mb-4 p-3 rounded-xl bg-success/10 border border-success/30 flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-success">Plano {activePlan.label} ativo</p>
                        {userData?.planExpiraEm && (
                          <p className="text-xs text-muted-foreground">Expira em {new Date(userData.planExpiraEm).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        )}
                      </div>
                    </div>
                  );
                  return null;
                })()}

                {/* Cartões de plano estilo "cartão premium" — clica para virar e ver os benefícios */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                  {activePlans.filter(p => p.id !== 'gratuito').map(plan => (
                    <PlanoCard
                      key={plan.id}
                      plan={plan}
                      isActive={userData?.plan === plan.id}
                      onSubscribe={() => setSelectedPlan(plan)}
                    />
                  ))}
                </div>

                {/* Plano gratuito — compacto no fundo */}
                {(!userData?.plan || userData.plan === 'gratuito') && (
                  <div className="mt-3 p-3 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold">Plano Gratuito</p>
                        <p className="text-xs text-muted-foreground">Acesso básico ao Marketplace e IA</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs font-bold rounded-full text-muted-foreground">Atual</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Minhas Publicações */}
            <Card className="border-border/50 shadow-soft rounded-lg">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black font-['Poppins'] flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Minhas Publicações
                </CardTitle>
                <p className="text-sm text-muted-foreground">Faça a gestão dos seus anúncios e pedidos ativos.</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
                ) : userProperties.length === 0 && userListings.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border/60 rounded-xl">
                    <Package className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="font-semibold text-foreground">Ainda não tem publicações</p>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">Publique um terreno ou produto no Marketplace.</p>
                    <Button onClick={() => navigate('/marketplace')} className="rounded-xl bg-primary text-white border-0 gap-2 font-semibold">
                      <MapPin className="h-4 w-4" /> Ir para o Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userProperties.map(p => (
                      <div key={p.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                          <Leaf className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm line-clamp-1">{p.nome}</p>
                          <p className="text-xs text-muted-foreground">{p.localizacao} • {p.preco.toLocaleString()} MT</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0" disabled={deletingId === p.id} onClick={() => handleDeleteProperty(p)}>
                          {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                    {userListings.map(l => (
                      <div key={l.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${l.listingType === 'produto-oferta' ? 'bg-blue-600/10 text-blue-600' : 'bg-purple-600/10 text-purple-600'}`}>
                          <Package className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm line-clamp-1">{l.titulo}</p>
                          <p className="text-xs text-muted-foreground capitalize">{l.listingType.replace('-', ' ')}</p>
                        </div>
                        <Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 flex-shrink-0" disabled={deletingId === l.id} onClick={() => handleDeleteListing(l)}>
                          {deletingId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30 shadow-soft rounded-lg bg-destructive/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black font-['Poppins'] flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" /> Zona de Perigo
                </CardTitle>
                <p className="text-sm text-destructive/80">Ações destrutivas que não podem ser desfeitas.</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-sm">Apagar Conta Definitivamente</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                      Esta ação irá apagar permanentemente o seu perfil, publicações e dados associados. O seu plano será cancelado.
                    </p>
                  </div>
                  <Button variant="destructive" className="w-full sm:w-auto shadow-soft rounded-xl shrink-0" onClick={handleDeleteAccount} disabled={deletingAccount}>
                    {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash className="h-4 w-4 mr-2" />}
                    Apagar Conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Perfil;
