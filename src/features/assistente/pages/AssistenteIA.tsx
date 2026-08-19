import { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Bot, Send, Languages, BookOpen, Lightbulb, Bug, Cloud, Sprout,
  Loader2, RefreshCw, MapPin
} from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

type Message = { id: number; sender: 'user' | 'ai'; content: string; timestamp: Date };

const topicSuggestions = [
  { icon: Sprout,    text: "Como plantar milho em Moçambique?",   category: "Cultivo",  color: "text-success" },
  { icon: Bug,       text: "Pragas no tomateiro: como tratar?",  category: "Pragas",   color: "text-destructive" },
  { icon: Cloud,     text: "Melhores culturas para época seca?",  category: "Clima",    color: "text-primary" },
  { icon: Lightbulb, text: "Como melhorar a fertilidade do solo?",category: "Solo",     color: "text-accent" },
];

const languages = [
  { code: 'pt',  name: 'Português', flag: 'PT', note: 'Responda sempre em Português de Moçambique.' },
  { code: 'mua', name: 'Makua',     flag: 'MK', note: 'Tente responder em Makua. Se não for possível, use Português simples.' },
  { code: 'seh', name: 'Sena',      flag: 'SN', note: 'Tente responder em Sena. Se não for possível, use Português simples.' },
  { code: 'tsc', name: 'Changana',  flag: 'CH', note: 'Tente responder em Changana. Se não for possível, use Português simples.' },
];

const SYSTEM = `És o AgroBot, o assistente agrícola da AgroConecta, especializado na agricultura de Moçambique.

O QUE FAZES
Ajudas agricultores moçambicanos com: culturas locais (milho, feijão, arroz, mandioca, caju, algodão, hortícolas), calendário agrícola (época chuvosa nov-abr, seca mai-out), tipos de solo, pragas e doenças, adubação, rega, colheita, armazenamento e venda. Trabalhas com Meticais (MT), hectares e medidas em metros, e realidades locais (agricultura familiar, recursos limitados, mercados locais).

COMO RESPONDES
1. Vai direto ao assunto. Primeira frase = a resposta principal. Sem introduções longas.
2. Se a pergunta for vaga ou faltar informação essencial (que cultura, que zona, que época, que dimensão), faz UMA pergunta curta para esclarecer, em vez de adivinhar.
3. Dá passos concretos e acionáveis, com quantidades e prazos reais (ex.: "aplica 2-3 sementes por cova, espaçadas 25 cm"). Nada de conselhos genéricos.
4. Sê conciso: usa frases curtas ou listas. Evita repetir-te.
5. Adapta tudo a Moçambique: clima, solos, culturas, preços e práticas locais. Não presumas tratores nem produtos caros a menos que o utilizador os mencione.

SÊ HONESTO
- Se não souberes ou não tiveres dados atuais (por exemplo, o preço de mercado de hoje), diz claramente e sugere onde confirmar. Nunca inventes números.
- Se a pergunta não for sobre agricultura, responde de forma breve e reconduz para a tua área.

ESTILO
Português de Moçambique, simples e respeitoso. No máximo 1 ou 2 emojis por resposta, e só quando ajudam. Sem exageros.`;

async function askAssistant(userText: string, history: Message[], langNote: string): Promise<string> {
  const historyForServer = history
    .filter(m => m.id !== 1)
    .slice(-10)
    .map(m => ({ role: m.sender === 'user' ? 'user' as const : 'model' as const, text: m.content }));

  const res = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: userText,
      history: historyForServer,
      langNote,
      systemPrompt: SYSTEM,
    }),
  });

  const data = await res.json() as { reply?: string; error?: string };
  if (data.error) return data.error;
  return data.reply || 'Sem resposta. Reformule a pergunta.';
}

