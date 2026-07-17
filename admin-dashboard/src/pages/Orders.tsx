import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { PageHeader, EmptyState } from '@/components/shared/PageHeader'
import { StatusBadge, ORDER_STATUSES } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Search, Archive, ArchiveRestore, ShoppingCart } from 'lucide-react'

interface OrderItem {
  nome: string
  quantidade: number
  preco: number
  tamanho?: string
  cor?: string
}

interface Order {
  id: number
  numero: string
  nome: string
  email: string
  telefone?: string
  morada?: string
  cidade?: string
  codigo_postal?: string
  total: number
  estado: string
  data: string
  itens?: OrderItem[]
  arquivada?: boolean
}

export default function OrdersPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('encomendas.editar')

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'ativas' | 'arquivadas'>('ativas')
  const [search, setSearch] = useState('')
  const [estado, setEstado] = useState<string>('all')

  const [selected, setSelected] = useState<Order | null>(null)
  const [detail, setDetail] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [newEstado, setNewEstado] = useState('')
  const [notificar, setNotificar] = useState(true)
  const [statusSaving, setStatusSaving] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [archivingAll, setArchivingAll] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params: { q?: string; estado?: string; arquivadas?: string } = {}
    if (search) params.q = search
    if (estado !== 'all') params.estado = estado
    if (tab === 'arquivadas') params.arquivadas = '1'
    api
      .orders(params)
      .then((data) => setOrders(data as Order[]))
      .catch(() => toast.error('Erro ao carregar encomendas.'))
      .finally(() => setLoading(false))
  }, [search, estado, tab])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const openOrder = async (o: Order) => {
    setSelected(o)
    setDetail(null)
    setNewEstado(o.estado)
    setNotificar(true)
    setDetailLoading(true)
    try {
      const full = await api.order(o.id)
      setDetail(full as Order)
    } catch {
      setDetail(o)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!selected) return
    setStatusSaving(true)
    try {
      await api.updateOrderStatus(selected.id, newEstado, notificar)
      toast.success('Estado da encomenda atualizado.')
      setOrders((prev) =>
        prev.map((o) => (o.id === selected.id ? { ...o, estado: newEstado } : o)),
      )
      setSelected((s) => (s ? { ...s, estado: newEstado } : s))
      setDetail((d) => (d ? { ...d, estado: newEstado } : d))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar estado.')
    } finally {
      setStatusSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!selected) return
    setArchiving(true)
    try {
      if (selected.arquivada) {
        await api.unarchiveOrder(selected.id)
        toast.success('Encomenda desarquivada.')
      } else {
        await api.archiveOrder(selected.id)
        toast.success('Encomenda arquivada.')
      }
      setOrders((prev) => prev.filter((o) => o.id !== selected.id))
      setSelected(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao arquivar.')
    } finally {
      setArchiving(false)
    }
  }

  const handleArchiveAll = async () => {
    if (!confirm('Arquivar todas as encomendas entregues?')) return
    setArchivingAll(true)
    try {
      const res = await api.archiveAllDelivered()
      toast.success(`${res.arquivadas} encomenda(s) arquivada(s).`)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao arquivar.')
    } finally {
      setArchivingAll(false)
    }
  }

  if (!hasPermission('encomendas.ver')) {
    return <PageHeader title="Encomendas" description="Sem permissão para ver esta página." />
  }

  return (
    <div>
      <PageHeader
        title="Encomendas"
        description="Gerir encomendas da loja"
        action={
          tab === 'ativas' ? (
            <Button variant="outline" onClick={handleArchiveAll} disabled={archivingAll}>
              <Archive className="h-4 w-4" />
              {archivingAll ? 'A arquivar…' : 'Arquivar entregues'}
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'ativas' | 'arquivadas')} className="mb-4">
        <TabsList>
          <TabsTrigger value="ativas">Activas</TabsTrigger>
          <TabsTrigger value="arquivadas">Arquivadas</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nº, nome ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={estado} onValueChange={setEstado}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os estados</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState icon={ShoppingCart} title="Nenhuma encomenda encontrada" description="Ajusta a pesquisa ou o filtro." />
                </TableCell>
              </TableRow>
            ) : (
              orders.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => openOrder(o)}
                >
                  <TableCell className="font-mono text-xs">{o.numero}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{o.nome}</span>
                      <span className="text-xs text-muted-foreground">{o.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(o.total)}</TableCell>
                  <TableCell><StatusBadge status={o.estado} /></TableCell>
                  <TableCell className="text-muted-foreground">{formatDateTime(o.data)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openOrder(o)}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Encomenda {selected?.numero}</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-semibold">Cliente</h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd>{detail.nome}</dd>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{detail.email}</dd>
                  {detail.telefone && (<><dt className="text-muted-foreground">Telefone</dt><dd>{detail.telefone}</dd></>)}
                  {detail.morada && (<><dt className="text-muted-foreground">Morada</dt><dd>{detail.morada}</dd></>)}
                  {detail.cidade && (<><dt className="text-muted-foreground">Cidade</dt><dd>{detail.cidade}</dd></>)}
                  {detail.codigo_postal && (<><dt className="text-muted-foreground">Código postal</dt><dd>{detail.codigo_postal}</dd></>)}
                </dl>
              </div>

              <Separator />

              <div>
                <h4 className="mb-2 text-sm font-semibold">Artigos</h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Artigo</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(detail.itens || []).map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <span className="font-medium">{item.nome}</span>
                            {(item.tamanho || item.cor) && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {item.tamanho} {item.tamanho && item.cor ? '·' : ''} {item.cor}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.preco)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-2 flex justify-end text-sm font-semibold">
                  Total: {formatCurrency(detail.total)}
                </div>
              </div>

              {canEdit && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Alterar estado</h4>
                    <div className="flex items-center gap-3">
                      <Select value={newEstado} onValueChange={setNewEstado}>
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button onClick={handleStatusUpdate} disabled={statusSaving || newEstado === detail.estado}>
                        {statusSaving ? 'A guardar…' : 'Atualizar'}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="notificar" checked={notificar} onCheckedChange={(v) => setNotificar(v === true)} />
                      <Label htmlFor="notificar">Notificar cliente por email</Label>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex justify-end">
                <Button
                  variant={detail.arquivada ? 'outline' : 'secondary'}
                  onClick={handleArchive}
                  disabled={archiving}
                >
                  {detail.arquivada ? (
                    <>
                      <ArchiveRestore className="h-4 w-4" />
                      Desarquivar
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Arquivar
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : null}

          {!detailLoading && !detail && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
