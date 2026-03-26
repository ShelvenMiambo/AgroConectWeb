import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Handshake,
    FileText,
    Shield,
    CreditCard,
    MessageSquare,
    Eye,
    Plus,
    Clock,
    CheckCircle,
    AlertCircle,
    DollarSign,
    Calendar,
    User,
    MapPin
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Mock data para contratos e transações
const mockContratos = [
    {
        id: 1,
        tipo: 'Arrendamento de Terra',
        propriedade: 'Quinta da Esperança',
        contraparte: 'João Machava',
        valor: '15.000 MT/mês',
        status: 'Ativo',
        dataInicio: '2024-10-01',
        dataFim: '2025-09-30',
        progresso: 25,
        proximoPagamento: '2024-12-01',
        assinado: true
    },
    {
        id: 2,
        tipo: 'Venda de Produção',
        produto: 'Milho - 500kg',
        contraparte: 'Maria Santos',
        valor: '25.000 MT',
        status: 'Pendente Assinatura',
        dataInicio: '2024-12-01',
        dataFim: '2024-12-15',
        progresso: 60,
        proximoPagamento: 'Aguardando assinatura',
        assinado: false
    },
    {
        id: 3,
        tipo: 'Parceria Agrícola',
        propriedade: 'Campos do Sul',
        contraparte: 'António Mucavel',
        valor: '30% da produção',
        status: 'Em Negociação',
        dataInicio: '2025-01-01',
        dataFim: '2025-12-31',
        progresso: 40,
        proximoPagamento: 'A definir',
        assinado: false
    }
];

const mockTransacoes = [
    {
        id: 1,
        tipo: 'Recebimento',
        descricao: 'Arrendamento - Quinta da Esperança',
        valor: 15000,
        data: '2024-11-01',
        status: 'Concluído',
        metodo: 'M-Pesa',
        referencia: 'MP2024110112345'
    },
    {
        id: 2,
        tipo: 'Pagamento',
        descricao: 'Comissão da plataforma',
        valor: -750,
        data: '2024-11-01',
        status: 'Concluído',
        metodo: 'Automático',
        referencia: 'COM2024110112345'
    },
    {
        id: 3,
        tipo: 'Recebimento',
        descricao: 'Venda de milho',
        valor: 25000,
        data: '2024-10-28',
        status: 'Processando',
        metodo: 'eMola',
        referencia: 'EM2024102812345'
    }
];

