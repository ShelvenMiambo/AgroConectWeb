import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Sprout,
    Calendar,
    AlertTriangle,
    CheckCircle,
    Clock,
    Camera,
    TrendingUp,
    Droplets,
    Thermometer,
    Plus,
    Eye
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Mock data para planos de cultivo
const mockPlanos = [
    {
        id: 1,
        cultura: 'Milho',
        propriedade: 'Quinta da Esperança',
        area: 10,
        dataInicio: '2024-10-15',
        dataColheita: '2025-02-15',
        progresso: 65,
        status: 'Em Andamento',
        proximaAtividade: 'Aplicação de fertilizante',
        alertas: 2
    },
    {
        id: 2,
        cultura: 'Feijão',
        propriedade: 'Campos do Sul',
        area: 5,
        dataInicio: '2024-11-01',
        dataColheita: '2025-01-30',
        progresso: 30,
        status: 'Em Andamento',
        proximaAtividade: 'Controlo de pragas',
        alertas: 1
    },
    {
        id: 3,
        cultura: 'Tomate',
        propriedade: 'Terra dos Baobás',
        area: 3,
        dataInicio: '2024-09-01',
        dataColheita: '2024-12-01',
        progresso: 95,
        status: 'Quase Pronto',
        proximaAtividade: 'Preparar colheita',
        alertas: 0
    }
];

const mockAlertas = [
    {
        id: 1,
        tipo: 'Clima',
        titulo: 'Chuva Prevista',
        descricao: 'Possibilidade de chuva forte nos próximos 3 dias',
        urgencia: 'media',
        plano: 'Milho - Quinta da Esperança'
    },
    {
        id: 2,
        tipo: 'Pragas',
        titulo: 'Risco de Lagarta',
        descricao: 'Condições favoráveis para aparecimento de lagartas',
        urgencia: 'alta',
        plano: 'Milho - Quinta da Esperança'
    },
    {
        id: 3,
        tipo: 'Irrigação',
        titulo: 'Tempo de Regar',
        descricao: 'Solo com baixa humidade, necessita irrigação',
        urgencia: 'media',
        plano: 'Feijão - Campos do Sul'
    }
];

const mockOcorrencias = [
    {
        id: 1,
        data: '2024-12-01',
        tipo: 'Aplicação',
        descricao: 'Aplicado fertilizante NPK',
        plano: 'Milho',
        fotos: 1
    },
    {
        id: 2,
        data: '2024-11-28',
        tipo: 'Observação',
        descricao: 'Crescimento saudável das plantas',
        plano: 'Feijão',
        fotos: 2
    },
    {
        id: 3,
        data: '2024-11-25',
        tipo: 'Problema',
        descricao: 'Identificadas algumas pragas no tomateiro',
        plano: 'Tomate',
        fotos: 3
    }
];

