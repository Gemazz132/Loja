# AURUM — Loja de Dropshipping + Painel Unificado

Loja de roupa **AURUM** com frontend, base de dados e um painel de administração
centralizado (Dashboard) que junta a gestão da loja (produtos, encomendas,
clientes, cupões) com CMS, RBAC, plugins e analytics internos.

> O antigo painel `admin/` (HTML/CSS/JS estático) foi **removido por completo**
> e substituído pelo painel React descrito abaixo. Ver `ARCHITECTURE.md` para
> o plano de fusão completo com o "Project Bolt" e o racional de cada decisão.

## Stack

- **Backend:** Node.js + Express + SQLite (`better-sqlite3`)
- **Painel de administração:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui (Radix primitives)
- **Autenticação:** sessões (`express-session`) + `bcryptjs`, com RBAC (Administrador/Editor/Autor)
- **Upload de imagens:** `multer` (imagem principal + galeria multi-imagem por produto)
- **Email:** `nodemailer` (opcional — sem SMTP configurado corre em modo dev, só regista no terminal)

## Estrutura

```
aurum-store/                        # Backend (Express) + loja pública
├── server.js
├── db/
│   ├── schema.sql
│   ├── migrations/002_dashboard.sql # RBAC, CMS, cupões, plugins, site_config
│   ├── database.js                  # aplica schema.sql + todas as migrations automaticamente
│   └── aurum.db
├── scripts/seed.js                  # admin inicial (role=admin) + 12 produtos
├── src/
│   ├── middleware/{auth,rbac,upload}.js
│   ├── routes/                      # auth, products, checkout, admin, coupons, cms, team, settings, plugins, analytics, config
│   ├── plugins/loader.js            # carrega plugins activos no arranque
│   └── utils/{helpers,mailer}.js
├── plugins/exemplo-formulario-contacto/   # plugin de exemplo (routes.js + plugin.json)
├── public/                          # Loja pública — inalterada na stack, com carrossel de fotos no produto
└── admin-dashboard-dist/            # Build do painel (gerada por `npm run build` em admin-dashboard/)

admin-dashboard/                     # Painel de administração (React + shadcn/ui)
├── src/lib/{api.ts,auth.tsx,theme.tsx,utils.ts}  # cliente de API + contexto de sessão/permissões + tema dark/light
├── src/components/ui/               # Componentes shadcn/ui (button, card, dialog, table, select, etc.)
├── src/components/{layout,shared}/  # Sidebar, TopBar, PageHeader, StatusBadge
├── src/pages/                       # Dashboard, Products, Orders, Customers, Coupons, Content, Team, Plugins, Analytics, Settings, Login
└── package.json
```

## Como correr localmente

### 1. Backend (loja + API + painel servido em produção)

```bash
cd aurum-store
npm install
cp .env.example .env
#   edita o .env e define SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm run seed          # cria o admin inicial (role=admin) + 12 produtos
npm start             # produção
npm run dev           # com auto-reload (node --watch)
```

- Loja: <http://localhost:3000>
- Painel: <http://localhost:3000/admin/> (serve o build de `admin-dashboard-dist/`)

### 2. Painel de administração — desenvolvimento com hot-reload

Em desenvolvimento, corre o Vite à parte (com proxy automático para `/api` no
backend acima) em vez de teres de fazer build a cada alteração:

```bash
cd admin-dashboard
npm install
npm run dev            # abre em http://localhost:5173, chamadas /api vão para :3000
```

Para gerar a versão final servida pelo Express:

```bash
cd admin-dashboard
npm run build          # gera ../aurum-store/admin-dashboard-dist
```

**Credenciais de admin por defeito** (definidas no `.env`): `admin@aurum.pt` / `admin123`
> ⚠️ Altera estas credenciais e o `SESSION_SECRET` antes de pôr online.

## Base de dados

