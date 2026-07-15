# AURUM — Plano de Fusão: Loja + Dashboard Unificado

## 0. Diagnóstico dos dois projetos

| | **Aurum Store** (atual) | **Project Bolt** (`project-bolt-sb1-4ptcvgds.zip`) |
|---|---|---|
| Stack | Node.js + Express + SQLite (`better-sqlite3`), sessões, admin em HTML/CSS/JS puro | React 18 + TypeScript + Vite + **AWS Cloudscape Design System** |
| Backend | ✅ Completo — auth, produtos, encomendas, clientes, checkout | ❌ Nenhum — é só frontend, com dados mock (`src/data.ts`) |
| Autenticação | ✅ `express-session` + bcrypt | ❌ Não existe (nenhum login) |
| Páginas | Dashboard, Produtos, Encomendas, Clientes, Definições, BD (as que criei há pouco) | Dashboard, Products, Orders, Customers, Settings (mock) |
| RBAC / CMS / Cupões / Plugins / Analytics | ❌ Não existe | ❌ Não existe |
| Visual | Paleta dourado/preto "luxo", handcrafted CSS | Cloudscape (estilo consola AWS — azul/cinzento, muito "enterprise", não "loja de moda") |

**Conclusão prática:** o Project Bolt é um *protótipo visual* (bom para estrutura de tabelas, filtros e paginação), não um produto com backend. A fusão real é: **manter o backend Express/SQLite do Aurum como única fonte de verdade**, e usar o Project Bolt como ponto de partida para a *casca* do novo dashboard — mas rebrandizado, porque o Cloudscape "de fábrica" não combina com a identidade AURUM (dourado/preto/luxo). Vou assinalar isto como uma decisão a validar contigo antes de investir tempo a "pintar" o Cloudscape.

> ⚠️ **Ponto de decisão:** o Cloudscape é ótimo para densidade de dados (tabelas, filtros), mas tem uma linguagem visual muito "AWS Console". Duas opções:
> **A)** Usar Cloudscape e aplicar os *design tokens* dele com as cores AURUM (dá para customizar via `@cloudscape-design/design-tokens`, mas o resultado nunca vai parecer "boutique de luxo").
> **B)** Aproveitar a *estrutura* das páginas do Project Bolt (colunas de tabela, filtros, lógica) mas reconstruir a UI com Tailwind/componentes próprios, coerente com o `admin/css/admin.css` que já existe e que a loja usa.
> **Recomendação:** opção B para o painel principal (fica visualmente unificado com a loja), mas o plano abaixo é escrito de forma a funcionar com qualquer uma das duas — a camada de dados (API) é igual.

---

## 1. Decisão de arquitetura

- **Um único backend** (Express + SQLite) serve tudo: loja pública, checkout, e a nova API de administração/CMS.
- **Um único frontend de administração** substitui por completo `admin/` (HTML/CSS/JS antigo). O painel antigo é **removido**, não mantido em paralelo.
- A loja pública (`public/`) **não muda de stack** — continua HTML/CSS/JS puro, apenas consome mais dados da API nova (ex: posts do blog, cupões).
- Adiciono **RBAC** (roles), **CMS**, **cupões**, **plugins modulares** e **analytics** como módulos novos no mesmo backend — não como microserviços separados, para não complicar o deploy (mantém-se "um único serviço Node" como o README já promete).

---

## 2. Estrutura de pastas proposta (monorepo, 2 pacotes)

