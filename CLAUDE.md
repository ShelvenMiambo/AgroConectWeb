# CLAUDE.md — Guia do projeto AgroConecta

Mapa de referência para qualquer pessoa (ou IA) que trabalhe neste repositório.

## O que é

AgroConecta é uma plataforma agrícola para Moçambique. Liga **agricultores**, **donos de
terrenos**, **vendedores** e **compradores** num só sítio: marketplace de terrenos/produtos,
gestão de produção (cultivos), negociações com chat, assistente de IA agrícola, e planos pagos
via mobile money (M-Pesa / eMola).

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + shadcn/ui (Radix) + lucide-react |
| Routing | react-router-dom v6 |
| Estado servidor | @tanstack/react-query |
| Auth | Firebase Authentication (email/password + Google) |
| Base de dados | Firebase Firestore |
| Ficheiros | Firebase Storage (imagens de propriedades) |
| Backend/API | Cloudflare Pages Functions (`functions/api/`) |
| IA | Google Gemini (via proxy server-side) |
| Pagamentos | PaySuite (M-Pesa / eMola) |
| Hosting | Cloudflare Pages (principal) / Firebase Hosting (alternativo) |

## Comandos

```sh
npm install        # instalar dependências
npm run dev        # servidor de desenvolvimento (Vite, http://localhost:5173)
npm run build      # build de produção -> dist/
npm run build:dev  # build em modo development
npm run lint       # ESLint
npm run preview    # pré-visualizar o build
```

Antes de correr: copiar `.env.example` para `.env.local` e preencher as variáveis
(ver [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md)). Sem `VITE_PAYSUITE_API_KEY`, os
pagamentos correm em **modo de simulação** (apenas em dev).

## Estrutura de pastas (arquitetura feature-based)

Cada funcionalidade vive numa pasta própria em `src/features/`, com a sua página, componentes
e serviços de dados. O que é transversal (usado por ≥2 features) fica no núcleo partilhado.

```
src/
  App.tsx · main.tsx · index.css
  features/                       UI + dados por funcionalidade
    landing/    pages/Index · components/HeroSection, FeaturesSection
    auth/       pages/Login · context/AuthContext · components/ProtectedRoute, AdminRoute
    marketplace/ pages/Marketplace · services/{properties,listings,favoritos}
    producao/   pages/Producao · services/{producao,alertas,ocorrencias}
    negociacoes/ pages/Negociacoes · components/ChatModal · services/negociacoes
    assistente/ pages/AssistenteIA
    perfil/     pages/Perfil · services/account
    admin/      pages/Admin · services/adminService
  components/                     Núcleo de UI partilhado
    layout/   Header, Footer, BottomNav, ScrollToTop, OnboardingModal
    theme/    theme-provider, theme-toggle
    ui/       Primitivos shadcn/ui
  pages/      NotFound
  lib/        Infra partilhada
    firebase.ts · env.ts · utils.ts · paysuiteService.ts
    services/  storage.ts, sanitize.ts (partilhados pelo marketplace)
  hooks/      use-toast, usePlanConfig
  types/      Tipos de domínio partilhados (Property, Listing, Negociacao, ...)
functions/api/   Cloudflare Pages Functions (ai-chat, initiate-payment, check-payment, payment-callback)
docs/            Documentação (arquitetura, modelo de dados, configuração)
firestore.rules · storage.rules   Regras de segurança
```

**Regra de organização**: feature = UI + serviços do seu domínio; uma feature pode importar a
API pública de outra (ex.: `perfil/services/account` usa `marketplace/services`). Não existe
barrel `firestoreService` — importa-se diretamente do serviço da feature ou de `@/types`.

## Fluxos principais

- **Auth** — `src/contexts/AuthContext.tsx`. No primeiro login cria o doc em `users/{uid}`.
  O papel `admin` é atribuído automaticamente se o email corresponder a `VITE_ADMIN_EMAIL`.
  Rotas protegidas via `ProtectedRoute`; rotas de admin via `AdminRoute`.
- **Marketplace** — `properties` (terrenos com imagens) e `listings` (ofertas/procuras de
  produtos). Números de telefone na descrição são ocultados automaticamente (`scrubPhoneNumbers`).
- **Negociações** — `negociacoes` com chat embutido (campo `mensagens`). Apenas as duas partes
  leem; o proprietário aceita/recusa.
- **Pagamentos** — cliente (`paysuiteService.ts`) → Function `initiate-payment` → STK push no
  telemóvel → polling `check-payment` e/ou webhook `payment-callback` → ativa `plan` no doc do user.
- **IA** — `AssistenteIA.tsx` → Function `ai-chat` → Gemini. Suporta voz (Web Speech API:
  reconhecimento + síntese), apenas em browsers compatíveis (Chrome).

Detalhes: [docs/ARQUITETURA.md](docs/ARQUITETURA.md) · [docs/MODELO_DADOS.md](docs/MODELO_DADOS.md).

## Convenções

- UI e textos em **português** (variante de Moçambique).
- Componentes UI vêm de `@/components/ui` (shadcn). Importar com o alias `@/` (= `src/`).
- Serviços de dados ficam em `src/lib/services/` e são reexportados por `firestoreService.ts`.
- Não expor chaves sensíveis no cliente: chamadas a IA e pagamentos passam pelas Functions.
- Toda a escrita no Firestore tem de respeitar `firestore.rules`.
