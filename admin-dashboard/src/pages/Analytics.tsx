import { useCallback, useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'

interface AnalyticsData {
  visitasPorDia?: { dia: string; pageviews: number }[]
  paginasMaisVistas?: { pagina: string; visitas: number }[]
  totalVisitantesUnicos?: number
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
}

export default function AnalyticsPage() {
  const { hasPermission } = useAuth()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dias, setDias] = useState(7)

  const load = useCallback((range: number) => {
    setLoading(true)
    api
      .analytics(range)
      .then((res) => setData(res as AnalyticsData))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load(dias)
  }, [dias, load])

  if (!hasPermission('analytics.ver')) {
    return <PageHeader title="Analytics" description="Sem permissão para ver a analítica." />
  }

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="Estatísticas de visitas e páginas mais vistas"
        action={
          <Select value={String(dias)} onValueChange={(v) => setDias(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {(data?.totalVisitantesUnicos ?? 0).toLocaleString('pt-PT')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visitas por dia</CardTitle>
            <CardDescription>Pageviews ao longo do período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[280px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={data?.visitasPorDia || []}>
                  <defs>
                    <linearGradient id="visitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="dia"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit' })}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="pageviews" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#visitas)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Páginas mais vistas</CardTitle>
            <CardDescription>Top páginas do período</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data?.paginasMaisVistas || []} layout="vertical" margin={{ left: 10 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="pagina"
                    width={120}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 18) + '…' : v)}
                  />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="visitas" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
