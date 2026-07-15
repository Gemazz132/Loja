'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { requirePermission } = require('../middleware/rbac');

// ── Admin: CRUD de cupões ────────────────────────────────────────────────
router.get('/', requirePermission('cupoes.editar'), (req, res) => {
  res.json(db.prepare('SELECT * FROM cupoes ORDER BY criado_em DESC').all());
});

router.post('/', requirePermission('cupoes.editar'), (req, res) => {
  const { codigo, tipo, valor, valido_de, valido_ate, usos_maximos, ativo } = req.body;
  if (!codigo || !valor) return res.status(400).json({ error: 'Código e valor são obrigatórios.' });

  try {
    const r = db.prepare(`
      INSERT INTO cupoes (codigo, tipo, valor, valido_de, valido_ate, usos_maximos, ativo)
      VALUES (?,?,?,?,?,?,?)
    `).run(codigo.toUpperCase().trim(), tipo || 'percentagem', +valor, valido_de || null, valido_ate || null, usos_maximos || null, ativo ? 1 : 0);
    res.json({ ok: true, id: r.lastInsertRowid });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Já existe um cupão com esse código.' });
    throw err;
  }
});

router.put('/:id', requirePermission('cupoes.editar'), (req, res) => {
  const { codigo, tipo, valor, valido_de, valido_ate, usos_maximos, ativo } = req.body;
  db.prepare(`
    UPDATE cupoes SET codigo=?, tipo=?, valor=?, valido_de=?, valido_ate=?, usos_maximos=?, ativo=?
    WHERE id=?
  `).run(codigo.toUpperCase().trim(), tipo, +valor, valido_de || null, valido_ate || null, usos_maximos || null, ativo ? 1 : 0, req.params.id);
  res.json({ ok: true });
});

router.delete('/:id', requirePermission('cupoes.editar'), (req, res) => {
  db.prepare('DELETE FROM cupoes WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── Função reutilizável a partir do checkout.js (loja pública) ──────────
// Valida um código e devolve { desconto } aplicável a um dado subtotal,
// ou lança erro com mensagem amigável para mostrar ao cliente.
function validarCupom(codigo, subtotal) {
  const cupom = db.prepare('SELECT * FROM cupoes WHERE codigo = ? AND ativo = 1').get((codigo || '').toUpperCase().trim());
  if (!cupom) throw new Error('Cupão inválido.');

  const agora = new Date();
  if (cupom.valido_de && agora < new Date(cupom.valido_de)) throw new Error('Este cupão ainda não é válido.');
  if (cupom.valido_ate && agora > new Date(cupom.valido_ate)) throw new Error('Este cupão expirou.');
  if (cupom.usos_maximos !== null && cupom.usos_atuais >= cupom.usos_maximos) throw new Error('Este cupão já atingiu o limite de utilizações.');

  const desconto = cupom.tipo === 'percentagem' ? subtotal * (cupom.valor / 100) : Math.min(cupom.valor, subtotal);
  return { id: cupom.id, desconto: Math.round(desconto * 100) / 100 };
}

/** Chamar depois de uma encomenda ser criada com sucesso, dentro da mesma transação. */
function registarUsoCupom(cupomId) {
  db.prepare('UPDATE cupoes SET usos_atuais = usos_atuais + 1 WHERE id = ?').run(cupomId);
}

module.exports = router;
module.exports.validarCupom = validarCupom;
module.exports.registarUsoCupom = registarUsoCupom;
