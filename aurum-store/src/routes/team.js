'use strict';

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../../db/database');
const { requirePermission } = require('../middleware/rbac');

router.get('/', requirePermission('equipa.editar'), (req, res) => {
  const membros = db.prepare(`
    SELECT a.id, a.nome, a.email, r.nome as role, a.criado_em
    FROM admins a JOIN roles r ON r.id = a.role_id
    ORDER BY a.criado_em
  `).all();
  res.json(membros);
});

router.get('/roles', requirePermission('equipa.editar'), (req, res) => {
  res.json(db.prepare('SELECT * FROM roles').all());
});

router.post('/', requirePermission('equipa.editar'), async (req, res) => {
  const { nome, email, password, role } = req.body;
  if (!nome || !email || !password || !role) return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });

  const roleRow = db.prepare('SELECT id FROM roles WHERE nome = ?').get(role);
  if (!roleRow) return res.status(400).json({ error: 'Role inválida.' });

  const existe = db.prepare('SELECT id FROM admins WHERE email = ?').get(email.toLowerCase());
  if (existe) return res.status(409).json({ error: 'Já existe um membro com esse email.' });

  const hash = await bcrypt.hash(password, 10);
  const r = db.prepare('INSERT INTO admins (nome, email, password_hash, role_id) VALUES (?,?,?,?)')
    .run(nome, email.toLowerCase(), hash, roleRow.id);
  res.json({ ok: true, id: r.lastInsertRowid });
});

router.put('/:id/role', requirePermission('equipa.editar'), (req, res) => {
  const roleRow = db.prepare('SELECT id FROM roles WHERE nome = ?').get(req.body.role);
  if (!roleRow) return res.status(400).json({ error: 'Role inválida.' });
  if (Number(req.params.id) === req.session.adminId) {
    return res.status(400).json({ error: 'Não podes alterar a tua própria role.' });
  }
  db.prepare('UPDATE admins SET role_id = ? WHERE id = ?').run(roleRow.id, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requirePermission('equipa.editar'), (req, res) => {
  if (Number(req.params.id) === req.session.adminId) {
    return res.status(400).json({ error: 'Não podes remover a tua própria conta.' });
  }
  db.prepare('DELETE FROM admins WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