| Tabela | Descrição |
| --- | --- |
| `admins` | Administradores do painel (password com bcrypt) + `role_id` (RBAC) |
| `roles` / `permissions` / `role_permissions` | Administrador / Editor / Autor e as permissões de cada um |
| `utilizadores` | Clientes (criados no registo ou automaticamente no checkout) |
| `produtos` | Catálogo (preço, promoção, imagem + `imagens_extra` galeria, categoria, tamanhos, cores, stock, ativo) |
| `encomendas` / `encomenda_itens` | Encomendas e respectivas linhas |
| `cupoes` | Códigos de desconto (percentagem ou valor fixo, validade, limite de usos) |
| `cms_paginas` / `cms_posts` / `cms_categorias` / `media` | Conteúdo (páginas, posts, biblioteca de media) |
| `configuracoes` / `site_config` | Portes de envio, título do site, idioma, tema/cores, logótipo |
| `plugins_instalados` | Que plugins estão activos e a sua configuração |
| `eventos_analytics` | Contagem interna de visitas/eventos (sem serviço externo) |

**Estados da encomenda:** `Pendente` → `Pago` → `Preparação` → `Enviado` → `Entregue` (ou `Cancelado`).
Ao avançar o estado no painel, o cliente é notificado por email (via `nodemailer`).

## API (resumo)

### Pública
- `GET /api/products` / `GET /api/products/:id`
- `POST /api/checkout` — cria encomenda (aceita `cupom` opcional), baixa stock, gera nº de encomenda curto
- `GET /api/config` — portes de envio (fonte única para loja + checkout)
- `GET /api/cms/paginas/:slug`, `GET /api/cms/posts` — conteúdo publicado
- `GET /api/site-config` — tema/logótipo público
- `POST /api/analytics/evento` — tracking anónimo de pageviews

### Admin (sessão + permissão RBAC)
- `POST/GET /api/admin/{login,logout,me}` — `me` devolve `role` + `permissoes`
- `GET/POST/PUT/DELETE /api/admin/products` (+ `/upload`, `/upload-multi` para galeria)
- `GET /api/admin/orders`, `PATCH /api/admin/orders/:id/estado` (com notificação por email)
- `GET /api/admin/customers`
- `GET/POST/PUT/DELETE /api/admin/coupons`
- `GET/POST/PUT/DELETE /api/admin/cms/{paginas,posts,categorias,media}`
- `GET/POST/PUT/DELETE /api/admin/team` — gestão de equipa (RBAC)
- `GET/PUT /api/admin/settings` — título, idioma, tema, logótipo
- `GET/PUT /api/admin/plugins/:pasta/estado` — activar/desactivar plugins
- `GET /api/admin/analytics/resumo`
- `GET /api/admin/db/tabelas` — mini-visualizador da base de dados (substituto do phpMyAdmin)

## Plugins

Cada plugin vive em `plugins/<nome>/` com um `plugin.json` (manifesto) e um
`routes.js` opcional (`module.exports = (app, config) => { ... }`). O loader
(`src/plugins/loader.js`) monta as rotas dos plugins marcados como activos na
tabela `plugins_instalados` no arranque do servidor. Ver
`plugins/exemplo-formulario-contacto/` para um exemplo completo.

## Deploy

Continua a ser um único serviço Node:

1. Define as variáveis de ambiente (`NODE_ENV=production`, `SESSION_SECRET`, `ADMIN_*`, `DB_PATH` se usares disco persistente, `PORT`).
2. `cd admin-dashboard && npm install && npm run build` (gera `aurum-store/admin-dashboard-dist`).
3. `cd aurum-store && npm install && npm run seed && npm start`.
4. Garante persistência do ficheiro `db/aurum.db` (ou define `DB_PATH` para um disco persistente) e da pasta `public/uploads/`.
5. Serve atrás de HTTPS (os cookies de sessão usam `secure` em produção).

> ⚠️ Em hosts com sistema de ficheiros efémero (sem disco persistente), a base
> de dados SQLite reinicia a cada deploy — usa `DB_PATH` apontado para um
> volume persistente, ou migra para PostgreSQL para escalar a vários servidores.
