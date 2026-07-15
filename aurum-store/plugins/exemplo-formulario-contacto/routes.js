'use strict';

const db = require('../../db/database');

// Tabela própria do plugin — criada aqui, não no schema central, para mostrar
// que um plugin pode gerir os seus próprios dados sem tocar no core.
db.exec(`
  CREATE TABLE IF NOT EXISTS plugin_contactos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

/** Chamado pelo loader com (app, config) quando o plugin está activo. */
module.exports = function montar(app, config) {
  app.post('/api/contacto', (req, res) => {
    const { nome, email, mensagem } = req.body || {};
    if (!nome || !email || !mensagem) return res.status(400).json({ error: 'Preenche todos os campos.' });

    db.prepare('INSERT INTO plugin_contactos (nome, email, mensagem) VALUES (?,?,?)').run(nome, email, mensagem);

    // config.email_destino viria da configuração do plugin no painel — aqui só
    // fica o local a fazer o pedido de envio real (nodemailer já é dependência).
    console.log(`[plugin contacto] nova mensagem de ${email} — reencaminhar para ${config.email_destino || '(não configurado)'}`);

    res.json({ ok: true });
  });

  app.get('/api/admin/contactos', (req, res) => {
    if (!req.session?.adminId) return res.status(401).json({ error: 'Não autenticado.' });
    res.json(db.prepare('SELECT * FROM plugin_contactos ORDER BY criado_em DESC').all());
  });
};
