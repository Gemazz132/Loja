'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { parsearJSON } = require('../utils/helpers');

function formatProduto(p) {
  return {
    ...p,
    tamanhos: parsearJSON(p.tamanhos),
    cores: parsearJSON(p.cores),
    imagens_extra: parsearJSON(p.imagens_extra),
  };
}

router.get('/', (req, res) => {
  const { category, q, destaque } = req.query;
  let sql = 'SELECT * FROM produtos WHERE ativo = 1';
  const params = [];

  if (category) { sql += ' AND categoria = ?'; params.push(category); }
  if (destaque) { sql += ' AND destaque = 1'; }
  if (q) { sql += ' AND (nome LIKE ? OR descricao LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' ORDER BY destaque DESC, criado_em DESC';

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(formatProduto));
});

router.get('/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Produto não encontrado.' });
  res.json(formatProduto(p));
});

module.exports = router;
