'use strict';

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const db = require('../../db/database');
const { requireUser } = require('../middleware/auth');

router.post('/register', (req, res) => {
  const { nome, email, password } = req.body || {};
  if (!nome || !email || !password) return res.status(400).json({ error: 'Campos obrigatórios.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password mínimo 6 caracteres.' });

  const exists = db.prepare('SELECT id FROM utilizadores WHERE email = ?').get(email.trim().toLowerCase());
  if (exists) return res.status(409).json({ error: 'Email já registado.' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare('INSERT INTO utilizadores (nome, email, password_hash) VALUES (?, ?, ?)').run(nome.trim(), email.trim().toLowerCase(), hash);
  req.session.userId = result.lastInsertRowid;
  req.session.userNome = nome.trim();
  res.json({ ok: true, nome: nome.trim() });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios.' });

  const user = db.prepare('SELECT * FROM utilizadores WHERE email = ?').get(email.trim().toLowerCase());
  if (!user || !user.password_hash || !bcrypt.compareSync(password, user.password_hash))
    return res.status(401).json({ error: 'Credenciais inválidas.' });

  req.session.userId = user.id;
  req.session.userNome = user.nome;
  res.json({ ok: true, nome: user.nome });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', (req, res) => {
  if (!req.session.userId) return res.json({ autenticado: false });
  const user = db.prepare('SELECT id, nome, email FROM utilizadores WHERE id = ?').get(req.session.userId);
  res.json({ autenticado: true, ...user });
});

module.exports = router;
