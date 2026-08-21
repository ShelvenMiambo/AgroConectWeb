# AgroConecta — Documentação completa (handoff)

Documento único com **tudo o que é preciso saber** para operar, retomar e lançar o
AgroConecta. Feito para poder limpar a janela de contexto e continuar sem perder nada.

> Última atualização: 21 Ago 2026. Se algo aqui divergir do código, o **código manda** —
> este doc é um mapa, não a fonte da verdade.

---

## 1. O que é

Plataforma agrícola para **Moçambique**. Liga **agricultores**, **donos de terreno**,
**vendedores** e **compradores**: marketplace de terrenos e produtos, gestão de produção
(cultivos + clima + calendário), negociações com chat, assistente de IA agrícola e planos
pagos via **mobile money (M‑Pesa / eMola)**.

- **Produção (live):** https://agroconecta.pages.dev
- **Repo:** ShelvenMiambo/AgroConectWeb (branch `main`)

---

## 2. Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) + lucide-react. Fontes: **Poppins** (títulos) + **Roboto** (corpo) |
| Routing | react-router-dom v6 |
| Estado servidor | @tanstack/react-query |
| Auth + BD + Storage + Realtime | **Supabase** |
| Backend/API | **Cloudflare Pages Functions** (`functions/api/*`) |
| IA | **Google Gemini** (via proxy server-side) |
| Pagamentos | **Debito Pay** (M‑Pesa; eMola/mKesh no futuro) |
| Hosting | **Cloudflare Pages** (deploy automático) |

---

## 3. Comandos e correr localmente

```sh
npm install        # instalar
npm run dev        # dev server — atenção: corre em http://localhost:8080 (não 5173)
npm run build      # build de produção -> dist/
npm run lint       # ESLint
npm run preview    # pré-visualizar o build
```

- Copiar `.env.example` → `.env.local` e preencher (ver docs/CONFIGURACAO.md).
- Em **dev**, os pagamentos correm em **simulação** (as Functions `/api/*` só existem na Cloudflare).
- Em dev, o `beforeinstallprompt` (instalar PWA) e a IA real não funcionam (precisam de produção/HTTPS).

---

## 4. Deploy

**Automático:** `git push` em `main` → a Cloudflare Pages reconstrói e publica. Não há passo manual.

- Terminar commits com `Co-Authored-By: Claude ...` (convenção do repo).
- **Cache do browser (importante):** a app é PWA com service worker. Depois de mudanças
  visíveis, **incrementar `CACHE_VERSION`** em `public/sw.js` (ex.: `agroconecta-v33` → `v34`)
  para forçar os utilizadores a apanhar a versão nova. Para testar de imediato: **janela
  anónima** ou hard‑refresh (Ctrl+Shift+R).

---

## 5. Base de dados (Supabase)

Esquema, políticas (RLS) e triggers estão em **`supabase/setup.sql`** (correr no SQL Editor do Supabase).

**Tabelas principais:** `profiles`, `properties` (terrenos), `listings` (ofertas/procuras de
terra e produtos), `producao` (planos de cultivo), `alertas`, `ocorrencias`, `negociacoes`,
`mensagens` (chat), `config` (preços/definições).

**Buckets (Storage):**
- `property-images` — **público** (fotos dos terrenos).
- `documentos` — **PRIVADO** (documento de posse DUAT/BI). **⚠️ ainda por criar — ver §9 e §11.**

**Segurança (RLS):** cada tabela tem políticas `own/admin`. Função `public.is_admin()` decide
se o utilizador atual é admin. **Trigger `protect_profile_fields`**: impede um utilizador
normal de mudar o próprio `role`/`plan`; só **admins** e o **servidor (service_role)** o podem
fazer (foi ajustado para permitir `service_role`, para a ativação automática do plano funcionar).

---

## 6. ⭐ Keep-alive — impedir a BD de adormecer

O Supabase do **plano grátis pausa por inatividade**. Para evitar isso:

- Existe a Function **`/api/keepalive`** (`functions/api/keepalive.ts`) que faz um pedido leve
  ao Supabase (conta como atividade).
- Um **serviço de cron externo** chama esse endereço periodicamente:
  **https://agroconecta.pages.dev/api/keepalive** (ex.: de 6 em 6 horas).
- Serviço usado: **cron-job.org** (grátis). *(O GitHub Actions não serve — a conta estava
  bloqueada por faturação.)*

**Se a BD voltar a adormecer:** confirmar que o job no **cron-job.org** está ativo e a apontar
para `https://agroconecta.pages.dev/api/keepalive`. Aceita GET/POST/HEAD. Resposta esperada:
`{ ok: true, supabase: 200, at: ... }`.

---

## 7. Variáveis de ambiente (Cloudflare Pages → Settings → Variables and Secrets)

**Nunca commitar segredos.** Nomes com `VITE_` são expostos ao browser (só pôr aí o que é público).

