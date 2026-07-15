import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, EmptyState } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Puzzle } from 'lucide-react'

interface Plugin {
  pasta: string
  nome: string
  descricao?: string
  versao?: string
  ativo: boolean
  config?: Record<string, any> | null
  configSchema?: Record<string, any> | null
}

function ConfigSchemaDisplay({ schema }: { schema?: Record<string, any> | null }) {
  if (!schema) return null
  const entries = Object.entries(schema)
  if (entries.length === 0) return null

  return (
    <div className="mt-3 border-t pt-3">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Configuração</p>
      <div className="space-y-1.5">
        {entries.map(([key, value]) => {
          const def = (value ?? {}) as Record<string, any>
          return (
            <div key={key} className="flex items-start justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="font-mono font-medium">{key}</span>
                {def.label && <span className="ml-1 text-muted-foreground">{def.label}</span>}
              </div>
              <span className="shrink-0 font-mono text-muted-foreground">{def.type ?? '—'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function PluginsPage() {
  const { hasPermission } = useAuth()
  const [plugins, setPlugins] = useState<Plugin[]>([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    api
      .plugins()
      .then((data) => setPlugins(data as Plugin[]))
      .catch(() => toast.error('Não foi possível carregar os plugins.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleToggle = useCallback(
    async (plugin: Plugin, next: boolean) => {
      setToggling(plugin.pasta)
      // optimistic update
      setPlugins((prev) => prev.map((p) => (p.pasta === plugin.pasta ? { ...p, ativo: next } : p)))
      try {
        const res = await api.updatePluginState(plugin.pasta, next)
        if (res.aviso) toast.message(res.aviso)
        toast.success(next ? `Plugin "${plugin.nome}" ativado.` : `Plugin "${plugin.nome}" desativado.`)
      } catch (err) {
        // revert on failure
        setPlugins((prev) => prev.map((p) => (p.pasta === plugin.pasta ? { ...p, ativo: !next } : p)))
        toast.error(err instanceof Error ? err.message : 'Erro ao alterar o estado do plugin.')
      } finally {
        setToggling(null)
      }
    },
    [],
  )

  if (!hasPermission('plugins.editar')) {
    return <PageHeader title="Plugins" description="Sem permissão para gerir plugins." />
  }

  return (
    <div>
      <PageHeader title="Plugins" description="Ative e desative os plugins da loja" />

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="mt-2 h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : plugins.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState icon={Puzzle} title="Nenhum plugin instalado" description="Os plugins que instalar aparecerão aqui." />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plugins.map((plugin) => (
            <Card key={plugin.pasta} className="flex flex-col">
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div className="min-w-0 space-y-1">
                  <CardTitle className="truncate">{plugin.nome}</CardTitle>
                  {plugin.descricao && <CardDescription className="line-clamp-2">{plugin.descricao}</CardDescription>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {plugin.versao && <Badge variant="outline">v{plugin.versao}</Badge>}
                </div>
              </CardHeader>

              <CardContent className="mt-auto">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{plugin.ativo ? 'Ativo' : 'Inativo'}</span>
                  <Switch
                    checked={plugin.ativo}
                    disabled={toggling === plugin.pasta}
                    onCheckedChange={(checked) => handleToggle(plugin, checked)}
                    aria-label={`Alternar plugin ${plugin.nome}`}
                  />
                </div>

                <ConfigSchemaDisplay schema={plugin.configSchema} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
