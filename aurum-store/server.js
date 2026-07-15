'use strict';

require('dotenv').config();

const path = require('path');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const multer = require('multer');

const authRoutes      = require('./src/routes/auth');
const userAuthRoutes  = require('./src/routes/userAuth');
const accountRoutes   = require('./src/routes/account');
const productRoutes   = require('./src/routes/products');
const checkoutRoutes  = require('./src/routes/checkout');
const adminRoutes     = require('./src/routes/admin');
const configRoutes    = require('./src/routes/config');
const couponsRoutes   = require('./src/routes/coupons');
const cmsRoutes       = require('./src/routes/cms');
const teamRoutes      = require('./src/routes/team');
const settingsRoutes  = require('./src/routes/settings');
const pluginsRoutes   = require('./src/routes/plugins');
const analyticsRoutes = require('./src/routes/analytics');
const { carregarPluginsAtivos, sincronizarRegisto } = require('./src/plugins/loader');

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  name: 'aurum.sid',
  secret: process.env.SESSION_SECRET || 'dev-secret-troca-isto',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: isProd, maxAge: 1000 * 60 * 60 * 8 },
}));

// ── API ────────────────────────────────────────────────
app.use('/api/admin',    authRoutes);      // login, logout, me (+ role/permissões)
app.use('/api/auth',     userAuthRoutes);  // register, login, logout, me
app.use('/api/account',  accountRoutes);   // orders do cliente
app.use('/api/products', productRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/admin',    adminRoutes);     // dashboard, produtos, encomendas, clientes, upload
app.use('/api/config',   configRoutes);    // portes/config pública (loja + checkout)

app.use('/api/admin/coupons',   couponsRoutes);
app.use('/api/admin/cms',       cmsRoutes);
app.use('/api/cms',             cmsRoutes.publicRouter);      // páginas/posts publicados (loja)
app.use('/api/admin/team',      teamRoutes);
app.use('/api/admin/settings',  settingsRoutes);
app.use('/api/site-config',     settingsRoutes.publicRouter); // definições públicas (tema/logótipo na loja)
app.use('/api/admin/plugins',   pluginsRoutes);
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/analytics',       analyticsRoutes.publicRouter); // POST /evento (tracking anónimo da loja)

sincronizarRegisto();
carregarPluginsAtivos(app);

// ── Painel de administração (React) ─────────────────────
// Substitui por completo o antigo admin/ (HTML/CSS/JS estático). A build
// (`npm run build` em admin-dashboard/) gera admin-dashboard-dist/, servida
// aqui. A autenticação é feita no cliente (ecrã de login do React chama
// /api/admin/me; se der 401, mostra o login) — não há gate no servidor.
const ADMIN_DIST = path.join(__dirname, 'admin-dashboard-dist');
app.use('/admin', express.static(ADMIN_DIST));
app.get(['/admin', '/admin/*'], (req, res) => {
  res.sendFile(path.join(ADMIN_DIST, 'index.html'));
});

// ── Public store ───────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Rota de produto (SPA fallback para /product.html) ──
// Já servido pelo static; mas garantir que /product retorna o HTML
app.get('/product', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'product.html'));
});

// ── Error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError)
    return res.status(400).json({ error: `Erro no upload: ${err.message}` });
  if (err)
    return res.status(400).json({ error: err.message || 'Erro inesperado.' });
  next();
});

app.listen(PORT, () => {
  console.log(`\n  ✦ AURUM a correr → http://localhost:${PORT}`);
  console.log(`  ✦ Painel          → http://localhost:${PORT}/admin/\n`);
});
