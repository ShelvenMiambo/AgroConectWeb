import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Mic, MicOff, Volume2, VolumeX,
  Languages, BookOpen, Lightbulb, Bug, Cloud, Sprout,
  Loader2, Sparkles
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Message = {
  id: number;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
};

const topicSuggestions = [
  { icon: Sprout, text: "Como plantar milho?",    category: "Cultivo",   color: "text-success" },
  { icon: Bug,    text: "Pragas no tomateiro",    category: "Pragas",    color: "text-destructive" },
  { icon: Cloud,  text: "Previsão do tempo",      category: "Clima",     color: "text-primary" },
  { icon: Lightbulb, text: "Melhores práticas",  category: "Dicas",     color: "text-accent" },
];

const languages = [
  { code: 'pt',  name: 'Português', flag: '🇲🇿' },
  { code: 'mua', name: 'Makua',     flag: '🌍' },
  { code: 'seh', name: 'Sena',      flag: '🌍' },
  { code: 'tsc', name: 'Changana',  flag: '🌍' },
];

function generateAIResponse(input: string): string {
  const i = input.toLowerCase();
  if (i.includes('milho') || i.includes('plantar')) {
    return 'Para plantar milho em Moçambique:\n\n🌱 **Época ideal**: Outubro–Novembro (início das chuvas)\n🌿 **Espaçamento**: 25 cm entre plantas, 75 cm entre linhas\n🪣 **Rega**: 400–600 mm durante o ciclo\n🌾 **Variedades locais**: ZM421, ZM401 adaptadas ao clima\n\nPrecisa de mais detalhes sobre alguma fase?';
  }
  if (i.includes('praga') || i.includes('inseto') || i.includes('tomate')) {
    return 'Para controlo de pragas no tomateiro:\n\n🐛 **Identificação**: Lagarta, pulgão ou mosca-branca?\n🟡 **Armadilhas cromáticas**: Use painéis amarelos\n🧪 **Controlo biológico**: Bacillus thuringiensis\n🔄 **Rotação de culturas**: Evita acumulação de pragas\n\nConsiga identificar qual praga está a afetar a sua cultura?';
  }
  if (i.includes('tempo') || i.includes('chuva') || i.includes('clima')) {
    return '☀️ Previsão agrícola para esta semana:\n\n🌡️ Temperatura: 25–32°C\n💧 Humidade: 65–80%\n🌧️ Probabilidade de chuva: 40%\n💨 Vento: Moderado de SE\n\n**Recomendações:**\n• Bom período para plantação\n• Prepare drenagem para excesso de água\n• Applique fertilizantes antes da chuva';
  }
  if (i.includes('solo') || i.includes('terra') || i.includes('adubar')) {
    return '🌍 Sobre gestão de solo:\n\n**Tipos principais:**\n• 🟤 Argiloso: retém água, ideal para arroz\n• 🟡 Arenoso: drenagem rápida, boa para raízes\n• 🟢 Franco: equilibrado, versátil\n\n**Adubação recomendada:**\nUse composto orgânico + NPK 10-20-10 para solos moçambicanos. Faça análise de solo antes de aplicar.';
  }
  return '🤖 Olá! Sou o seu assistente agrícola especializado em Moçambique.\n\nPosso ajudá-lo com:\n• 🌱 Técnicas de cultivo\n• 🐛 Controlo de pragas\n• ☀️ Previsões climáticas\n• 🌍 Gestão de solo e água\n• 📊 Melhores práticas\n\nReformule a sua pergunta ou escolha um tema sugerido!';
}

const AssistenteIA = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      content: 'Olá! 👋 Sou o seu assistente agrícola inteligente. Posso ajudar com cultivo, pragas, clima, solo e muito mais — disponível em 4 idiomas locais. Como posso ajudá-lo hoje?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate realistic AI thinking time
    const delay = 800 + Math.random() * 800;
    setTimeout(() => {
      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        content: generateAIResponse(content),
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, delay);
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Simulate voice input
      const phrases = [
        "Como tratar as pragas no meu feijão?",
        "Qual é a melhor época para plantar milho?",
        "O meu tomate tem manchas amarelas"
      ];
      setInputMessage(phrases[Math.floor(Math.random() * phrases.length)]);
    } else {
      setIsRecording(true);
      // Auto-stop after 4s
      setTimeout(() => setIsRecording(false), 4000);
    }
  };

  const formatContent = (text: string) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.replace(/\*\*(.*?)\*\*/g, '$1')}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 max-w-3xl">

        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl gradient-hero shadow-glow mb-5">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-3">
            <span className="text-gradient-primary">Assistente IA</span> Agrícola
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Conselhos personalizados sobre cultivo, pragas, clima e práticas agrícolas.
            Disponível em 4 idiomas.
          </p>
        </div>

        {/* Language + Audio Controls */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
            <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`rounded-xl gap-2 ${audioEnabled ? 'text-primary' : 'text-muted-foreground'}`}
          >
            {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="text-xs hidden sm:inline">{audioEnabled ? 'Áudio ativo' : 'Mudo'}</span>
          </Button>
        </div>

        {/* Chat Window */}
        <Card className="mb-4 border-border/60 shadow-medium rounded-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-muted/30">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl gradient-hero flex items-center justify-center shadow-medium">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
            </div>
            <div>
              <p className="font-semibold text-sm">AgroBot</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-accent" />
                Especialista em Agricultura Moçambicana
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                {message.sender === 'ai' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg gradient-hero flex items-center justify-center shadow-soft mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.sender === 'user'
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-line">{formatContent(message.content)}</p>
                  <p className={`text-[10px] mt-1.5 ${message.sender === 'user' ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
                    {message.timestamp.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">A pensar...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border/60 px-4 py-3 bg-background">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  placeholder="Faça a sua pergunta agrícola..."
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(inputMessage); } }}
                  className="pr-10 rounded-xl border-border/70 h-11"
                  disabled={isTyping}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-1 top-1 h-9 w-9 p-0 rounded-lg ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}
                  onClick={toggleRecording}
                >
                  {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button
                onClick={() => sendMessage(inputMessage)}
                disabled={!inputMessage.trim() || isTyping}
                className="h-11 w-11 p-0 rounded-xl gradient-primary text-white border-0 flex-shrink-0 shadow-soft hover:-translate-y-0.5 transition-spring"
              >
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>

        {/* Topic Suggestions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {topicSuggestions.map(({ icon: Icon, text, category, color }, i) => (
            <button
              key={i}
              onClick={() => sendMessage(text)}
              disabled={isTyping}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-1 transition-spring text-center disabled:opacity-50"
            >
              <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-xs font-semibold leading-tight">{text}</p>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{category}</Badge>
            </button>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Languages, title: "4 Idiomas Locais",  desc: "Português, Makua, Sena e Changana",         color: "text-primary",     bg: "bg-primary/8" },
            { icon: Volume2,   title: "Áudio Integrado",   desc: "Ouça as respostas em alta voz",             color: "text-accent",      bg: "bg-accent/8" },
            { icon: BookOpen,  title: "Conteúdo Técnico",  desc: "Guias, vídeos e dados especializados",      color: "text-success",     bg: "bg-success/8" },
          ].map(({ icon: Icon, title, desc, color, bg }, i) => (
            <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl border border-border/60 bg-card hover:shadow-soft transition-smooth">
              <div className={`p-3 rounded-xl ${bg} mb-3`}>
                <Icon className={`h-6 w-6 ${color}`} />
              </div>
              <h3 className="font-bold text-sm mb-1 font-['Outfit']">{title}</h3>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AssistenteIA;