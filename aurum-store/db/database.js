'use strict';

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

// DB_PATH pode ser definido via variável de ambiente para apontar para um
// disco persistente (ex: Railway/Render volumes). Sem isso, em muitos hosts o
// sistema de ficheiros é efémero e a base de dados "esquece-se" de tudo a
// cada deploy/restart — esta é a causa mais comum de "produtos desaparecem"
// e "encomendas não ficam guardadas".
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, 'aurum.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

// Garante que a pasta da base de dados existe (evita crash silencioso em
// hosts onde a pasta ainda não foi criada).
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

let db;
try {
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Aplicar esquema (idempotente — usa CREATE TABLE IF NOT EXISTS)
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  db.exec(schema);

  // Migrações leves para bases de dados criadas antes de novas colunas/tabelas
  // existirem — evita ter de apagar o aurum.db sempre que o esquema muda.
  const colunasProdutos = db.prepare("PRAGMA table_info(produtos)").all().map(c => c.name);
  if (!colunasProdutos.includes('imagens_extra')) {
    db.exec("ALTER TABLE produtos ADD COLUMN imagens_extra TEXT DEFAULT '[]'");
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS configuracoes (
      chave TEXT PRIMARY KEY,
      valor TEXT
    )
  `);

  // ── Migrações adicionais (RBAC, CMS, cupões, plugins, site_config...) ──
  const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
  if (fs.existsSync(MIGRATIONS_DIR)) {
    const ficheiros = fs.readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql')).sort();
    for (const ficheiro of ficheiros) {
      db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, ficheiro), 'utf8'));
    }
  }

  // admins.role_id — não pode ir no .sql porque ALTER TABLE ADD COLUMN não é
  // idempotente em SQLite (rebentaria na 2ª vez que o servidor arrancasse).
  const colunasAdmins = db.prepare("PRAGMA table_info(admins)").all().map(c => c.name);
  if (!colunasAdmins.includes('role_id')) {
    db.exec("ALTER TABLE admins ADD COLUMN role_id INTEGER REFERENCES roles(id)");
    db.exec("UPDATE admins SET role_id = (SELECT id FROM roles WHERE nome = 'admin') WHERE role_id IS NULL");
  }
} catch (err) {
  console.error('\n✗ Erro fatal a inicializar a base de dados AURUM:');
  console.error(`  Caminho: ${DB_PATH}`);
  console.error(`  ${err.message}\n`);
  console.error('  Verifica se a pasta da base de dados existe e tem permissões de escrita,');
  console.error('  e se em produção o disco onde vive o ficheiro .db é persistente.\n');
  throw err;
}

console.log(`  ✦ Base de dados AURUM ligada → ${DB_PATH}`);

module.exports = db;
