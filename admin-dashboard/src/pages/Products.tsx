<<<<<<< HEAD
import { useEffect, useState, useRef } from 'react';
import ContentLayout from '@cloudscape-design/components/content-layout';
import Header from '@cloudscape-design/components/header';
import Table from '@cloudscape-design/components/table';
import TextFilter from '@cloudscape-design/components/text-filter';
import Pagination from '@cloudscape-design/components/pagination';
import SpaceBetween from '@cloudscape-design/components/space-between';
import Button from '@cloudscape-design/components/button';
import Box from '@cloudscape-design/components/box';
import Modal from '@cloudscape-design/components/modal';
import Form from '@cloudscape-design/components/form';
import FormField from '@cloudscape-design/components/form-field';
import Input from '@cloudscape-design/components/input';
import Textarea from '@cloudscape-design/components/textarea';
import Toggle from '@cloudscape-design/components/toggle';
import TokenGroup from '@cloudscape-design/components/token-group';
import Badge from '@cloudscape-design/components/badge';
import { useCollection } from '@cloudscape-design/collection-hooks';
import Select from '@cloudscape-design/components/select';
import { produtosApi, Produto, parseImagensExtra, parseVariantes, categoriasApi, Categoria } from '../lib/api';
import { useAuth } from '../lib/auth';
=======
import { useState, useEffect, useCallback, type FormEvent } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { formatCurrency, cn } from '@/lib/utils'
import { PageHeader, EmptyState } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { Plus, Search, MoveHorizontal as MoreHorizontal, Pencil, Trash2, Power, Package, Upload } from 'lucide-react'
>>>>>>> eaf13e42e132f6e36e3fe180092e7a95536b94a3

const CATEGORIES = ['casacos', 'camisolas', 'camisas', 'tshirts', 'calcas', 'vestidos', 'saias']

interface Product {
  id: number
  nome: string
  descricao?: string
  preco: number
  preco_promocional?: number | null
  categoria: string
  stock: number
  ativo: boolean
  destaque?: boolean
  imagem?: string | null
  imagens_extra?: string[]
  tamanhos?: string[]
  cores?: string[]
  material?: string
  instrucoes_lavagem?: string
  descricao_longa?: string
}

