'use strict';

function requireAdmin(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.status(401).json({ error: 'Não autenticado.' });
}

function requireAdminPage(req, res, next) {
  if (req.session && req.session.adminId) return next();
  return res.redirect('/admin/login.html');
}

function requireUser(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Sessão expirada. Faz login novamente.' });
}

module.exports = { requireAdmin, requireAdminPage, requireUser };
