import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, Sessao } from './api';

interface AuthContextValue {
  sessao: Sessao | null;
  carregando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  pode: (permissao: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessao, setSessao] = useState<Sessao | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarSessao() {
    try {
      setSessao(await auth.me());
    } catch {
      setSessao(null);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregarSessao(); }, []);

  async function login(email: string, password: string) {
    await auth.login(email, password);
    await carregarSessao();
  }

  async function logout() {
    await auth.logout();
    setSessao(null);
  }

  // 'admin' tem sempre todas as permissões, mesmo que a lista vinda da API
  // esteja incompleta por algum motivo — segurança adicional no cliente
  // (a validação real e obrigatória está sempre no middleware do servidor).
  function pode(permissao: string) {
    if (!sessao) return false;
    if (sessao.role === 'admin') return true;
    return sessao.permissoes.includes(permissao);
  }

  return (
    <AuthContext.Provider value={{ sessao, carregando, login, logout, pode }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