| Variável | Onde | Para quê |
|----------|------|----------|
| `VITE_SUPABASE_URL` | cliente + Functions | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | cliente | chave pública (segura de expor) |
| `VITE_GEMINI_API_KEY` | Function `ai-chat` | chave do Gemini (só server-side) |
| `VITE_ADMIN_EMAIL` | cliente | email que fica com role admin no 1.º login |
| `DEBITOPAY_API_KEY` | Function pagamentos | `sk_live_…` / `sk_test_…` |
| `DEBITOPAY_MERCHANT_ID` | Function pagamentos | UUID do merchant Debito Pay |
| `DEBITOPAY_WALLET_CODE` | Function pagamentos | código da carteira M‑Pesa |
| `SUPABASE_SERVICE_ROLE_KEY` | Functions | **secreta** — ativa o plano após pagamento (contorna RLS) |
| `SUPABASE_URL` | Functions | opcional (cai para `VITE_SUPABASE_URL`) |
| `MODO_TESTE` | Function pagamentos | **`off` = cobra o preço real**; ausente/qualquer outro = fase de testes (cobra 10 MT) |

Depois de mudar variáveis, é preciso **novo deploy** (Retry deployment ou um push).

---

## 8. Funcionalidades

- **Auth** (`src/features/auth/context/AuthContext.tsx`): Supabase Auth (email/password + Google).
  No 1.º login cria `profiles/{uid}`. Admin = email igual a `VITE_ADMIN_EMAIL` **ou** `role='admin'`.
  Rotas protegidas por `ProtectedRoute`; admin por `AdminRoute`.
- **Marketplace** (`src/features/marketplace/pages/Marketplace.tsx`): `properties` (terrenos com
  fotos) e `listings` (procura de terra, venda/procura de produtos). Botão único **"Publicar"**
  com menu por perfil. Cartões de listagem em "faixa colorida" (`ListingCard`). Filtro **"Guardados"**
  (favoritos, em `profiles.favoritos`). Números de telefone na descrição são **ocultados**
  (`scrubPhoneNumbers`). Área em **m²** (largura×comprimento).
- **Produção** (`src/features/producao/pages/Producao.tsx`): planos de cultivo + **calendário de
  tarefas por cultura** (sem IA, dados agronómicos com fontes) + **clima** (Open‑Meteo, sem chave) +
  "vender a colheita" (leva ao marketplace pré‑preenchido).
- **Negociações** (`src/features/negociacoes/pages/Negociacoes.tsx`): lista **estilo WhatsApp**;
  chat embutido (`mensagens`); o proprietário aceita/recusa; avaliações após aceite. Gated a premium.
- **Assistente IA** (`src/features/assistente/pages/AssistenteIA.tsx`): Gemini via `/api/ai-chat`.
  Português (tenta línguas locais). Suporta voz (Web Speech API, só Chrome).
- **Sistema de confiança:** selo **"Verificado"** (admin liga), **avaliações/estrelas**.
- **Documento de posse (DUAT/BI):** ver §9.

---

## 9. Pagamentos (Debito Pay · M‑Pesa)

- **Fluxo:** cliente mete o número → Function **`/api/initiate-payment`** chama o *Payment
  Orchestrator* da Debito Pay (`…/functions/v1/payment-orchestrator`, `Authorization: Bearer <API_KEY>`).
  O **M‑Pesa é SÍNCRONO** (a resposta já traz `status:success`) → a Function **ativa o plano** no
  Supabase via `service_role`. `/api/check-payment` é fallback. Animação de espera =
  `ProcessingAnimation` (a mesma do arranque).
- **Preços (mostrados):** Mensal **50** · Trimestral **135** (−10%) · Anual **500** (−~17%) MT.
  Definidos em `src/hooks/usePlanConfig.ts` (`DEFAULT_PRICES`) e no fallback do servidor
  (`PRECOS_FALLBACK`). Podem ser sobrepostos em **Admin → preços**.
- **⭐ MODO DE TESTE:** enquanto `MODO_TESTE` **não** for `off`, o M‑Pesa só cobra **10 MT**
  (o preço mostrado ao utilizador mantém‑se o real). **Para lançar:** pôr `MODO_TESTE=off` no
  Cloudflare + redeploy → passa a cobrar o valor real.
- **Cartões de plano:** estilo "cartão premium" (chip, contactless, logo, tier). **Clicar vira**
  o cartão e mostra os benefícios + Subscrever (`PlanoCard` em Perfil).
- **eMola/mKesh** (assíncronos) e **webhook** `payment.completed` (HMAC) ficam para depois.
- **Ativação manual (admin):** Admin → Utilizadores → seletor de plano (`adminSetUserPlan`).

### Documento de posse (verificação de dono real)
- Ao **publicar terreno**: campo opcional *"Documento de posse"* (imagem/PDF, ≤10 MB) → guardado
  no bucket **privado `documentos`**. `properties.documento_url` guarda o caminho.
- No anúncio: selo **"Com documento"**. O **admin** abre o documento via **URL assinado**
  (`getDocumentoUrl`), confirma, e liga o selo **"Verificado"**. Outros utilizadores **nunca** veem o documento.
