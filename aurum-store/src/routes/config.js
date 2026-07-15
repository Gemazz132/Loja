'use strict';

const router = require('express').Router();
const db = require('../../db/database');

const DEFAULT_CONFIG = { portes_valor: '4.99', portes_gratis_acima: '75' };

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT chave, valor FROM configuracoes').all();
  const config = { ...DEFAULT_CONFIG };
  rows.forEach(r => { config[r.chave] = r.valor; });
  res.json({
    portes_valor: Number(config.portes_valor),
    portes_gratis_acima: Number(config.portes_gratis_acima),
  });
});

module.exports = router;
