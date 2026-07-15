import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, EmptyState } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatDate } from '@/lib/utils'
import { MoveHorizontal as MoreHorizontal, Pencil, Trash2, Plus, Ticket } from 'lucide-react'
import { toast } from 'sonner'

interface Coupon {
  id: number
  codigo: string
  tipo: 'percentagem' | 'fixo'
  valor: number
  valido_de: string | null
  valido_ate: string | null
  usos_maximos: number | null
  usos_atuais: number
  ativo: boolean
}

const emptyForm = {
  codigo: '',
  tipo: 'percentagem' as 'percentagem' | 'fixo',
  valor: '',
  valido_de: '',
  valido_ate: '',
  usos_maximos: '',
  ativo: true,
}

export default function CouponsPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('cupoes.editar')

  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api.coupons()
      setCoupons(data)
    } catch {
      toast.error('Erro ao carregar cupões.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setEditing(null)
    setForm({ ...emptyForm })
    setOpen(true)
  }

  const openEdit = (c: Coupon) => {
    setEditing(c)
    setForm({
      codigo: c.codigo,
      tipo: c.tipo,
      valor: String(c.valor ?? ''),
      valido_de: c.valido_de ? c.valido_de.slice(0, 10) : '',
      valido_ate: c.valido_ate ? c.valido_ate.slice(0, 10) : '',
      usos_maximos: c.usos_maximos != null ? String(c.usos_maximos) : '',
      ativo: c.ativo,
    })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = {
      codigo: form.codigo.trim(),
      tipo: form.tipo,
      valor: Number(form.valor),
      valido_de: form.valido_de || null,
      valido_ate: form.valido_ate || null,
      usos_maximos: form.usos_maximos ? Number(form.usos_maximos) : null,
      ativo: form.ativo,
    }
    try {
      if (editing) {
        await api.updateCoupon(editing.id, payload)
        toast.success('Cupão atualizado.')
      } else {
        await api.createCoupon(payload)
        toast.success('Cupão criado.')
      }
      setOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar cupão.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (c: Coupon) => {
    try {
      await api.deleteCoupon(c.id)
      toast.success('Cupão eliminado.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar cupão.')
    }
  }

  const handleToggleAtivo = async (c: Coupon, checked: boolean) => {
    try {
      await api.updateCoupon(c.id, { ativo: checked })
      setCoupons((prev) => prev.map((x) => (x.id === c.id ? { ...x, ativo: checked } : x)))
      toast.success(checked ? 'Cupão ativado.' : 'Cupão desativado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar estado.')
    }
  }

  const renderValor = (c: Coupon) =>
    c.tipo === 'percentagem' ? `${c.valor}%` : formatCurrency(c.valor)

  const renderUsos = (c: Coupon) =>
    c.usos_maximos != null ? `${c.usos_atuais} / ${c.usos_maximos}` : `${c.usos_atuais} / Ilimitado`

  if (!canEdit) {
    return <PageHeader title="Cupões" description="Sem permissão para gerir cupões." />
  }

  return (
    <div>
      <PageHeader
        title="Cupões"
        description="Gerir códigos de desconto"
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Novo cupão
          </Button>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Usos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[60px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[120px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={Ticket}
                    title="Nenhum cupão"
                    description="Crie o primeiro cupão de desconto."
                  />
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.codigo}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{c.tipo === 'percentagem' ? '%' : '€'}</Badge>
                  </TableCell>
                  <TableCell>{renderValor(c)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.valido_de || c.valido_ate
                      ? `${formatDate(c.valido_de)} → ${formatDate(c.valido_ate)}`
                      : 'Sem limite'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{renderUsos(c)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={c.ativo}
                      onCheckedChange={(checked) => handleToggleAtivo(c, checked)}
                      aria-label="Ativar cupão"
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Abrir menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(c)}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleDelete(c)}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar cupão' : 'Novo cupão'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Altere os dados do cupão.' : 'Crie um novo código de desconto.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código</Label>
              <Input
                id="codigo"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                placeholder="VERAO20"
                required
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm((f) => ({ ...f, tipo: v as 'percentagem' | 'fixo' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentagem">Percentagem</SelectItem>
                    <SelectItem value="fixo">Valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">
                  Valor {form.tipo === 'percentagem' ? '(%)' : '(€)'}
                </Label>
                <Input
                  id="valor"
                  type="number"
                  min="0"
                  step={form.tipo === 'percentagem' ? '1' : '0.01'}
                  value={form.valor}
                  onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valido_de">Válido de</Label>
                <Input
                  id="valido_de"
                  type="date"
                  value={form.valido_de}
                  onChange={(e) => setForm((f) => ({ ...f, valido_de: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valido_ate">Válido até</Label>
                <Input
                  id="valido_ate"
                  type="date"
                  value={form.valido_ate}
                  onChange={(e) => setForm((f) => ({ ...f, valido_ate: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="usos_maximos">Usos máximos</Label>
              <Input
                id="usos_maximos"
                type="number"
                min="0"
                value={form.usos_maximos}
                onChange={(e) => setForm((f) => ({ ...f, usos_maximos: e.target.value }))}
                placeholder="Vazio = ilimitado"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="ativo">Ativo</Label>
                <p className="text-xs text-muted-foreground">Cupão disponível para utilização</p>
              </div>
              <Switch
                id="ativo"
                checked={form.ativo}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, ativo: checked }))}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'A guardar…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