- **⚠️ PENDENTE:** correr o SQL que cria a coluna + bucket + políticas RLS (ver §11). Sem isso, o
  upload de documento não funciona (publicar terreno **sem** documento continua a funcionar).

---

## 10. PWA (instalar no ecrã principal) e tema

- **Instalar:** `src/components/layout/InstallPWA.tsx` (cartão) + botão **"Instalar app"** na barra
  lateral (por cima de "Terminar Sessão"), ambos via o hook `usePwaInstall`.
  Android/Chrome → pedido nativo; iPhone/Safari → instruções (Partilhar → Adicionar ao ecrã principal).
- **Service worker:** `public/sw.js` (network‑first para navegação; cache‑first para assets).
  Forçar atualização = **incrementar `CACHE_VERSION`**.
- **Tema:** a app **arranca sempre em claro** (`App.tsx` `defaultTheme="light"`, `enableSystem=false`);
  a escolha do utilizador (toggle) fica guardada e é respeitada.

---

## 11. ⚠️ Pendências / o que falta para lançar

**Do teu lado (Supabase / Cloudflare):**
1. **SQL do documento de posse** — criar coluna + bucket privado + 3 políticas RLS:
   ```sql
   alter table public.properties add column if not exists documento_url text;
   insert into storage.buckets (id, name, public)
     values ('documentos','documentos', false) on conflict (id) do nothing;
   create policy "doc upload own" on storage.objects for insert to authenticated
     with check ( bucket_id = 'documentos' and (storage.foldername(name))[1] = auth.uid()::text );
   create policy "doc read own/admin" on storage.objects for select to authenticated
     using ( bucket_id = 'documentos' and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() ) );
   create policy "doc delete own/admin" on storage.objects for delete to authenticated
     using ( bucket_id = 'documentos' and ( (storage.foldername(name))[1] = auth.uid()::text or public.is_admin() ) );
   ```
2. Confirmar a **`SUPABASE_SERVICE_ROLE_KEY`** no Cloudflare **e** que o trigger
   `protect_profile_fields` já permite `service_role` (SQL no setup.sql / dado no chat) — senão o
   plano paga mas não ativa sozinho.
3. **No lançamento:** `MODO_TESTE=off` no Cloudflare (passa a cobrar o preço real) + redeploy.
4. Confirmar o **keep-alive** (cron-job.org) ativo (§6).

**A construir (código):**
5. **Termos de Uso + Política de Privacidade** (páginas não existem; links removidos até existirem).
6. **Contactos reais** no rodapé (email/WhatsApp/redes) — hoje sem contactos.
7. **Email de produção** (SMTP, ex.: Resend) para recuperação de senha fiável.
8. **eMola/mKesh** + **webhook** de pagamento (robustez para métodos assíncronos).

---

## 12. Mapa de ficheiros úteis

```
functions/api/
  ai-chat.ts            IA (Gemini) + retry/fallback de modelos
  initiate-payment.ts   pagamento M-Pesa (Debito Pay) + ativa plano + MODO_TESTE
  check-payment.ts      consulta de estado (fallback)
  keepalive.ts          keep-alive do Supabase
  payment-callback.ts   webhook (stub, para o futuro)
src/
  App.tsx               rotas + tema (arranca em claro) + <InstallPWA/>
  hooks/usePlanConfig.ts  preços dos planos (DEFAULT_PRICES)
  hooks/usePwaInstall.ts  estado de instalação PWA (partilhado)
  lib/services/storage.ts imagens (público) + documentos (privado, assinado)
  features/marketplace/…  Marketplace, PublishModal, ListingCard, favoritos, documento
  features/perfil/…       Perfil, PaymentModal (M-Pesa), PlanoCard (cartões premium)
  features/negociacoes/…  lista estilo WhatsApp, chat
  features/admin/…        painel admin (verificar, planos, preços, ver documento)
  components/layout/      Header (menu + Instalar app), Footer, BottomNav, InstallPWA
  components/ProcessingAnimation.tsx  animação (arranque + espera de pagamento)
public/
  sw.js                 service worker (CACHE_VERSION!)
  manifest.webmanifest  PWA
  images/               fotos + M-Pesa.png / Emola.png (nomes case-sensitive!)
supabase/setup.sql      esquema + RLS + triggers
docs/                   ARQUITETURA, MODELO_DADOS, CONFIGURACAO, este ficheiro
```

---

## 13. Notas/armadilhas já apanhadas

- **Case-sensitive no servidor (Linux):** referenciar ficheiros com o nome exato
  (ex.: `/images/M-Pesa.png`, `/images/Emola.png`).
- **`content-type` das respostas:** a Cloudflare devolve `200` com HTML de fallback para ficheiros
  inexistentes — verificar sempre o tipo (deu falsos positivos no keep-alive e em chunks JS).
- **Gemini sobrecarregado (503):** resolvido com **retry + fallback** de modelos
  (`gemini-flash-latest` → `gemini-2.5-flash` → `gemini-2.5-flash-lite`).
- **Dev server:** corre em **:8080** (não 5173) — ver `.claude/launch.json`.
