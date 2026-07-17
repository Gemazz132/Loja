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

// ── Perfil (dados pessoais editáveis) ────────────────────────────────────
router.get('/profile', requireUser, (req, res) => {
  const u = db.prepare('SELECT id, nome, email, telefone, morada, cidade, codigo_postal, pais, criado_em FROM utilizadores WHERE id = ?').get(req.session.userId);
  if (!u) return res.status(404).json({ error: 'Conta não encontrada.' });
  res.json(u);
});

router.put('/profile', requireUser, (req, res) => {
  const { nome, telefone, morada, cidade, codigo_postal, pais } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'O nome é obrigatório.' });

  db.prepare(`
    UPDATE utilizadores SET nome = ?, telefone = ?, morada = ?, cidade = ?, codigo_postal = ?, pais = ?
    WHERE id = ?
  `).run(nome.trim(), telefone || null, morada || null, cidade || null, codigo_postal || null, pais || 'Portugal', req.session.userId);

  req.session.userNome = nome.trim(); // mantém o nome em sessão coerente com o que foi editado
  res.json({ ok: true });
});

// ── Resumo de actividade (para a página de perfil) ───────────────────────
router.get('/resumo', requireUser, (req, res) => {
  const encomendas = db.prepare(`
    SELECT COUNT(*) as total, COALESCE(SUM(total), 0) as total_gasto
    FROM encomendas WHERE utilizador_id = ? AND estado != 'Cancelado'
  `).get(req.session.userId);

  const favoritosCount = db.prepare('SELECT COUNT(*) as n FROM favoritos WHERE utilizador_id = ?').get(req.session.userId);

  const ultimaEncomenda = db.prepare(`
    SELECT numero, total, estado, criado_em FROM encomendas
    WHERE utilizador_id = ? ORDER BY criado_em DESC LIMIT 1
  `).get(req.session.userId);

  res.json({
    totalEncomendas: encomendas.total,
    totalGasto: encomendas.total_gasto,
    totalFavoritos: favoritosCount.n,
    ultimaEncomenda: ultimaEncomenda || null,
  });
});

// ── Favoritos (wishlist) ──────────────────────────────────────────────────
router.get('/favoritos', requireUser, (req, res) => {
  const favoritos = db.prepare(`
    SELECT p.id, p.nome, p.preco, p.preco_promocional, p.imagem, p.categoria, p.ativo
    FROM favoritos f JOIN produtos p ON p.id = f.produto_id
    WHERE f.utilizador_id = ?
    ORDER BY f.criado_em DESC
  `).all(req.session.userId);
  res.json(favoritos);
});

router.post('/favoritos/:produtoId', requireUser, (req, res) => {
  const produto = db.prepare('SELECT id FROM produtos WHERE id = ?').get(req.params.produtoId);
  if (!produto) return res.status(404).json({ error: 'Produto não encontrado.' });
  db.prepare('INSERT OR IGNORE INTO favoritos (utilizador_id, produto_id) VALUES (?, ?)').run(req.session.userId, req.params.produtoId);
  res.json({ ok: true, favorito: true });
});

router.delete('/favoritos/:produtoId', requireUser, (req, res) => {
  db.prepare('DELETE FROM favoritos WHERE utilizador_id = ? AND produto_id = ?').run(req.session.userId, req.params.produtoId);
  res.json({ ok: true, favorito: false });
});

router.get('/favoritos/:produtoId/estado', requireUser, (req, res) => {
  const existe = db.prepare('SELECT 1 FROM favoritos WHERE utilizador_id = ? AND produto_id = ?').get(req.session.userId, req.params.produtoId);
  res.json({ favorito: !!existe });
});

module.exports = router;
