'use strict';

const router = require('express').Router();
const db = require('../../db/database');
const { requireAdmin } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const upload = require('../middleware/upload');
const { parsearJSON } = require('../utils/helpers');
const { enviarEmail } = require('../utils/mailer');
const { registarAtividade } = require('../utils/activityLog');

router.use(requireAdmin);

// ── Dashboard ──────────────────────────────────────────────────────────────
const LIMIAR_STOCK_BAIXO = 5;

router.get('/dashboard', requirePermission('encomendas.ver'), (req, res) => {
  const vendasHoje = db.prepare(`
    SELECT COALESCE(SUM(total),0) as v FROM encomendas
    WHERE estado != 'Cancelado' AND arquivada = 0 AND date(criado_em) = date('now')
  `).get().v;

  // Ontem — para comparar com "hoje"
  const vendasOntem = db.prepare(`
    SELECT COALESCE(SUM(total),0) as v FROM encomendas
    WHERE estado != 'Cancelado' AND date(criado_em) = date('now', '-1 day')
  `).get().v;

  const vendasMes = db.prepare(`
    SELECT COALESCE(SUM(total),0) as v FROM encomendas
    WHERE estado != 'Cancelado' AND arquivada = 0 AND strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now')
  `).get().v;

  // Mês passado até ao mesmo dia do mês — comparação justa "month-to-date"
  const vendasMesPassado = db.prepare(`
    SELECT COALESCE(SUM(total),0) as v FROM encomendas
    WHERE estado != 'Cancelado'
      AND strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now', '-1 month')
      AND CAST(strftime('%d', criado_em) AS INTEGER) <= CAST(strftime('%d', 'now') AS INTEGER)
  `).get().v;

  const encomendasPendentes = db.prepare(`SELECT COUNT(*) as n FROM encomendas WHERE estado = 'Pendente' AND arquivada = 0`).get().n;
  const totalClientes = db.prepare(`SELECT COUNT(*) as n FROM utilizadores`).get().n;

  // Comparação de clientes: novos este mês vs mês passado (até ao mesmo dia)
  const clientesEsteMes = db.prepare(`
    SELECT COUNT(*) as n FROM utilizadores
    WHERE strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now')
  `).get().n;
  const clientesMesPassado = db.prepare(`
    SELECT COUNT(*) as n FROM utilizadores
    WHERE strftime('%Y-%m', criado_em) = strftime('%Y-%m', 'now', '-1 month')
      AND CAST(strftime('%d', criado_em) AS INTEGER) <= CAST(strftime('%d', 'now') AS INTEGER)
  `).get().n;

  const vendasPorDia = db.prepare(`
    SELECT date(criado_em) as dia, COALESCE(SUM(total),0) as total
    FROM encomendas
    WHERE estado != 'Cancelado' AND criado_em >= datetime('now', '-30 days')
    GROUP BY dia ORDER BY dia
  `).all();

  const produtosMaisVendidos = db.prepare(`
    SELECT nome_produto as nome, SUM(quantidade) as quantidade
    FROM encomenda_itens ei
    JOIN encomendas e ON e.id = ei.encomenda_id
    WHERE e.estado != 'Cancelado'
    GROUP BY nome_produto ORDER BY quantidade DESC LIMIT 8
  `).all();

  // Alertas de stock baixo/esgotado (só produtos ativos)
  const stockBaixo = db.prepare(`
    SELECT id, nome, categoria, stock, imagem
    FROM produtos
    WHERE ativo = 1 AND stock <= ?
    ORDER BY stock ASC, nome ASC
    LIMIT 20
  `).all(LIMIAR_STOCK_BAIXO);
  const totalStockBaixo = db.prepare(`SELECT COUNT(*) as n FROM produtos WHERE ativo = 1 AND stock <= ?`).get(LIMIAR_STOCK_BAIXO).n;

  // Últimas encomendas
  const ultimasEncomendas = db.prepare(`
    SELECT id, numero, nome_cliente, total, estado, criado_em
    FROM encomendas WHERE arquivada = 0
    ORDER BY criado_em DESC LIMIT 6
  `).all();

  res.json({
    vendasHoje, vendasOntem,
    vendasMes, vendasMesPassado,
    encomendasPendentes,
    totalClientes, clientesEsteMes, clientesMesPassado,
    vendasPorDia, produtosMaisVendidos,
    stockBaixo, totalStockBaixo, limiarStockBaixo: LIMIAR_STOCK_BAIXO,
    ultimasEncomendas,
  });
});

