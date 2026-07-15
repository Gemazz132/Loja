'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { gerarNumeroEncomenda, parsearJSON } = require('../utils/helpers');
const { validarCupom, registarUsoCupom } = require('./coupons');

function getConfigPortes() {
  const rows = db.prepare('SELECT chave, valor FROM configuracoes WHERE chave IN (?, ?)').all('portes_valor', 'portes_gratis_acima');
  const config = { portes_valor: 4.99, portes_gratis_acima: 75 };
  rows.forEach(r => { config[r.chave] = Number(r.valor); });
  return config;
}

router.post('/', (req, res) => {
  const { nome, email, telefone, morada, cidade, codigo_postal, pais, itens, metodo_pagamento, cupom } = req.body || {};

  if (!nome || !email || !itens || !Array.isArray(itens) || itens.length === 0)
    return res.status(400).json({ error: 'Dados de checkout incompletos.' });

  const checkout = db.transaction(() => {
    // Se o cliente tem sessão iniciada, a encomenda fica sempre ligada à
    // conta real (evita duplicar clientes ou ligar a encomenda à conta
    // errada caso o email escrito no formulário seja diferente do da conta).
    let utilizador;
    if (req.session && req.session.userId) {
      utilizador = db.prepare('SELECT id, nome, email FROM utilizadores WHERE id = ?').get(req.session.userId);
    }
    if (!utilizador) {
      utilizador = db.prepare('SELECT id FROM utilizadores WHERE email = ?').get(email.toLowerCase());
    }
    if (!utilizador) {
      const r = db.prepare('INSERT INTO utilizadores (nome, email, morada, cidade, codigo_postal, pais, telefone) VALUES (?,?,?,?,?,?,?)').run(nome, email.toLowerCase(), morada, cidade, codigo_postal, pais || 'Portugal', telefone);
      utilizador = { id: r.lastInsertRowid };
    }

    let subtotal = 0;
    const linhas = [];

    for (const item of itens) {
      const produto = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(item.produto_id);
      if (!produto) throw new Error(`Produto ${item.produto_id} não disponível.`);
      if (produto.stock < item.quantidade) throw new Error(`Stock insuficiente para "${produto.nome}".`);

      const preco = produto.preco_promocional || produto.preco;
      subtotal += preco * item.quantidade;
      linhas.push({ produto, preco, item });
    }

    const { portes_valor, portes_gratis_acima } = getConfigPortes();
    const portes = subtotal >= portes_gratis_acima ? 0 : portes_valor;

    let desconto = 0;
    let cupomAplicado = null;
    if (cupom) {
      const resultado = validarCupom(cupom, subtotal); // lança erro com mensagem amigável se inválido
      desconto = resultado.desconto;
      cupomAplicado = resultado.id;
    }

    const total = Math.max(0, subtotal - desconto + portes);
    const numero = gerarNumeroEncomenda();

    const enc = db.prepare(`
      INSERT INTO encomendas (numero, utilizador_id, nome_cliente, email_cliente, telefone_cliente,
        morada, cidade, codigo_postal, pais, subtotal, desconto, portes, total, estado, pagamento, metodo_pagamento)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(numero, utilizador.id, nome, email.toLowerCase(), telefone, morada, cidade, codigo_postal, pais || 'Portugal',
      subtotal, desconto, portes, total, 'Pendente', 'Pendente', metodo_pagamento || 'Transferência');

    if (cupomAplicado) registarUsoCupom(cupomAplicado);

    for (const { produto, preco, item } of linhas) {
      db.prepare(`INSERT INTO encomenda_itens (encomenda_id, produto_id, nome_produto, preco_unitario, quantidade, tamanho, cor)
        VALUES (?,?,?,?,?,?,?)`)
        .run(enc.lastInsertRowid, produto.id, produto.nome, preco, item.quantidade, item.tamanho || null, item.cor || null);

      db.prepare('UPDATE produtos SET stock = stock - ? WHERE id = ?').run(item.quantidade, produto.id);
    }

    return { numero, total, portes, subtotal, desconto };
  });

  try {
    const result = checkout();
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;