const AssistenteIA = () => {
  const [messages, setMessages] = useState<Message[]>([{
    id: 1, sender: 'ai', timestamp: new Date(),
    content: 'Olá! Sou o AgroBot, assistente agrícola especializado em Moçambique.\n\nPosso ajudá-lo com cultivo, pragas, clima, solo e preços. Qual é a sua dúvida?',
  }]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const [lang, setLang]     = useState('pt');
  const endRef   = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const getLang = () => languages.find(l => l.code === lang) ?? languages[0];

  const send = async (text: string) => {
    if (!text.trim() || typing) return;
    const userMsg: Message = { id: Date.now(), sender: 'user', content: text.trim(), timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    try {
      const reply = await askAssistant(text.trim(), messages, getLang().note);
      const aiMsg: Message = { id: Date.now() + 1, sender: 'ai', content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'ai', timestamp: new Date(), content: 'Erro de rede. Verifique a ligação e tente novamente.' }]);
    } finally { setTyping(false); }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 max-w-3xl">
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-lg bg-primary shadow-md mb-5">
            <Bot className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-black font-['Poppins'] mb-3">
            <span className="text-primary">Assistente IA</span> Agrícola
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">
            Respostas práticas sobre cultivo, pragas, clima e mercado, adaptadas a Moçambique.
          </p>
          <div className="mt-3">
            <Badge variant="secondary" className="gap-1.5 text-success border-success/30 bg-success/10">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
              Assistente disponível
            </Badge>
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
          <Button variant="ghost" size="sm" onClick={() => setMessages(m => [m[0]])}
            className="rounded-xl gap-2 text-muted-foreground" title="Limpar conversa">
            <RefreshCw className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Limpar</span>
          </Button>
        </div>

        <Card className="mb-4 border-border/60 shadow-medium rounded-lg overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border/60 bg-muted/30">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-medium">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-success border-2 border-background" />
            </div>
            <div>
              <p className="font-semibold text-sm">AgroBot</p>
              <p className="text-xs text-muted-foreground">Assistente agrícola</p>
            </div>
          </div>

          <div className="h-96 overflow-y-auto p-5 space-y-4">
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.sender === 'ai' && (
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-soft mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
                <div className={`max-w-[82%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  msg.sender === 'user' ? 'bg-primary text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'
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
                <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-soft">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-muted rounded-lg rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">A escrever...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-border/60 px-4 py-3 bg-background">
            <div className="flex gap-2">
              <Input ref={inputRef} placeholder="Faça a sua pergunta agrícola..."
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                className="flex-1 rounded-xl border-border/70 h-11" disabled={typing} />
              <Button onClick={() => send(input)} disabled={!input.trim() || typing}
                className="h-11 w-11 p-0 rounded-xl bg-primary text-white border-0 flex-shrink-0 shadow-soft transition-colors">
                {typing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {topicSuggestions.map(({ icon: Ic, text, category, color }, i) => (
            <button key={i} onClick={() => send(text)} disabled={typing}
              className="group flex flex-col items-center gap-2 p-4 rounded-lg border border-border/60 bg-card hover:border-primary/40 hover:bg-primary/5 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed">
              <div className="p-2 rounded-xl bg-muted group-hover:bg-primary/10 transition-colors">
                <Ic className={`h-5 w-5 ${color}`} />
              </div>
              <p className="text-xs font-semibold leading-tight">{text}</p>
              <Badge variant="secondary" className="text-[10px] px-2 py-0.5">{category}</Badge>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Languages, title: 'Português + línguas locais', desc: 'Responde em português; tenta Makua, Sena e Changana.', color: 'text-primary', bg: 'bg-primary/8' },
            { icon: MapPin,    title: 'Focado em Moçambique',    desc: 'Culturas, clima e solos do país',     color: 'text-accent',  bg: 'bg-accent/8' },
            { icon: BookOpen,  title: 'Conselhos práticos',      desc: 'Recomendações que pode aplicar já',   color: 'text-success', bg: 'bg-success/8' },
          ].map(({ icon: Ic, title, desc, color, bg }, i) => (
            <div key={i} className="flex flex-col items-center text-center p-5 rounded-lg border border-border/60 bg-card hover:shadow-soft transition-smooth">
              <div className={`p-3 rounded-xl ${bg} mb-3`}><Ic className={`h-6 w-6 ${color}`} /></div>
              <h3 className="font-bold text-sm mb-1 font-['Poppins']">{title}</h3>
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
