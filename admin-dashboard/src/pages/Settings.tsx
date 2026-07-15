import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, ChevronRight, Database } from 'lucide-react'

const POR_PAGINA = 50

export default function SettingsPage() {
  const { hasPermission } = useAuth()
  const [loading, setLoading] = useState(true)
  const [savingGeneral, setSavingGeneral] = useState(false)
  const [savingPortes, setSavingPortes] = useState(false)

  // Geral
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [generalForm, setGeneralForm] = useState<Record<string, string>>({})

  // Portes
  const [config, setConfig] = useState<{ portes_valor: number; portes_gratis_acima: number } | null>(null)
  const [portesForm, setPortesForm] = useState({ portes_valor: '', portes_gratis_acima: '' })

  // Base de dados
  const [tables, setTables] = useState<{ nome: string; linhas: number }[]>([])
  const [tablesLoading, setTablesLoading] = useState(false)
  const [activeTable, setActiveTable] = useState<string | null>(null)
  const [tableData, setTableData] = useState<any>(null)
  const [tableLoading, setTableLoading] = useState(false)
  const [page, setPage] = useState(1)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [s, c] = await Promise.all([api.settings(), api.config()])
      setSettings(s)
      setGeneralForm({
        titulo_site: s.titulo_site ?? '',
        idioma: s.idioma ?? 'pt',
        cor_primaria: s.cor_primaria ?? '#000000',
        cor_fundo: s.cor_fundo ?? '#ffffff',
        logotipo_url: s.logotipo_url ?? '',
      })
      setConfig(c)
      setPortesForm({
        portes_valor: String(c.portes_valor ?? ''),
        portes_gratis_acima: String(c.portes_gratis_acima ?? ''),
      })
    } catch {
      toast.error('Não foi possível carregar as definições.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  const handleSaveGeneral = useCallback(async () => {
    setSavingGeneral(true)
    try {
      await api.updateSettings(generalForm)
      setSettings(generalForm)
      toast.success('Definições gerais guardadas.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar as definições.')
    } finally {
      setSavingGeneral(false)
    }
  }, [generalForm])

  const handleSavePortes = useCallback(async () => {
    setSavingPortes(true)
    try {
      const payload = {
        portes_valor: Number(portesForm.portes_valor),
        portes_gratis_acima: Number(portesForm.portes_gratis_acima),
      }
      await api.updateConfig(payload)
      setConfig(payload)
      toast.success('Definições de portes guardadas.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar os portes.')
    } finally {
      setSavingPortes(false)
    }
  }, [portesForm])

  const loadTables = useCallback(async () => {
    setTablesLoading(true)
    try {
      const res = await api.dbTables()
      setTables(res.tabelas || [])
    } catch {
      toast.error('Não foi possível listar as tabelas.')
    } finally {
      setTablesLoading(false)
    }
  }, [])

  const loadTableData = useCallback(async (nome: string, pagina: number) => {
    setTableLoading(true)
    try {
      const res = await api.dbTableData(nome, pagina, POR_PAGINA)
      setTableData(res)
    } catch {
      toast.error('Não foi possível obter os dados da tabela.')
      setTableData(null)
    } finally {
      setTableLoading(false)
    }
  }, [])

  const openTable = useCallback(
    (nome: string) => {
      setActiveTable(nome)
      setPage(1)
      loadTableData(nome, 1)
    },
    [loadTableData],
  )

  const closeTable = useCallback(() => {
    setActiveTable(null)
    setTableData(null)
    setPage(1)
  }, [])

  const goPage = useCallback(
    (next: number) => {
      if (!activeTable || next < 1) return
      setPage(next)
      loadTableData(activeTable, next)
    },
    [activeTable, loadTableData],
  )

  if (!hasPermission('definicoes.editar')) {
    return <PageHeader title="Definições" description="Sem permissão para gerir as definições." />
  }

  const totalPages = tableData?.totalPaginas ?? tableData?.total_pages ?? 1
  const currentPage = tableData?.pagina ?? tableData?.page ?? page
  const rows: any[] = tableData?.linhas ?? tableData?.rows ?? []
  const columns = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <div>
      <PageHeader title="Definições" description="Gerir configuração geral, portes e base de dados" />

      <Tabs defaultValue="geral" onValueChange={(v) => v === 'bd' && tables.length === 0 && loadTables()}>
        <TabsList>
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="portes">Portes</TabsTrigger>
          <TabsTrigger value="bd">Base de Dados</TabsTrigger>
        </TabsList>

        {/* Geral */}
        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Definições gerais</CardTitle>
              <CardDescription>Configuração visual e textual do site</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full max-w-md" />
                  ))}
                </div>
              ) : (
                <div className="grid max-w-2xl gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="titulo_site">Título do site</Label>
                    <Input
                      id="titulo_site"
                      value={generalForm.titulo_site}
                      onChange={(e) => setGeneralForm((p) => ({ ...p, titulo_site: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="idioma">Idioma</Label>
                    <Input
                      id="idioma"
                      value={generalForm.idioma}
                      onChange={(e) => setGeneralForm((p) => ({ ...p, idioma: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="cor_primaria">Cor primária</Label>
                      <div className="flex items-center gap-3">
                        <input
                          id="cor_primaria"
                          type="color"
                          value={generalForm.cor_primaria}
                          onChange={(e) => setGeneralForm((p) => ({ ...p, cor_primaria: e.target.value }))}
                          className="h-9 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                        />
                        <Input
                          value={generalForm.cor_primaria}
                          onChange={(e) => setGeneralForm((p) => ({ ...p, cor_primaria: e.target.value }))}
                          className="max-w-[140px]"
                        />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="cor_fundo">Cor de fundo</Label>
                      <div className="flex items-center gap-3">
                        <input
                          id="cor_fundo"
                          type="color"
                          value={generalForm.cor_fundo}
                          onChange={(e) => setGeneralForm((p) => ({ ...p, cor_fundo: e.target.value }))}
                          className="h-9 w-14 cursor-pointer rounded-md border border-input bg-background p-1"
                        />
                        <Input
                          value={generalForm.cor_fundo}
                          onChange={(e) => setGeneralForm((p) => ({ ...p, cor_fundo: e.target.value }))}
                          className="max-w-[140px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="logotipo_url">URL do logótipo</Label>
                    <Input
                      id="logotipo_url"
                      value={generalForm.logotipo_url}
                      onChange={(e) => setGeneralForm((p) => ({ ...p, logotipo_url: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <Button onClick={handleSaveGeneral} disabled={savingGeneral}>
                      {savingGeneral ? 'A guardar…' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Portes */}
        <TabsContent value="portes">
          <Card>
            <CardHeader>
              <CardTitle>Definições de portes</CardTitle>
              <CardDescription>Configurar custos e limite de portes grátis</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full max-w-md" />
                  ))}
                </div>
              ) : (
                <div className="grid max-w-md gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="portes_valor">Valor dos portes (€)</Label>
                    <Input
                      id="portes_valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={portesForm.portes_valor}
                      onChange={(e) => setPortesForm((p) => ({ ...p, portes_valor: e.target.value }))}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="portes_gratis_acima">Portes grátis a partir de (€)</Label>
                    <Input
                      id="portes_gratis_acima"
                      type="number"
                      step="0.01"
                      min="0"
                      value={portesForm.portes_gratis_acima}
                      onChange={(e) => setPortesForm((p) => ({ ...p, portes_gratis_acima: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Button onClick={handleSavePortes} disabled={savingPortes}>
                      {savingPortes ? 'A guardar…' : 'Guardar'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Base de Dados */}
        <TabsContent value="bd">
          <Card>
            <CardHeader>
              <CardTitle>Tabelas da base de dados</CardTitle>
              <CardDescription>Clique numa tabela para ver os seus registos</CardDescription>
            </CardHeader>
            <CardContent>
              {tablesLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : tables.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                    <Database className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="font-medium">Nenhuma tabela disponível</p>
                  <p className="mt-1 text-sm text-muted-foreground">As tabelas da base de dados aparecerão aqui.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tabela</TableHead>
                      <TableHead className="text-right">Linhas</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tables.map((t) => (
                      <TableRow
                        key={t.nome}
                        className="cursor-pointer"
                        onClick={() => openTable(t.nome)}
                      >
                        <TableCell className="font-mono font-medium">{t.nome}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {t.linhas.toLocaleString('pt-PT')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <ChevronRight className="h-4 w-4" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de dados da tabela */}
      <Dialog open={!!activeTable} onOpenChange={(open) => !open && closeTable()}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="font-mono">{activeTable}</DialogTitle>
            <DialogDescription>Registos da tabela</DialogDescription>
          </DialogHeader>

          {tableLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem registos.</p>
          ) : (
            <div className="space-y-4">
              <div className="max-h-[50vh] overflow-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {columns.map((col) => (
                        <TableHead key={col} className="font-mono whitespace-nowrap">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        {columns.map((col) => (
                          <TableCell key={col} className="whitespace-nowrap text-xs">
                            {row[col] === null || row[col] === undefined
                              ? '—'
                              : String(row[col])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1 || tableLoading}
                    onClick={() => goPage(currentPage - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages || tableLoading}
                    onClick={() => goPage(currentPage + 1)}
                  >
                    Seguinte
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
