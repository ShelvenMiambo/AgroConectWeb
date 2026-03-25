import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Handshake, FileText, Shield, CreditCard, MessageSquare, Eye,
  Plus, Clock, CheckCircle, AlertCircle, DollarSign, Calendar,
  User, MapPin, X, ChevronRight, TrendingUp, ArrowLeft
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const mockContratos = [
  { id: 1, tipo: 'Arrendamento de Terra', propriedade: 'Quinta da Esperança', contraparte: 'João Machava',    valor: '15.000 MT/mês', status: 'Ativo',                dataInicio: '2025-10-01', dataFim: '2026-09-30', progresso: 25, proximoPagamento: '2026-04-01', assinado: true,  icon: '🏞️' },
  { id: 2, tipo: 'Venda de Produção',     produto:    'Milho — 500kg',        contraparte: 'Maria Santos',    valor: '25.000 MT',     status: 'Pendente Assinatura', dataInicio: '2026-04-01', dataFim: '2026-04-15', progresso: 60, proximoPagamento: 'Aguardando assinatura', assinado: false, icon: '🌽' },
  { id: 3, tipo: 'Parceria Agrícola',     propriedade: 'Campos do Sul',       contraparte: 'António Mucavel', valor: '30% da produção', status: 'Em Negociação',    dataInicio: '2026-05-01', dataFim: '2026-12-31', progresso: 40, proximoPagamento: 'A definir', assinado: false, icon: '🤝' },
];

const mockTransacoes = [
  { id: 1, tipo: 'Recebimento', descricao: 'Arrendamento — Quinta da Esperança', valor: 15000,  data: '2026-03-01', status: 'Concluído',   metodo: 'M-Pesa',   referencia: 'MP20260301' },
  { id: 2, tipo: 'Pagamento',   descricao: 'Comissão da plataforma',             valor: -750,   data: '2026-03-01', status: 'Concluído',   metodo: 'Automático',referencia: 'COM20260301' },
  { id: 3, tipo: 'Recebimento', descricao: 'Venda de milho',                     valor: 25000,  data: '2026-02-28', status: 'Processando', metodo: 'eMola',    referencia: 'EM20260228' },
];

const statusConfig: Record<string, { bg: string; text: string }> = {
  'Ativo':                { bg: 'bg-success/15',     text: 'text-success' },
  'Pendente Assinatura':  { bg: 'bg-warning/15',     text: 'text-warning' },
  'Em Negociação':        { bg: 'bg-primary/15',     text: 'text-primary' },
  'Expirado':             { bg: 'bg-destructive/15', text: 'text-destructive' },
  'Concluído':            { bg: 'bg-muted',          text: 'text-muted-foreground' },
};

const CONTRACT_TYPES = [
  { icon: '🏞️', title: 'Arrendamento de Terra',  desc: 'Arrende a sua ou outra propriedade agrícola' },
  { icon: '🤝', title: 'Parceria Agrícola',       desc: 'Cultivo conjunto com partilha de recursos' },
  { icon: '💰', title: 'Venda de Produção',        desc: 'Venda os seus produtos com contratos seguros' },
];

