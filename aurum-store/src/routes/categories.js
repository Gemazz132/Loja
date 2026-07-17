'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { requirePermission } = require('../middleware/rbac');

function slugify(str) {
  return str.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Admin: listar (com contagem de produtos por categoria) ─────────────────
router.get('/', requirePermission('produtos.ver'), (req, res) => {
  const categorias = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM produtos p WHERE p.categoria = c.slug) as total_produtos
    FROM categorias c
    ORDER BY c.ordem, c.nome
  `).all();
  res.json(categorias);
});

// ── Admin: criar ─────────────────────────────────────────────────────────
router.post('/', requirePermission('produtos.editar'), (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });

  const slug = slugify(nome);
  if (!slug) return res.status(400).json({ error: 'Nome inválido.' });

  const existente = db.prepare('SELECT id FROM categorias WHERE slug = ?').get(slug);
  if (existente) return res.status(409).json({ error: 'Já existe uma categoria com esse nome.' });

  const maxOrdem = db.prepare('SELECT COALESCE(MAX(ordem), 0) as m FROM categorias').get().m;
  const r = db.prepare('INSERT INTO categorias (nome, slug, ordem) VALUES (?, ?, ?)').run(nome.trim(), slug, maxOrdem + 1);
  res.json({ ok: true, id: r.lastInsertRowid, slug });
});

// ── Admin: editar nome ───────────────────────────────────────────────────
// O slug NUNCA muda ao renomear — é isso que permite ao nome mudar livremente
// sem termos de andar a actualizar produtos.categoria em cascata.
router.put('/:id', requirePermission('produtos.editar'), (req, res) => {
  const { nome } = req.body;
  if (!nome || !nome.trim()) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });

  const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(req.params.id);
  if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada.' });

  db.prepare('UPDATE categorias SET nome = ? WHERE id = ?').run(nome.trim(), req.params.id);
  res.json({ ok: true });
});

// ── Admin: eliminar (bloqueia se ainda houver produtos a usá-la) ─────────
router.delete('/:id', requirePermission('produtos.editar'), (req, res) => {
  const categoria = db.prepare('SELECT * FROM categorias WHERE id = ?').get(req.params.id);
  if (!categoria) return res.status(404).json({ error: 'Categoria não encontrada.' });

  const { n } = db.prepare('SELECT COUNT(*) as n FROM produtos WHERE categoria = ?').get(categoria.slug);
  if (n > 0) {
    return res.status(409).json({
      error: `Não é possível eliminar: existem ${n} produto(s) nesta categoria. Muda-os de categoria primeiro.`,
    });
  }

  db.prepare('DELETE FROM categorias WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Admin: reordenar (opcional, arrastar-e-largar no painel) ─────────────
router.put('/:id/ordem', requirePermission('produtos.editar'), (req, res) => {
  const { ordem } = req.body;
  db.prepare('UPDATE categorias SET ordem = ? WHERE id = ?').run(+ordem || 0, req.params.id);
  res.json({ ok: true });
});

module.exports = router;

// ── Rota pública — usada pelo menu de navegação e filtros da loja ───────
// Reflecte imediatamente qualquer alteração feita no admin (sem cache).
router.publicRouter = require('express').Router();
router.publicRouter.get('/', (req, res) => {
  const categorias = db.prepare('SELECT nome, slug FROM categorias ORDER BY ordem, nome').all();
  res.json(categorias);
});
