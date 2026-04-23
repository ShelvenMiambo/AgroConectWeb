import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Mic, MicOff, Volume2, VolumeX,
  Languages, BookOpen, Lightbulb, Bug, Cloud, Sprout,
  Loader2, Sparkles, AlertTriangle, RefreshCw
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type Message = { id: number; sender: 'user' | 'ai'; content: string; timestamp: Date };

const topicSuggestions = [
  { icon: Sprout,    text: "Como plantar milho em Moçambique?",   category: "Cultivo",  color: "text-success" },
  { icon: Bug,       text: "Pragas no tomateiro — como tratar?",  category: "Pragas",   color: "text-destructive" },
  { icon: Cloud,     text: "Melhores culturas para época seca?",  category: "Clima",    color: "text-primary" },
  { icon: Lightbulb, text: "Como melhorar a fertilidade do solo?",category: "Solo",     color: "text-accent" },
];

const languages = [
  { code: 'pt',  name: 'Português', flag: '🇲🇿', note: 'Responda sempre em Português de Moçambique.' },
  { code: 'mua', name: 'Makua',     flag: '🌍',  note: 'Tente responder em Makua. Se não for possível, use Português simples.' },
  { code: 'seh', name: 'Sena',      flag: '🌍',  note: 'Tente responder em Sena. Se não for possível, use Português simples.' },
  { code: 'tsc', name: 'Changana',  flag: '🌍',  note: 'Tente responder em Changana. Se não for possível, use Português simples.' },
];

const SYSTEM = `Você é o AgroBot, assistente agrícola da AgroConecta especializado em Moçambique.
Ajude agricultores com: culturas locais (milho, feijão, arroz, mandioca, caju, algodão, horticultura), clima (época chuvosa out-mar / seca abr-set), solos (argiloso, arenoso, franco), pragas, irrigação, preços em Meticais (MT) e mercados locais.
Seja direto, prático e use emojis. Dê sempre recomendações acionáveis adaptadas a Moçambique.`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const MODEL = 'gemini-2.5-flash';

async function askGemini(userText: string, history: Message[], langNote: string): Promise<string> {
  if (!GEMINI_API_KEY) return 'Chave API nao configurada. Contacte o administrador.';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  // Build alternating user/model history — skip the initial AI greeting (index 0)
  // Only include messages after the first greeting to avoid double-model sequences
  const historyMsgs = history
    .filter(m => m.id !== 1)  // skip the initial greeting message
    .slice(-10);

  // Ensure strictly alternating roles (Gemini requirement)
  const alternating: { role: string; parts: { text: string }[] }[] = [];
  for (const m of historyMsgs) {
    const role = m.sender === 'user' ? 'user' : 'model';
    if (alternating.length > 0 && alternating[alternating.length - 1].role === role) continue;
    alternating.push({ role, parts: [{ text: m.content }] });
  }

  // Final message must always be from user
  if (alternating.length > 0 && alternating[alternating.length - 1].role === 'user') {
    alternating.pop(); // remove last user to avoid double-user before appending
  }
  alternating.push({ role: 'user', parts: [{ text: userText }] });

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: `${SYSTEM}\nIdioma: ${langNote}` }] },
      contents: alternating,
      generationConfig: { temperature: 0.7, maxOutputTokens: 800, topP: 0.9 },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[Gemini]', res.status, err);
    if (res.status === 429) return 'Limite de pedidos atingido. Aguarde 30 segundos e tente novamente.';
    if (res.status === 400) return `Pedido invalido: ${err?.error?.message || 'verifique os parametros.'}`;
    if (res.status === 401 || res.status === 403) return 'Chave API invalida ou sem permissao. Contacte o administrador.';
    if (res.status === 503) return 'Servico temporariamente indisponivel. Tente mais tarde.';
    return `Erro ${res.status}. Tente novamente.`;
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const reason = data?.candidates?.[0]?.finishReason;
    if (reason === 'SAFETY') return 'Resposta bloqueada por filtros de seguranca. Reformule a pergunta.';
    console.error('[Gemini] resposta vazia:', JSON.stringify(data));
    return 'Sem resposta. Reformule a pergunta.';
  }
  return text;
}

