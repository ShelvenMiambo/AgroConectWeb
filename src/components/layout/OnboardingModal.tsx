import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/features/auth/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Loader2, User, Phone, CheckCircle, Leaf, Sprout, Home, ShoppingBag, Package, AlertTriangle } from 'lucide-react';

const profileOptions = [
  {
    id: 'proprietario',
    label: 'Dono de Terreno',
    desc: 'Tenho terra disponível para arrendar a agricultores.',
    Icon: Home,
  },
  {
    id: 'agricultor',
    label: 'Agricultor',
    desc: 'Tenho experiência agrícola e procuro terra para cultivar.',
    Icon: Sprout,
  },
  {
    id: 'vendedor',
    label: 'Vendedor Agrícola',
    desc: 'Tenho colheitas e produtos agrícolas para vender.',
    Icon: ShoppingBag,
  },
  {
    id: 'comprador',
    label: 'Comprador / Fornecedor',
    desc: 'Procuro produtos agrícolas específicos para adquirir.',
    Icon: Package,
  },
];

const OnboardingModal = () => {
  const { currentUser, userData } = useAuth();
  const [show, setShow] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    setShow(userData?.userType === 'pendente');
  }, [userData]);

  if (!show) return null;

  const handleSave = async () => {
    if (selectedTypes.length === 0 || !currentUser) return;
    setSaving(true);
    setSaveError('');
    try {
      const { error } = await supabase.from('profiles').update({
        user_type: selectedTypes[0],
        user_types: selectedTypes,
        phone: phone || userData?.phone || '',
      }).eq('id', currentUser.uid);
      if (error) throw error;
      window.location.reload();
    } catch (err) {
      console.error('Error updating profile:', err);
      setSaveError('Erro ao gravar o seu perfil. Por favor, tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-lg bg-card border border-border/80 rounded-3xl shadow-strong p-6 md:p-10 fade-in-up relative overflow-hidden">

        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

        {step === 1 ? (
          <div className="relative z-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center shadow-glow mx-auto mb-6 transform -rotate-6">
              <Leaf className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-3xl font-black font-['Outfit'] leading-tight">
              Bem-vindo à <span className="text-gradient-primary">AgroConecta</span>
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Olá, <span className="font-bold text-foreground">{userData?.name || currentUser?.displayName || 'Utilizador'}</span>!{' '}
              Ficamos felizes por se juntar à maior rede agrícola de Moçambique.
              Para começar, precisamos de configurar o seu perfil.
            </p>
            <Button
              onClick={() => setStep(2)}
              className="w-full h-14 rounded-2xl gradient-primary text-white border-0 font-bold text-lg shadow-medium hover:shadow-strong transition-spring"
            >
              Configurar Perfil
            </Button>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Outfit']">Configure o seu perfil</h3>
                <p className="text-xs text-muted-foreground">Como pretende usar a plataforma?</p>
              </div>
            </div>

            <div className="space-y-3">
              {profileOptions.map((opt) => {
                const selected = selectedTypes.includes(opt.id);
                return (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selected
                        ? 'border-primary bg-primary/5 shadow-soft'
                        : 'border-border/60 hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTypes([...selectedTypes, opt.id]);
                        } else {
                          setSelectedTypes(selectedTypes.filter(t => t !== opt.id));
                        }
                      }}
                      checked={selected}
                    />
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                      selected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                    }`}>
                      <opt.Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${selected ? 'text-primary' : 'text-foreground'}`}>{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.desc}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                      selected ? 'border-primary bg-primary' : 'border-border'
                    }`}>
                      {selected && <CheckCircle className="h-3 w-3 text-white" />}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ob-phone" className="text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Telefone <span className="text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Input
                id="ob-phone"
                placeholder="+258 8X XXX XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="h-12 rounded-xl border-border/70 focus:border-primary/50"
              />
            </div>

            {saveError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />{saveError}
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={selectedTypes.length === 0 || saving}
              className="w-full h-14 rounded-2xl gradient-primary text-white border-0 font-bold text-lg shadow-medium disabled:opacity-50 mt-4 transition-spring"
            >
              {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                <><CheckCircle className="h-5 w-5 mr-2" /> Finalizar Configuração</>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
