import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { PageHeader, EmptyState } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { formatDateTime, formatDate } from '@/lib/utils'
import { MoveHorizontal as MoreHorizontal, Pencil, Trash2, Plus, FileText, Image as ImageIcon, Upload } from 'lucide-react'
import { toast } from 'sonner'

type Estado = 'rascunho' | 'publicado'

interface Page {
  id: number
  titulo: string
  slug: string
  conteudo: string
  estado: Estado
  atualizado_em: string
}

interface Post {
  id: number
  titulo: string
  slug: string
  resumo: string
  conteudo: string
  estado: Estado
  publicado_em: string | null
}

interface Category {
  id: number
  nome: string
}

interface MediaItem {
  id: number
  url: string
  nome: string
  criado_em: string
}

const estadoVariant: Record<Estado, 'secondary' | 'success'> = {
  rascunho: 'secondary',
  publicado: 'success',
}

export default function ContentPage() {
  const { hasPermission } = useAuth()
  const canView = hasPermission('cms.ver')
  const canEdit = hasPermission('cms.editar')

  const [pages, setPages] = useState<Page[]>([])
  const [posts, setPosts] = useState<Post[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [media, setMedia] = useState<MediaItem[]>([])

  const [loadingPages, setLoadingPages] = useState(true)
  const [loadingPosts, setLoadingPosts] = useState(true)
  const [loadingCats, setLoadingCats] = useState(true)
  const [loadingMedia, setLoadingMedia] = useState(true)

  // Page dialog
  const [pageOpen, setPageOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const [pageForm, setPageForm] = useState({ titulo: '', conteudo: '', estado: 'rascunho' as Estado })
  const [savingPage, setSavingPage] = useState(false)

  // Post dialog
  const [postOpen, setPostOpen] = useState(false)
  const [postForm, setPostForm] = useState({ titulo: '', resumo: '', conteudo: '', estado: 'rascunho' as Estado })
  const [savingPost, setSavingPost] = useState(false)

  // Category
  const [catName, setCatName] = useState('')
  const [savingCat, setSavingCat] = useState(false)

  // Media upload
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const loadPages = useCallback(async () => {
    setLoadingPages(true)
    try {
      setPages(await api.cmsPages())
    } catch {
      toast.error('Erro ao carregar páginas.')
    } finally {
      setLoadingPages(false)
    }
  }, [])

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true)
    try {
      setPosts(await api.cmsPosts())
    } catch {
      toast.error('Erro ao carregar posts.')
    } finally {
      setLoadingPosts(false)
    }
  }, [])

  const loadCategories = useCallback(async () => {
    setLoadingCats(true)
    try {
      setCategories(await api.cmsCategories())
    } catch {
      toast.error('Erro ao carregar categorias.')
    } finally {
      setLoadingCats(false)
    }
  }, [])

  const loadMedia = useCallback(async () => {
    setLoadingMedia(true)
    try {
      setMedia(await api.media())
    } catch {
      toast.error('Erro ao carregar media.')
    } finally {
      setLoadingMedia(false)
    }
  }, [])

  useEffect(() => {
    if (canView) {
      loadPages()
      loadPosts()
      loadCategories()
      loadMedia()
    }
  }, [canView, loadPages, loadPosts, loadCategories, loadMedia])

  // ---- Page handlers ----
  const openNewPage = () => {
    setEditingPage(null)
    setPageForm({ titulo: '', conteudo: '', estado: 'rascunho' })
    setPageOpen(true)
  }

  const openEditPage = (p: Page) => {
    setEditingPage(p)
    setPageForm({ titulo: p.titulo, conteudo: p.conteudo || '', estado: p.estado })
    setPageOpen(true)
  }

  const handlePageSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPage(true)
    try {
      if (editingPage) {
        await api.updatePage(editingPage.id, pageForm)
        toast.success('Página atualizada.')
      } else {
        await api.createPage(pageForm)
        toast.success('Página criada.')
      }
      setPageOpen(false)
      await loadPages()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao guardar página.')
    } finally {
      setSavingPage(false)
    }
  }

  const handleDeletePage = async (p: Page) => {
    try {
      await api.deletePage(p.id)
      toast.success('Página eliminada.')
      await loadPages()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao eliminar página.')
    }
  }

  // ---- Post handlers ----
  const openNewPost = () => {
    setPostForm({ titulo: '', resumo: '', conteudo: '', estado: 'rascunho' })
    setPostOpen(true)
  }

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingPost(true)
    try {
      await api.createPost(postForm)
      toast.success('Post criado.')
      setPostOpen(false)
      await loadPosts()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar post.')
    } finally {
      setSavingPost(false)
    }
  }

  // ---- Category handlers ----
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    const nome = catName.trim()
    if (!nome) return
    setSavingCat(true)
    try {
      await api.createCategory(nome)
      toast.success('Categoria criada.')
      setCatName('')
      await loadCategories()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao criar categoria.')
    } finally {
      setSavingCat(false)
    }
  }

  // ---- Media handlers ----
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const res = await api.uploadMedia(files)
      toast.success(`${res.items?.length || files.length} ficheiro(s) enviados.`)
      await loadMedia()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao enviar media.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (!canView) {
    return <PageHeader title="Conteúdo" description="Sem permissão para ver conteúdo." />
  }

  return (
    <div>
      <PageHeader title="Conteúdo" description="Gerir páginas, posts, categorias e media" />

      <Tabs defaultValue="paginas">
        <TabsList>
          <TabsTrigger value="paginas">Páginas</TabsTrigger>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
        </TabsList>

        {/* Páginas */}
        <TabsContent value="paginas">
          <div className="mb-4 flex justify-end">
            {canEdit && (
              <Button onClick={openNewPage}>
                <Plus className="h-4 w-4" />
                Nova página
              </Button>
            )}
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Atualizado em</TableHead>
                  {canEdit && <TableHead className="w-[60px] text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPages ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: canEdit ? 5 : 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full max-w-[140px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : pages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={canEdit ? 5 : 4} className="p-0">
                      <EmptyState icon={FileText} title="Nenhuma página" description="Crie a primeira página." />
                    </TableCell>
                  </TableRow>
                ) : (
                  pages.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.titulo}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{p.slug}</TableCell>
                      <TableCell>
                        <Badge variant={estadoVariant[p.estado]}>{p.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDateTime(p.atualizado_em)}</TableCell>
                      {canEdit && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditPage(p)}>
                                <Pencil className="h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => handleDeletePage(p)}
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Posts */}
        <TabsContent value="posts">
          <div className="mb-4 flex justify-end">
            {canEdit && (
              <Button onClick={openNewPost}>
                <Plus className="h-4 w-4" />
                Novo post
              </Button>
            )}
          </div>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Publicado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingPosts ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 4 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-5 w-full max-w-[140px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : posts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-0">
                      <EmptyState icon={FileText} title="Nenhum post" description="Crie o primeiro post." />
                    </TableCell>
                  </TableRow>
                ) : (
                  posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.titulo}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{p.slug}</TableCell>
                      <TableCell>
                        <Badge variant={estadoVariant[p.estado]}>{p.estado}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(p.publicado_em)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Categorias */}
        <TabsContent value="categorias">
          {canEdit && (
            <form onSubmit={handleCreateCategory} className="mb-4 flex items-end gap-2">
              <div className="space-y-2">
                <Label htmlFor="cat-nome">Nome da categoria</Label>
                <Input
                  id="cat-nome"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Notícias"
                  required
                  className="w-64"
                />
              </div>
              <Button type="submit" disabled={savingCat}>
                <Plus className="h-4 w-4" />
                {savingCat ? 'A criar…' : 'Adicionar'}
              </Button>
            </form>
          )}
          <div className="rounded-lg border">
            <div className="divide-y">
              {loadingCats ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                ))
              ) : categories.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhuma categoria" description="Adicione a primeira categoria." />
              ) : (
                categories.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3">
                    <span className="font-medium">{c.nome}</span>
                    <Badge variant="secondary">Categoria</Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Media */}
        <TabsContent value="media">
          <div className="mb-4 flex justify-end">
            {canEdit && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleUpload}
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4" />
                  {uploading ? 'A enviar…' : 'Enviar media'}
                </Button>
              </>
            )}
          </div>
          {loadingMedia ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-lg" />
              ))}
            </div>
          ) : media.length === 0 ? (
            <EmptyState icon={ImageIcon} title="Nenhuma media" description="Envie imagens para a biblioteca." />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {media.map((m) => (
                <div key={m.id} className="group overflow-hidden rounded-lg border">
                  <div className="aspect-square overflow-hidden bg-muted">
                    <img
                      src={m.url}
                      alt={m.nome}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="p-2">
                    <p className="truncate text-xs font-medium">{m.nome}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(m.criado_em)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Page Dialog */}
      <Dialog open={pageOpen} onOpenChange={setPageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPage ? 'Editar página' : 'Nova página'}</DialogTitle>
            <DialogDescription>
              {editingPage ? 'Altere o conteúdo da página.' : 'Crie uma nova página.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePageSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="page-titulo">Título</Label>
              <Input
                id="page-titulo"
                value={pageForm.titulo}
                onChange={(e) => setPageForm((f) => ({ ...f, titulo: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-conteudo">Conteúdo</Label>
              <Textarea
                id="page-conteudo"
                rows={10}
                value={pageForm.conteudo}
                onChange={(e) => setPageForm((f) => ({ ...f, conteudo: e.target.value }))}
                placeholder="Conteúdo da página…"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={pageForm.estado}
                onValueChange={(v) => setPageForm((f) => ({ ...f, estado: v as Estado }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPageOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingPage}>
                {savingPage ? 'A guardar…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Post Dialog */}
      <Dialog open={postOpen} onOpenChange={setPostOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo post</DialogTitle>
            <DialogDescription>Crie um novo post para o blog.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePostSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="post-titulo">Título</Label>
              <Input
                id="post-titulo"
                value={postForm.titulo}
                onChange={(e) => setPostForm((f) => ({ ...f, titulo: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-resumo">Resumo</Label>
              <Textarea
                id="post-resumo"
                rows={2}
                value={postForm.resumo}
                onChange={(e) => setPostForm((f) => ({ ...f, resumo: e.target.value }))}
                placeholder="Breve resumo do post…"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="post-conteudo">Conteúdo</Label>
              <Textarea
                id="post-conteudo"
                rows={8}
                value={postForm.conteudo}
                onChange={(e) => setPostForm((f) => ({ ...f, conteudo: e.target.value }))}
                placeholder="Conteúdo do post…"
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select
                value={postForm.estado}
                onValueChange={(v) => setPostForm((f) => ({ ...f, estado: v as Estado }))}
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="publicado">Publicado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPostOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={savingPost}>
                {savingPost ? 'A guardar…' : 'Criar post'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
