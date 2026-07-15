-- 002_dashboard.sql — RBAC, CMS, cupões, plugins e definições de site
-- Idempotente (CREATE TABLE IF NOT EXISTS) — seguro correr em bases já existentes.

-- ── RBAC ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT UNIQUE NOT NULL,        -- 'admin' | 'editor' | 'autor'
  descricao TEXT
);
INSERT OR IGNORE INTO roles (nome, descricao) VALUES
  ('admin',  'Acesso total ao painel'),
  ('editor', 'Gere produtos, encomendas, clientes e conteúdo'),
  ('autor',  'Gere apenas conteúdo (páginas/posts)');

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chave TEXT UNIQUE NOT NULL        -- ex: 'produtos.editar'
);
INSERT OR IGNORE INTO permissions (chave) VALUES
  ('produtos.ver'), ('produtos.editar'),
  ('encomendas.ver'), ('encomendas.editar'),
  ('clientes.ver'),
  ('cupoes.editar'),
  ('cms.ver'), ('cms.editar'), ('cms.publicar'),
  ('equipa.editar'),
  ('definicoes.editar'),
  ('plugins.editar'),
  ('analytics.ver');

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id),
  permission_id INTEGER NOT NULL REFERENCES permissions(id),
  PRIMARY KEY (role_id, permission_id)
);
-- admin = todas as permissões
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
  SELECT (SELECT id FROM roles WHERE nome = 'admin'), id FROM permissions;
-- editor = tudo excepto equipa/definições/plugins
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
  SELECT (SELECT id FROM roles WHERE nome = 'editor'), id FROM permissions
  WHERE chave NOT IN ('equipa.editar', 'definicoes.editar', 'plugins.editar');
-- autor = só CMS
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
  SELECT (SELECT id FROM roles WHERE nome = 'autor'), id FROM permissions
  WHERE chave IN ('cms.ver', 'cms.editar');

-- A coluna admins.role_id é adicionada de forma guardada em db/database.js
-- (ALTER TABLE ADD COLUMN não é idempotente em SQLite, por isso não fica aqui).

-- ── CMS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cms_categorias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS cms_paginas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  conteudo TEXT,
  estado TEXT DEFAULT 'rascunho',   -- rascunho | publicado
  autor_id INTEGER REFERENCES admins(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cms_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  resumo TEXT,
  conteudo TEXT,
  imagem_capa TEXT,
  categoria_id INTEGER REFERENCES cms_categorias(id),
  estado TEXT DEFAULT 'rascunho',
  autor_id INTEGER REFERENCES admins(id),
  publicado_em DATETIME,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  tipo TEXT DEFAULT 'imagem',       -- imagem | video
  nome_original TEXT,
  tamanho_bytes INTEGER,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Cupões ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cupoes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo TEXT UNIQUE NOT NULL,          -- ex: 'GYM20'
  tipo TEXT NOT NULL DEFAULT 'percentagem', -- percentagem | fixo
  valor REAL NOT NULL,                  -- 20 (=20%) ou 10 (=10€)
  valido_de DATETIME,
  valido_ate DATETIME,
  usos_maximos INTEGER,                 -- NULL = ilimitado
  usos_atuais INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ── Plugins ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plugins_instalados (
  nome TEXT PRIMARY KEY,             -- corresponde à pasta em /plugins/<nome>
  ativo INTEGER DEFAULT 0,
  config TEXT DEFAULT '{}'
);

-- ── Definições gerais do site ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_config (
  chave TEXT PRIMARY KEY,
  valor TEXT
);
INSERT OR IGNORE INTO site_config (chave, valor) VALUES
  ('titulo_site', 'AURUM'),
  ('idioma', 'pt-PT'),
  ('cor_primaria', '#B8965A'),
  ('cor_fundo', '#0E0E0E'),
  ('logotipo_url', '');

-- ── Analytics leve (sem serviço externo) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS eventos_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo TEXT NOT NULL,                -- 'pageview' | 'add_to_cart' | 'checkout' ...
  pagina TEXT,
  referrer TEXT,
  utilizador_id INTEGER REFERENCES utilizadores(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eventos_tipo_data ON eventos_analytics(tipo, criado_em);
