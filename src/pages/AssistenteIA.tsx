import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Mic, MicOff, Volume2, VolumeX,
  Languages, BookOpen, Lightbulb, Bug, Cloud, Sprout,
  Loader2, Sparkles, AlertTriangle
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
  { icon: Sprout,    text: "Como plantar milho em Moçambique?",  category: "Cultivo",  color: "text-success" },
  { icon: Bug,       text: "Pragas no tomateiro — como tratar?", category: "Pragas",   color: "text-destructive" },
  { icon: Cloud,     text: "Melhores culturas para época seca?", category: "Clima",    color: "text-primary" },
  { icon: Lightbulb, text: "Como melhorar a fertilidade do solo?",category: "Solo",    color: "text-accent" },
];

const languages = [
  { code: 'pt',  name: 'Português', flag: '🇲🇿', instruction: 'Responsa sempre em Português de Moçambique.' },
  { code: 'mua', name: 'Makua',     flag: '🌍', instruction: 'Responda em Makua (língua bantu de Moçambique). Se não for possível, use Português simples.' },
  { code: 'seh', name: 'Sena',      flag: '🌍', instruction: 'Responda em Sena (língua bantu de Moçambique). Se não for possível, use Português simples.' },
  { code: 'tsc', name: 'Changana',  flag: '🌍', instruction: 'Responda em Changana (língua bantu do sul de Moçambique). Se não for possível, use Português simples.' },
];

const SYSTEM_PROMPT = `Você é o AgroBot, um assistente agrícola especializado em Moçambique, desenvolvido pela AgroConecta.

Missão: Ajudar agricultores moçambicanos com conselhos práticos, acessíveis e adaptados ao contexto local.

Conhecimentos principais:
- Culturas locais: milho, feijão, arroz, mandioca, amendoim, algodão, caju, tabaco, horticultura
- Clima de Moçambique: época das chuvas (outubro–março), época seca (abril–setembro), ciclones costeiros
- Solos moçambicanos: argiloso, arenoso, franco, latossolo vermelho-amarelo
- Pragas comuns: lagarta do cartucho, mosca-branca, pulgão, ácaros, ferrugem, míldio
- Técnicas adaptadas: agricultura de conservação, rotação de culturas, compostagem, rega gota-a-gota
- Preços e mercado: Mercado Municipal de Maputo, preços em Meticais (MT), cooperativas locais
- Regiões: Maputo, Gaza, Inhambane, Sofala, Manica, Tete, Zambézia, Nampula, Cabo Delgado, Niassa

Estilo de resposta:
- Seja direto, claro e prático
- Use exemplos locais (variedades moçambicanas, condições locais)
- Formate as respostas com emojis relevantes para facilitar a leitura
- Dê sempre recomendações acionáveis
- Mencione preços em MT quando relevante
- Adapte-se ao nível do agricultor (pode ser analfabeto digital)`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function callGemini(userMessage: string, history: Message[], langInstruction: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    return '⚠️ Chave API Gemini não configurada. Contacte o administrador.';
  }

  // Build conversation history for Gemini
  const contents = [
    // System context as first user message
    {
      role: 'user',
      parts: [{ text: `${SYSTEM_PROMPT}\n\nInstrução de idioma: ${langInstruction}` }]
    },
    {
      role: 'model',
      parts: [{ text: 'Olá! Estou pronto para ajudar os agricultores moçambicanos. Como posso ajudá-lo?' }]
    },
    // Add conversation history (last 6 messages to stay within token limits)
    ...history.slice(-6).map(m => ({
      role: m.sender === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    })),
    // Current message
    {
      role: 'user',
      parts: [{ text: userMessage }]
    }
  ];

  const response = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
        topP: 0.8,
      },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      ]
    })
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error('[Gemini Error]', err);
    if (response.status === 429) return '⏳ Muitas perguntas seguidas. Aguarde um momento e tente novamente.';
    if (response.status === 401 || response.status === 403) return '🔑 Chave API inválida. Contacte o administrador.';
    return `❌ Erro ao contactar o assistente (${response.status}). Tente novamente.`;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return '🤔 Não consegui gerar uma resposta. Tente reformular a pergunta.';
  return text;
}

