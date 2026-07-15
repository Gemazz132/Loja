'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { requirePermission } = require('../middleware/rbac');

// ── Ingestão pública (chamada pela loja, sem autenticação) ───────────────
router.publicRouter = require('express').Router();
router.publicRouter.post('/evento', (req, res) => {
  const { tipo, pagina, referrer } = req.body || {};
  if (!tipo) return res.status(400).json({ error: 'Tipo de evento obrigatório.' });
  db.prepare('INSERT INTO eventos_analytics (tipo, pagina, referrer, utilizador_id) VALUES (?,?,?,?)')
    .run(tipo, pagina || null, referrer || null, req.session?.userId || null);
  res.status(204).end();
});

// ── Leitura no painel (agregados simples, sem serviço externo) ──────────
router.get('/resumo', requirePermission('analytics.ver'), (req, res) => {
  const dias = Math.min(90, Math.max(1, +req.query.dias || 30));

  const visitasPorDia = db.prepare(`
    SELECT date(criado_em) as dia, COUNT(*) as total
    FROM eventos_analytics
    WHERE tipo = 'pageview' AND criado_em >= datetime('now', ?)
    GROUP BY dia ORDER BY dia
  `).all(`-${dias} days`);

  const paginasMaisVistas = db.prepare(`
    SELECT pagina, COUNT(*) as total
    FROM eventos_analytics
    WHERE tipo = 'pageview' AND pagina IS NOT NULL AND criado_em >= datetime('now', ?)
    GROUP BY pagina ORDER BY total DESC LIMIT 10
  `).all(`-${dias} days`);

  const totalVisitantesUnicos = db.prepare(`
    SELECT COUNT(DISTINCT utilizador_id) as n FROM eventos_analytics
    WHERE utilizador_id IS NOT NULL AND criado_em >= datetime('now', ?)
  `).get(`-${dias} days`);

  res.json({ visitasPorDia, paginasMaisVistas, totalVisitantesUnicos: totalVisitantesUnicos.n });
});

module.exports = router;
