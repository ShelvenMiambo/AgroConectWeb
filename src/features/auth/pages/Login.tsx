import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  Leaf, Mail, Lock, Eye, EyeOff, User, Phone,
  Loader2, ArrowRight, CheckCircle, ArrowLeft, Send, AlertTriangle,
  Sprout, Home, ShoppingBag, Package
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email invalido'),
  phone: z.string().optional().or(z.literal('')),
  userTypes: z.array(z.string({ required_error: 'Selecione pelo menos um perfil' }))
    .min(1, 'Selecione pelo menos um perfil'),
  password: z.string().min(6, 'Minimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As palavras-passe nao coincidem',
  path: ['confirmPassword'],
});
const resetSchema = z.object({
  email: z.string().email('Email inválido'),
});
const updateSchema = z.object({
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As palavras-passe não coincidem',
  path: ['confirmPassword'],
});

type LoginData    = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type ResetData    = z.infer<typeof resetSchema>;
type UpdateData   = z.infer<typeof updateSchema>;
type Mode         = 'login' | 'register' | 'reset' | 'update';

const perks = [
  'Marketplace de terras em todo Moçambique',
  'Assistente IA agrícola em 4 idiomas',
  'Gestão inteligente de produção',
  'Contratos digitais seguros',
];

const errorMap: Record<string, string> = {
  'auth/invalid-credential':     'Email ou palavra-passe incorretos.',
  'auth/user-not-found':         'Nenhuma conta com este email.',
  'auth/wrong-password':         'Palavra-passe incorreta.',
  'auth/too-many-requests':      'Muitas tentativas. Aguarde alguns minutos.',
  'auth/email-already-in-use':   'Este email já está registado.',
  'auth/weak-password':          'Palavra-passe demasiado fraca.',
  'auth/network-request-failed': 'Verifique a sua ligação à internet.',
  'auth/popup-closed-by-user':   'A janela do Google foi fechada. Tente novamente.',
  'auth/popup-blocked':          'Popup bloqueado. Permita pop-ups para este site.',
  'auth/cancelled-popup-request':'A operação foi cancelada. Tente novamente.',
  'auth/unauthorized-domain':    'Domínio não autorizado. Contacte o administrador.',
  'auth/operation-not-allowed':  'Login com Google não está ativado.',
};