const Negociacoes = () => {
    const [activeTab, setActiveTab] = useState<'contratos' | 'transacoes' | 'criar'>('contratos');
    const [selectedContrato, setSelectedContrato] = useState<any>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Ativo': return 'bg-green-500 text-white';
            case 'Pendente Assinatura': return 'bg-yellow-500 text-white';
            case 'Em Negociação': return 'bg-blue-500 text-white';
            case 'Expirado': return 'bg-red-500 text-white';
            case 'Concluído': return 'bg-gray-500 text-white';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    const getTransactionColor = (tipo: string) => {
        return tipo === 'Recebimento' ? 'text-green-600' : 'text-red-600';
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-MZ', {
            style: 'currency',
            currency: 'MZN'
        }).format(Math.abs(value));
    };

    const renderContractDetails = (contrato: any) => (
        <Card className="border-border/50">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">{contrato.tipo}</CardTitle>
                        <CardDescription className="text-base mt-1">
                            {contrato.propriedade || contrato.produto}
                        </CardDescription>
                    </div>
                    <Badge className={getStatusColor(contrato.status)}>
                        {contrato.status}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Contract Info */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                            <User className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{contrato.contraparte}</p>
                                <p className="text-sm text-muted-foreground">Contraparte</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold text-primary">{contrato.valor}</p>
                                <p className="text-sm text-muted-foreground">Valor do contrato</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">
                                    {new Date(contrato.dataInicio).toLocaleDateString('pt-MZ')} - {new Date(contrato.dataFim).toLocaleDateString('pt-MZ')}
                                </p>
                                <p className="text-sm text-muted-foreground">Período do contrato</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium">Progresso do Contrato</span>
                                <span className="text-sm text-muted-foreground">{contrato.progresso}%</span>
                            </div>
                            <Progress value={contrato.progresso} className="h-2" />
                        </div>

                        <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">{contrato.proximoPagamento}</p>
                                <p className="text-sm text-muted-foreground">Próximo pagamento</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            {contrato.assinado ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                            <div>
                                <p className="font-semibold">
                                    {contrato.assinado ? 'Assinado digitalmente' : 'Aguardando assinatura'}
                                </p>
                                <p className="text-sm text-muted-foreground">Status da assinatura</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button className="flex-1">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Contactar Contraparte
                    </Button>
                    {!contrato.assinado && (
                        <Button variant="outline" className="flex-1">
                            <FileText className="h-4 w-4 mr-2" />
                            Assinar Contrato
                        </Button>
                    )}
                    <Button variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Documento
                    </Button>
                </div>
            </CardContent>
        </Card>
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 rounded-xl gradient-earth shadow-medium">
                            <Handshake className="h-8 w-8 text-primary-foreground" />
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        <span className="text-primary">Negociações</span> Seguras
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Crie contratos digitais, gerencie pagamentos e faça transações seguras
                        com outros utilizadores da plataforma.
                    </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Contratos Ativos</p>
                                    <p className="text-2xl font-bold text-primary">1</p>
                                </div>
                                <FileText className="h-8 w-8 text-primary" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Em Negociação</p>
                                    <p className="text-2xl font-bold text-warning">2</p>
                                </div>
                                <Clock className="h-8 w-8 text-warning" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Recebido</p>
                                    <p className="text-2xl font-bold text-success">40.000 MT</p>
                                </div>
                                <DollarSign className="h-8 w-8 text-success" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Transações</p>
                                    <p className="text-2xl font-bold text-accent">12</p>
                                </div>
                                <CreditCard className="h-8 w-8 text-accent" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {[
                        { key: 'contratos', label: 'Meus Contratos', icon: FileText },
                        { key: 'transacoes', label: 'Transações', icon: CreditCard },
                        { key: 'criar', label: 'Criar Contrato', icon: Plus }
                    ].map(({ key, label, icon: Icon }) => (
                        <Button
                            key={key}
                            variant={activeTab === key ? "default" : "outline"}
                            onClick={() => setActiveTab(key as any)}
                            className="flex items-center space-x-2"
                        >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </Button>
                    ))}
                </div>

                {/* Content */}
                {activeTab === 'contratos' && (
                    <div className="space-y-6">
                        {selectedContrato ? (
                            <div>
                                <Button
                                    variant="ghost"
                                    className="mb-6"
                                    onClick={() => setSelectedContrato(null)}
                                >
                                    ← Voltar aos Contratos
                                </Button>
                                {renderContractDetails(selectedContrato)}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {mockContratos.map((contrato) => (
                                    <Card
                                        key={contrato.id}
                                        className="border-border/50 hover:shadow-medium transition-spring cursor-pointer"
                                        onClick={() => setSelectedContrato(contrato)}
                                    >
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center space-x-3">
                                                    <Badge className={getStatusColor(contrato.status)}>
                                                        {contrato.status}
                                                    </Badge>
                                                    <h3 className="font-semibold text-lg">{contrato.tipo}</h3>
                                                </div>
                                                <Button variant="ghost" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-muted-foreground">Propriedade/Produto</p>
                                                    <p className="font-medium">{contrato.propriedade || contrato.produto}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Contraparte</p>
                                                    <p className="font-medium">{contrato.contraparte}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Valor</p>
                                                    <p className="font-medium text-primary">{contrato.valor}</p>
                                                </div>
                                                <div>
                                                    <p className="text-muted-foreground">Próximo Pagamento</p>
                                                    <p className="font-medium">{contrato.proximoPagamento}</p>
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span>Progresso</span>
                                                    <span>{contrato.progresso}%</span>
                                                </div>
                                                <Progress value={contrato.progresso} className="h-2" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'transacoes' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Histórico de Transações</h2>
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                                <p className="text-2xl font-bold text-primary">39.250 MT</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {mockTransacoes.map((transacao) => (
                                <Card key={transacao.id} className="border-border/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-2 rounded-full ${transacao.tipo === 'Recebimento' ? 'bg-green-100' : 'bg-red-100'
                                                    }`}>
                                                    <DollarSign className={`h-5 w-5 ${getTransactionColor(transacao.tipo)}`} />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold">{transacao.descricao}</h3>
                                                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                        <span>{new Date(transacao.data).toLocaleDateString('pt-MZ')}</span>
                                                        <span>via {transacao.metodo}</span>
                                                        <span>Ref: {transacao.referencia}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${getTransactionColor(transacao.tipo)}`}>
                                                    {transacao.tipo === 'Recebimento' ? '+' : ''}{formatCurrency(transacao.valor)}
                                                </p>
                                                <Badge
                                                    variant={transacao.status === 'Concluído' ? 'default' : 'secondary'}
                                                    className="text-xs"
                                                >
                                                    {transacao.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'criar' && (
                    <div className="max-w-2xl mx-auto">
                        <Card className="border-border/50">
                            <CardHeader>
                                <CardTitle>Criar Novo Contrato</CardTitle>
                                <CardDescription>
                                    Selecione o tipo de contrato que deseja criar
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid gap-4">
                                    <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-6">
                                        <div className="text-center space-y-3">
                                            <MapPin className="h-8 w-8 text-primary mx-auto" />
                                            <h3 className="font-semibold">Arrendamento de Terra</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Arrende a sua propriedade ou arrende terra de outros utilizadores
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-6">
                                        <div className="text-center space-y-3">
                                            <Handshake className="h-8 w-8 text-accent mx-auto" />
                                            <h3 className="font-semibold">Parceria Agrícola</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Estabeleça parcerias para cultivo conjunto e partilha de recursos
                                            </p>
                                        </div>
                                    </Card>

                                    <Card className="border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer p-6">
                                        <div className="text-center space-y-3">
                                            <DollarSign className="h-8 w-8 text-success mx-auto" />
                                            <h3 className="font-semibold">Venda de Produção</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Venda os seus produtos agrícolas com contratos seguros
                                            </p>
                                        </div>
                                    </Card>
                                </div>

                                <div className="pt-6 border-t">
                                    <h4 className="font-semibold mb-3 flex items-center">
                                        <Shield className="h-4 w-4 mr-2 text-primary" />
                                        Segurança e Proteção
                                    </h4>
                                    <div className="space-y-2 text-sm text-muted-foreground">
                                        <p>✓ Todos os contratos são verificados e seguros</p>
                                        <p>✓ Assinatura digital com validade legal</p>
                                        <p>✓ Pagamentos protegidos via plataforma</p>
                                        <p>✓ Suporte 24/7 para resolução de conflitos</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Negociacoes;