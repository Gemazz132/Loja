'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { requirePermission } = require('../middleware/rbac');
const { listarDisponiveis } = require('../plugins/loader');

router.get('/', requirePermission('plugins.editar'), (req, res) => {
  const instalados = db.prepare('SELECT nome, ativo, config FROM plugins_instalados').all();
  const estado = new Map(instalados.map(p => [p.nome, p]));

  const lista = listarDisponiveis().map(p => ({
    ...p,
    ativo: !!(estado.get(p.pasta)?.ativo),
    config: JSON.parse(estado.get(p.pasta)?.config || '{}'),
  }));
  res.json(lista);
});

router.put('/:pasta/estado', requirePermission('plugins.editar'), (req, res) => {
  const { ativo, config } = req.body;
  db.prepare(`
    INSERT INTO plugins_instalados (nome, ativo, config) VALUES (?, ?, ?)
    ON CONFLICT(nome) DO UPDATE SET ativo = excluded.ativo, config = COALESCE(excluded.config, plugins_instalados.config)
  `).run(req.params.pasta, ativo ? 1 : 0, config ? JSON.stringify(config) : '{}');
  res.json({ ok: true, aviso: 'Reinicia o servidor para aplicar rotas de um plugin recém-activado.' });
});

module.exports = router;