// ── Registo de atividade ─────────────────────────────────────────────────
router.get('/logs', requirePermission('logs.ver'), (req, res) => {
  const limite = Math.min(500, Math.max(1, +req.query.limite || 100));
  const linhas = db.prepare(`
    SELECT id, admin_id, admin_nome, acao, entidade, entidade_id, detalhe, criado_em
    FROM logs_atividade
    ORDER BY criado_em DESC, id DESC
    LIMIT ?
  `).all(limite);
  res.json(linhas);
});

// Mantido para compatibilidade com scripts/relatórios que já usem os nomes antigos
router.get('/dashboard/legado', requirePermission('encomendas.ver'), (req, res) => {
  const totalVendas = db.prepare(`SELECT COALESCE(SUM(total),0) as v FROM encomendas WHERE estado NOT IN ('Cancelado') AND arquivada = 0`).get().v;
  const totalEncomendas = db.prepare(`SELECT COUNT(*) as n FROM encomendas WHERE arquivada = 0`).get().n;
  const encomendasHoje = db.prepare(`SELECT COUNT(*) as n FROM encomendas WHERE date(criado_em) = date('now') AND arquivada = 0`).get().n;
  const produtosSemStock = db.prepare(`SELECT COUNT(*) as n FROM produtos WHERE stock = 0 AND ativo = 1`).get().n;
  const totalClientes = db.prepare(`SELECT COUNT(*) as n FROM utilizadores`).get().n;
  const encomendaPendente = db.prepare(`SELECT COUNT(*) as n FROM encomendas WHERE estado = 'Pendente' AND arquivada = 0`).get().n;
  const totalArquivadas = db.prepare(`SELECT COUNT(*) as n FROM encomendas WHERE arquivada = 1`).get().n;

  const ultimasEncomendas = db.prepare(`
    SELECT numero, nome_cliente, total, estado, criado_em
    FROM encomendas WHERE arquivada = 0
    ORDER BY criado_em DESC LIMIT 5
  `).all();

  res.json({ totalVendas, totalEncomendas, encomendasHoje, produtosSemStock, totalClientes, encomendaPendente, totalArquivadas, ultimasEncomendas });
});

