'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { requireUser } = require('../middleware/auth');

router.get('/orders', requireUser, (req, res) => {
  const orders = db.prepare(`
    SELECT e.*, GROUP_CONCAT(ei.nome_produto, ', ') as items_resumo
    FROM encomendas e
    LEFT JOIN encomenda_itens ei ON ei.encomenda_id = e.id
    WHERE e.utilizador_id = ?
    GROUP BY e.id
    ORDER BY e.criado_em DESC
  `).all(req.session.userId);
  res.json(orders);
});

module.exports = router;
