import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { LayoutDashboard, Package, ShoppingCart, Users, Ticket, FileText, UsersRound, Puzzle, ChartBar as BarChart3, Settings, LogOut, Sparkles, Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  permission?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'encomendas.ver' },
  { to: '/produtos', label: 'Produtos', icon: Package, permission: 'produtos.ver' },
  { to: '/encomendas', label: 'Encomendas', icon: ShoppingCart, permission: 'encomendas.ver' },
  { to: '/clientes', label: 'Clientes', icon: Users, permission: 'clientes.ver' },
  { to: '/cupoes', label: 'Cupões', icon: Ticket, permission: 'cupoes.editar' },
  { to: '/conteudo', label: 'Conteúdo', icon: FileText, permission: 'cms.ver' },
  { to: '/equipa', label: 'Equipa', icon: UsersRound, permission: 'equipa.editar' },
  { to: '/plugins', label: 'Plugins', icon: Puzzle, permission: 'plugins.editar' },
  { to: '/analytics', label: 'Analytics', icon: BarChart3, permission: 'analytics.ver' },
  { to: '/definicoes', label: 'Definições', icon: Settings, permission: 'definicoes.editar' },
]

export function Sidebar() {
  const { user, hasPermission, logout } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()

  const visibleItems = NAV_ITEMS.filter((item) => !item.permission || hasPermission(item.permission))

  const handleLogout = async () => {
    await logout()
    toast.success('Sessão terminada')
  }

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="font-display text-lg font-semibold tracking-[0.15em]">AURUM</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3 scrollbar-thin">
        {visibleItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center justify-between gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex flex-1 items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-muted">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user?.nome?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">{user?.nome}</p>
                  <p className="truncate text-xs text-muted-foreground capitalize">{user?.role}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4" />
                Terminar sessão
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Alternar tema">
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </aside>
  )
}

export function TopBar() {
  const location = useLocation()
  const current = NAV_ITEMS.find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
  )
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/80 px-6 backdrop-blur-sm">
      <h1 className="text-lg font-semibold">{current?.label || 'Painel'}</h1>
    </header>
  )
}