// ── Produtos ───────────────────────────────────────────────────────────────
router.get('/products', requirePermission('produtos.ver'), (req, res) => {
  const { q, categoria } = req.query;
  let sql = 'SELECT * FROM produtos WHERE 1=1';
  const params = [];
  if (q) { sql += ' AND (nome LIKE ? OR descricao LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (categoria) { sql += ' AND categoria = ?'; params.push(categoria); }
  sql += ' ORDER BY criado_em DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(p => ({ ...p, tamanhos: parsearJSON(p.tamanhos), cores: parsearJSON(p.cores), imagens_extra: parsearJSON(p.imagens_extra) })));
});

router.post('/products', requirePermission('produtos.editar'), (req, res) => {
  const { nome, descricao, descricao_longa, preco, preco_promocional, categoria, imagem, imagens_extra, tamanhos, cores, stock, ativo, destaque, material, instrucoes_lavagem } = req.body;
  if (!nome || !preco) return res.status(400).json({ error: 'Nome e preço obrigatórios.' });
  const r = db.prepare(`
    INSERT INTO produtos (nome, descricao, descricao_longa, preco, preco_promocional, categoria, imagem, imagens_extra, tamanhos, cores, stock, ativo, destaque, material, instrucoes_lavagem)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(nome, descricao || '', descricao_longa || '', +preco, preco_promocional ? +preco_promocional : null,
    categoria || '', imagem || null,
    JSON.stringify(Array.isArray(imagens_extra) ? imagens_extra.slice(0, 6) : []),
    JSON.stringify(Array.isArray(tamanhos) ? tamanhos : []),
    JSON.stringify(Array.isArray(cores) ? cores : []),
    +stock || 0, ativo ? 1 : 0, destaque ? 1 : 0, material || '', instrucoes_lavagem || '');
  registarAtividade(req, { acao: 'produto.criar', entidade: 'produto', entidadeId: r.lastInsertRowid, detalhe: `Criou o produto "${nome}"` });
  res.json({ ok: true, id: r.lastInsertRowid });
});

router.get('/products/:id', requirePermission('produtos.ver'), (req, res) => {
  const p = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Não encontrado.' });
  res.json({ ...p, tamanhos: parsearJSON(p.tamanhos), cores: parsearJSON(p.cores), imagens_extra: parsearJSON(p.imagens_extra) });
});

router.put('/products/:id', requirePermission('produtos.editar'), (req, res) => {
  const existente = db.prepare('SELECT id FROM produtos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ error: 'Produto não encontrado.' });

  const { nome, descricao, descricao_longa, preco, preco_promocional, categoria, imagem, imagens_extra, tamanhos, cores, stock, ativo, destaque, material, instrucoes_lavagem } = req.body;
  db.prepare(`
    UPDATE produtos SET nome=?, descricao=?, descricao_longa=?, preco=?, preco_promocional=?, categoria=?, imagem=?, imagens_extra=?, tamanhos=?, cores=?, stock=?, ativo=?, destaque=?, material=?, instrucoes_lavagem=?
    WHERE id=?
  `).run(nome, descricao || '', descricao_longa || '', +preco, preco_promocional ? +preco_promocional : null,
    categoria || '', imagem || null,
    JSON.stringify(Array.isArray(imagens_extra) ? imagens_extra.slice(0, 6) : []),
    JSON.stringify(Array.isArray(tamanhos) ? tamanhos : []),
    JSON.stringify(Array.isArray(cores) ? cores : []),
    +stock || 0, ativo ? 1 : 0, destaque ? 1 : 0, material || '', instrucoes_lavagem || '', req.params.id);
  registarAtividade(req, { acao: 'produto.editar', entidade: 'produto', entidadeId: req.params.id, detalhe: `Editou o produto "${nome}"` });
  res.json({ ok: true });
});

router.delete('/products/:id', requirePermission('produtos.editar'), (req, res) => {
  const p = db.prepare('SELECT nome FROM produtos WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  registarAtividade(req, { acao: 'produto.remover', entidade: 'produto', entidadeId: req.params.id, detalhe: `Removeu o produto "${p ? p.nome : req.params.id}"` });
  res.json({ ok: true });
});

router.patch('/products/:id/toggle', requirePermission('produtos.editar'), (req, res) => {
  const p = db.prepare('SELECT nome, ativo FROM produtos WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Não encontrado.' });
  db.prepare('UPDATE produtos SET ativo = ? WHERE id = ?').run(p.ativo ? 0 : 1, req.params.id);
  registarAtividade(req, { acao: 'produto.estado', entidade: 'produto', entidadeId: req.params.id, detalhe: `${p.ativo ? 'Desativou' : 'Ativou'} o produto "${p.nome}"` });
  res.json({ ok: true, ativo: !p.ativo });
});

// ── Encomendas ─────────────────────────────────────────────────────────────
router.get('/orders', requirePermission('encomendas.ver'), (req, res) => {
  const { q, estado, arquivadas } = req.query;
  const mostrarArquivadas = arquivadas === '1';

  let sql = 'SELECT * FROM encomendas WHERE arquivada = ?';
  const params = [mostrarArquivadas ? 1 : 0];

  if (estado) { sql += ' AND estado = ?'; params.push(estado); }
  if (q) { sql += ' AND (numero LIKE ? OR nome_cliente LIKE ? OR email_cliente LIKE ?)'; params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  sql += ' ORDER BY criado_em DESC';

  res.json(db.prepare(sql).all(...params));
});

router.get('/orders/:id', requirePermission('encomendas.ver'), (req, res) => {
  const enc = db.prepare('SELECT * FROM encomendas WHERE id = ?').get(req.params.id);
  if (!enc) return res.status(404).json({ error: 'Não encontrada.' });
  const itens = db.prepare('SELECT * FROM encomenda_itens WHERE encomenda_id = ?').all(req.params.id);
  res.json({ ...enc, itens });
});

const MENSAGENS_ESTADO = {
  'Pago': 'Recebemos o teu pagamento — a tua encomenda vai entrar em preparação em breve.',
  'Preparação': 'A tua encomenda está a ser preparada com todo o cuidado.',
  'Enviado': 'A tua encomenda já foi enviada e está a caminho!',
  'Entregue': 'A tua encomenda foi entregue. Esperamos que gostes!',
  'Cancelado': 'A tua encomenda foi cancelada. Se não esperavas isto, contacta-nos.',
};

router.patch('/orders/:id/estado', requirePermission('encomendas.editar'), async (req, res) => {
  const { estado, notificar } = req.body;
  const estados = ['Pendente', 'Pago', 'Preparação', 'Enviado', 'Entregue', 'Cancelado'];
  if (!estados.includes(estado)) return res.status(400).json({ error: 'Estado inválido.' });

  const enc = db.prepare('SELECT * FROM encomendas WHERE id = ?').get(req.params.id);
  if (!enc) return res.status(404).json({ error: 'Encomenda não encontrada.' });

  db.prepare('UPDATE encomendas SET estado = ? WHERE id = ?').run(estado, req.params.id);
  registarAtividade(req, { acao: 'encomenda.estado', entidade: 'encomenda', entidadeId: enc.numero, detalhe: `Encomenda ${enc.numero}: ${enc.estado} → ${estado}` });

  if (notificar && MENSAGENS_ESTADO[estado]) {
    try {
      await enviarEmail({
        to: enc.email_cliente,
        subject: `Encomenda ${enc.numero} — ${estado}`,
        text: `Olá ${enc.nome_cliente},\n\n${MENSAGENS_ESTADO[estado]}\n\nNº de encomenda: ${enc.numero}\n\nAURUM`,
        html: `<p>Olá ${enc.nome_cliente},</p><p>${MENSAGENS_ESTADO[estado]}</p><p><strong>Nº de encomenda:</strong> ${enc.numero}</p><p>AURUM</p>`,
      });
    } catch (err) {
      // Não falha o pedido só porque o email não saiu — o estado já ficou gravado.
      console.error('[encomendas] falha ao notificar cliente:', err.message);
    }
  }

  res.json({ ok: true });
});

// ── Arquivar encomendas ────────────────────────────────────────────────────
router.patch('/orders/:id/archive', (req, res) => {
  const enc = db.prepare('SELECT id, estado FROM encomendas WHERE id = ?').get(req.params.id);
  if (!enc) return res.status(404).json({ error: 'Encomenda não encontrada.' });
  if (enc.estado !== 'Entregue' && enc.estado !== 'Cancelado')
    return res.status(400).json({ error: 'Só é possível arquivar encomendas Entregues ou Canceladas.' });

  db.prepare('UPDATE encomendas SET arquivada = 1, arquivada_em = CURRENT_TIMESTAMP WHERE id = ?').run(req.params.id);
  registarAtividade(req, { acao: 'encomenda.arquivar', entidade: 'encomenda', entidadeId: req.params.id, detalhe: `Arquivou uma encomenda` });
  res.json({ ok: true });
});

router.patch('/orders/:id/unarchive', (req, res) => {
  db.prepare('UPDATE encomendas SET arquivada = 0, arquivada_em = NULL WHERE id = ?').run(req.params.id);
  registarAtividade(req, { acao: 'encomenda.desarquivar', entidade: 'encomenda', entidadeId: req.params.id, detalhe: `Desarquivou uma encomenda` });
  res.json({ ok: true });
});

// Arquivar em massa todas as encomendas Entregues
router.post('/orders/archive-all-delivered', (req, res) => {
  const result = db.prepare(`
    UPDATE encomendas SET arquivada = 1, arquivada_em = CURRENT_TIMESTAMP
    WHERE estado = 'Entregue' AND arquivada = 0
  `).run();
  registarAtividade(req, { acao: 'encomenda.arquivar', entidade: 'encomenda', detalhe: `Arquivou ${result.changes} encomenda(s) entregue(s) em massa` });
  res.json({ ok: true, arquivadas: result.changes });
});

// ── Clientes ───────────────────────────────────────────────────────────────
router.get('/customers', requirePermission('clientes.ver'), (req, res) => {
  const { q } = req.query;
  let sql = `
    SELECT u.*, COUNT(e.id) as total_encomendas, COALESCE(SUM(e.total),0) as total_gasto
    FROM utilizadores u
    LEFT JOIN encomendas e ON e.utilizador_id = u.id AND e.estado != 'Cancelado'
    WHERE 1=1
  `;
  const params = [];
  if (q) { sql += ' AND (u.nome LIKE ? OR u.email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  sql += ' GROUP BY u.id ORDER BY u.criado_em DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/customers/:id', requirePermission('clientes.ver'), (req, res) => {
  const user = db.prepare('SELECT * FROM utilizadores WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Não encontrado.' });
  const encomendas = db.prepare('SELECT * FROM encomendas WHERE utilizador_id = ? ORDER BY criado_em DESC').all(req.params.id);
  res.json({ ...user, encomendas });
});

// ── Upload ─────────────────────────────────────────────────────────────────
router.post('/upload', requirePermission('produtos.editar'), upload.single('imagem'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
  res.json({ ok: true, url: `/uploads/${req.file.filename}` });
});

// Upload de várias imagens de uma vez (galeria do produto)
router.post('/upload-multi', requirePermission('produtos.editar'), upload.multiplas, (req, res) => {
  if (!req.files || !req.files.length) return res.status(400).json({ error: 'Nenhum ficheiro enviado.' });
  res.json({ ok: true, urls: req.files.map(f => `/uploads/${f.filename}`) });
});

// ── Configurações (portes, etc.) ─────────────────────────────────────────────
const DEFAULT_CONFIG = { portes_valor: '4.99', portes_gratis_acima: '75' };

router.get('/config', requirePermission('definicoes.editar'), (req, res) => {
  const rows = db.prepare('SELECT chave, valor FROM configuracoes').all();
  const config = { ...DEFAULT_CONFIG };
  rows.forEach(r => { config[r.chave] = r.valor; });
  res.json(config);
});

router.put('/config', requirePermission('definicoes.editar'), (req, res) => {
  const permitido = ['portes_valor', 'portes_gratis_acima'];
  const upsert = db.prepare(`
    INSERT INTO configuracoes (chave, valor) VALUES (?, ?)
    ON CONFLICT(chave) DO UPDATE SET valor = excluded.valor
  `);
  for (const chave of permitido) {
    if (req.body[chave] !== undefined && req.body[chave] !== null && req.body[chave] !== '') {
      const num = Number(req.body[chave]);
      if (Number.isNaN(num) || num < 0) return res.status(400).json({ error: `Valor inválido para ${chave}.` });
      upsert.run(chave, String(num));
    }
  }
  registarAtividade(req, { acao: 'definicoes.portes', entidade: 'config', detalhe: 'Atualizou os valores de portes' });
  res.json({ ok: true });
});

// ── Mini-visualizador da base de dados (só leitura) ─────────────────────────
// Lista branca de tabelas — nunca aceitar nomes de tabela vindos do pedido
// directamente na query SQL (evita injecção de SQL).
const TABELAS_PERMITIDAS = ['admins', 'utilizadores', 'produtos', 'encomendas', 'encomenda_itens', 'favoritos', 'configuracoes'];

router.get('/db/tabelas', requirePermission('definicoes.editar'), (req, res) => {
  const tabelas = TABELAS_PERMITIDAS.map(nome => {
    const { n } = db.prepare(`SELECT COUNT(*) as n FROM ${nome}`).get();
    return { nome, linhas: n };
  });
  res.json({ tabelas });
});

router.get('/db/tabelas/:nome', requirePermission('definicoes.editar'), (req, res) => {
  const { nome } = req.params;
  if (!TABELAS_PERMITIDAS.includes(nome)) return res.status(400).json({ error: 'Tabela inválida.' });

  const pagina = Math.max(1, +req.query.pagina || 1);
  const porPagina = Math.min(200, Math.max(1, +req.query.porPagina || 50));
  const offset = (pagina - 1) * porPagina;

  const colunas = db.prepare(`PRAGMA table_info(${nome})`).all().map(c => c.name);
  const total = db.prepare(`SELECT COUNT(*) as n FROM ${nome}`).get().n;
  const linhas = db.prepare(`SELECT * FROM ${nome} LIMIT ? OFFSET ?`).all(porPagina, offset);

  res.json({ nome, colunas, linhas, total, pagina, porPagina, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) });
});

module.exports = router;
