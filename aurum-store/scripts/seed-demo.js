'use strict';

// Dados de demonstração — encomendas, clientes e stock baixo — para que a
// Dashboard mostre KPIs, comparações de período, alertas de stock e últimas
// encomendas com dados reais. Idempotente: não duplica se já correu.

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../db/database');

const jaTemDemo = db.prepare("SELECT COUNT(*) as n FROM encomendas WHERE numero LIKE 'DEMO-%'").get().n;
if (jaTemDemo > 0) {
  console.log(`ℹ Dados de demonstração já existem (${jaTemDemo} encomendas). Nada a fazer.`);
  process.exit(0);
}

// ── Clientes de demonstração ────────────────────────────────────────────
const clientes = [
  { nome: 'Mariana Costa', email: 'mariana.costa@exemplo.pt', cidade: 'Lisboa' },
  { nome: 'João Pereira', email: 'joao.pereira@exemplo.pt', cidade: 'Porto' },
  { nome: 'Sofia Almeida', email: 'sofia.almeida@exemplo.pt', cidade: 'Braga' },
  { nome: 'Rui Fernandes', email: 'rui.fernandes@exemplo.pt', cidade: 'Coimbra' },
  { nome: 'Beatriz Santos', email: 'beatriz.santos@exemplo.pt', cidade: 'Faro' },
];

const inserirCliente = db.prepare(`
  INSERT OR IGNORE INTO utilizadores (nome, email, cidade, pais, criado_em)
  VALUES (?, ?, ?, 'Portugal', datetime('now', ?))
`);
clientes.forEach((c, i) => inserirCliente.run(c.nome, c.email, c.cidade, `-${i * 3} days`));

const idsClientes = db.prepare("SELECT id, nome, email FROM utilizadores WHERE email LIKE '%@exemplo.pt'").all();
const produtos = db.prepare('SELECT id, nome, preco, preco_promocional FROM produtos').all();

// ── Encomendas de demonstração distribuídas ao longo de ~35 dias ──────────
const estados = ['Pendente', 'Pago', 'Preparação', 'Enviado', 'Entregue', 'Entregue', 'Cancelado'];
const inserirEncomenda = db.prepare(`
  INSERT INTO encomendas
    (numero, utilizador_id, nome_cliente, email_cliente, cidade, pais,
     subtotal, portes, total, estado, pagamento, metodo_pagamento, criado_em)
  VALUES (?, ?, ?, ?, ?, 'Portugal', ?, ?, ?, ?, ?, 'Cartão', datetime('now', ?))
`);
const inserirItem = db.prepare(`
  INSERT INTO encomenda_itens (encomenda_id, produto_id, nome_produto, preco_unitario, quantidade, tamanho)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const criar = db.transaction(() => {
  let n = 1;
  // Distribuição de dias: alguns hoje, ontem, esta semana, este mês e mês passado
  const diasOffset = [0, 0, -1, -1, -2, -3, -5, -8, -11, -14, -18, -22, -26, -31, -34];
  for (const off of diasOffset) {
    const cliente = idsClientes[Math.floor(Math.random() * idsClientes.length)];
    const nItens = 1 + Math.floor(Math.random() * 3);
    let subtotal = 0;
    const itensEnc = [];
    for (let k = 0; k < nItens; k++) {
      const p = produtos[Math.floor(Math.random() * produtos.length)];
      const preco = p.preco_promocional || p.preco;
      const qtd = 1 + Math.floor(Math.random() * 2);
      subtotal += preco * qtd;
      itensEnc.push({ p, preco, qtd });
    }
    const portes = subtotal >= 75 ? 0 : 4.99;
    const total = +(subtotal + portes).toFixed(2);
    const estado = estados[Math.floor(Math.random() * estados.length)];
    const numero = `DEMO-${String(1000 + n)}`;
    const pagamento = (estado === 'Pendente') ? 'Pendente' : (estado === 'Cancelado' ? 'Reembolsado' : 'Pago');
    const r = inserirEncomenda.run(
      numero, cliente.id, cliente.nome, cliente.email, 'Lisboa',
      +subtotal.toFixed(2), portes, total, estado, pagamento, `${off} days`
    );
    for (const it of itensEnc) {
      inserirItem.run(r.lastInsertRowid, it.p.id, it.p.nome, it.preco, it.qtd, 'M');
    }
    n++;
  }
});
criar();

// ── Stock baixo/esgotado para acionar os alertas ──────────────────────────
const todosProdutos = db.prepare('SELECT id FROM produtos ORDER BY id LIMIT 4').all();
if (todosProdutos[0]) db.prepare('UPDATE produtos SET stock = 0 WHERE id = ?').run(todosProdutos[0].id);
if (todosProdutos[1]) db.prepare('UPDATE produtos SET stock = 2 WHERE id = ?').run(todosProdutos[1].id);
if (todosProdutos[2]) db.prepare('UPDATE produtos SET stock = 4 WHERE id = ?').run(todosProdutos[2].id);
if (todosProdutos[3]) db.prepare('UPDATE produtos SET stock = 5 WHERE id = ?').run(todosProdutos[3].id);

const totalEnc = db.prepare("SELECT COUNT(*) as n FROM encomendas WHERE numero LIKE 'DEMO-%'").get().n;
console.log(`✔ ${idsClientes.length} clientes e ${totalEnc} encomendas de demonstração criados.`);
console.log('✔ Stock baixo/esgotado aplicado a 4 produtos.');
console.log('✅ Seed de demonstração concluído.');
process.exit(0);