<<<<<<< HEAD
export default function Products() {
  const { pode } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState<Partial<Produto> | null>(null);
  const [galeria, setGaleria] = useState<string[]>([]);
  const [tamanhos, setTamanhos] = useState<string[]>([]);
  const [cores, setCores] = useState<string[]>([]);
  const [aGuardar, setAGuardar] = useState(false);
  const inputGaleriaRef = useRef<HTMLInputElement>(null);

  async function carregar() {
    setCarregando(true);
    setProdutos(await produtosApi.listar());
    setCarregando(false);
  }
  useEffect(() => { carregar(); categoriasApi.listar().then(setCategorias); }, []);
=======
const emptyForm = {
  nome: '',
  descricao: '',
  preco: '',
  preco_promocional: '',
  categoria: 'tshirts',
  stock: '',
  tamanhos: '',
  cores: '',
  material: '',
  instrucoes_lavagem: '',
  descricao_longa: '',
  destaque: false,
  ativo: true,
  imagem: '',
  imagens_extra: '',
}

export default function ProductsPage() {
  const { hasPermission } = useAuth()
  const canEdit = hasPermission('produtos.editar')
>>>>>>> eaf13e42e132f6e36e3fe180092e7a95536b94a3

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [categoria, setCategoria] = useState<string>('all')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [imagemPreview, setImagemPreview] = useState<string | null>(null)
  const [extraPreviews, setExtraPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    const params: { q?: string; categoria?: string } = {}
    if (search) params.q = search
    if (categoria !== 'all') params.categoria = categoria
    api
      .products(params)
      .then((data) => setProducts(data as Product[]))
      .catch(() => toast.error('Erro ao carregar produtos.'))
      .finally(() => setLoading(false))
  }, [search, categoria])

  useEffect(() => {
    const t = setTimeout(load, 300)
    return () => clearTimeout(t)
  }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setImagemPreview(null)
    setExtraPreviews([])
    setDialogOpen(true)
  }

  const openEdit = (p: Product) => {
    setEditing(p)
    setForm({
      nome: p.nome || '',
      descricao: p.descricao || '',
      preco: String(p.preco ?? ''),
      preco_promocional: p.preco_promocional ? String(p.preco_promocional) : '',
      categoria: p.categoria || 'tshirts',
      stock: String(p.stock ?? ''),
      tamanhos: (p.tamanhos || []).join(', '),
      cores: (p.cores || []).join(', '),
      material: p.material || '',
      instrucoes_lavagem: p.instrucoes_lavagem || '',
      descricao_longa: p.descricao_longa || '',
      destaque: !!p.destaque,
      ativo: !!p.ativo,
      imagem: p.imagem || '',
      imagens_extra: (p.imagens_extra || []).join(', '),
    })
    setImagemPreview(p.imagem || null)
    setExtraPreviews(p.imagens_extra || [])
    setDialogOpen(true)
  }

  const handleImagem = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await api.uploadImage(file)
      setImagemPreview(res.url)
      setForm((f) => ({ ...f, imagem: res.url }))
      toast.success('Imagem enviada.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar imagem.')
    } finally {
      setUploading(false)
    }
  }

  const handleExtraImagens = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploading(true)
    try {
      const res = await api.uploadImages(files)
      setExtraPreviews((prev) => [...prev, ...res.urls])
      toast.success(`${files.length} imagem(ns) enviada(s).`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar imagens.')
    } finally {
      setUploading(false)
    }
  }

  const removeExtraImagem = (idx: number) => {
    setExtraPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.preco) {
      toast.error('Nome e preço são obrigatórios.')
      return
    }
    setSaving(true)
    const payload = {
      nome: form.nome,
      descricao: form.descricao,
      preco: parseFloat(form.preco),
      preco_promocional: form.preco_promocional ? parseFloat(form.preco_promocional) : null,
      categoria: form.categoria,
      stock: parseInt(form.stock, 10) || 0,
      tamanhos: form.tamanhos.split(',').map((s) => s.trim()).filter(Boolean),
      cores: form.cores.split(',').map((s) => s.trim()).filter(Boolean),
      material: form.material,
      instrucoes_lavagem: form.instrucoes_lavagem,
      descricao_longa: form.descricao_longa,
      destaque: form.destaque,
      ativo: form.ativo,
      imagem: form.imagem || null,
      imagens_extra: extraPreviews,
    }
    try {
      if (editing) {
        await api.updateProduct(editing.id, payload)
        toast.success('Produto atualizado.')
      } else {
        await api.createProduct(payload)
        toast.success('Produto criado.')
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar produto.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (p: Product) => {
    try {
      await api.toggleProduct(p.id)
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ativo: !x.ativo } : x)))
      toast.success(p.ativo ? 'Produto desativado.' : 'Produto ativado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar estado.')
    }
  }

  const handleDelete = async (p: Product) => {
    if (!confirm(`Eliminar "${p.nome}"?`)) return
    try {
      await api.deleteProduct(p.id)
      setProducts((prev) => prev.filter((x) => x.id !== p.id))
      toast.success('Produto eliminado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar.')
    }
  }

<<<<<<< HEAD
              <FormField label="Categoria">
                <Select
                  selectedOption={
                    emEdicao.categoria
                      ? { label: categorias.find(c => c.slug === emEdicao.categoria)?.nome || emEdicao.categoria, value: emEdicao.categoria }
                      : null
                  }
                  placeholder="Escolhe uma categoria"
                  options={categorias.map(c => ({ label: c.nome, value: c.slug }))}
                  onChange={({ detail }) => setEmEdicao({ ...emEdicao, categoria: detail.selectedOption.value })}
                  empty="Ainda não há categorias — cria uma em Categorias no menu."
                />
              </FormField>
=======
  if (!hasPermission('produtos.ver')) {
    return <PageHeader title="Produtos" description="Sem permissão para ver esta página." />
  }
