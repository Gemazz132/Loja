'use strict';

const router = require('express').Router();
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../../db/database');
const { requireAdmin } = require('../middleware/auth');
const { permissoesDoAdmin } = require('../middleware/rbac');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiadas tentativas. Aguarda 15 minutos.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Campos obrigatórios.' });

  const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email.trim().toLowerCase());
  if (!admin || !bcrypt.compareSync(password, admin.password_hash))
    return res.status(401).json({ error: 'Credenciais inválidas.' });

  req.session.adminId = admin.id;
  req.session.adminNome = admin.nome;
  req.session.adminEmail = admin.email;
  res.json({ ok: true, nome: admin.nome });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/me', requireAdmin, (req, res) => {
  const { role, permissoes } = permissoesDoAdmin(req.session.adminId);
  res.json({ id: req.session.adminId, nome: req.session.adminNome, email: req.session.adminEmail, role, permissoes });
});

module.exports = router;