const Producao = () => {
    const [activeTab, setActiveTab] = useState<'dashboard' | 'planos' | 'alertas' | 'historico'>('dashboard');
    const [selectedPlano, setSelectedPlano] = useState<any>(null);

    const getUrgenciaColor = (urgencia: string) => {
        switch (urgencia) {
            case 'alta': return 'text-red-500 bg-red-50 border-red-200';
            case 'media': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'baixa': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-muted-foreground bg-muted border-border';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Em Andamento': return 'bg-blue-500';
            case 'Quase Pronto': return 'bg-green-500';
            case 'Finalizado': return 'bg-gray-500';
            default: return 'bg-muted-foreground';
        }
    };

    const renderDashboard = () => (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="border-border/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Planos Ativos</p>
                                <p className="text-2xl font-bold text-primary">3</p>
                            </div>
                            <Sprout className="h-8 w-8 text-primary" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Área Total</p>
                                <p className="text-2xl font-bold text-accent">18ha</p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-accent" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Alertas</p>
                                <p className="text-2xl font-bold text-warning">3</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-warning" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-border/50">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Próxima Colheita</p>
                                <p className="text-2xl font-bold text-success">15</p>
                                <p className="text-xs text-muted-foreground">dias</p>
                            </div>
                            <Calendar className="h-8 w-8 text-success" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Active Plans */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Sprout className="h-5 w-5 mr-2 text-primary" />
                        Planos de Cultivo Ativos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {mockPlanos.map((plano) => (
                            <div key={plano.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center space-x-3">
                                        <Badge className={getStatusColor(plano.status)}>
                                            {plano.status}
                                        </Badge>
                                        <h3 className="font-semibold">{plano.cultura} - {plano.propriedade}</h3>
                                        {plano.alertas > 0 && (
                                            <Badge variant="destructive" className="text-xs">
                                                {plano.alertas} alertas
                                            </Badge>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-3">
                                    <div>Área: {plano.area}ha</div>
                                    <div>Início: {new Date(plano.dataInicio).toLocaleDateString('pt-MZ')}</div>
                                    <div>Colheita: {new Date(plano.dataColheita).toLocaleDateString('pt-MZ')}</div>
                                    <div>Próximo: {plano.proximaAtividade}</div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Progresso</span>
                                        <span>{plano.progresso}%</span>
                                    </div>
                                    <Progress value={plano.progresso} className="h-2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Recent Alerts */}
            <Card className="border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-warning" />
                        Alertas Recentes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {mockAlertas.slice(0, 3).map((alerta) => (
                            <div key={alerta.id} className={`border rounded-lg p-3 ${getUrgenciaColor(alerta.urgencia)}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <Badge variant="outline" className="text-xs">
                                                {alerta.tipo}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">{alerta.plano}</span>
                                        </div>
                                        <h4 className="font-semibold text-sm">{alerta.titulo}</h4>
                                        <p className="text-xs opacity-80">{alerta.descricao}</p>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        Ver
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold mb-4">
                        <span className="text-primary">Gestão de</span> Produção
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Planeie, monitorize e otimize os seus cultivos com ferramentas intuitivas e alertas inteligentes.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 justify-center">
                    {[
                        { key: 'dashboard', label: 'Dashboard', icon: TrendingUp },
                        { key: 'planos', label: 'Meus Planos', icon: Sprout },
                        { key: 'alertas', label: 'Alertas', icon: AlertTriangle },
                        { key: 'historico', label: 'Histórico', icon: Clock }
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
                {activeTab === 'dashboard' && renderDashboard()}

                {activeTab === 'planos' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Meus Planos de Cultivo</h2>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Plano
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {mockPlanos.map((plano) => (
                                <Card key={plano.id} className="border-border/50 hover:shadow-medium transition-spring">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge className={getStatusColor(plano.status)}>
                                                {plano.status}
                                            </Badge>
                                            {plano.alertas > 0 && (
                                                <Badge variant="destructive" className="text-xs">
                                                    {plano.alertas}
                                                </Badge>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg">{plano.cultura}</CardTitle>
                                        <CardDescription>{plano.propriedade} • {plano.area}ha</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                                <div>Início: {new Date(plano.dataInicio).toLocaleDateString('pt-MZ')}</div>
                                                <div>Colheita: {new Date(plano.dataColheita).toLocaleDateString('pt-MZ')}</div>
                                            </div>

                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span>Progresso</span>
                                                    <span>{plano.progresso}%</span>
                                                </div>
                                                <Progress value={plano.progresso} className="h-2" />
                                            </div>

                                            <div className="pt-2 border-t">
                                                <p className="text-sm text-muted-foreground mb-2">Próxima atividade:</p>
                                                <p className="text-sm font-medium">{plano.proximaAtividade}</p>
                                            </div>

                                            <Button variant="outline" className="w-full">
                                                Ver Detalhes
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'alertas' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Alertas e Lembretes</h2>

                        <div className="space-y-4">
                            {mockAlertas.map((alerta) => (
                                <Card key={alerta.id} className={`border-l-4 ${getUrgenciaColor(alerta.urgencia)}`}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Badge variant="outline">
                                                        {alerta.tipo}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {alerta.urgencia === 'alta' ? 'Urgente' :
                                                            alerta.urgencia === 'media' ? 'Moderado' : 'Baixo'}
                                                    </Badge>
                                                </div>
                                                <h3 className="font-semibold text-lg mb-1">{alerta.titulo}</h3>
                                                <p className="text-muted-foreground mb-2">{alerta.descricao}</p>
                                                <p className="text-sm text-muted-foreground">Plano: {alerta.plano}</p>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button variant="outline" size="sm">
                                                    Marcar como Lido
                                                </Button>
                                                <Button size="sm">
                                                    Ver Detalhes
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'historico' && (
                    <div className="space-y-6">
                        <h2 className="text-2xl font-bold">Histórico de Ocorrências</h2>

                        <div className="space-y-4">
                            {mockOcorrencias.map((ocorrencia) => (
                                <Card key={ocorrencia.id} className="border-border/50">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <Badge variant="outline">
                                                        {ocorrencia.tipo}
                                                    </Badge>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {ocorrencia.plano}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {new Date(ocorrencia.data).toLocaleDateString('pt-MZ')}
                                                    </span>
                                                </div>
                                                <p className="text-muted-foreground">{ocorrencia.descricao}</p>
                                                {ocorrencia.fotos > 0 && (
                                                    <div className="flex items-center mt-2 text-sm text-muted-foreground">
                                                        <Camera className="h-4 w-4 mr-1" />
                                                        {ocorrencia.fotos} foto{ocorrencia.fotos > 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Producao;