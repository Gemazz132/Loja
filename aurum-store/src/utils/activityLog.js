'use strict';

const db = require('../../db/database');

const inserir = db.prepare(`
  INSERT INTO logs_atividade (admin_id, admin_nome, acao, entidade, entidade_id, detalhe)
  VALUES (?, ?, ?, ?, ?, ?)
`);

/**
 * Regista uma ação de um administrador no registo de atividade.
 * Nunca deita abaixo o pedido — se o log falhar, apenas escreve no stderr.
 *
 * @param {import('express').Request} req  pedido (para ler a sessão)
 * @param {object} dados
 * @param {string} dados.acao       ex: 'produto.criar'
 * @param {string} [dados.entidade] ex: 'produto'
 * @param {string|number} [dados.entidadeId]
 * @param {string} [dados.detalhe]  descrição legível
 */
function registarAtividade(req, { acao, entidade = null, entidadeId = null, detalhe = null }) {
  try {
    inserir.run(
      req.session?.adminId ?? null,
      req.session?.adminNome ?? null,
      acao,
      entidade,
      entidadeId != null ? String(entidadeId) : null,
      detalhe
    );
  } catch (err) {
    console.error('[activityLog] falha a registar atividade:', err.message);
  }
}

module.exports = { registarAtividade };