```
aurum/
├── server/                        # Backend único (era a raiz do Aurum Store)
│   ├── server.js
│   ├── db/
│   │   ├── database.js
│   │   ├── schema.sql             # schema base (produtos, encomendas, clientes...)
│   │   └── migrations/
│   │       └── 002_dashboard.sql  # NOVO: roles, cms, cupões, plugins, analytics
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── upload.js
│   │   │   └── rbac.js            # NOVO
│   │   ├── routes/
│   │   │   ├── auth.js / userAuth.js / account.js / products.js / checkout.js
│   │   │   ├── admin.js           # dashboard, produtos, encomendas, clientes (existente)
│   │   │   ├── team.js            # NOVO — gestão de membros da equipa (RBAC)
│   │   │   ├── cms.js             # NOVO — páginas, posts, categorias, media
│   │   │   ├── coupons.js         # NOVO — cupões de desconto
│   │   │   ├── plugins.js         # NOVO — activar/desactivar módulos
│   │   │   ├── analytics.js       # NOVO — tráfego e eventos
│   │   │   └── settings.js        # NOVO — título do site, idioma, slugs, tema
│   │   └── utils/helpers.js
│   └── public/                    # Loja pública (inalterada na stack)
│
├── admin-dashboard/                # NOVO — substitui por completo admin/
│   ├── src/
│   │   ├── lib/api.ts             # wrapper fetch para o backend Express
│   │   ├── lib/auth.tsx           # contexto de sessão + guarda de rotas por role
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx      # gráficos de vendas, KPIs, top produtos
│   │   │   ├── Products.tsx       # + multi-imagem + variantes + alertas de stock
│   │   │   ├── Orders.tsx         # + estado + notificar cliente
│   │   │   ├── Customers.tsx      # + histórico + LTV
│   │   │   ├── Coupons.tsx        # NOVO
│   │   │   ├── Content/           # NOVO — CMS (Pages, Posts, Media, Categories)
│   │   │   ├── Team.tsx           # NOVO — RBAC
│   │   │   ├── Plugins.tsx        # NOVO
│   │   │   ├── Analytics.tsx      # NOVO
│   │   │   └── Settings.tsx       # tema, cores, logótipo, slugs, segurança
│   │   └── App.tsx
│   └── package.json
│
└── plugins/                        # Módulos opcionais (ex: formulário de contacto, SEO)
    └── exemplo-newsletter/
        └── plugin.json
```

**O que desaparece:** `admin/login.html`, `admin/index.html`, `admin/css/admin.css`, `admin/js/admin.js` — tudo substituído pelo `admin-dashboard/` (SPA em React), servido como build estático em `/admin` pelo mesmo Express (`express.static`), tal como o `admin/` antigo era servido.

---

## 3. Modelo de dados — o que é preciso acrescentar

O schema atual (`produtos`, `encomendas`, `utilizadores`, `admins`, `favoritos`) mantém-se. Novas tabelas (ver `server/db/migrations/002_dashboard.sql` com o SQL completo):

| Tabela | Para quê |
|---|---|
| `roles` / `admin_roles` | RBAC — Administrador / Editor / Autor, e a relação admin↔role |
| `permissions` | Lista de permissões atómicas (`produtos.editar`, `encomendas.ver`, `cms.publicar`, ...) |
| `role_permissions` | Que permissões cada role tem |
| `cms_paginas` | Páginas estáticas (Sobre, Termos, FAQ...) |
| `cms_posts` | Artigos de blog/editorial |
| `cms_categorias` | Categorias partilhadas entre posts e produtos |
| `media` | Biblioteca de imagens/vídeos (em vez de imagens soltas por produto) |
| `cupoes` | Códigos de desconto, regras, validade |
| `plugins_instalados` | Que módulos estão activos e a sua configuração (JSON) |
| `site_config` | Título do site, idioma, slug base, tema/cores, definições de segurança |
| `eventos_analytics` | Registo leve de visitas/eventos (sem serviço externo) |

`produtos.tamanhos`/`cores` já existem como JSON — ficam, só passam a ser geridos por um editor de variantes mais rico no novo painel.

---

## 4. RBAC — como funciona

- Cada admin tem uma `role` (`admin`, `editor`, `autor`).
- `admin`: tudo. `editor`: CMS + produtos + encomendas, sem gerir equipa/definições de segurança. `autor`: só CMS (posts/páginas), sem acesso a vendas/clientes.
- Middleware `rbac.js` (ver código) — `requirePermission('produtos.editar')` em vez de um único `requireAdmin` genérico.
- **Migração suave:** o admin existente (`admins` table) passa a ter `role='admin'` por omissão — ninguém perde acesso na transição.

---

## 5. Plugins — como ficam "modulares" sem virar um framework de plugins a sério