// New Contract Modal
const NewContractModal = ({ onClose }: { onClose: () => void }) => {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [form, setForm] = useState({ contraparte: '', valor: '', dataInicio: '', dataFim: '', notas: '' });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <Card className="relative w-full max-w-md shadow-strong rounded-2xl border-border/60 fade-in-up max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4 sticky top-0 bg-card border-b border-border/60 z-10">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="font-['Outfit']">Novo Contrato</CardTitle>
              <CardDescription>Passo {step} de 3</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <Progress value={(step / 3) * 100} className="h-1 mt-3" />
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {step === 1 && (
            <>
              <p className="text-sm font-semibold text-muted-foreground">Selecione o tipo de contrato</p>
              <div className="space-y-3">
                {CONTRACT_TYPES.map(ct => (
                  <button
                    key={ct.title}
                    onClick={() => setSelectedType(ct.title)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${selectedType === ct.title ? 'border-primary bg-primary/5' : 'border-border/60 hover:border-primary/40'}`}
                  >
                    <span className="text-3xl">{ct.icon}</span>
                    <div>
                      <p className="font-semibold text-sm">{ct.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{ct.desc}</p>
                    </div>
                    {selectedType === ct.title && <CheckCircle className="h-5 w-5 text-primary ml-auto flex-shrink-0" />}
                  </button>
                ))}
              </div>
              <Button className="w-full h-11 rounded-xl gradient-primary text-white border-0 font-semibold" disabled={!selectedType} onClick={() => setStep(2)}>
                Continuar <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </>
          )}
          {step === 2 && (
            <>
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 flex items-center gap-3">
                <span className="text-2xl">{CONTRACT_TYPES.find(c => c.title === selectedType)?.icon}</span>
                <p className="font-semibold text-sm">{selectedType}</p>
              </div>
              {[
                { key: 'contraparte', label: 'Nome da Contraparte', placeholder: 'Ex: João Machava' },
                { key: 'valor',       label: 'Valor / Termos',      placeholder: 'Ex: 15.000 MT/mês ou 30% produção' },
              ].map(f => (
                <div key={f.key} className="space-y-1">
                  <label className="text-sm font-medium">{f.label} *</label>
                  <Input placeholder={f.placeholder} value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} className="rounded-xl" />
                </div>
              ))}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(1)}>Voltar</Button>
                <Button className="flex-1 h-11 rounded-xl gradient-primary text-white border-0 font-semibold" disabled={!form.contraparte || !form.valor} onClick={() => setStep(3)}>
                  Continuar <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data de Início *</label>
                <Input type="date" value={form.dataInicio} onChange={e => set('dataInicio', e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Data de Fim *</label>
                <Input type="date" value={form.dataFim} onChange={e => set('dataFim', e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Notas adicionais</label>
                <textarea
                  placeholder="Condições especiais, observações..."
                  className="w-full rounded-xl border border-border/70 bg-background px-3 py-2 text-sm resize-none h-20 focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.notas}
                  onChange={e => set('notas', e.target.value)}
                />
              </div>
              <div className="p-4 rounded-xl bg-success/8 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-success" />
                  <p className="text-sm font-semibold text-success">Contrato Seguro</p>
                </div>
                <p className="text-xs text-muted-foreground">Assinatura digital com validade legal · Pagamentos protegidos · Suporte 24/7</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setStep(2)}>Voltar</Button>
                <Button className="flex-1 h-11 rounded-xl gradient-primary text-white border-0 font-semibold" disabled={!form.dataInicio || !form.dataFim} onClick={onClose}>
                  <FileText className="mr-2 h-4 w-4" /> Criar Contrato
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const Negociacoes = () => {
  const [activeTab, setActiveTab] = useState<'contratos' | 'transacoes'>('contratos');
  const [selectedContrato, setSelectedContrato] = useState<any>(null);
  const [showNewContract, setShowNewContract] = useState(false);

  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-MZ', { style: 'currency', currency: 'MZN' }).format(Math.abs(v));

  const statsCards = [
    { label: 'Contratos Ativos',  value: '1', icon: FileText,    color: 'text-primary',  bg: 'bg-primary/10' },
    { label: 'Em Negociação',     value: '2', icon: Clock,       color: 'text-warning',  bg: 'bg-warning/10' },
    { label: 'Total Recebido',    value: '40K MT', icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Transações',        value: '12', icon: CreditCard, color: 'text-accent',   bg: 'bg-accent/10' },
  ];

  // Contract Detail
  if (selectedContrato) {
    const c = selectedContrato;
    const sc = statusConfig[c.status] || { bg: 'bg-muted', text: 'text-muted-foreground' };
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
          <Button variant="ghost" className="mb-6 -ml-2 gap-2" onClick={() => setSelectedContrato(null)}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <Card className="border-border/60 shadow-medium rounded-2xl overflow-hidden">
            <div className="h-2 gradient-earth" />
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{c.icon}</span>
                  <div>
                    <CardTitle className="font-['Outfit'] text-xl">{c.tipo}</CardTitle>
                    <CardDescription className="text-base mt-0.5">{c.propriedade || c.produto}</CardDescription>
                  </div>
                </div>
                <Badge className={`${sc.bg} ${sc.text} border-0 flex-shrink-0`}>{c.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: User,      label: 'Contraparte',      value: c.contraparte },
                  { icon: DollarSign,label: 'Valor',            value: c.valor,       primary: true },
                  { icon: Calendar,  label: 'Período',          value: `${new Date(c.dataInicio).toLocaleDateString('pt-MZ')} — ${new Date(c.dataFim).toLocaleDateString('pt-MZ')}` },
                  { icon: Clock,     label: 'Próximo pagamento',value: c.proximoPagamento },
                ].map(({ icon: Icon, label, value, primary }) => (
                  <div key={label} className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border border-border/60">
                    <Icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className={`font-semibold text-sm truncate ${primary ? 'text-primary' : ''}`}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-muted/40 border border-border/60">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Progresso do Contrato</span>
                  <span className="text-primary font-bold">{c.progresso}%</span>
                </div>
                <Progress value={c.progresso} className="h-2" />
              </div>

              <div className="flex items-center gap-3 p-4 rounded-xl border border-border/60">
                {c.assinado
                  ? <CheckCircle className="h-5 w-5 text-success" />
                  : <AlertCircle className="h-5 w-5 text-warning" />
                }
                <div>
                  <p className="font-semibold text-sm">{c.assinado ? 'Assinado digitalmente' : 'Aguardando assinatura'}</p>
                  <p className="text-xs text-muted-foreground">Status da assinatura</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button className="flex-1 gradient-primary text-white border-0 rounded-xl font-semibold">
                  <MessageSquare className="h-4 w-4 mr-2" /> Contactar
                </Button>
                {!c.assinado && (
                  <Button variant="outline" className="flex-1 rounded-xl">
                    <FileText className="h-4 w-4 mr-2" /> Assinar
                  </Button>
                )}
                <Button variant="outline" className="rounded-xl">
                  <Eye className="h-4 w-4 mr-2" /> Documento
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {showNewContract && <NewContractModal onClose={() => setShowNewContract(false)} />}
      <Header />
      <main>
        {/* Page Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-warning/8 via-background to-accent/5 border-b border-border/60 py-12">
          <div className="absolute inset-0 dot-pattern opacity-40" />
          <div className="relative container mx-auto px-4 lg:px-8 text-center">
            <div className="inline-flex p-3.5 rounded-2xl gradient-earth mb-5 shadow-medium">
              <Handshake className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black mb-3 font-['Outfit']">
              <span className="text-gradient-primary">Negociações</span> Seguras
            </h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Contratos digitais, pagamentos e transações seguras com outros utilizadores.
            </p>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {statsCards.map(({ label, value, icon: Icon, color, bg }, i) => (
              <Card key={i} className={`border-border/60 shadow-xs fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                      <p className={`text-xl font-black font-['Outfit'] ${color}`}>{value}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl ${bg}`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs + New Contract */}
          <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
            <div className="flex gap-1 p-1 bg-muted/60 rounded-xl border border-border/60">
              {[
                { key: 'contratos',  label: 'Contratos',  icon: FileText },
                { key: 'transacoes', label: 'Transações', icon: CreditCard },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    activeTab === key ? 'bg-background text-primary shadow-soft' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
            <Button className="gradient-primary text-white border-0 rounded-xl gap-2 font-semibold shadow-soft" onClick={() => setShowNewContract(true)}>
              <Plus className="h-4 w-4" /> Novo Contrato
            </Button>
          </div>

          {/* ── CONTRATOS ── */}
          {activeTab === 'contratos' && (
            <div className="space-y-4">
              {mockContratos.map((c, i) => {
                const sc = statusConfig[c.status] || { bg: 'bg-muted', text: 'text-muted-foreground' };
                return (
                  <Card
                    key={c.id}
                    className={`border-border/60 shadow-xs card-hover cursor-pointer rounded-2xl overflow-hidden fade-in-up`}
                    style={{ animationDelay: `${i * 80}ms` }}
                    onClick={() => setSelectedContrato(c)}
                  >
                    <CardContent className="p-5 sm:p-6">
                      <div className="flex items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{c.icon}</span>
                          <div>
                            <h3 className="font-bold font-['Outfit']">{c.tipo}</h3>
                            <p className="text-sm text-muted-foreground">{c.propriedade || c.produto}</p>
                          </div>
                        </div>
                        <Badge className={`${sc.bg} ${sc.text} border-0 flex-shrink-0 text-xs`}>{c.status}</Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-4">
                        {[
                          { label: 'Contraparte',  value: c.contraparte },
                          { label: 'Valor',        value: c.valor, primary: true },
                          { label: 'Validade',     value: `${new Date(c.dataFim).toLocaleDateString('pt-MZ')}` },
                          { label: 'Próx. Pag.',   value: c.proximoPagamento },
                        ].map(({ label, value, primary }) => (
                          <div key={label}>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className={`font-semibold truncate ${primary ? 'text-primary' : ''}`}>{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progresso</span><span className="font-semibold text-primary">{c.progresso}%</span>
                        </div>
                        <Progress value={c.progresso} className="h-1.5" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* ── TRANSACOES ── */}
          {activeTab === 'transacoes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-2xl font-black font-['Outfit']">Transações</h2>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Saldo disponível</p>
                  <p className="text-xl font-black text-primary font-['Outfit']">39.250 MT</p>
                </div>
              </div>
              {mockTransacoes.map((t, i) => {
                const isReceipt = t.tipo === 'Recebimento';
                return (
                  <Card key={t.id} className={`border-border/60 shadow-xs rounded-2xl fade-in-up`} style={{ animationDelay: `${i * 80}ms` }}>
                    <CardContent className="p-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isReceipt ? 'bg-success/15' : 'bg-destructive/15'}`}>
                          <DollarSign className={`h-5 w-5 ${isReceipt ? 'text-success' : 'text-destructive'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{t.descricao}</p>
                          <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground mt-0.5">
                            <span>{new Date(t.data).toLocaleDateString('pt-MZ')}</span>
                            <span>via {t.metodo}</span>
                            <span className="font-mono">{t.referencia}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-lg font-black font-['Outfit'] ${isReceipt ? 'text-success' : 'text-destructive'}`}>
                            {isReceipt ? '+' : '-'}{formatCurrency(t.valor)}
                          </p>
                          <Badge variant={t.status === 'Concluído' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                            {t.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Negociacoes;