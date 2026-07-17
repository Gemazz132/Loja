import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatCurrency, formatDate } from '@/lib/utils'
import { PageHeader, EmptyState } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Input } from '@/components/ui/input'
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
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Search, Users } from 'lucide-react'

interface CustomerOrder {
  id: number
  numero: string
  total: number
  estado: string
  data: string
}

interface Customer {
  id: number
  nome: string
  email: string
  telefone?: string
  encomendas?: CustomerOrder[]
  total_gasto?: number
  data_registo?: string
}

interface CustomerListItem {
  id: number
  nome: string
  email: string
  encomendas: number
  total_gasto: number
  data_registo: string
}

export default function CustomersPage() {
  const { hasPermission } = useAuth()

  const [customers, setCustomers] = useState<CustomerListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState<Customer | null>(null)
  const [detail, setDetail] = useState<Customer | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api
      .customers(search)
      .then((data) => setCustomers(data as CustomerListItem[]))
      .catch(() => toast.error('Erro ao carregar clientes.'))
      .finally(() => setLoading(false))
  }, [search])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const openCustomer = async (c: CustomerListItem) => {
    setSelected({ id: c.id, nome: c.nome, email: c.email, total_gasto: c.total_gasto, data_registo: c.data_registo })
    setDetail(null)
    setDetailLoading(true)
    try {
      const full = await api.customer(c.id)
      setDetail(full as Customer)
    } catch {
      toast.error('Erro ao carregar detalhes do cliente.')
    } finally {
      setDetailLoading(false)
    }
  }

  if (!hasPermission('clientes.ver')) {
    return <PageHeader title="Clientes" description="Sem permissão para ver esta página." />
  }

  return (
    <div>
      <PageHeader title="Clientes" description="Gerir e consultar clientes da loja" />

      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Encomendas</TableHead>
              <TableHead>Total Gasto</TableHead>
              <TableHead>Data registo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                </TableRow>
              ))
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState icon={Users} title="Nenhum cliente encontrado" description="Ajusta a pesquisa." />
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => openCustomer(c)}
                >
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{c.email}</TableCell>
                  <TableCell>{c.encomendas}</TableCell>
                  <TableCell>{formatCurrency(c.total_gasto)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.data_registo)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selected?.nome}</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detail ? (
            <div className="space-y-4">
              <div>
                <h4 className="mb-2 text-sm font-semibold">Informação</h4>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd>{detail.email}</dd>
                  {detail.telefone && (<><dt className="text-muted-foreground">Telefone</dt><dd>{detail.telefone}</dd></>)}
                  <dt className="text-muted-foreground">Data registo</dt>
                  <dd>{formatDate(detail.data_registo)}</dd>
                  <dt className="text-muted-foreground">Total gasto</dt>
                  <dd className="font-medium">{formatCurrency(detail.total_gasto)}</dd>
                </dl>
              </div>

              <Separator />

              <div>
                <h4 className="mb-2 text-sm font-semibold">Encomendas</h4>
                {(detail.encomendas && detail.encomendas.length > 0) ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nº</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.encomendas.map((o) => (
                          <TableRow key={o.id}>
                            <TableCell className="font-mono text-xs">{o.numero}</TableCell>
                            <TableCell><StatusBadge status={o.estado} /></TableCell>
                            <TableCell className="text-muted-foreground">{formatDate(o.data)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(o.total)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem encomendas registadas.</p>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