const Login = () => {
  const [mode, setMode]           = useState<Mode>('login');
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [loading, setLoading]     = useState(false);
  const { login, register, loginWithGoogle, resetPassword, updatePassword, recoveryMode, clearRecovery } = useAuth();
  const navigate = useNavigate();

  const loginForm    = useForm<LoginData>   ({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });
  const resetForm    = useForm<ResetData>   ({ resolver: zodResolver(resetSchema) });
  const updateForm   = useForm<UpdateData>  ({ resolver: zodResolver(updateSchema) });

  // Quando o utilizador chega pelo link de recuperação, mostra o ecrã de nova senha.
  useEffect(() => { if (recoveryMode) setMode('update'); }, [recoveryMode]);

  const handleUpdate = async (data: UpdateData) => {
    try { clearMessages(); setLoading(true);
      await updatePassword(data.password);
      setSuccess('Palavra-passe alterada com sucesso. Já pode usá-la para entrar.');
      updateForm.reset();
      setTimeout(() => { setMode('login'); setSuccess(''); }, 2500);
    } catch (e: any) { setError(e.message || 'Erro ao alterar a palavra-passe.');
    } finally { setLoading(false); }
  };

  const clearMessages = () => { setError(''); setSuccess(''); };

  const switchMode = (m: Mode) => {
    clearMessages();
    loginForm.reset(); registerForm.reset(); resetForm.reset();
    setMode(m);
  };

  const handleLogin = async (data: LoginData) => {
    try { clearMessages(); setLoading(true);
      await login(data.email, data.password);
      navigate('/');
    } catch (e: any) { setError(e.message || 'Erro ao entrar. Tente novamente.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (data: RegisterData) => {
    try { clearMessages(); setLoading(true);
      await register(data.email, data.password, data.name, data.phone, data.userTypes[0], data.userTypes);
      navigate('/');
    } catch (e: any) { setError(e.message || 'Erro ao criar conta. Tente novamente.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try { clearMessages(); setLoading(true);
      await loginWithGoogle();
      // O OAuth do Google redireciona; o navigate fica como fallback.
    } catch (e: any) {
      setError(e.message || 'Erro ao entrar com Google. Tente novamente.');
      console.error('[Google Login Error]', e.message);
    } finally { setLoading(false); }
  };

  const handleReset = async (data: ResetData) => {
    try { clearMessages(); setLoading(true);
      await resetPassword(data.email);
      setSuccess(`Email enviado para ${data.email}. Verifique a sua caixa de entrada (e spam).`);
      resetForm.reset();
    } catch (e: any) { setError(e.message || 'Erro ao enviar email. Verifique o endereço.');
    } finally { setLoading(false); }
  };

  /* ─────────── Render ─────────── */
  return (
    <div className="min-h-screen flex">

      {/* ══ Painel esquerdo — fotografia (escondido em telemóvel) ══ */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12">
        <img
          src="/images/login-campo.webp"
          alt="Agricultora com a colheita, em Moçambique"
          className="absolute inset-0 h-full w-full object-cover"
          decoding="async"
        />

        {/* Escurecimento para o texto ser legível */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/35" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <span className="text-white font-black font-['Outfit']">AC</span>
            </div>
            <div>
              <p className="text-lg font-black text-white font-['Outfit']">AgroConecta</p>
              <p className="text-xs text-white/60 tracking-widest uppercase">Moçambique</p>
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white font-['Outfit'] mb-4 leading-tight">
            Cultive o seu<br /><span className="text-gradient-gold">futuro digital</span>
          </h2>
          <p className="text-white/75 text-base mb-8 leading-relaxed max-w-xs">
            A plataforma que liga agricultores, donos de terra e compradores em Moçambique.
          </p>
          <ul className="space-y-3">
            {perks.map(perk => (
              <li key={perk} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-white" />
                </div>
                <span className="text-sm text-white/85">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-white/40 text-xs">
          © 2026 AgroConecta · Feito em Moçambique
        </p>
      </div>

      {/* ══ Right Panel — Form ══ */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 bg-background min-h-screen">

        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link to="/" className="flex items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-medium">
              <span className="text-white font-black font-['Outfit']">AC</span>
            </div>
            <span className="text-xl font-black text-primary font-['Outfit']">AgroConecta</span>
          </Link>
        </div>

        <div className="w-full max-w-[400px]">

          {/* ─── RESET PASSWORD ─── */}
          {mode === 'reset' && (
            <>
              <button onClick={() => switchMode('login')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Voltar ao login
              </button>
              <div className="mb-8">
                <h1 className="text-3xl font-black font-['Outfit'] mb-2">Recuperar senha</h1>
                <p className="text-muted-foreground text-sm">
                  Introduza o seu email e enviamos um link para redefinir a sua palavra-passe.
                </p>
              </div>

              {error && <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}</div>}
              {success && <div className="mb-4 p-4 rounded-xl bg-success/10 border border-success/25 text-success text-sm flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0"/>{success}</div>}

              <form onSubmit={resetForm.handleSubmit(handleReset)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="reset-email" type="email" placeholder="o.seu@email.com" className="pl-10 h-12 rounded-xl border-border/70" {...resetForm.register('email')} />
                  </div>
                  {resetForm.formState.errors.email && <p className="text-xs text-destructive">{resetForm.formState.errors.email.message}</p>}
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-semibold shadow-medium hover:-translate-y-0.5 transition-spring">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Send className="h-4 w-4 mr-2" /> Enviar email de recuperação</>}
                </Button>
              </form>
            </>
          )}

          {/* ─── DEFINIR NOVA SENHA (vindo do link de recuperação) ─── */}
          {mode === 'update' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black font-['Outfit'] mb-2">Definir nova palavra-passe</h1>
                <p className="text-muted-foreground text-sm">
                  Escolha uma nova palavra-passe para a sua conta.
                </p>
              </div>

              {error && <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}</div>}
              {success && <div className="mb-4 p-4 rounded-xl bg-success/10 border border-success/25 text-success text-sm flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0"/>{success}</div>}

              <form onSubmit={updateForm.handleSubmit(handleUpdate)} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="upd-pass" className="text-sm font-medium">Nova palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="upd-pass" type={showPass ? 'text' : 'password'} placeholder="Min. 6 caracteres" className="pl-10 pr-10 h-12 rounded-xl border-border/70" {...updateForm.register('password')} />
                    <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {updateForm.formState.errors.password && <p className="text-xs text-destructive">{updateForm.formState.errors.password.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="upd-confirm" className="text-sm font-medium">Repetir palavra-passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="upd-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Repetir" className="pl-10 pr-10 h-12 rounded-xl border-border/70" {...updateForm.register('confirmPassword')} />
                    <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {updateForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{updateForm.formState.errors.confirmPassword.message}</p>}
                </div>
                <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground border-0 font-semibold transition-colors">
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar nova palavra-passe'}
                </Button>
              </form>
            </>
          )}

          {/* ─── LOGIN / REGISTER ─── */}
          {mode !== 'reset' && mode !== 'update' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black font-['Outfit'] mb-2">
                  {mode === 'login' ? 'Bem-vindo de volta' : 'Criar conta gratuita'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {mode === 'login'
                    ? 'Entre na sua conta AgroConecta para continuar.'
                    : 'Registe-se e comece a explorar o futuro da agricultura.'}
                </p>
              </div>

              {error && <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm font-medium flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />{error}</div>}

              {/* Google */}
              <Button type="button" variant="outline" className="w-full h-12 rounded-xl font-semibold mb-5 gap-3 border-border/70 hover:bg-muted transition-spring" onClick={handleGoogle} disabled={loading}>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continuar com Google
              </Button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border/50" /></div>
                <div className="relative flex justify-center text-xs"><span className="bg-background px-3 text-muted-foreground">ou com email</span></div>
              </div>

              {/* LOGIN FORM */}
              {mode === 'login' && (
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="o.seu@email.com" className="pl-10 h-12 rounded-xl border-border/70" {...loginForm.register('email')} />
                    </div>
                    {loginForm.formState.errors.email && <p className="text-xs text-destructive">{loginForm.formState.errors.email.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="login-pass" className="text-sm font-medium">Palavra-passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-pass" type={showPass ? 'text' : 'password'} placeholder="••••••" className="pl-10 pr-10 h-12 rounded-xl border-border/70" {...loginForm.register('password')} />
                      <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPass(!showPass)}>
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {loginForm.formState.errors.password && <p className="text-xs text-destructive">{loginForm.formState.errors.password.message}</p>}
                  </div>

                  {/* Esqueceu? — below password field, own row */}
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="text-xs text-primary hover:underline font-medium -mt-1 text-left"
                  >
                    Esqueceu a palavra-passe?
                  </button>

                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-semibold text-base shadow-medium hover:-translate-y-0.5 hover:shadow-strong transition-spring">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Entrar <ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>
              )}

              {/* REGISTER FORM */}
              {mode === 'register' && (
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-name" className="text-sm font-medium">Nome completo</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-name" placeholder="João Machava" className="pl-10 h-12 rounded-xl border-border/70" {...registerForm.register('name')} />
                    </div>
                    {registerForm.formState.errors.name && <p className="text-xs text-destructive">{registerForm.formState.errors.name.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-email" className="text-sm font-medium">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-email" type="email" placeholder="o.seu@email.com" className="pl-10 h-12 rounded-xl border-border/70" {...registerForm.register('email')} />
                    </div>
                    {registerForm.formState.errors.email && <p className="text-xs text-destructive">{registerForm.formState.errors.email.message}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reg-phone" className="text-sm font-medium">Telefone <span className="text-muted-foreground">(opcional)</span></Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="reg-phone" placeholder="+258 84 000 0000" className="pl-10 h-12 rounded-xl border-border/70" {...registerForm.register('phone')} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Perfis de Utilizador <span className="text-muted-foreground">(Pode selecionar vários)</span></Label>
                    <div className="grid gap-2">
                      {[
                        { value: 'proprietario', label: 'Dono de Terreno',        sub: 'Tenho terra disponível para arrendar',      Icon: Home },
                        { value: 'agricultor',   label: 'Agricultor',              sub: 'Tenho experiência e procuro terra para cultivar', Icon: Sprout },
                        { value: 'vendedor',     label: 'Vendedor Agrícola',       sub: 'Tenho colheitas e produtos para vender',    Icon: ShoppingBag },
                        { value: 'comprador',    label: 'Comprador / Fornecedor',  sub: 'Procuro produtos agrícolas específicos',    Icon: Package },
                      ].map(opt => {
                        const currentTypes = registerForm.watch('userTypes') || [];
                        const selected = currentTypes.includes(opt.value);
                        return (
                          <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${selected ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40 hover:bg-muted/40'}`}>
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              value={opt.value} 
                              checked={selected}
                              onChange={(e) => {
                                const newTypes = e.target.checked 
                                  ? [...currentTypes, opt.value]
                                  : currentTypes.filter(t => t !== opt.value);
                                registerForm.setValue('userTypes', newTypes, { shouldValidate: true });
                              }}
                            />
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                              <opt.Icon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold leading-tight ${selected ? 'text-primary' : ''}`}>{opt.label}</p>
                              <p className="text-xs text-muted-foreground">{opt.sub}</p>
                            </div>
                            <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center transition-all ${selected ? 'border-primary bg-primary' : 'border-border'}`}>
                              {selected && <CheckCircle className="h-3 w-3 text-white" />}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    {registerForm.formState.errors.userTypes && <p className="text-xs text-destructive">{registerForm.formState.errors.userTypes.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-pass" className="text-sm font-medium">Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="reg-pass" type={showPass ? 'text' : 'password'} placeholder="Min. 6" className="pl-9 pr-9 h-12 rounded-xl border-border/70" {...registerForm.register('password')} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPass(!showPass)}>
                          {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && <p className="text-xs text-destructive">{registerForm.formState.errors.password.message}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm" className="text-sm font-medium">Confirmar</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="reg-confirm" type={showConfirm ? 'text' : 'password'} placeholder="Repetir" className="pl-9 pr-9 h-12 rounded-xl border-border/70" {...registerForm.register('confirmPassword')} />
                        <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm(!showConfirm)}>
                          {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && <p className="text-xs text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ao registar-se aceita os nossos <a href="#" className="text-primary hover:underline">Termos</a> e <a href="#" className="text-primary hover:underline">Política de Privacidade</a>.
                  </p>
                  <Button type="submit" disabled={loading} className="w-full h-12 rounded-xl gradient-primary text-white border-0 font-semibold text-base shadow-medium hover:-translate-y-0.5 hover:shadow-strong transition-spring">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Criar Conta <Leaf className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>
              )}

              <p className="text-center text-sm text-muted-foreground mt-6">
                {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}
                {' '}
                <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="text-primary font-semibold hover:underline">
                  {mode === 'login' ? 'Criar conta grátis' : 'Entrar'}
                </button>
              </p>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-border/50">
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;