'use strict';

(async () => {
  const loadingEl = document.getElementById('perfilLoading');
  const guestEl = document.getElementById('perfilGuest');
  const conteudoEl = document.getElementById('perfilConteudo');

  function fmt(v) { return `${Number(v).toFixed(2).replace('.', ',')} €`; }

  const ESTADO_COR = {
    'Pendente': 'estado-cinza', 'Pago': 'estado-azul', 'Preparação': 'estado-amarelo',
    'Enviado': 'estado-azul', 'Entregue': 'estado-verde', 'Cancelado': 'estado-vermelho',
  };

  // ── Verificar sessão ──────────────────────────────────
  let me;
  try {
    me = await fetch('/api/auth/me').then(r => r.json());
  } catch {
    me = { autenticado: false };
  }

  loadingEl.style.display = 'none';

  if (!me.autenticado) {
    guestEl.style.display = '';
    document.getElementById('perfilAbrirLogin')?.addEventListener('click', () => {
      if (typeof Account !== 'undefined') Account.open();
    });
    return;
  }

  conteudoEl.style.display = '';

  // ── Carregar dados em paralelo ────────────────────────
  const [perfil, resumo, encomendas, favoritos] = await Promise.all([
    fetch('/api/account/profile').then(r => r.json()),
    fetch('/api/account/resumo').then(r => r.json()),
    fetch('/api/account/orders').then(r => r.json()),
    fetch('/api/account/favoritos').then(r => r.json()),
  ]);

  // ── Cabeçalho ──────────────────────────────────────────
  document.getElementById('perfilAvatar').textContent = (perfil.nome || '?').charAt(0).toUpperCase();
  document.getElementById('perfilNomeTitulo').textContent = perfil.nome;
  document.getElementById('perfilEmailTitulo').textContent = perfil.email;

  // ── Preencher formulário ───────────────────────────────
  document.getElementById('perfilNome').value = perfil.nome || '';
  document.getElementById('perfilEmail').value = perfil.email || '';
  document.getElementById('perfilTelefone').value = perfil.telefone || '';
  document.getElementById('perfilCodigoPostal').value = perfil.codigo_postal || '';
  document.getElementById('perfilMorada').value = perfil.morada || '';
  document.getElementById('perfilCidade').value = perfil.cidade || '';
  document.getElementById('perfilPais').value = perfil.pais || 'Portugal';

  // ── Guardar alterações ─────────────────────────────────
  const form = document.getElementById('perfilForm');
  const msgEl = document.getElementById('perfilMsg');
  const guardarBtn = document.getElementById('perfilGuardarBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgEl.textContent = '';
    msgEl.className = 'perfil-msg';
    guardarBtn.disabled = true;
    guardarBtn.textContent = 'A guardar…';

    const body = {
      nome: document.getElementById('perfilNome').value,
      telefone: document.getElementById('perfilTelefone').value,
      morada: document.getElementById('perfilMorada').value,
      cidade: document.getElementById('perfilCidade').value,
      codigo_postal: document.getElementById('perfilCodigoPostal').value,
      pais: document.getElementById('perfilPais').value,
    };

    try {
      const res = await fetch('/api/account/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao guardar.');
      msgEl.textContent = 'Dados guardados com sucesso.';
      msgEl.className = 'perfil-msg perfil-msg-ok';
      document.getElementById('perfilNomeTitulo').textContent = body.nome;
      document.getElementById('perfilAvatar').textContent = body.nome.charAt(0).toUpperCase();
    } catch (err) {
      msgEl.textContent = err.message;
      msgEl.className = 'perfil-msg perfil-msg-erro';
    } finally {
      guardarBtn.disabled = false;
      guardarBtn.textContent = 'Guardar alterações';
    }
  });

  // ── Resumo de actividade ───────────────────────────────
  document.getElementById('statEncomendas').textContent = resumo.totalEncomendas;
  document.getElementById('statGasto').textContent = fmt(resumo.totalGasto);
  document.getElementById('statFavoritos').textContent = resumo.totalFavoritos;
  document.getElementById('statDesde').textContent = new Date(perfil.criado_em).toLocaleDateString('pt-PT', { year: 'numeric', month: 'short' });

  // ── Últimas encomendas ─────────────────────────────────
  const encomendasEl = document.getElementById('perfilEncomendas');
  if (encomendas.length > 0) {
    encomendasEl.innerHTML = encomendas.slice(0, 5).map(enc => `
      <div class="perfil-encomenda">
        <div>
          <div class="perfil-encomenda-numero">${enc.numero}</div>
          <div class="perfil-encomenda-data">${new Date(enc.criado_em).toLocaleDateString('pt-PT')} • ${enc.items_resumo || ''}</div>
        </div>
        <div class="perfil-encomenda-direita">
          <span class="perfil-badge ${ESTADO_COR[enc.estado] || 'estado-cinza'}">${enc.estado}</span>
          <span class="perfil-encomenda-total">${fmt(enc.total)}</span>
        </div>
      </div>
    `).join('');
  }

  // ── Favoritos ──────────────────────────────────────────
  const favoritosEl = document.getElementById('perfilFavoritos');
  if (favoritos.length > 0) {
    favoritosEl.innerHTML = favoritos.map(p => `
      <a href="/product.html?id=${p.id}" class="perfil-favorito-card">
        <div class="perfil-favorito-img" style="${p.imagem ? `background-image:url('${p.imagem}')` : ''}"></div>
        <div class="perfil-favorito-nome">${p.nome}</div>
        <div class="perfil-favorito-preco">${fmt(p.preco_promocional || p.preco)}</div>
      </a>
    `).join('');
  }
})();