Dado que isto corre num único processo Node (não WordPress), a forma pragmática de ter "instalação de plugins" é:

1. Cada plugin é uma pasta em `plugins/<nome>/plugin.json` + `routes.js` (opcional) + `hooks.js` (opcional).
2. Um `plugin.json` descreve nome, versão, se precisa de rotas de API, e um schema de configuração.
3. A tabela `plugins_instalados` guarda quais estão **activos** e a sua config (ex: chave de API do módulo de SEO).
4. No arranque do servidor, um pequeno *loader* (`server/src/plugins/loader.js`) lê `plugins_instalados`, e para cada um activo faz `require('../../plugins/<nome>/routes')(app)` se existir.
5. No painel, a página **Plugins.tsx** lista as pastas disponíveis em `plugins/` + estado (activo/inactivo) e permite activar/desactivar (grava na tabela, não precisa reiniciar o processo se os hooks forem carregados de forma lazy).

Isto dá verdadeira modularidade sem reinventar um sistema de plugins tipo WordPress (que seria over-engineering para este projecto).

---

## 6. Roteiro por fases (o que eu sugiro implementar por esta ordem)

| Fase | Conteúdo | Risco/esforço |
|---|---|---|
| **1** | Migração SQL (roles, cms, cupões, plugins, settings) + RBAC middleware + migrar admin existente para `role='admin'` | Baixo |
| **2** | Scaffold do `admin-dashboard/` (login, layout, guarda de rotas), ligado à API já existente (produtos, encomendas, clientes, dashboard) — **isto já substitui o painel antigo com paridade de funcionalidades** | Médio |
| **3** | Upload múltiplo de imagens + carrossel na ficha de produto da loja pública (a parte de upload múltiplo já ficou pronta no backend na conversa anterior — falta ligar ao novo frontend) | Baixo (já feito no backend) |
| **4** | Alertas de stock (badges vermelho/amarelo) + gestão de encomendas com "notificar cliente" (email via `nodemailer`, já é dependência do projecto) | Baixo–Médio |
| **5** | Cupões (criar código, %, validade) + aplicar no checkout da loja | Médio |
| **6** | CMS (páginas/posts/media/categorias) + páginas públicas geradas a partir do CMS | Médio–Alto |
| **7** | Equipa & RBAC no painel (UI de convites/permissões) | Médio |
| **8** | Definições de design (logótipo, cores, tema) — grava em `site_config`, loja lê e aplica via CSS variables | Médio |
| **9** | Analytics interno (contagem de visitas/eventos, sem serviço externo) — ou alternativa: instruções para ligar Plausible/Umami (mais realista do que reinventar analytics) | Alto se for "a sério" |
| **10** | Plugins (loader + 1 plugin de exemplo: formulário de contacto) | Médio |

Cada fase é entregável e testável isoladamente — não é preciso esperar pelas 10 para teres um painel novo a funcionar (a Fase 2 já dá isso).

---

## 7. Ficheiros de código incluídos neste pacote

- `server/db/migrations/002_dashboard.sql` — todas as tabelas novas
- `server/src/middleware/rbac.js` — permissões por role
- `server/src/routes/coupons.js` — CRUD de cupões + validação no checkout
- `server/src/routes/cms.js` — páginas/posts/categorias/media
- `server/src/routes/team.js` — gestão de equipa (RBAC)
- `server/src/routes/settings.js` — título do site, idioma, slugs, tema, segurança
- `server/src/plugins/loader.js` — carregador de plugins
- `plugins/exemplo-newsletter/plugin.json` — exemplo de manifesto de plugin
- `admin-dashboard/src/lib/api.ts` — cliente de API tipado (substitui `data.ts` mock)
- `admin-dashboard/src/pages/Products.tsx` — exemplo de página do Project Bolt **religada a dados reais**, com upload múltiplo, variantes e badge de stock

Estes ficheiros são o esqueleto/arranque — não é o CMS completo nem o RBAC UI completo (isso é trabalho de várias semanas de um projecto real), mas dá-te uma base sólida e consistente para continuarmos fase a fase.
