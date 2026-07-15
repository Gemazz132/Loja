'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { requirePermission } = require('../middleware/rbac');

const CHAVES_PERMITIDAS = ['titulo_site', 'idioma', 'cor_primaria', 'cor_fundo', 'logotipo_url'];

router.get('/', requirePermission('definicoes.editar'), (req, res) => {
  const rows = db.prepare('SELECT chave, valor FROM site_config').all();
  const config = {};
  rows.forEach(r => { config[r.chave] = r.valor; });
  res.json(config);
});

router.put('/', requirePermission('definicoes.editar'), (req, res) => {
  const upsert = db.prepare(`
    INSERT INTO site_config (chave, valor) VALUES (?, ?)
    ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
  `);
  for (const chave of CHAVES_PERMITIDAS) {
    if (req.body[chave] !== undefined) upsert.run(chave, String(req.body[chave]));
  }
  res.json({ ok: true });
});

// Versão pública e só-leitura (para a loja aplicar tema/logótipo em runtime)
router.publicRouter = require('express').Router();
router.publicRouter.get('/', (req, res) => {
  const rows = db.prepare('SELECT chave, valor FROM site_config WHERE chave IN (?,?,?,?,?)').all(...CHAVES_PERMITIDAS);
  const config = {};
  rows.forEach(r => { config[r.chave] = r.valor; });
  res.json(config);
});

module.exports = router;
