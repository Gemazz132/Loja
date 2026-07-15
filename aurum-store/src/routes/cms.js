'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const upload = require('../middleware/upload');
const { requirePermission } = require('../middleware/rbac');

function slugify(str) {
  return str.toString().toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')  // remove acentos
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ── Categorias ───────────────────────────────────────────────────────────
router.get('/categorias', requirePermission('cms.ver'), (req, res) => {
  res.json(db.prepare('SELECT * FROM cms_categorias ORDER BY nome').all());
});
router.post('/categorias', requirePermission('cms.editar'), (req, res) => {
  const { nome } = req.body;
  const r = db.prepare('INSERT INTO cms_categorias (nome, slug) VALUES (?, ?)').run(nome, slugify(nome));
  res.json({ ok: true, id: r.lastInsertRowid });
});

// ── Páginas ──────────────────────────────────────────────────────────────
router.get('/paginas', requirePermission('cms.ver'), (req, res) => {
  res.json(db.prepare('SELECT * FROM cms_paginas ORDER BY atualizado_em DESC').all());
});
router.post('/paginas', requirePermission('cms.editar'), (req, res) => {
  const { titulo, conteudo, estado } = req.body;
  const r = db.prepare('INSERT INTO cms_paginas (titulo, slug, conteudo, estado, autor_id) VALUES (?,?,?,?,?)')
    .run(titulo, slugify(titulo), conteudo || '', estado || 'rascunho', req.session.adminId);
  res.json({ ok: true, id: r.lastInsertRowid });
});
router.put('/paginas/:id', requirePermission('cms.editar'), (req, res) => {
  const { titulo, conteudo, estado } = req.body;
  // publicar exige permissão extra (um 'autor' pode editar mas não publicar)
  if (estado === 'publicado') {
    const podePublicar = db.prepare(`
      SELECT 1 FROM admins a JOIN role_permissions rp ON rp.role_id = a.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE a.id = ? AND p.chave = 'cms.publicar'
    `).get(req.session.adminId);
    if (!podePublicar) return res.status(403).json({ error: 'Sem permissão para publicar — pede a um editor/admin.' });
  }
  db.prepare('UPDATE cms_paginas SET titulo=?, conteudo=?, estado=?, atualizado_em=CURRENT_TIMESTAMP WHERE id=?')
    .run(titulo, conteudo, estado, req.params.id);
  res.json({ ok: true });
});
router.delete('/paginas/:id', requirePermission('cms.editar'), (req, res) => {
  db.prepare('DELETE FROM cms_paginas WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Posts (blog/editorial) ───────────────────────────────────────────────
router.get('/posts', requirePermission('cms.ver'), (req, res) => {
  res.json(db.prepare('SELECT * FROM cms_posts ORDER BY criado_em DESC').all());
});
router.post('/posts', requirePermission('cms.editar'), (req, res) => {
  const { titulo, resumo, conteudo, imagem_capa, categoria_id, estado } = req.body;
  const r = db.prepare(`
    INSERT INTO cms_posts (titulo, slug, resumo, conteudo, imagem_capa, categoria_id, estado, autor_id, publicado_em)
    VALUES (?,?,?,?,?,?,?,?,?)
  `).run(titulo, slugify(titulo), resumo || '', conteudo || '', imagem_capa || null, categoria_id || null,
    estado || 'rascunho', req.session.adminId, estado === 'publicado' ? new Date().toISOString() : null);
  res.json({ ok: true, id: r.lastInsertRowid });
});

// ── Biblioteca de media ──────────────────────────────────────────────────
router.get('/media', requirePermission('cms.ver'), (req, res) => {
  res.json(db.prepare('SELECT * FROM media ORDER BY criado_em DESC').all());
});
router.post('/media/upload', requirePermission('cms.editar'), upload.multiplas, (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
  const insert = db.prepare('INSERT INTO media (url, tipo, nome_original, tamanho_bytes) VALUES (?,?,?,?)');
  const items = req.files.map(f => {
    const tipo = f.mimetype.startsWith('video') ? 'video' : 'imagem';
    const r = insert.run(`/uploads/${f.filename}`, tipo, f.originalname, f.size);
    return { id: r.lastInsertRowid, url: `/uploads/${f.filename}`, tipo };
  });
  res.json({ ok: true, items });
});

// ── Rota pública (loja) para páginas/posts publicados ────────────────────
// Montada à parte, sem requirePermission — ver nota no server.js
router.publicRouter = require('express').Router();
router.publicRouter.get('/paginas/:slug', (req, res) => {
  const pagina = db.prepare("SELECT * FROM cms_paginas WHERE slug = ? AND estado = 'publicado'").get(req.params.slug);
  if (!pagina) return res.status(404).json({ error: 'Página não encontrada.' });
  res.json(pagina);
});
router.publicRouter.get('/posts', (req, res) => {
  res.json(db.prepare("SELECT id, titulo, slug, resumo, imagem_capa, publicado_em FROM cms_posts WHERE estado='publicado' ORDER BY publicado_em DESC").all());
});

module.exports = router;
