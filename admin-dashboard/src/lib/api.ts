// Cliente de API do painel — substitui por completo o `src/data.ts` mock do
// Project Bolt. Todas as chamadas usam `credentials: 'include'` porque a
// autenticação do backend é por cookie de sessão (express-session), não por
// token Bearer.

const BASE = '/api';

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error || `Erro ${res.status}`, res.status);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Sessão / equipa ─────────────────────────────────────────────────────
export interface Sessao {
  id: number;
  nome: string;
  email: string;
  role: 'admin' | 'editor' | 'autor';
  permissoes: string[];
}

export const auth = {
  login: (email: string, password: string) =>
    request<{ ok: true }>('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request<{ ok: true }>('/admin/logout', { method: 'POST' }),
  me: () => request<Sessao>('/admin/me'),
};

// ── Produtos ─────────────────────────────────────────────────────────────
export interface Produto {
  id: number;
  nome: string;
  descricao: string;
  descricao_longa: string;
  preco: number;
  preco_promocional: number | null;
  categoria: string;
  imagem: string | null;
  imagens_extra: string;      // JSON string — usar parseImagensExtra()
  tamanhos: string;           // JSON string
  cores: string;              // JSON string
  stock: number;
  ativo: number;
  destaque: number;
}

export const parseImagensExtra = (p: Produto): string[] => {
  try { return JSON.parse(p.imagens_extra || '[]'); } catch { return []; }
};
export const parseVariantes = (json: string): string[] => {
  try { return JSON.parse(json || '[]'); } catch { return []; }
};

type ProdutoEscrita = Omit<Partial<Produto>, 'imagens_extra' | 'tamanhos' | 'cores'> & {
  imagens_extra?: string[];
  tamanhos?: string[];
  cores?: string[];
};

export const produtosApi = {
  listar: () => request<Produto[]>('/admin/products'),
  criar: (dados: ProdutoEscrita) =>
    request<{ ok: true; id: number }>('/admin/products', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: ProdutoEscrita) =>
    request<{ ok: true }>(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  remover: (id: number) => request<{ ok: true }>(`/admin/products/${id}`, { method: 'DELETE' }),
  alternarAtivo: (id: number) => request<{ ok: true }>(`/admin/products/${id}/toggle`, { method: 'PATCH' }),

  // Upload — usa FormData, por isso não passa por request() (que assume JSON)
  uploadImagemPrincipal: async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('imagem', file);
    const res = await fetch(`${BASE}/admin/upload`, { method: 'POST', credentials: 'include', body: fd });
    if (!res.ok) throw new ApiError('Falha no upload.', res.status);
    return (await res.json()).url;
  },
  uploadGaleria: async (files: File[]): Promise<string[]> => {
    const fd = new FormData();
    files.forEach(f => fd.append('imagens', f));
    const res = await fetch(`${BASE}/admin/upload-multi`, { method: 'POST', credentials: 'include', body: fd });
    if (!res.ok) throw new ApiError('Falha no upload.', res.status);
    return (await res.json()).urls;
  },
};

// ── Encomendas ───────────────────────────────────────────────────────────
export interface Encomenda {
  id: number;
  numero: string;
  nome_cliente: string;
  email_cliente: string;
  total: number;
  estado: 'Pendente' | 'Pago' | 'Preparação' | 'Enviado' | 'Entregue' | 'Cancelado';
  pagamento: string;
  criado_em: string;
}

export const encomendasApi = {
  listar: (filtros?: { q?: string; estado?: string }) => {
    const params = new URLSearchParams(filtros as Record<string, string>).toString();
    return request<Encomenda[]>(`/admin/orders${params ? `?${params}` : ''}`);
  },
  detalhe: (id: number) => request<Encomenda & { itens: unknown[] }>(`/admin/orders/${id}`),
  // Actualiza o estado E notifica o cliente por email num único pedido —
  // ver server/src/routes/admin.js: usa nodemailer (já é dependência do projecto).
  atualizarEstado: (id: number, estado: Encomenda['estado'], notificarCliente = true) =>
    request<{ ok: true }>(`/admin/orders/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, notificar: notificarCliente }),
    }),
};

// ── Clientes ─────────────────────────────────────────────────────────────
export interface Cliente {
  id: number;
  nome: string;
  email: string;
  criado_em: string;
  total_encomendas: number;
  total_gasto: number;
}
export const clientesApi = {
  listar: (q?: string) => request<Cliente[]>(`/admin/customers${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  detalhe: (id: number) => request<Cliente & { encomendas: Encomenda[] }>(`/admin/customers/${id}`),
};

// ── Cupões ───────────────────────────────────────────────────────────────
export interface Cupom {
  id: number;
  codigo: string;
  tipo: 'percentagem' | 'fixo';
  valor: number;
  valido_de: string | null;
  valido_ate: string | null;
  usos_maximos: number | null;
  usos_atuais: number;
  ativo: number;
}
export const cuponsApi = {
  listar: () => request<Cupom[]>('/admin/coupons'),
  criar: (dados: Partial<Cupom>) => request<{ ok: true; id: number }>('/admin/coupons', { method: 'POST', body: JSON.stringify(dados) }),
  atualizar: (id: number, dados: Partial<Cupom>) => request<{ ok: true }>(`/admin/coupons/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  remover: (id: number) => request<{ ok: true }>(`/admin/coupons/${id}`, { method: 'DELETE' }),
};

// ── Categorias ───────────────────────────────────────────────────────────
export interface Categoria { id: number; nome: string; slug: string; ordem: number; total_produtos: number }
export const categoriasApi = {
  listar: () => request<Categoria[]>('/admin/categories'),
  criar: (nome: string) => request<{ ok: true; id: number; slug: string }>('/admin/categories', { method: 'POST', body: JSON.stringify({ nome }) }),
  atualizar: (id: number, nome: string) => request<{ ok: true }>(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify({ nome }) }),
  remover: (id: number) => request<{ ok: true }>(`/admin/categories/${id}`, { method: 'DELETE' }),
};

// ── Dashboard ────────────────────────────────────────────────────────────
export interface ResumoDashboard {
  vendasHoje: number;
  vendasMes: number;
  encomendasPendentes: number;
  totalClientes: number;
  vendasPorDia: { dia: string; total: number }[];
  produtosMaisVendidos: { nome: string; quantidade: number }[];
}
export const dashboardApi = {
  resumo: () => request<ResumoDashboard>('/admin/dashboard'),
};

// ── Equipa (RBAC) ────────────────────────────────────────────────────────
export interface Membro { id: number; nome: string; email: string; role: string; criado_em: string }
export const equipaApi = {
  listar: () => request<Membro[]>('/admin/team'),
  roles: () => request<{ id: number; nome: string; descricao: string }[]>('/admin/team/roles'),
  convidar: (dados: { nome: string; email: string; password: string; role: string }) =>
    request<{ ok: true; id: number }>('/admin/team', { method: 'POST', body: JSON.stringify(dados) }),
  alterarRole: (id: number, role: string) => request<{ ok: true }>(`/admin/team/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  remover: (id: number) => request<{ ok: true }>(`/admin/team/${id}`, { method: 'DELETE' }),
};

// ── CMS ──────────────────────────────────────────────────────────────────
export interface PaginaCMS { id: number; titulo: string; slug: string; conteudo: string; estado: 'rascunho' | 'publicado'; atualizado_em: string }
export const cmsApi = {
  paginas: () => request<PaginaCMS[]>('/admin/cms/paginas'),
  criarPagina: (dados: { titulo: string; conteudo: string; estado: string }) =>
    request<{ ok: true; id: number }>('/admin/cms/paginas', { method: 'POST', body: JSON.stringify(dados) }),
  atualizarPagina: (id: number, dados: Partial<PaginaCMS>) =>
    request<{ ok: true }>(`/admin/cms/paginas/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  removerPagina: (id: number) => request<{ ok: true }>(`/admin/cms/paginas/${id}`, { method: 'DELETE' }),
  media: () => request<{ id: number; url: string; tipo: string }[]>('/admin/cms/media'),
};

// ── Plugins ──────────────────────────────────────────────────────────────
export interface Plugin { pasta: string; nome: string; versao: string; descricao: string; ativo: boolean; config: Record<string, unknown> }
export const pluginsApi = {
  listar: () => request<Plugin[]>('/admin/plugins'),
  alternar: (pasta: string, ativo: boolean) =>
    request<{ ok: true; aviso?: string }>(`/admin/plugins/${pasta}/estado`, { method: 'PUT', body: JSON.stringify({ ativo }) }),
};

// ── Definições do site ───────────────────────────────────────────────────
export interface SiteConfig { titulo_site: string; idioma: string; cor_primaria: string; cor_fundo: string; logotipo_url: string }
export const settingsApi = {
  obter: () => request<SiteConfig>('/admin/settings'),
  guardar: (dados: Partial<SiteConfig>) => request<{ ok: true }>('/admin/settings', { method: 'PUT', body: JSON.stringify(dados) }),
  portes: () => request<{ portes_valor: string; portes_gratis_acima: string }>('/admin/config'),
  guardarPortes: (dados: { portes_valor: string; portes_gratis_acima: string }) =>
    request<{ ok: true }>('/admin/config', { method: 'PUT', body: JSON.stringify(dados) }),
};

// ── Analytics ────────────────────────────────────────────────────────────
export const analyticsApi = {
  resumo: (dias = 30) => request<{
    visitasPorDia: { dia: string; total: number }[];
    paginasMaisVistas: { pagina: string; total: number }[];
    totalVisitantesUnicos: number;
  }>(`/admin/analytics/resumo?dias=${dias}`),
};

export { ApiError };