const AssistenteIA = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: 1, sender: 'ai', timestamp: new Date(),
    content: 'Olá! 👋 Sou o AgroBot — assistente agrícola especializado em Moçambique.\n\nPosso ajudá-lo com cultivo, pragas, clima, solo e preços. Qual é a sua dúvida?',
  }]);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [recording, setRecording] = useState(false);
  const [audio, setAudio]         = useState(false);
  const [lang, setLang]           = useState('pt');
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recRef   = useRef<any>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const getLang = () => languages.find(l => l.code === lang) ?? languages[0];

  const send = async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { id: Date.now(), sender: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const reply = await askGemini(text.trim(), messages, getLang().note);
      const aiMsg: Message = { id: Date.now() + 1, sender: 'ai', content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      if (audio && 'speechSynthesis' in window) {
        const u = new SpeechSynthesisUtterance(reply.replace(/[^\p{L}\p{N} ,.!?]/gu, ''));
        u.lang = 'pt-PT'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
      }
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', timestamp: new Date(), content: 'Erro de rede. Verifique a ligacao e tente novamente.' }]);
    } finally { setTyping(false); }
  };

  const toggleRec = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Use o Chrome para reconhecimento de voz.'); return;
    }
    if (recording) { recRef.current?.stop(); setRecording(false); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR(); r.lang = 'pt-MZ'; r.continuous = false; r.interimResults = false;
    r.onresult = (e: any) => { setInput(e.results[0][0].transcript); setRecording(false); };
    r.onerror = () => setRecording(false);
    r.onend   = () => setRecording(false);
    recRef.current = r; r.start(); setRecording(true);
  };

  const toggleAudio = () => { if (audio) window.speechSynthesis?.cancel(); setAudio(!audio); };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl gradient-hero shadow-glow mb-5">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-3">
            <span className="text-gradient-primary">Assistente IA</span> Agrícola
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Respostas inteligentes sobre cultivo, pragas, clima e mercado — powered by Google Gemini.
          </p>
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

        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 bg-muted/60 rounded-xl px-3 py-2">
            <Languages className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <select value={lang} onChange={e => setLang(e.target.value)}
              className="bg-transparent text-sm font-medium border-none outline-none cursor-pointer text-foreground">
              {languages.map(l => <option key={l.code} value={l.code}>{l.flag} {l.name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleAudio}
              className={`rounded-xl gap-2 ${audio ? 'text-primary' : 'text-muted-foreground'}`}>
              {audio ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span className="text-xs hidden sm:inline">{audio ? 'Áudio' : 'Mudo'}</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setMessages(m => [m[0]])}
              className="rounded-xl gap-2 text-muted-foreground" title="Limpar conversa">
              <RefreshCw className="h-4 w-4" />
              <span className="text-xs hidden sm:inline">Limpar</span>
            </Button>
          </div>
        </div>

        <Card className="mb-4 border-border/60 shadow-medium rounded-2xl overflow-hidden">
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
                  <Sparkles className="h-3 w-3 text-accent" /> Google Gemini 2.5 Flash
              </p>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-5 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.sender === 'ai' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg gradient-hero flex items-center justify-center shadow-soft mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user' ? 'gradient-primary text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-white/60 text-right' : 'text-muted-foreground'}`}>
                    {msg.timestamp.toLocaleTimeString('pt-MZ', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {typing && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-lg gradient-hero flex items-center justify-center shadow-soft">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">A consultar Gemini...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border/60 px-4 py-3 bg-background">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input ref={inputRef} placeholder="Faça a sua pergunta agrícola..."
                  value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                  className="pr-10 rounded-xl border-border/70 h-11" disabled={typing} />
                <Button variant="ghost" size="sm" onClick={toggleRec}
                  className={`absolute right-1 top-1 h-9 w-9 p-0 rounded-lg ${recording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                  {recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={() => send(input)} disabled={!input.trim() || typing}
                className="h-11 w-11 p-0 rounded-xl gradient-primary text-white border-0 flex-shrink-0 shadow-soft hover:-translate-y-0.5 transition-spring">
                {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {recording && (
              <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse inline-block" /> A gravar...
              </p>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {topicSuggestions.map(({ icon: Ic, text, category, color }, i) => (
            <button key={i} onClick={() => send(text)} disabled={typing}
              className="group flex flex-col items-center gap-2 p-4 rounded-2xl border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 hover:-translate-y-1 transition-spring text-center disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                <Ic className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-xs font-semibold leading-tight">{text}</p>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{category}</Badge>
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Languages, title: '4 Idiomas Locais',  desc: 'Português, Makua, Sena e Changana', color: 'text-primary', bg: 'bg-primary/8' },
            { icon: Volume2,   title: 'Áudio Integrado',   desc: 'Ouça as respostas em voz alta',     color: 'text-accent',  bg: 'bg-accent/8' },
            { icon: BookOpen,  title: 'IA Real',            desc: 'Powered by Google Gemini 1.5',     color: 'text-success', bg: 'bg-success/8' },
          ].map(({ icon: Ic, title, desc, color, bg }, i) => (
            <div key={i} className="flex flex-col items-center text-center p-5 rounded-2xl border border-border/60 bg-card hover:shadow-soft transition-smooth">
              <div className={`p-3 rounded-xl ${bg} mb-3`}><Ic className={`h-6 w-6 ${color}`} /></div>
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