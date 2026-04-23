import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2, User, Phone, CheckCircle, Leaf, Sparkles, Sprout, AlertTriangle } from 'lucide-react';

const OnboardingModal = () => {
  const { currentUser, userData } = useAuth();
  const [show, setShow] = useState(false);
  const [selectedType, setSelectedType] = useState<'agricultor' | 'proprietario' | 'vendedor' | ''>('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [step, setStep] = useState(1);

  useEffect(() => {
    if (userData?.userType === 'pendente') {
      setShow(true);
    } else {
      setShow(false);
    }
  }, [userData]);

  if (!show) return null;

  const handleSave = async () => {
    if (!selectedType || !currentUser) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        userType: selectedType,
        phone: phone || userData?.phone || ''
      });
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
        
        {/* Background Decorative Element */}
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
              Olá, <span className="font-bold text-foreground">{userData?.name || currentUser?.displayName || 'Agricultor'}</span>! 
              Ficamos felizes por se juntar à maior rede agrícola de Moçambique. 
              Para começar, precisamos de configurar o seu perfil.
            </p>
            <Button 
              onClick={() => setStep(2)} 
              className="w-full h-14 rounded-2xl gradient-primary text-white border-0 font-bold text-lg shadow-medium hover:shadow-strong transition-spring group"
            >
              Vamos Começar <Sparkles className="ml-2 h-5 w-5 group-hover:animate-pulse" />
            </Button>
          </div>
        ) : (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-['Outfit']">Configure o seu perfil</h3>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold">Como pretende usar a plataforma?</Label>
              <div className="grid gap-3">
                {[
                  { id: 'agricultor', label: 'Agricultor Experiente', desc: 'Procuro terra para cultivar e produzir.', icon: Sprout },
                  { id: 'proprietario', label: 'Dono de Terreno', desc: 'Tenho terra disponível para arrendamento.', icon: CheckCircle },
                  { id: 'vendedor', label: 'Vendedor Agrícola', desc: 'Quero vender as minhas colheitas e produtos.', icon: Leaf }
                ].map((type) => (
                  <label 
                    key={type.id}
                    className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedType === type.id 
                        ? 'border-primary bg-primary/5 shadow-soft' 
                        : 'border-border/60 hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="profileType" 
                      className="mt-1 hidden" 
                      onChange={() => setSelectedType(type.id as any)} 
                      checked={selectedType === type.id}
                    />
                    <div className={`p-2 rounded-lg ${selectedType === type.id ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      <type.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-bold text-sm ${selectedType === type.id ? 'text-primary' : 'text-foreground'}`}>{type.label}</p>
                      <p className="text-xs text-muted-foreground">{type.desc}</p>
                    </div>
                    {selectedType === type.id && <CheckCircle className="h-5 w-5 text-primary self-center" />}
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary" /> Telefone (opcional)
              </Label>
              <Input 
                id="phone" 
                placeholder="+258 -- --- ----" 
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
              disabled={!selectedType || saving}
              className="w-full h-14 rounded-2xl gradient-primary text-white border-0 font-bold text-lg shadow-medium disabled:opacity-50 mt-4 transition-spring"
            >
              {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Finalizar Configuracao'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingModal;
