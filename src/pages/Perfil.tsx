import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User, Mail, Phone, Leaf, Shield, CheckCircle,
  Crown, Handshake, MapPin, LogOut, Edit3, Save,
  Loader2, Sprout, Star, Zap, X, AlertCircle, Calendar, Trash2, Package, Trash, Home
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAllProperties, getUserListings, deleteProperty, deleteListing, Property, Listing, deleteUserAccountData } from '@/lib/firestoreService';
import { deleteUser } from 'firebase/auth';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import UpgradeModal from '@/components/UpgradeModal';
import { PLANS } from '@/components/UpgradeModal';
import { IS_PROMOTION_FREE } from '@/lib/utils';

/* ─── Plan Config ──────────────────────────────────── */
const plans = PLANS;

const userTypeLabel: Record<string, string> = {
  agricultor:   'Agricultor',
  proprietario: 'Dono de Terreno',
  vendedor:     'Vendedor Agrícola',
  comprador:    'Comprador / Fornecedor',
  pendente:     'Perfil Incompleto',
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
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradePlan, setUpgradePlan] = useState<'gratuito' | 'mensal' | 'trimestral' | 'anual' | undefined>(undefined);
  
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
    const loadContent = async () => {
      if (!currentUser) return;
      setLoadingData(true);
      try {
        const [allProps, lsts] = await Promise.all([getAllProperties(), getUserListings(currentUser.uid)]);
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
      await deleteUser(currentUser);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        alert('Por motivos de segurança, precisa de terminar a sessão e entrar novamente antes de apagar a conta.');
      } else {
        alert('Erro ao apagar conta. Tente novamente.');
      }
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    try {
      const primaryType = userTypes[0] || 'pendente';
      await updateDoc(doc(db, 'users', currentUser.uid), { 
        name, 
        phone,
        userType: primaryType,
        userTypes: userTypes
      });
      setEditing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      window.location.reload();
    } catch (e) {
      alert('Erro ao guardar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const currentPlan = plans.find(p => p.id === (userData?.plan || 'gratuito')) || plans[0];
  const isPremium   = userData?.plan && userData.plan !== 'gratuito';

  return (
    <div className="min-h-screen bg-background">
      <Header />
      {showUpgrade && (
        <UpgradeModal
          onClose={() => { setShowUpgrade(false); setUpgradePlan(undefined); }}
          defaultPlan={upgradePlan}
        />
      )}

      <main className="container mx-auto px-4 lg:px-8 py-10 max-w-5xl">
        <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-8">
          O Meu <span className="text-gradient-primary">Perfil</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="border-border/50 shadow-soft rounded-2xl overflow-hidden">
              <div className="h-20 gradient-primary relative" />
              <CardContent className="px-6 pb-6 pt-0">
                <div className="flex justify-end -mt-10 mb-3">
                  <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center text-white text-3xl font-black shadow-glow border-4 border-background">
                    {(userData?.name || currentUser?.email || 'U').charAt(0).toUpperCase()}
                  </div>
                </div>
                <h2 className="text-xl font-black font-['Outfit'] leading-tight">{userData?.name || 'Utilizador'}</h2>
                <p className="text-sm text-muted-foreground mb-3">{currentUser?.email}</p>

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
                  {IS_PROMOTION_FREE && (!userData?.plan || userData.plan === 'gratuito') ? (
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
            <Card className="border-border/50 shadow-soft rounded-2xl">
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
            <Card className="border-border/50 shadow-soft rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-black font-['Outfit']">Dados da Conta</CardTitle>
                {!editing ? (
                  <Button size="sm" variant="ghost" className="gap-2 rounded-xl" onClick={() => { setEditing(true); setName(userData?.name || ''); setPhone(userData?.phone || ''); }}>
                    <Edit3 className="h-4 w-4" /> Editar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
                    <Button size="sm" className="gap-2 rounded-xl gradient-primary text-white border-0" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} Guardar
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                    {editing ? (
                      <Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl h-11" />
                    ) : (
                      <p className="font-semibold">{userData?.name || '—'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Telefone</Label>
                    {editing ? (
                      <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+258 8X XXX XXXX" className="rounded-xl h-11" />
                    ) : (
                      <p className="font-semibold">{userData?.phone || 'Não definido'}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</Label>
                    <p className="font-semibold flex items-center gap-2">
                      {currentUser?.email}
                      {currentUser?.emailVerified && <CheckCircle className="h-4 w-4 text-success" />}
                    </p>
                  </div>
                  <div className={`space-y-1.5 ${editing ? 'col-span-2 mt-2' : ''}`}>
                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {editing ? 'Perfis de Utilizador (Pode selecionar vários)' : 'Tipo de Conta'}
                    </Label>
                    {editing ? (
                      <div className="grid sm:grid-cols-2 gap-2 mt-1">
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

            {/* Minhas Publicações */}
            <Card className="border-border/50 shadow-soft rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black font-['Outfit'] flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" /> Minhas Publicações
                </CardTitle>
                <p className="text-sm text-muted-foreground">Faça a gestão dos seus anúncios e pedidos ativos.</p>
              </CardHeader>
              <CardContent>
                {loadingData ? (
                  <div className="flex justify-center p-6"><Loader2 className="h-6 w-6 text-primary animate-spin" /></div>
                ) : userProperties.length === 0 && userListings.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-border/60 rounded-xl">
                    <p className="text-sm text-muted-foreground">Ainda não tem publicações ativas.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userProperties.map(p => (
                      <div key={p.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border/50 bg-muted/20 items-center justify-between">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Leaf className="h-6 w-6 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-bold line-clamp-1">{p.nome}</p>
                            <p className="text-xs text-muted-foreground">{p.localizacao} • {p.preco.toLocaleString()} MT</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10" disabled={deletingId === p.id} onClick={() => handleDeleteProperty(p)}>
                          {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                          Eliminar
                        </Button>
                      </div>
                    ))}
                    {userListings.map(l => (
                      <div key={l.id} className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border/50 bg-muted/20 items-center justify-between">
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${l.listingType === 'produto-oferta' ? 'bg-blue-600/10 text-blue-600' : 'bg-purple-600/10 text-purple-600'}`}>
                            <Package className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold line-clamp-1">{l.titulo}</p>
                            <p className="text-xs text-muted-foreground capitalize">{l.listingType.replace('-', ' ')}</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="w-full sm:w-auto text-destructive border-destructive/30 hover:bg-destructive/10" disabled={deletingId === l.id} onClick={() => handleDeleteListing(l)}>
                          {deletingId === l.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                          Eliminar
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {IS_PROMOTION_FREE && (
              <div className="bg-gradient-to-r from-amber-500/10 via-primary/5 to-emerald-500/10 border border-primary/20 text-foreground p-5 rounded-2xl flex items-start gap-4 mb-4 shadow-soft">
                <Crown className="h-6 w-6 text-amber-500 animate-pulse mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-black text-sm font-['Outfit'] flex items-center gap-2">
                    Promoção de Lançamento: 5 Meses 100% Grátis!
                    <Badge className="bg-primary text-white border-0 font-bold text-[9px] px-2 animate-bounce">Ativa</Badge>
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para comemorar o lançamento do AgroConecta, todos os recursos premium (negociações ilimitadas, alertas e contactos diretos com proprietários e produtores) estão <strong>totalmente gratuitos e ativos para todos os utilizadores</strong>.
                  </p>
                  <p className="text-xs font-semibold text-primary pt-1">
                    Desfrute do acesso Premium sem restrições!
                  </p>
                </div>
              </div>
            )}

            {/* Subscription Plans */}
            <Card className="border-border/50 shadow-soft rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="text-lg font-black font-['Outfit'] flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" /> Planos de Subscrição
                </CardTitle>
                <p className="text-sm text-muted-foreground">Desbloqueie funcionalidades premium e contacte proprietários directamente.</p>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {PLANS.map(plan => {
                    const isActive = userData?.plan === plan.id || (plan.id === 'gratuito' && !userData?.plan);
                    const Icon = plan.icon;
                    return (
                      <div
                        key={plan.id}
                        className={`relative rounded-2xl border-2 p-5 space-y-4 transition-all ${
                          plan.highlight
                            ? 'border-primary bg-primary/5 shadow-md'
                            : isActive
                            ? 'border-success/50 bg-success/5'
                            : `${plan.border} bg-gradient-to-b ${plan.gradient}`
                        }`}
                      >
                        {plan.badge && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                            <Badge className={`font-bold text-[10px] px-3 text-white border-0 ${plan.highlight ? 'gradient-primary' : 'bg-emerald-600'}`}>
                              {plan.badge}
                            </Badge>
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute -top-3 right-4">
                            <Badge className="bg-success text-white border-0 font-bold text-[10px] px-3">
                              <CheckCircle className="h-3 w-3 mr-1" /> Ativo
                            </Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 bg-gradient-to-br ${plan.gradient}`}>
                              <Icon className={`h-5 w-5 ${plan.color}`} />
                            </div>
                            <p className="font-black text-base font-['Outfit']">{plan.label}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-2xl font-black font-['Outfit'] ${plan.color}`}>{plan.price}</p>
                            {plan.period && <p className="text-[10px] text-muted-foreground">MT/{plan.period}</p>}
                          </div>
                        </div>
                        <ul className="space-y-1.5">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-start gap-2 text-xs">
                              <CheckCircle className="h-3.5 w-3.5 text-primary mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                          {plan.locked.map(f => (
                            <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground/50 line-through">
                              <X className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                              {f}
                            </li>
                          ))}
                        </ul>
                        {!isActive && plan.id !== 'gratuito' ? (
                          <Button
                            size="sm"
                            className={`w-full h-9 rounded-xl font-bold text-xs border-0 ${
                              plan.highlight
                                ? 'gradient-primary text-white'
                                : plan.id === 'mensal'
                                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                            onClick={() => {
                              setUpgradePlan(plan.id as any);
                              setShowUpgrade(true);
                            }}
                          >
                            Subscrever {plan.label}
                          </Button>
                        ) : isActive ? (
                          <p className="text-center text-xs text-success font-semibold flex items-center justify-center gap-1.5">
                            <CheckCircle className="h-3.5 w-3.5" />
                            {plan.id === 'gratuito' ? 'Plano actual (gratuito)' : 'Plano activo'}
                          </p>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Continue Free CTA */}
                {userData?.plan && userData.plan !== 'gratuito' ? null : (
                  <div className="mt-5 p-4 rounded-2xl border border-dashed border-border/60 bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-center sm:text-left">
                      <p className="font-bold text-sm">Prefere continuar gratis?</p>
                      <p className="text-xs text-muted-foreground">Sem problema! O plano gratuito está sempre disponível.</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-border/60 font-semibold text-xs shrink-0"
                      onClick={() => setShowUpgrade(true)}
                    >
                      Ver comparativo completo
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-destructive/30 shadow-soft rounded-2xl bg-destructive/5">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black font-['Outfit'] flex items-center gap-2 text-destructive">
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