const AssistenteIA = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      content: 'Olá! Sou o AgroBot, o seu assistente agrícola especializado em Moçambique 🌱\n\nPosso ajudá-lo com cultivo, pragas, clima, solo, preços de mercado e muito mais — em Português e línguas locais.\n\nComo posso ajudá-lo hoje?',
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage]     = useState('');
  const [isTyping, setIsTyping]             = useState(false);
  const [isRecording, setIsRecording]       = useState(false);
  const [audioEnabled, setAudioEnabled]     = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('pt');
  const [apiError, setApiError]             = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const getCurrentLang = () => languages.find(l => l.code === selectedLanguage) || languages[0];

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;
    setApiError(false);

    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      content: content.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const lang = getCurrentLang();
      const reply = await callGemini(content.trim(), messages, lang.instruction);

      const aiMsg: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        content: reply,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);

      // Text-to-speech if enabled
      if (audioEnabled && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(reply.replace(/[🌱🐛☀️🌍🤖⚠️❌⏳🔑🤔]/gu, ''));
        utterance.lang = 'pt-PT';
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.error('[AssistenteIA]', e);
      setApiError(true);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: 'ai',
        content: '❌ Ocorreu um erro de rede. Verifique a sua ligação à internet e tente novamente.',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('O seu browser não suporta reconhecimento de voz. Use Chrome para esta funcionalidade.');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-MZ';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
      setIsRecording(false);
    };
    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const toggleAudio = () => {
    if (audioEnabled) window.speechSynthesis?.cancel();
    setAudioEnabled(!audioEnabled);
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
            Conselhos reais sobre cultivo, pragas, clima e mercado — powered by Google Gemini.
          </p>
          {/* API status badge */}
          <div className="mt-3">
            {GEMINI_API_KEY ? (
              <Badge variant="secondary" className="gap-1.5 text-success border-success/30 bg-success/10">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                Gemini AI Ativo
              </Badge>
            ) : (
              <Badge variant="secondary" className="gap-1.5 text-destructive border-destructive/30 bg-destructive/10">
                <AlertTriangle className="h-3 w-3" /> API não configurada
              </Badge>
            )}
          </div>
        </div>

        {/* Language + Audio Controls */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
            <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer text-foreground"
            >
              {languages.map(l => (
                <option key={l.code} value={l.code}>{l.flag} {l.name}</option>
              ))}
            </select>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className={`rounded-xl gap-2 ${audioEnabled ? 'text-primary' : 'text-muted-foreground'}`}
            title={audioEnabled ? 'Desativar leitura em voz alta' : 'Ativar leitura em voz alta'}
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
                Powered by Google Gemini 2.0 Flash
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="h-96 overflow-y-auto p-5 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {message.sender === 'ai' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg gradient-hero flex items-center justify-center shadow-soft mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    message.sender === 'user'
                      ? 'gradient-primary text-white rounded-tr-sm'
                      : 'bg-muted rounded-tl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
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
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">A consultar Gemini AI...</span>
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
                  className={`absolute right-1 top-1 h-9 w-9 p-0 rounded-lg ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={toggleRecording}
                  title={isRecording ? 'Parar gravação' : 'Gravar voz (Chrome)'}
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
            {isRecording && (
              <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse inline-block" />
                A gravar... Fale agora
              </p>
            )}
          </div>
        </Card>

        {/* Topic Suggestions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {topicSuggestions.map(({ icon: Icon, text, category, color }, i) => (
            <button
              key={i}
              onClick={() => sendMessage(text)}
              disabled={isTyping}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-1 transition-spring text-center disabled:opacity-50 disabled:cursor-not-allowed"
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
            { icon: Languages, title: "4 Idiomas Locais",  desc: "Português, Makua, Sena e Changana — Gemini adapta-se ao idioma pedido", color: "text-primary",  bg: "bg-primary/8" },
            { icon: Volume2,   title: "Áudio Integrado",   desc: "Ative o áudio para ouvir as respostas em voz alta (Web Speech API)",    color: "text-accent",  bg: "bg-accent/8" },
            { icon: BookOpen,  title: "IA Real",            desc: "Powered by Google Gemini 2.0 Flash — respostas inteligentes e actuais", color: "text-success", bg: "bg-success/8" },
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