-- 003_activity_log.sql — Registo de atividade dos administradores
-- Idempotente (CREATE TABLE IF NOT EXISTS) — seguro correr em bases já existentes.

CREATE TABLE IF NOT EXISTS logs_atividade (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER REFERENCES admins(id),
  admin_nome TEXT,                  -- desnormalizado: mantém o nome mesmo que o admin seja removido
  acao TEXT NOT NULL,               -- ex: 'produto.criar', 'encomenda.estado'
  entidade TEXT,                    -- ex: 'produto', 'encomenda'
  entidade_id TEXT,                 -- id/numero do alvo (texto para aceitar nº de encomenda)
  detalhe TEXT,                     -- descrição legível da ação
  criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_logs_data ON logs_atividade(criado_em);

-- Nova permissão para ver o registo de atividade (só admin por omissão).
INSERT OR IGNORE INTO permissions (chave) VALUES ('logs.ver');
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
  SELECT (SELECT id FROM roles WHERE nome = 'admin'), id FROM permissions WHERE chave = 'logs.ver';
