/* nav.js — popula o menu de categorias do cabeçalho a partir da API,
   para páginas que não têm os filter-tabs completos (produto, perfil). */
'use strict';

(async () => {
  const headerNavLeft = document.querySelector('.header-nav-left');
  const footerCategorias = document.getElementById('footerCategorias');
  if (!headerNavLeft && !footerCategorias) return;
  try {
    const res = await fetch('/api/categories');
    const categorias = await res.json();
    const links = categorias.slice(0, 4).map(c => `<a href="/?category=${c.slug}">${c.nome}</a>`).join('');
    if (headerNavLeft) headerNavLeft.innerHTML = links;
    if (footerCategorias) footerCategorias.innerHTML = links;
  } catch {
    // Falha silenciosa — o cabeçalho fica só com o logótipo e ícones.
  }
})();
