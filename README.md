# AgroConecta 🌱

Plataforma agrícola para Moçambique que liga **agricultores**, **donos de terrenos**,
**vendedores** e **compradores**. Inclui marketplace de terrenos e produtos, gestão de
produção, negociações com chat, assistente de IA agrícola e planos pagos via M-Pesa / eMola.

## Stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui · Firebase (Auth/Firestore/Storage) ·
Cloudflare Pages Functions · Google Gemini · PaySuite.

## Começar

```sh
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local   # depois preencher (ver docs/CONFIGURACAO.md)

# 3. Correr em desenvolvimento
npm run dev                  # http://localhost:5173
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | build de produção (`dist/`) |
| `npm run build:dev` | build em modo development |
| `npm run lint` | ESLint |
| `npm run preview` | pré-visualizar o build |

## Documentação

- [CLAUDE.md](CLAUDE.md) — mapa do projeto (estrutura, comandos, convenções)
- [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — como as peças se ligam
- [docs/MODELO_DADOS.md](docs/MODELO_DADOS.md) — coleções Firestore e regras
- [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md) — variáveis de ambiente e deploy

## Deploy

Deploy principal em **Cloudflare Pages** (build `npm run build`, output `dist`, Functions
detetadas automaticamente). Ver [docs/CONFIGURACAO.md](docs/CONFIGURACAO.md) para detalhes,
incluindo as variáveis de ambiente do servidor e a configuração do webhook PaySuite.
