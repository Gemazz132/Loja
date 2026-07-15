import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ThemeProvider } from '@/lib/theme'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Sidebar, TopBar } from '@/components/layout/Sidebar'
import LoginPage from '@/pages/Login'
import DashboardPage from '@/pages/Dashboard'
import ProductsPage from '@/pages/Products'
import OrdersPage from '@/pages/Orders'
import CustomersPage from '@/pages/Customers'
import CouponsPage from '@/pages/Coupons'
import ContentPage from '@/pages/Content'
import TeamPage from '@/pages/Team'
import PluginsPage from '@/pages/Plugins'
import AnalyticsPage from '@/pages/Analytics'
import SettingsPage from '@/pages/Settings'
import { cn } from '@/lib/utils'

function ProtectedLayout() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">A carregar…</p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('ml-64')}>
        <TopBar />
        <main className="p-6">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/produtos" element={<ProductsPage />} />
            <Route path="/encomendas" element={<OrdersPage />} />
            <Route path="/clientes" element={<CustomersPage />} />
            <Route path="/cupoes" element={<CouponsPage />} />
            <Route path="/conteudo" element={<ContentPage />} />
            <Route path="/equipa" element={<TeamPage />} />
            <Route path="/plugins" element={<PluginsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/definicoes" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider delayDuration={200}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
