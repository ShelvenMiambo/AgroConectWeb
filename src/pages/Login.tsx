import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import {
  Leaf, Mail, Lock, Eye, EyeOff, User, Phone,
  Loader2, ArrowRight, CheckCircle, ArrowLeft, Send
} from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
const registerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional().or(z.literal('')),
  userType: z.enum(['agricultor', 'proprietario', 'vendedor'], { required_error: 'Selecione um tipo' }),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'As palavras-passe não coincidem',
  path: ['confirmPassword'],
});
const resetSchema = z.object({
  email: z.string().email('Email inválido'),
});

type LoginData    = z.infer<typeof loginSchema>;
type RegisterData = z.infer<typeof registerSchema>;
type ResetData    = z.infer<typeof resetSchema>;
type Mode         = 'login' | 'register' | 'reset';

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
  const { login, register, loginWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();

  const loginForm    = useForm<LoginData>   ({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterData>({ resolver: zodResolver(registerSchema) });
  const resetForm    = useForm<ResetData>   ({ resolver: zodResolver(resetSchema) });

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
    } catch (e: any) { setError(errorMap[e.code] || 'Erro ao entrar. Tente novamente.');
    } finally { setLoading(false); }
  };

  const handleRegister = async (data: RegisterData) => {
    try { clearMessages(); setLoading(true);
      await register(data.email, data.password, data.name, data.phone, data.userType);
      navigate('/');
    } catch (e: any) { setError(errorMap[e.code] || 'Erro ao criar conta. Tente novamente.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    try { clearMessages(); setLoading(true);
      await loginWithGoogle();
      navigate('/');
    } catch (e: any) {
      const msg = errorMap[e.code] || `Erro Google (${e.code || 'desconhecido'}). Tente novamente.`;
      setError(msg);
      console.error('[Google Login Error]', e.code, e.message);
    } finally { setLoading(false); }
  };

  const handleReset = async (data: ResetData) => {
    try { clearMessages(); setLoading(true);
      await resetPassword(data.email);
      setSuccess(`Email enviado para ${data.email}. Verifique a sua caixa de entrada (e spam).`);
      resetForm.reset();
    } catch (e: any) { setError(errorMap[e.code] || 'Erro ao enviar email. Verifique o endereço.');
    } finally { setLoading(false); }
  };

  /* ─────────── Render ─────────── */
  return (
    <div className="min-h-screen flex">

      {/* ══ Left Panel — Animated SVG (hidden on mobile) ══ */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12">
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 900"
          preserveAspectRatio="xMidYMid slice"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="lsky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#060d14" />
              <stop offset="30%"  stopColor="#0f1e3a" />
              <stop offset="60%"  stopColor="#1a1228" />
              <stop offset="75%"  stopColor="#7a2e08" />
              <stop offset="87%"  stopColor="#b05a10" />
              <stop offset="95%"  stopColor="#2d5c1e" />
              <stop offset="100%" stopColor="#0e1f0a" />
            </linearGradient>
            <radialGradient id="lsun" cx="75%" cy="55%" r="40%">
              <stop offset="0%"   stopColor="#fff9c4" stopOpacity="1" />
              <stop offset="25%"  stopColor="#ffd54f" stopOpacity="0.95" />
              <stop offset="55%"  stopColor="#ff8f00" stopOpacity="0.55" />
              <stop offset="85%"  stopColor="#e65100" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#bf360c" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="lmfar" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1a2e4a" />
              <stop offset="100%" stopColor="#0d1e20" />
            </linearGradient>
            <linearGradient id="lmnear" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0d2218" />
              <stop offset="100%" stopColor="#050e06" />
            </linearGradient>
            <linearGradient id="lfield" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#162b10" />
              <stop offset="100%" stopColor="#020502" />
            </linearGradient>
            <filter id="lblur">  <feGaussianBlur stdDeviation="14" /></filter>
            <filter id="lblurSm"><feGaussianBlur stdDeviation="5"  /></filter>
          </defs>

          {/* Sky */}
          <rect width="800" height="900" fill="url(#lsky)" />

          {/* Stars */}
          {[10,45,120,200,280,350,420,520,600,680,750,30,90,160,240,310,390,470,550,630,720,70,140,220,300,370,440].map((x, i) => (
            <circle key={i} cx={x} cy={(i * 37 + 20) % 320} r={1 + (i % 3) * 0.6} fill="#e8f4fc" opacity={0.2 + (i % 4) * 0.1}>
              <animate attributeName="opacity" values={`${0.2 + (i % 4) * 0.1};0.05;${0.2 + (i % 4) * 0.1}`} dur={`${4 + (i % 5)}s`} begin={`${i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* Sun halo */}
          <ellipse cx="600" cy="490" rx="200" ry="150" fill="url(#lsun)" filter="url(#lblur)" opacity="0.8" />
          <circle  cx="600" cy="490" r="35" fill="#fff8c4" filter="url(#lblurSm)" />
          <circle  cx="600" cy="490" r="22" fill="#fffde0" />

          {/* Light rays */}
          {[0,30,60,90,120,150,180,210,240,270,300,330].map((ang, i) => {
            const rad = (ang * Math.PI) / 180;
            return (
              <line key={i} x1="600" y1="490"
                x2={600 + Math.cos(rad) * 280} y2={490 + Math.sin(rad) * 280}
                stroke="#ffd54f" strokeWidth="1.5" opacity={0.03 + (i % 4) * 0.015}>
                <animate attributeName="opacity"
                  values={`${0.03 + (i % 4) * 0.015};${0.07 + (i % 4) * 0.03};${0.03 + (i % 4) * 0.015}`}
                  dur="5s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </line>
            );
          })}

          {/* Mountains */}
          <path d="M-10 580 L60 480 L140 530 L240 440 L340 500 L440 420 L540 470 L640 390 L720 450 L810 400 L810 600 L-10 600Z" fill="url(#lmfar)" opacity="0.9" />
          <path d="M-10 660 L80 560 L180 610 L300 530 L420 590 L540 510 L660 580 L760 530 L810 560 L810 680 L-10 680Z" fill="url(#lmnear)" />

          {/* Baobab */}
          <rect  x="100" y="590" width="14" height="80" fill="#050e06" rx="3" />
          <ellipse cx="107" cy="580" rx="40" ry="20" fill="#060f07" />
          <ellipse cx="78"  cy="588" rx="20" ry="12" fill="#060f07" />
          <ellipse cx="136" cy="585" rx="22" ry="11" fill="#060f07" />
          <ellipse cx="107" cy="564" rx="28" ry="16" fill="#070f07" />

          {/* Small trees */}
          <rect    x="310" y="628" width="6" height="42" fill="#07100a" />
          <ellipse cx="313" cy="622" rx="20" ry="9" fill="#07110a" />
          <rect    x="500" y="632" width="5" height="38" fill="#07100a" />
          <ellipse cx="502" cy="626" rx="17" ry="8" fill="#07110a" />

          {/* Ground */}
          <rect x="0" y="658" width="800" height="242" fill="url(#lfield)" />

          {/* Field rows */}
          {Array.from({ length: 10 }, (_, i) => {
            const t = (i + 1) / 11;
            const y = 658 + t * 242;
            return <line key={i} x1="0" y1={y} x2="800" y2={y} stroke="#4caf50" strokeWidth={0.6 + t * 1.2} opacity={0.05 + t * 0.09} />;
          })}

          {/* Vanishing lines */}
          {[-4, -2, 0, 2, 4].map((s, i) => (
            <line key={i} x1="400" y1="658" x2={400 + s * 300} y2="900" stroke="#388e3c" strokeWidth="0.6" opacity="0.10" />
          ))}

          {/* Moon */}
          <circle cx="110" cy="130" r="24" fill="#e8eaf6" opacity="0.5" filter="url(#lblurSm)" />
          <circle cx="120" cy="124" r="21" fill="#0f1e3a" opacity="0.9" />
        </svg>

        {/* Overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-primary/20 to-black/55" />

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
            Junte-se a 10.000+ agricultores que já transformaram os seus negócios.
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

              {error   && <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm">⚠️ {error}</div>}
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

          {/* ─── LOGIN / REGISTER ─── */}
          {mode !== 'reset' && (
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

              {error && <div className="mb-5 p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm font-medium flex items-start gap-2"><span>⚠️</span>{error}</div>}

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
                    <Label htmlFor="reg-type" className="text-sm font-medium">Perfil de Utilizador</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <select id="reg-type" className="w-full pl-10 pr-3 h-12 rounded-xl border border-border/70 bg-background text-foreground text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring appearance-none" {...registerForm.register('userType')}>
                        <option value="" className="text-muted-foreground">Selecione o seu perfil...</option>
                        <option value="agricultor" className="text-foreground">Agricultor sem terreno (Experiente)</option>
                        <option value="proprietario" className="text-foreground">Dono de Terreno (Sem experiência)</option>
                        <option value="vendedor" className="text-foreground">Vendedor de Produtos Agrícolas</option>
                      </select>
                    </div>
                    {registerForm.formState.errors.userType && <p className="text-xs text-destructive">{registerForm.formState.errors.userType.message}</p>}
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