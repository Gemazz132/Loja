'use strict';

const fs = require('fs');
const path = require('path');
const db = require('../../db/database');

// __dirname = aurum-store/src/plugins → 2 níveis acima chega à raiz do projecto (aurum-store/)
const PLUGINS_DIR = path.join(__dirname, '../../plugins');

/** Lista todas as pastas de plugins disponíveis em /plugins, com o seu manifesto. */
function listarDisponiveis() {
  if (!fs.existsSync(PLUGINS_DIR)) return [];
  return fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => {
      const manifestPath = path.join(PLUGINS_DIR, d.name, 'plugin.json');
      if (!fs.existsSync(manifestPath)) return null;
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      return { pasta: d.name, ...manifest };
    })
    .filter(Boolean);
}

/** Corre no arranque do servidor: monta as rotas dos plugins marcados como activos na BD. */
function carregarPluginsAtivos(app) {
  const disponiveis = listarDisponiveis();
  const ativos = new Set(
    db.prepare('SELECT nome FROM plugins_instalados WHERE ativo = 1').all().map(r => r.nome)
  );

  for (const plugin of disponiveis) {
    if (!ativos.has(plugin.pasta)) continue;
    const routesPath = path.join(PLUGINS_DIR, plugin.pasta, 'routes.js');
    if (fs.existsSync(routesPath)) {
      const montar = require(routesPath);
      const configRow = db.prepare('SELECT config FROM plugins_instalados WHERE nome = ?').get(plugin.pasta);
      const config = configRow ? JSON.parse(configRow.config || '{}') : {};
      montar(app, config);
      console.log(`  ✦ Plugin activo: ${plugin.nome} (${plugin.pasta})`);
    }
  }
}

/** Garante que todo o plugin encontrado em disco tem uma linha em plugins_instalados
 *  (inactivo por omissão), para aparecer na lista do painel mesmo sem nunca ter sido activado. */
function sincronizarRegisto() {
  const insert = db.prepare("INSERT OR IGNORE INTO plugins_instalados (nome, ativo, config) VALUES (?, 0, '{}')");
  for (const plugin of listarDisponiveis()) insert.run(plugin.pasta);
}

module.exports = { listarDisponiveis, carregarPluginsAtivos, sincronizarRegisto };
