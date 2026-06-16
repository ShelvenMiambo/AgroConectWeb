# Modelo de dados — AgroConecta (Firestore)

Coleções, campos e regras de segurança. Os tipos canónicos estão em `src/types/`
(reexportados por `src/lib/firestoreService.ts`) e em `src/contexts/AuthContext.tsx`.

## `users/{uid}`

Perfil do utilizador. Criado no primeiro login.

| Campo | Tipo | Notas |
|-------|------|-------|
| `uid` | string | = id do doc |
| `uidPrefix` | string | primeiros 8 chars do uid; usado pelo webhook de pagamento |
| `name` | string | |
| `email` | string | |
| `phone` | string? | |
| `role` | `'user' \| 'admin'` | admin atribuído via `VITE_ADMIN_EMAIL` |
| `userType` | `'agricultor'\|'proprietario'\|'vendedor'\|'comprador'\|'pendente'` | perfil principal |
| `userTypes` | string[]? | múltiplos perfis |
| `plan` | `'gratuito'\|'mensal'\|'trimestral'\|'anual'` | |
| `planAtivadoEm` | string? | ISO date |
| `planExpiraEm` | string? | ISO date |
| `favoritos` | string[]? | propertyIds guardados pelo utilizador |
| `photoURL` | string? | |
| `createdAt` | timestamp | |

**Regras**: o próprio lê/cria/atualiza o seu doc; não pode mudar `role`/`plan`/`planAtivadoEm`/
`planExpiraEm` (só admin/webhook). Pode mudar `userType` (validado) e `favoritos`. Admin lê/escreve tudo.

## `properties/{id}`

Terrenos do marketplace.

| Campo | Tipo |
|-------|------|
| `nome`, `localizacao`, `descricao` | string |
| `area`, `preco` | number |
| `tipo_solo` | `'argiloso'\|'arenoso'\|'franco'` |
| `disponibilidade_agua` | boolean |
| `culturas` | string[] |
| `donoUid`, `donoNome` | string |
| `verificado` | boolean |
| `imageUrls` | string[]? (Firebase Storage) |
| `createdAt` | timestamp |

**Regras**: leitura por autenticados; criação só pelo dono (com campos obrigatórios e validação
de `nome`≥3 e `area`>0); update/delete só pelo dono ou admin.

## `listings/{id}`

Ofertas/procuras de produtos e procura de terra.

| Campo | Tipo |
|-------|------|
| `listingType` | `'terra-procura'\|'produto-oferta'\|'produto-procura'` |
| `titulo`, `descricao` | string |
| `localizacao` | string? |
| `area`, `preco` | number? |
| `tipo_solo` | string? |
| `produtos` | string[]? |
| `quantidade` | string? |
| `autorUid`, `autorNome` | string |
| `createdAt` | timestamp |

**Regras**: leitura por autenticados; criação só pelo autor; update/delete só pelo autor ou admin.

## `producao/{id}`

Planos de cultivo (privados do utilizador).

| Campo | Tipo |
|-------|------|
| `uid` | string (dono) |
| `cultura`, `propriedade` | string |
| `area` | number |
| `dataInicio`, `dataColheita` | string |
| `progresso` | number (0–100) |
| `status` | `'Em Andamento'\|'Quase Pronto'\|'Finalizado'` (derivado do progresso) |
| `notas` | string? |
| `createdAt` | timestamp |

**Regras**: só o dono (ou admin) lê/escreve.

## `alertas/{id}`

Alertas por plano de produção.

| Campo | Tipo |
|-------|------|
| `uid`, `planoId`, `planoNome` | string |
| `tipo` | `'Clima'\|'Pragas'\|'Irrigação'\|'Outro'` |
| `titulo`, `descricao` | string |
| `urgencia` | `'alta'\|'media'\|'baixa'` |
| `lido` | boolean |
| `createdAt` | timestamp |

**Regras**: só o dono (ou admin).

## `ocorrencias/{id}`

Registos de ocorrências num plano.

| Campo | Tipo |
|-------|------|
| `uid`, `planoId`, `planoNome` | string |
| `tipo` | `'Aplicação'\|'Observação'\|'Problema'` |
| `descricao`, `data` | string |
| `fotos` | number? |
| `createdAt` | timestamp |

**Regras**: só o dono (ou admin).

## `negociacoes/{id}`

Propostas de arrendamento com chat embutido.

| Campo | Tipo |
|-------|------|
| `propertyId`, `propertyNome` | string |
| `arrendatarioUid`, `arrendatarioNome` | string |
| `proprietarioUid`, `proprietarioNome` | string |
| `mensagem` | string (mensagem inicial) |
| `mensagens` | `{senderId,text,createdAt}[]` (histórico de chat) |
| `status` | `'pendente'\|'aceite'\|'recusada'` |
| `createdAt` | timestamp |

**Regras**: leem as duas partes (e admin); cria o arrendatário (status `pendente`); o
proprietário muda o `status` para `aceite`/`recusada`; qualquer das partes pode acrescentar
ao `mensagens` (chat). Delete só admin.

## `config/{docId}`

Configuração da app (ex.: preços dos planos).

**Regras**: leitura por autenticados; escrita só admin.
