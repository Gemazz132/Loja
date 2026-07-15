-- AURUM schema

CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS utilizadores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  telefone TEXT,
  morada TEXT,
  cidade TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'Portugal',
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS produtos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  descricao TEXT,
  descricao_longa TEXT,
  preco REAL NOT NULL,
  preco_promocional REAL,
  categoria TEXT,
  imagem TEXT,
  imagens_extra TEXT DEFAULT '[]',
  tamanhos TEXT DEFAULT '[]',
  cores TEXT DEFAULT '[]',
  stock INTEGER DEFAULT 0,
  ativo INTEGER DEFAULT 1,
  destaque INTEGER DEFAULT 0,
  material TEXT,
  instrucoes_lavagem TEXT,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS encomendas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  numero TEXT UNIQUE NOT NULL,
  utilizador_id INTEGER REFERENCES utilizadores(id),
  nome_cliente TEXT NOT NULL,
  email_cliente TEXT NOT NULL,
  telefone_cliente TEXT,
  morada TEXT,
  cidade TEXT,
  codigo_postal TEXT,
  pais TEXT DEFAULT 'Portugal',
  subtotal REAL,
  desconto REAL DEFAULT 0,
  portes REAL DEFAULT 0,
  total REAL NOT NULL,
  estado TEXT DEFAULT 'Pendente',
  pagamento TEXT DEFAULT 'Pendente',
  metodo_pagamento TEXT,
  notas TEXT,
  arquivada INTEGER DEFAULT 0,
  arquivada_em DATETIME,
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS encomenda_itens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  encomenda_id INTEGER NOT NULL REFERENCES encomendas(id),
  produto_id INTEGER REFERENCES produtos(id),
  nome_produto TEXT NOT NULL,
  preco_unitario REAL NOT NULL,
  quantidade INTEGER NOT NULL,
  tamanho TEXT,
  cor TEXT
);

CREATE TABLE IF NOT EXISTS favoritos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  utilizador_id INTEGER NOT NULL REFERENCES utilizadores(id),
  produto_id INTEGER NOT NULL REFERENCES produtos(id),
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(utilizador_id, produto_id)
);
