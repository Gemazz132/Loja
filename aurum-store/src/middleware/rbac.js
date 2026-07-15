'use strict';

const db = require('../../db/database');

/**
 * Carrega as permissões da role do admin em sessão (uma vez por pedido) e
 * exige uma permissão específica em vez de um "é admin? sim/não" genérico.
 *
 * Uso:
 *   router.put('/products/:id', requirePermission('produtos.editar'), handler)
 */
function requirePermission(chave) {
  return (req, res, next) => {
    if (!req.session || !req.session.adminId) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const tem = db.prepare(`
      SELECT 1
      FROM admins a
      JOIN role_permissions rp ON rp.role_id = a.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE a.id = ? AND p.chave = ?
    `).get(req.session.adminId, chave);

    if (!tem) {
      return res.status(403).json({ error: 'Sem permissão para esta ação.' });
    }
    next();
  };
}

/** Devolve a role + lista de permissões do admin em sessão — usado por /api/admin/me
 *  para o frontend saber que menus/ações mostrar. */
function permissoesDoAdmin(adminId) {
  const role = db.prepare(`
    SELECT r.nome FROM roles r JOIN admins a ON a.role_id = r.id WHERE a.id = ?
  `).get(adminId);

  const permissoes = db.prepare(`
    SELECT p.chave FROM permissions p
    JOIN role_permissions rp ON rp.permission_id = p.id
    JOIN admins a ON a.role_id = rp.role_id
    WHERE a.id = ?
  `).all(adminId).map(r => r.chave);

  return { role: role ? role.nome : null, permissoes };
}

module.exports = { requirePermission, permissoesDoAdmin };
