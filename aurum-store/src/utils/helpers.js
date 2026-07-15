'use strict';

function gerarNumeroEncomenda() {
  // Código curto e único: AUR- + 6 caracteres alfanuméricos (base36 dos últimos
  // dígitos do timestamp + 2 caracteres aleatórios), ex: AUR-K3F9X2
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = Math.random().toString(36).slice(2, 4).toUpperCase();
  return `AUR-${ts}${rand}`;
}

function parsearJSON(val, fallback = []) {
  try { return JSON.parse(val); } catch { return fallback; }
}

module.exports = { gerarNumeroEncomenda, parsearJSON };