>>>>>>> eaf13e42e132f6e36e3fe180092e7a95536b94a3

  return (
    <div>
      <PageHeader
        title="Produtos"
        description="Gerir o catálogo de produtos da loja"
        action={
          canEdit ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Novo produto
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar por nome ou descrição…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c} className="capitalize">
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Preço</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-10 w-full max-w-[220px]" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-10" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-8" /></TableCell>
                </TableRow>
              ))
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState icon={Package} title="Nenhum produto encontrado" description="Ajusta a pesquisa ou cria um novo produto." />
                </TableCell>
              </TableRow>
            ) : (
              products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted">
                        {p.imagem ? (
                          <img src={p.imagem} alt={p.nome} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground m-auto mt-[10px]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{p.nome}</p>
                        {p.destaque && <Badge variant="warning" className="mt-0.5">Destaque</Badge>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{p.categoria}</TableCell>
                  <TableCell>
                    {p.preco_promocional ? (
                      <span className="flex flex-col">
                        <span className="text-muted-foreground line-through text-xs">{formatCurrency(p.preco)}</span>
                        <span className="font-medium text-emerald-600">{formatCurrency(p.preco_promocional)}</span>
                      </span>
                    ) : (
                      formatCurrency(p.preco)
                    )}
                  </TableCell>
                  <TableCell>{p.stock}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <div className="flex items-center gap-2">
                        <Switch checked={p.ativo} onCheckedChange={() => handleToggle(p)} />
                        <span className={cn('text-xs', p.ativo ? 'text-emerald-600' : 'text-muted-foreground')}>
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    ) : (
                      <Badge variant={p.ativo ? 'success' : 'secondary'}>{p.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(p)} disabled={!canEdit}>
                          <Pencil className="h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(p)} disabled={!canEdit}>
                          <Power className="h-4 w-4" />
                          {p.ativo ? 'Desativar' : 'Ativar'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(p)} disabled={!canEdit} className="text-destructive focus:text-destructive">
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar produto' : 'Novo produto'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="nome">Nome *</Label>
                <Input id="nome" value={form.nome} onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input id="descricao" value={form.descricao} onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco">Preço (€) *</Label>
                <Input id="preco" type="number" step="0.01" min="0" value={form.preco} onChange={(e) => setForm((f) => ({ ...f, preco: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="preco_promocional">Preço promocional (€)</Label>
                <Input id="preco_promocional" type="number" step="0.01" min="0" value={form.preco_promocional} onChange={(e) => setForm((f) => ({ ...f, preco_promocional: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm((f) => ({ ...f, categoria: v }))}>
                  <SelectTrigger id="categoria">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tamanhos">Tamanhos (separados por vírgula)</Label>
                <Input id="tamanhos" value={form.tamanhos} onChange={(e) => setForm((f) => ({ ...f, tamanhos: e.target.value }))} placeholder="S, M, L, XL" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cores">Cores (separadas por vírgula)</Label>
                <Input id="cores" value={form.cores} onChange={(e) => setForm((f) => ({ ...f, cores: e.target.value }))} placeholder="Preto, Branco" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material">Material</Label>
                <Input id="material" value={form.material} onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="instrucoes_lavagem">Instruções de lavagem</Label>
                <Input id="instrucoes_lavagem" value={form.instrucoes_lavagem} onChange={(e) => setForm((f) => ({ ...f, instrucoes_lavagem: e.target.value }))} />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="descricao_longa">Descrição longa</Label>
                <Textarea id="descricao_longa" rows={3} value={form.descricao_longa} onChange={(e) => setForm((f) => ({ ...f, descricao_longa: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem principal</Label>
              <div className="flex items-center gap-4">
                {imagemPreview && (
                  <img src={imagemPreview} alt="Pré-visualização" className="h-20 w-20 rounded-md border object-cover" />
                )}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="h-4 w-4" />
                  {uploading ? 'A enviar…' : 'Enviar imagem'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImagem} disabled={uploading} />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagens extra</Label>
              {extraPreviews.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {extraPreviews.map((url, i) => (
                    <div key={i} className="relative h-16 w-16 overflow-hidden rounded-md border">
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeExtraImagem(i)}
                        className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center bg-black/60 text-white hover:bg-black/80"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" />
                {uploading ? 'A enviar…' : 'Enviar imagens'}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleExtraImagens} disabled={uploading} />
              </label>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch id="destaque" checked={form.destaque} onCheckedChange={(v) => setForm((f) => ({ ...f, destaque: v }))} />
                <Label htmlFor="destaque">Destaque</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="ativo" checked={form.ativo} onCheckedChange={(v) => setForm((f) => ({ ...f, ativo: v }))} />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={saving || uploading}>
                {saving ? 'A guardar…' : editing ? 'Guardar' : 'Criar produto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
