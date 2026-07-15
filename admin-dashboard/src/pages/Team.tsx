import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, EmptyState } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { formatDate } from '@/lib/utils'
import { MoveHorizontal as MoreHorizontal, Trash2, Plus, Users } from 'lucide-react'
import { toast } from 'sonner'

interface TeamMember {
  id: number
  nome: string
  email: string
  role: string
  criado_em: string
}

interface Role {
  id: string
  nome: string
  label?: string
}

const emptyForm = {
  nome: '',
  email: '',
  password: '',
  role: '',
}

export default function TeamPage() {
  const { hasPermission, user } = useAuth()
  const canEdit = hasPermission('equipa.editar')

  const [members, setMembers] = useState<TeamMember[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [teamData, rolesData] = await Promise.all([api.team(), api.teamRoles()])
      setMembers(teamData)
      setRoles(rolesData)
    } catch {
      toast.error('Erro ao carregar equipa.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const openNew = () => {
    setForm({ ...emptyForm, role: roles[0]?.id || '' })
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.createTeamMember({
        nome: form.nome.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      })
      toast.success('Membro adicionado.')
      setOpen(false)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao adicionar membro.')
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (m: TeamMember, role: string) => {
    if (user && m.id === user.id) {
      toast.error('Não pode alterar o seu próprio cargo.')
      return
    }
    try {
      await api.updateTeamMemberRole(m.id, role)
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role } : x)))
      toast.success('Cargo atualizado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar cargo.')
    }
  }

  const handleDelete = async (m: TeamMember) => {
    if (user && m.id === user.id) {
      toast.error('Não pode eliminar a sua própria conta.')
      return
    }
    try {
      await api.deleteTeamMember(m.id)
      toast.success('Membro eliminado.')
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar membro.')
    }
  }

  if (!canEdit) {
    return <PageHeader title="Equipa" description="Sem permissão para gerir a equipa." />
  }

  return (
    <div>
      <PageHeader
        title="Equipa"
        description="Gerir membros e permissões"
        action={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Adicionar membro
          </Button>
        }
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="w-[60px] text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 5 }).map((__, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-5 w-full max-w-[140px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState icon={Users} title="Nenhum membro" description="Adicione o primeiro membro." />
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => {
                const isSelf = user != null && m.id === user.id
                return (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">
                      {m.nome}
                      {isSelf && (
                        <Badge variant="info" className="ml-2">
                          Você
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{m.email}</TableCell>
                    <TableCell>
                      <Select
                        value={m.role}
                        onValueChange={(role) => handleRoleChange(m, role)}
                        disabled={isSelf}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.label || r.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(m.criado_em)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSelf}>
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Abrir menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => handleDelete(m)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar membro</DialogTitle>
            <DialogDescription>Crie uma nova conta para um membro da equipa.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Cargo</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.label || r.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'A adicionar…' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
